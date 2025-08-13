import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// In-memory storage for active connections and meeting state
const connections = new Map<string, any>()
const meetingRooms = new Map<string, Set<string>>() // approved participants in main meeting
const waitingRooms = new Map<string, Set<string>>() // users waiting for host approval
const breakoutRooms = new Map<string, Map<string, Set<string>>>() // meetingId -> roomId -> userIds
const recordingPermissions = new Map<string, Set<string>>() // meetingId -> userIds allowed to record
const chatMutedUsers = new Map<string, Set<string>>() // meetingId -> userIds muted in chat
const chatGlobalMute = new Map<string, boolean>() // meetingId -> is chat globally muted

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')
    
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 })
    }

    // Set up SSE connection
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const userId = session.user.id
        
        // Store connection
        const connectionId = `${meetingId}-${userId}`
        connections.set(connectionId, {
          controller,
          userId,
          meetingId,
          timestamp: Date.now()
        })
        
        // Ensure base state containers exist
        if (!meetingRooms.has(meetingId)) meetingRooms.set(meetingId, new Set())
        if (!waitingRooms.has(meetingId)) waitingRooms.set(meetingId, new Set())
        if (!breakoutRooms.has(meetingId)) breakoutRooms.set(meetingId, new Map([['main', new Set<string>()]]))
        if (!recordingPermissions.has(meetingId)) recordingPermissions.set(meetingId, new Set())
        if (!chatMutedUsers.has(meetingId)) chatMutedUsers.set(meetingId, new Set())
        if (!chatGlobalMute.has(meetingId)) chatGlobalMute.set(meetingId, false)

        // Determine host
        let isHost = false
        let hostId: string | null = null
        try {
          const call = await prisma.call.findUnique({ where: { id: meetingId } })
          hostId = call?.createdById || null
          isHost = hostId === userId
        } catch (e) {
          // If DB lookup fails, treat first user as host
          const participantsSet = meetingRooms.get(meetingId)!
          isHost = participantsSet.size === 0
          if (isHost) hostId = userId
        }

        if (isHost) {
          // Add host to main room participants and default breakout room 'main'
          meetingRooms.get(meetingId)!.add(userId)
          breakoutRooms.get(meetingId)!.get('main')!.add(userId)

          // Send initial connection confirmation to host with pending approvals
          const pending = Array.from(waitingRooms.get(meetingId) || [])
          const message = `data: ${JSON.stringify({
            type: 'connected',
            userId,
            meetingId,
            isHost: true,
            participants: Array.from(meetingRooms.get(meetingId) || []),
            pendingApprovals: pending,
            rooms: Array.from(breakoutRooms.get(meetingId)!.keys()),
          })}\n\n`
          controller.enqueue(encoder.encode(message))

          // Notify approved participants that host joined
          const others = Array.from(meetingRooms.get(meetingId) || []).filter(id => id !== userId)
          others.forEach(participantId => {
            const pid = `${meetingId}-${participantId}`
            const conn = connections.get(pid)
            if (conn) {
              const notification = `data: ${JSON.stringify({
                type: 'host-connected',
                userId,
                meetingId
              })}\n\n`
              conn.controller.enqueue(encoder.encode(notification))
            }
          })
        } else {
          // Non-host joins waiting room; notify host for approval
          waitingRooms.get(meetingId)!.add(userId)
          
          // Send waiting status to the user
          const waitingMsg = `data: ${JSON.stringify({
            type: 'waiting-approval',
            userId,
            meetingId,
          })}\n\n`
          controller.enqueue(encoder.encode(waitingMsg))

          // Notify host (if connected)
          if (hostId) {
            const hostConn = connections.get(`${meetingId}-${hostId}`)
            if (hostConn) {
              // Optionally include basic user info
              let userInfo: any = { id: userId }
              try {
                const u = await prisma.user.findUnique({ where: { id: userId } })
                if (u) {
                  userInfo = {
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                  }
                }
              } catch {}
              const reqMsg = `data: ${JSON.stringify({
                type: 'approval-request',
                meetingId,
                user: userInfo,
              })}\n\n`
              hostConn.controller.enqueue(encoder.encode(reqMsg))
            }
          }
        }

        // Clean up on disconnect
        request.signal.addEventListener('abort', () => {
          connections.delete(connectionId)
          if (waitingRooms.has(meetingId)) {
            waitingRooms.get(meetingId)!.delete(userId)
          }
          if (meetingRooms.has(meetingId)) {
            meetingRooms.get(meetingId)!.delete(userId)
            if (meetingRooms.get(meetingId)!.size === 0) {
              meetingRooms.delete(meetingId)
              breakoutRooms.delete(meetingId)
              recordingPermissions.delete(meetingId)
              chatMutedUsers.delete(meetingId)
              chatGlobalMute.delete(meetingId)
            }
          }

          // Notify other participants about user leaving
          const remainingParticipants = Array.from(meetingRooms.get(meetingId) || [])
          remainingParticipants.forEach(participantId => {
            const participantConnectionId = `${meetingId}-${participantId}`
            const participantConnection = connections.get(participantConnectionId)
            
            if (participantConnection) {
              const notification = `data: ${JSON.stringify({
                type: 'user-left',
                userId,
                meetingId
              })}\n\n`
              
              participantConnection.controller.enqueue(encoder.encode(notification))
            }
          })
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('SSE connection error:', error)
    return NextResponse.json(
      { error: 'Failed to establish SSE connection' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, meetingId, targetUserId, data } = await request.json()
    const userId = session.user.id

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 })
    }

    switch (action) {
      case 'offer':
        return sendToUser(meetingId, targetUserId, {
          type: 'offer',
          from: userId,
          meetingId,
          data
        })
      
      case 'answer':
        return sendToUser(meetingId, targetUserId, {
          type: 'answer',
          from: userId,
          meetingId,
          data
        })
      
      case 'ice-candidate':
        return sendToUser(meetingId, targetUserId, {
          type: 'ice-candidate',
          from: userId,
          meetingId,
          data
        })

      // Waiting room approvals
      case 'approve-participant': {
        // Move from waiting to meeting
        waitingRooms.get(meetingId)?.delete(targetUserId)
        meetingRooms.get(meetingId)?.add(targetUserId)
        // Default put into main breakout room
        const rooms = breakoutRooms.get(meetingId)!
        rooms.get('main')?.add(targetUserId)

        // Notify target user (approved + connected snapshot)
        const participantsSnapshot = Array.from(meetingRooms.get(meetingId) || [])
        await sendToUser(meetingId, targetUserId, {
          type: 'approved',
          meetingId,
          roomId: 'main',
        })
        await sendToUser(meetingId, targetUserId, {
          type: 'connected',
          meetingId,
          participants: participantsSnapshot,
        })
        // Notify others in meeting
        broadcastToMeeting(meetingId, {
          type: 'user-joined',
          userId: targetUserId,
          meetingId,
        })
        return NextResponse.json({ success: true })
      }
      case 'reject-participant': {
        waitingRooms.get(meetingId)?.delete(targetUserId)
        await sendToUser(meetingId, targetUserId, {
          type: 'rejected',
          meetingId,
        })
        return NextResponse.json({ success: true })
      }

      // Breakout rooms
      case 'create-room': {
        const roomId = (data?.roomId as string) || `room-${Math.floor(Math.random()*10000)}`
        const rooms = breakoutRooms.get(meetingId)!
        if (!rooms.has(roomId)) rooms.set(roomId, new Set<string>())
        // Notify host and participants
        broadcastToMeeting(meetingId, { type: 'room-created', meetingId, roomId })
        return NextResponse.json({ success: true, roomId })
      }
      case 'move-to-room': {
        const roomId = data?.roomId as string
        if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 })
        const rooms = breakoutRooms.get(meetingId)!
        // Remove from any existing room
        rooms.forEach(set => set.delete(targetUserId))
        // Add to target room (create if needed)
        if (!rooms.has(roomId)) rooms.set(roomId, new Set<string>())
        rooms.get(roomId)!.add(targetUserId)

        // Notify target and others
        await sendToUser(meetingId, targetUserId, { type: 'room-changed', meetingId, roomId })
        broadcastToMeeting(meetingId, { type: 'participant-room-changed', meetingId, userId: targetUserId, roomId })
        return NextResponse.json({ success: true })
      }

      // Recording permissions
      case 'set-recording-permission': {
        const allowed = !!data?.allowed
        const set = recordingPermissions.get(meetingId)!
        if (allowed) set.add(targetUserId)
        else set.delete(targetUserId)
        await sendToUser(meetingId, targetUserId, { type: 'recording-permission', meetingId, allowed })
        return NextResponse.json({ success: true })
      }

      // Chat moderation and messaging
      case 'chat-message': {
        const globalMuted = chatGlobalMute.get(meetingId) || false
        const mutedSet = chatMutedUsers.get(meetingId)!
        if (globalMuted && !(await isHostUser(meetingId, userId))) {
          return NextResponse.json({ error: 'Chat is muted by host' }, { status: 403 })
        }
        if (mutedSet.has(userId)) {
          return NextResponse.json({ error: 'You are muted in chat' }, { status: 403 })
        }
        const payload = {
          type: 'chat-message',
          meetingId,
          message: {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            senderId: userId,
            content: (data?.content as string) || '',
            timestamp: Date.now(),
          }
        }
        broadcastToMeeting(meetingId, payload)
        return NextResponse.json({ success: true })
      }
      case 'chat-mute-user': {
        chatMutedUsers.get(meetingId)!.add(targetUserId)
        await sendToUser(meetingId, targetUserId, { type: 'chat-muted', meetingId })
        return NextResponse.json({ success: true })
      }
      case 'chat-unmute-user': {
        chatMutedUsers.get(meetingId)!.delete(targetUserId)
        await sendToUser(meetingId, targetUserId, { type: 'chat-unmuted', meetingId })
        return NextResponse.json({ success: true })
      }
      case 'chat-mute-all': {
        chatGlobalMute.set(meetingId, true)
        broadcastToMeeting(meetingId, { type: 'chat-global-muted', meetingId })
        return NextResponse.json({ success: true })
      }
      case 'chat-unmute-all': {
        chatGlobalMute.set(meetingId, false)
        broadcastToMeeting(meetingId, { type: 'chat-global-unmuted', meetingId })
        return NextResponse.json({ success: true })
      }
      case 'chat-delete-message': {
        const msgId = data?.messageId as string
        if (!msgId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })
        broadcastToMeeting(meetingId, { type: 'chat-message-deleted', meetingId, messageId: msgId })
        return NextResponse.json({ success: true })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Signaling message error:', error)
    return NextResponse.json(
      { error: 'Failed to send signaling message' },
      { status: 500 }
    )
  }
}

function sendToUser(meetingId: string, targetUserId: string, message: any) {
  const connectionId = `${meetingId}-${targetUserId}`
  const connection = connections.get(connectionId)
  
  if (!connection) {
    return NextResponse.json({ error: 'User not connected' }, { status: 404 })
  }

  try {
    const encoder = new TextEncoder()
    const messageStr = `data: ${JSON.stringify(message)}\n\n`
    connection.controller.enqueue(encoder.encode(messageStr))
    
    return NextResponse.json({ success: true, message: 'Message sent' })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

function broadcastToMeeting(meetingId: string, message: any) {
  const encoder = new TextEncoder()
  const str = `data: ${JSON.stringify(message)}\n\n`
  for (const [connId, conn] of connections) {
    if (conn.meetingId === meetingId) {
      try { conn.controller.enqueue(encoder.encode(str)) } catch {}
    }
  }
}

async function isHostUser(meetingId: string, userId: string): Promise<boolean> {
  try {
    const call = await prisma.call.findUnique({ where: { id: meetingId }, select: { createdById: true } })
    return call?.createdById === userId
  } catch {
    return false
  }
}
