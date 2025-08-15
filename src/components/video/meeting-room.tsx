"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Settings, 
  Users,
  Share,
  MessageSquare,
  MoreVertical,
  Circle,
  Square,
  Volume2,
  VolumeX,
  Crown,
  UserCheck,
  UserX
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { AudioLevelIndicator } from './audio-level-indicator'
import { SpeakingIndicator } from './speaking-indicator'
import { MeetingLobby } from './meeting-lobby'
import { MeetingDurationWarning } from './meeting-duration-warning'
import { useMeetingDuration } from '@/hooks/use-meeting-duration'

interface MeetingRoomProps {
  meeting: any
  user: any
  isHost: boolean
  isAdmin: boolean
}

interface Participant {
  id: string
  userId?: string
  contactId?: string
  firstName?: string
  lastName?: string
  email?: string
  avatar?: string
  isLocal: boolean
  isHost: boolean
  isMuted?: boolean
  isVideoOn?: boolean
  stream?: MediaStream
  peerConnection?: RTCPeerConnection
}

export function MeetingRoom({ meeting, user, isHost, isAdmin }: MeetingRoomProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([])
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [showLobby, setShowLobby] = useState(true)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [waitingApproval, setWaitingApproval] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState<Array<{ id: string; firstName?: string; lastName?: string; email?: string }>>([])
  const [rooms, setRooms] = useState<string[]>(['main'])
  const [myRoomId, setMyRoomId] = useState<string>('main')
  const [userIdToRoomId, setUserIdToRoomId] = useState<Record<string, string>>({})
  const [allowedRecorders, setAllowedRecorders] = useState<Set<string>>(new Set())
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; senderId: string; content: string; timestamp: number }>>([])
  const [isChatGloballyMuted, setIsChatGloballyMuted] = useState(false)
  const [meetingStartTime, setMeetingStartTime] = useState<Date>(new Date())
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({})
  const { toast } = useToast()

  // Meeting duration tracking
  const {
    duration,
    showWarning,
    hasShownWarning,
    dismissWarning,
  } = useMeetingDuration({
    startTime: meetingStartTime,
    isHost,
    onDurationWarning: () => {
      toast({
        title: "Meeting Duration Warning",
        description: "This meeting has exceeded 1 hour. Please respond to continue or stop.",
        variant: "destructive",
      });
    },
    onAutoStop: () => {
      endCall();
    },
  });

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }

  const initializeVideoConference = async () => {
    if (isJoining) return
    
    // Set meeting start time when initializing
    setMeetingStartTime(new Date())
    
    setIsJoining(true)
    setError(null)

    try {
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLocalStream(stream)
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(console.error)
      }
      
      // Set up audio context for better audio handling
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const gainNode = audioContext.createGain()
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Set initial participants - mark current user as local
      const meetingParticipants = meeting.participants?.map((p: any) => ({
        id: p.userId || p.contactId,
        userId: p.userId,
        contactId: p.contactId,
        firstName: p.user?.firstName || p.contact?.firstName,
        lastName: p.user?.lastName || p.contact?.lastName,
        email: p.user?.email || p.contact?.email,
        avatar: p.user?.avatar || p.contact?.avatarUrl,
        isLocal: (p.userId === user.id || p.contactId === user.id),
        isHost: p.userId === meeting.createdById,
        isMuted: false,
        isVideoOn: true
      })) || []
      
      setParticipants(meetingParticipants)
      setIsInCall(true)
      setIsInitialized(true)
      setIsJoining(false)
      
      // Start signaling for peer connections
      startSignaling()
      
      toast({
        title: "Video Conference Started",
        description: "You're now connected to the video conference",
      })
      
    } catch (error: any) {
      console.error('Failed to initialize video conference:', error)
      setError(error.message || 'Failed to start video conference')
      setIsJoining(false)
      
      toast({
        title: "Error",
        description: error.message || 'Failed to start video conference',
        variant: 'destructive',
      })
    }
  }

  const startSignaling = useCallback(() => {
    // Connect to signaling server using Server-Sent Events
    console.log('Starting signaling for peer connections...')
    
    const eventSource = new EventSource(`/api/signaling/sse?meetingId=${meeting.id}`)
    
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('Received signaling message:', message)
        
        switch (message.type) {
          case 'connected':
            handleConnected(message)
            break
          case 'user-joined':
            handleUserJoined(message)
            break
          case 'user-left':
            handleUserLeft(message)
            break
          case 'offer':
            handleOffer(message)
            break
          case 'answer':
            handleAnswer(message)
            break
          case 'ice-candidate':
            handleIceCandidate(message)
            break
          case 'mute-participant':
            handleMuteParticipant(message)
            break
          case 'unmute-participant':
            handleUnmuteParticipant(message)
            break
          case 'remove-participant':
            handleRemoveParticipant(message)
            break
          case 'toggle-video':
            handleToggleVideo(message)
            break
          // Waiting room and approvals
          case 'waiting-approval':
            setWaitingApproval(true)
            break
          case 'approval-request':
            if (isHost) {
              const u = message.user || { id: message.userId }
              setPendingApprovals(prev => {
                const exists = prev.some(p => p.id === u.id)
                return exists ? prev : [...prev, u]
              })
            }
            break
          case 'approved':
            setWaitingApproval(false)
            break
          case 'host-connected':
            // no-op for now
            break
          // Breakout rooms
          case 'room-created':
            setRooms(prev => prev.includes(message.roomId) ? prev : [...prev, message.roomId])
            break
          case 'participant-room-changed': {
            const { userId: changedId, roomId } = message
            setUserIdToRoomId(prev => ({ ...prev, [changedId]: roomId }))
            // If participant moved away from my room, drop PC and hide
            if (roomId !== myRoomId) {
              const participant = participants.find(p => p.id === changedId)
              if (participant?.peerConnection) {
                participant.peerConnection.close()
              }
              setParticipants(prev => prev.map(p => p.id === changedId ? { ...p, stream: undefined, peerConnection: undefined } : p))
            } else {
              // If moved into my room, create PC
              createPeerConnection(changedId)
            }
            break
          }
          case 'room-changed': {
            const { roomId } = message
            setMyRoomId(roomId || 'main')
            // Reconcile peer connections: close PCs not in my room
            setParticipants(prev => prev.map(p => {
              const pRoom = userIdToRoomId[p.id] || 'main'
              if (p.peerConnection && pRoom !== (roomId || 'main')) {
                p.peerConnection.close()
                return { ...p, stream: undefined, peerConnection: undefined }
              }
              return p
            }))
            break
          }
          // Recording permissions
          case 'recording-permission': {
            const allowed = !!message.allowed
            if (allowed) {
              setAllowedRecorders(prev => new Set([...prev, user.id]))
            } else {
              setAllowedRecorders(prev => {
                const next = new Set(prev)
                next.delete(user.id)
                return next
              })
            }
            break
          }
          // Chat events
          case 'chat-message': {
            const m = message.message
            setChatMessages(prev => [...prev, m])
            break
          }
          case 'chat-message-deleted': {
            const { messageId } = message
            setChatMessages(prev => prev.filter(m => m.id !== messageId))
            break
          }
          case 'chat-global-muted':
            setIsChatGloballyMuted(true)
            break
          case 'chat-global-unmuted':
            setIsChatGloballyMuted(false)
            break
          case 'chat-muted':
            // local user muted in chat
            setIsChatGloballyMuted(false)
            break
          case 'chat-unmuted':
            // local user unmuted in chat
            break
        }
      } catch (error) {
        console.error('Error parsing signaling message:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('Signaling connection error:', error)
      eventSource.close()
    }
    
    // Store event source for cleanup
    setEventSource(eventSource)
  }, [meeting.id])

  const handleConnected = (message: any) => {
    console.log('Connected to signaling server:', message)
    // Start creating peer connections with existing participants
    if (Array.isArray(message.participants)) {
      message.participants.forEach((participantId: string) => {
        // Only create peer connections with other participants (not self)
        if (participantId !== user.id) {
          createPeerConnection(participantId)
        }
      })
    }
    if (Array.isArray(message.rooms)) {
      setRooms(message.rooms)
    }
  }

  const handleUserJoined = (message: any) => {
    console.log('User joined:', message)
    const { userId, firstName, lastName, email, isHost: userIsHost } = message
    
    // Add new participant to the list - ensure they're not marked as local
    setParticipants(prev => {
      const existing = prev.find(p => p.id === userId)
      if (!existing) {
        return [...prev, {
          id: userId,
          isLocal: false, // New participants are always remote
          isHost: userIsHost || false,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'User',
          email: email,
          isMuted: false,
          isVideoOn: true
        }]
      }
      return prev
    })
    
    // Create peer connection with new user
    // Only connect if in same room
    const roomOfUser = userIdToRoomId[userId] || 'main'
    if (roomOfUser === myRoomId) {
      createPeerConnection(userId)
    }
  }

  const handleUserLeft = (message: any) => {
    console.log('User left:', message)
    const { userId } = message
    
    // Remove participant and close peer connection
    setParticipants(prev => {
      const participant = prev.find(p => p.id === userId)
      if (participant?.peerConnection) {
        participant.peerConnection.close()
      }
      return prev.filter(p => p.id !== userId)
    })
  }

  const handleOffer = async (message: any) => {
    const { from, data: offer } = message
    console.log('Received offer from:', from)
    
    try {
      // Create peer connection if it doesn't exist
      let peerConnection = participants.find(p => p.id === from)?.peerConnection
      
      if (!peerConnection) {
        peerConnection = new RTCPeerConnection(rtcConfig)
        
        // Add local stream tracks
        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnection!.addTrack(track, localStream)
          })
        }
        
        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
          console.log('Received remote track from offer:', event)
          const remoteStream = event.streams[0]
          
          if (remoteStream) {
            // Update participant with stream
            setParticipants(prev => prev.map(p => 
              p.id === from 
                ? { ...p, stream: remoteStream, peerConnection, isMuted: p.isMuted || false, isVideoOn: p.isVideoOn !== false }
                : p
            ))
            
            // Display remote video immediately
            setTimeout(() => {
              const videoElement = remoteVideosRef.current[from]
              if (videoElement) {
                videoElement.srcObject = remoteStream
                videoElement.play().catch(console.error)
                console.log('Remote video started playing for:', from)
              }
            }, 100)
          }
        }
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignalingMessage('ice-candidate', from, event.candidate)
          }
        }
        
        // Update participant
        setParticipants(prev => prev.map(p => 
          p.id === from 
            ? { ...p, peerConnection, isMuted: p.isMuted || false, isVideoOn: p.isVideoOn !== false }
            : p
        ))
      }
      
      // Set remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      
      // Create and send answer
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      
      sendSignalingMessage('answer', from, answer)
      
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleAnswer = async (message: any) => {
    const { from, data: answer } = message
    console.log('Received answer from:', from)
    
    try {
      const participant = participants.find(p => p.id === from)
      if (participant?.peerConnection) {
        await participant.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
        console.log('Remote description set for:', from)
      }
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const handleIceCandidate = async (message: any) => {
    const { from, data: candidate } = message
    console.log('Received ICE candidate from:', from)
    
    try {
      const participant = participants.find(p => p.id === from)
      if (participant?.peerConnection) {
        await participant.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        console.log('ICE candidate added for:', from)
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  const handleMuteParticipant = async (message: any) => {
    const { from, data: { muted } } = message
    console.log('Received mute participant from:', from)
    
    setParticipants(prev => prev.map(p => 
      p.id === from ? { ...p, isMuted: muted } : p
    ))
  }

  const handleUnmuteParticipant = async (message: any) => {
    const { from, data: { muted } } = message
    console.log('Received unmute participant from:', from)
    
    setParticipants(prev => prev.map(p => 
      p.id === from ? { ...p, isMuted: !muted } : p
    ))
  }

  const handleRemoveParticipant = async (message: any) => {
    const { from } = message
    console.log('Received remove participant from:', from)
    
    // Close peer connection
    const participant = participants.find(p => p.id === from)
    if (participant?.peerConnection) {
      participant.peerConnection.close()
    }
    
    // Remove from local state
    setParticipants(prev => prev.filter(p => p.id !== from))
    
    toast({
      title: "Participant Removed",
      description: "Participant has been removed from the meeting",
    })
  }

  const handleToggleVideo = async (message: any) => {
    const { from, data: { videoOn } } = message
    console.log('Received toggle video from:', from)
    
    setParticipants(prev => prev.map(p => 
      p.id === from ? { ...p, isVideoOn: videoOn } : p
    ))
  }

  const sendSignalingMessage = async (action: string, targetUserId: string, data: any) => {
    try {
      await fetch('/api/signaling/sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          meetingId: meeting.id,
          targetUserId,
          data
        }),
      })
    } catch (error) {
      console.error('Failed to send signaling message:', error)
    }
  }

  // Approvals (host)
  const approveParticipant = async (participantId: string) => {
    await sendSignalingMessage('approve-participant', participantId, {})
    setPendingApprovals(prev => prev.filter(p => p.id !== participantId))
  }
  const rejectParticipant = async (participantId: string) => {
    await sendSignalingMessage('reject-participant', participantId, {})
    setPendingApprovals(prev => prev.filter(p => p.id !== participantId))
  }

  // Breakout rooms (host)
  const createRoom = async () => {
    const roomId = `room-${Math.floor(Math.random()*10000)}`
    await fetch('/api/signaling/sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create-room', meetingId: meeting.id, targetUserId: user.id, data: { roomId } })
    })
  }
  const moveParticipantToRoom = async (participantId: string, roomId: string) => {
    await fetch('/api/signaling/sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'move-to-room', meetingId: meeting.id, targetUserId: participantId, data: { roomId } })
    })
  }

  // Recording permissions (host)
  const setRecordingPermission = async (participantId: string, allowed: boolean) => {
    await fetch('/api/signaling/sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-recording-permission', meetingId: meeting.id, targetUserId: participantId, data: { allowed } })
    })
    setAllowedRecorders(prev => {
      const next = new Set(prev)
      if (allowed) next.add(participantId)
      else next.delete(participantId)
      return next
    })
  }

  // Chat messaging
  const sendChatMessage = async (content: string) => {
    if (!content.trim()) return
    await fetch('/api/signaling/sse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat-message', meetingId: meeting.id, targetUserId: user.id, data: { content } })
    })
  }
  const chatMuteUser = async (participantId: string) => {
    await fetch('/api/signaling/sse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat-mute-user', meetingId: meeting.id, targetUserId: participantId, data: {} })
    })
  }
  const chatUnmuteUser = async (participantId: string) => {
    await fetch('/api/signaling/sse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat-unmute-user', meetingId: meeting.id, targetUserId: participantId, data: {} })
    })
  }
  const chatMuteAll = async () => {
    await fetch('/api/signaling/sse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-mute-all', meetingId: meeting.id, targetUserId: user.id, data: {} }) })
    setIsChatGloballyMuted(true)
  }
  const chatUnmuteAll = async () => {
    await fetch('/api/signaling/sse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat-unmute-all', meetingId: meeting.id, targetUserId: user.id, data: {} }) })
    setIsChatGloballyMuted(false)
  }

  const createPeerConnection = (participantId: string) => {
    try {
      console.log('Creating peer connection for:', participantId)
      const peerConnection = new RTCPeerConnection(rtcConfig)
      
      // Add local stream tracks to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream)
          console.log('Added track to peer connection:', track.kind)
        })
      }
      
      // Handle incoming tracks from remote peer
      peerConnection.ontrack = (event) => {
        console.log('Received remote track from createPeerConnection:', event)
        const remoteStream = event.streams[0]
        
        if (remoteStream) {
          console.log('Remote stream received for:', participantId)
          
          // Add remote stream to participants
          setParticipants(prev => prev.map(p => 
            p.id === participantId 
              ? { ...p, stream: remoteStream, peerConnection, isMuted: p.isMuted || false, isVideoOn: p.isVideoOn !== false }
              : p
          ))
          
          // Display remote video
          setTimeout(() => {
            const videoElement = remoteVideosRef.current[participantId]
            if (videoElement) {
              videoElement.srcObject = remoteStream
              videoElement.play().catch(console.error)
              console.log('Remote video started playing for:', participantId)
            } else {
              console.log('Video element not found for:', participantId)
            }
          }, 200)
        }
      }
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage('ice-candidate', participantId, event.candidate)
        }
      }
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Peer connection state for', participantId, ':', peerConnection.connectionState)
      }
      
      // Update participant with peer connection
      setParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? { ...p, peerConnection, isMuted: p.isMuted || false, isVideoOn: p.isVideoOn !== false }
          : p
      ))
      
      // Create and send offer
      createOffer(peerConnection, participantId)
      
    } catch (error) {
      console.error('Failed to create peer connection:', error)
    }
  }

  const createOffer = async (peerConnection: RTCPeerConnection, participantId: string) => {
    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      // Send offer to remote peer via signaling server
      await sendSignalingMessage('offer', participantId, offer)
      console.log('Sent offer to participant:', participantId)
      
    } catch (error) {
      console.error('Failed to create offer:', error)
    }
  }

  const simulateAnswer = async (peerConnection: RTCPeerConnection, participantId: string) => {
    try {
      // Simulate receiving answer from remote peer
      const answer = await peerConnection.createAnswer()
      await peerConnection.setRemoteDescription(answer)
      
      console.log('Simulated answer received for participant:', participantId)
      
    } catch (error) {
      console.error('Failed to set remote description:', error)
    }
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
        
        // Update all peer connections
        participants.forEach(participant => {
          if (participant.peerConnection) {
            participant.peerConnection.getSenders().forEach(sender => {
              if (sender.track?.kind === 'audio') {
                sender.track.enabled = !audioTrack.enabled
              }
            })
          }
        })
        
        toast({
          title: audioTrack.enabled ? "Microphone Enabled" : "Microphone Disabled",
          description: audioTrack.enabled ? "Your microphone is now active" : "Your microphone is now muted",
        })
      }
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(!videoTrack.enabled)
        
        toast({
          title: videoTrack.enabled ? "Camera Enabled" : "Camera Disabled",
          description: videoTrack.enabled ? "Your camera is now active" : "Your camera is now off",
        })
      }
    }
  }

  const toggleRecording = async () => {
    // Only host/admin or users with permission can record
    const isAllowed = (isHost || isAdmin) || allowedRecorders.has(user.id)
    if (!isAllowed) {
      toast({ title: 'Recording Not Allowed', description: 'You do not have permission to record this meeting', variant: 'destructive' })
      return
    }
    
    if (!isRecording) {
      try {
        // Start Stream.io recording
        const response = await fetch('/api/meetings/start-recording', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            meetingId: meeting.id,
            action: 'start'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start recording');
        }

        const result = await response.json();
        
        if (result.success) {
          setIsRecording(true);
          toast({
            title: "Recording Started",
            description: "Meeting recording is now active and will be saved to cloud storage",
          });
        } else {
          throw new Error(result.error || 'Failed to start recording');
        }
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast({
          title: "Recording Error",
          description: "Failed to start recording. Please try again.",
          variant: 'destructive',
        });
      }
    } else {
      try {
        // Stop Stream.io recording
        const response = await fetch('/api/meetings/stop-recording', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            meetingId: meeting.id,
            action: 'stop'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to stop recording');
        }

        const result = await response.json();
        
        if (result.success) {
          setIsRecording(false);
          toast({
            title: "Recording Stopped",
            description: "Recording has been stopped. It will be processed and saved to cloud storage shortly.",
          });
        } else {
          throw new Error(result.error || 'Failed to stop recording');
        }
      } catch (error) {
        console.error('Failed to stop recording:', error);
        toast({
          title: "Recording Error",
          description: "Failed to stop recording. Please try again.",
          variant: 'destructive',
        });
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        
        setIsScreenSharing(true)
        
        toast({
          title: "Screen Sharing Started",
          description: "You're now sharing your screen",
        })
      } else {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream
        }
        setIsScreenSharing(false)
        
        toast({
          title: "Screen Sharing Stopped",
          description: "Screen sharing has been stopped",
        })
      }
    } catch (error) {
      console.error('Screen sharing error:', error)
      toast({
        title: "Screen Sharing Error",
        description: "Failed to start screen sharing",
        variant: 'destructive',
      })
    }
  }

  const leaveCall = () => {
    // Close event source
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
    }
    
    // Close all peer connections
    participants.forEach(participant => {
      if (participant.peerConnection) {
        participant.peerConnection.close()
      }
    })
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    setIsInCall(false)
    setParticipants([])
    setIsInitialized(false)
    
    toast({
      title: "Call Ended",
      description: "You've left the video conference",
    })
    
    // Redirect to meetings page
    window.location.href = '/meetings'
  }

  const endCall = () => {
    if (isHost || isAdmin) {
      leaveCall()
    }
  }

  useEffect(() => {
    initializeVideoConference()
  }, [])

  // Show lobby if not yet joined
  if (showLobby) {
    return (
      <MeetingLobby
        meeting={meeting}
        user={user}
        onJoinMeeting={() => setShowLobby(false)}
        onLeaveLobby={() => window.location.href = '/meetings'}
      />
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Failed to connect to the video call: {error}
            </p>
            <Button onClick={initializeVideoConference} disabled={isJoining}>
              {isJoining ? 'Retrying...' : 'Retry Connection'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isInitialized || isJoining) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{isJoining ? 'Connecting to meeting...' : 'Initializing video call...'}</p>
        </div>
      </div>
    )
  }

  // Host control functions
  const muteParticipant = async (participantId: string) => {
    if (!isHost && !isAdmin) return
    
    try {
      // Send mute command to participant via signaling
      await sendSignalingMessage('mute-participant', participantId, { muted: true })
      
      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, isMuted: true } : p
      ))
      
      toast({
        title: "Participant Muted",
        description: "Participant has been muted by host",
      })
    } catch (error) {
      console.error('Failed to mute participant:', error)
      toast({
        title: "Error",
        description: "Failed to mute participant",
        variant: "destructive",
      })
    }
  }

  const unmuteParticipant = async (participantId: string) => {
    if (!isHost && !isAdmin) return
    
    try {
      // Send unmute command to participant via signaling
      await sendSignalingMessage('unmute-participant', participantId, { muted: false })
      
      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, isMuted: false } : p
      ))
      
      toast({
        title: "Participant Unmuted",
        description: "Participant has been unmuted by host",
      })
    } catch (error) {
      console.error('Failed to unmute participant:', error)
      toast({
        title: "Error",
        description: "Failed to unmute participant",
        variant: "destructive",
      })
    }
  }

  const removeParticipant = async (participantId: string) => {
    if (!isHost && !isAdmin) return
    
    if (!confirm('Are you sure you want to remove this participant from the meeting?')) return
    
    try {
      // Send remove command to participant via signaling
      await sendSignalingMessage('remove-participant', participantId, {})
      
      // Close peer connection
      const participant = participants.find(p => p.id === participantId)
      if (participant?.peerConnection) {
        participant.peerConnection.close()
      }
      
      // Remove from local state
      setParticipants(prev => prev.filter(p => p.id !== participantId))
      
      toast({
        title: "Participant Removed",
        description: "Participant has been removed from the meeting",
      })
    } catch (error) {
      console.error('Failed to remove participant:', error)
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      })
    }
  }

  const toggleParticipantVideo = async (participantId: string) => {
    if (!isHost && !isAdmin) return
    
    const participant = participants.find(p => p.id === participantId)
    if (!participant) return
    
    try {
      const newVideoState = !participant.isVideoOn
      
      // Send video toggle command to participant via signaling
      await sendSignalingMessage('toggle-video', participantId, { videoOn: newVideoState })
      
      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? { ...p, isVideoOn: newVideoState } : p
      ))
      
      toast({
        title: newVideoState ? "Video Enabled" : "Video Disabled",
        description: `Participant video has been ${newVideoState ? 'enabled' : 'disabled'} by host`,
      })
    } catch (error) {
      console.error('Failed to toggle participant video:', error)
      toast({
        title: "Error",
        description: "Failed to toggle participant video",
        variant: "destructive",
      })
    }
  }

  // Render participant video thumbnail
  const renderParticipantThumbnail = (participant: Participant, index: number) => {
    const isMainView = index === 0 || participants.length <= 4
    
    return (
      <div 
        key={participant.id} 
        className={`relative bg-gray-700 rounded-lg overflow-hidden ${
          isMainView ? 'col-span-2 row-span-2' : ''
        }`}
      >
        {participant.stream ? (
          <video
            ref={(el) => {
              if (el) remoteVideosRef.current[participant.id] = el
            }}
            autoPlay
            playsInline
            muted={participant.isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-600">
            <Avatar className="h-20 w-20">
              <AvatarImage src={participant.avatar} />
              <AvatarFallback className="text-2xl">
                {participant.firstName?.[0]}{participant.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Participant info overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
          {participant.isHost && <Crown className="h-3 w-3 text-yellow-400" />}
          <span>{participant.firstName} {participant.lastName}</span>
          {participant.isLocal && <span className="text-blue-400">(You)</span>}
        </div>
        
        {/* Status indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
          {participant.isMuted && <MicOff className="h-4 w-4 text-red-400 bg-black bg-opacity-50 rounded p-0.5" />}
          {participant.isVideoOn === false && <VideoOff className="h-4 w-4 text-red-400 bg-black bg-opacity-50 rounded p-0.5" />}
        </div>
        
        {/* Audio level indicator */}
        {participant.stream && (
          <div className="absolute top-2 left-2">
            <AudioLevelIndicator stream={participant.stream} />
          </div>
        )}
        
        {/* Speaking indicator */}
        {participant.stream && (
          <div className="absolute bottom-2 right-2">
            <SpeakingIndicator stream={participant.stream} />
          </div>
        )}
        
        {/* Host controls overlay */}
        {(isHost || isAdmin) && !participant.isLocal && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={participant.isMuted ? "destructive" : "secondary"}
                onClick={() => participant.isMuted ? unmuteParticipant(participant.id) : muteParticipant(participant.id)}
                className="h-8 w-8 p-0"
              >
                {participant.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                size="sm"
                variant={participant.isVideoOn === false ? "destructive" : "secondary"}
                onClick={() => toggleParticipantVideo(participant.id)}
                className="h-8 w-8 p-0"
              >
                {participant.isVideoOn === false ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => removeParticipant(participant.id)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Remove Participant
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedParticipant(participant)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-white font-semibold">{meeting.title}</h1>
            <p className="text-gray-400 text-sm">
              {isHost ? 'Host' : 'Participant'} • {participants.length + 1} participants
            </p>
            <p className="text-gray-400 text-sm font-mono">
              Duration: {duration}
            </p>
            {duration && parseInt(duration.split(':')[0] || '0') >= 1 && !hasShownWarning && (
              <p className="text-amber-400 text-sm">
                ⚠️ Meeting duration warning approaching
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'}>
            {meeting.status}
          </Badge>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              Recording
            </Badge>
          )}
          {(isHost || isAdmin) && (
            <div className="flex items-center gap-2">
              {/* Rooms */}
              <Button variant="secondary" size="sm" onClick={createRoom}>Create Room</Button>
              {/* Chat moderation */}
              <Button variant="secondary" size="sm" onClick={isChatGloballyMuted ? chatUnmuteAll : chatMuteAll}>
                {isChatGloballyMuted ? 'Unmute Chat' : 'Mute Chat'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Waiting room overlay for non-hosts */}
      {waitingApproval && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">Waiting for Host Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">You'll join automatically once the host approves your request.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
          {/* Main video area - Grid of participants */}
          <div className="col-span-full lg:col-span-2 xl:col-span-3 bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
              {/* Local video */}
              <div className="relative bg-gray-700 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
                  {isHost && <Crown className="h-3 w-3 text-yellow-400" />}
                  <span>You ({user.firstName} {user.lastName})</span>
                </div>
                
                {/* Local status indicators */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {isMuted && <MicOff className="h-4 w-4 text-red-400 bg-black bg-opacity-50 rounded p-0.5" />}
                  {!isVideoOn && <VideoOff className="h-4 w-4 text-red-400 bg-black bg-opacity-50 rounded p-0.5" />}
                </div>
              </div>

              {/* Remote participants */}
              {participants.filter(p => !p.isLocal).filter(p => (userIdToRoomId[p.id] || 'main') === myRoomId).map((participant, index) => 
                renderParticipantThumbnail(participant, index)
              )}

              {/* Placeholder for additional participants */}
              {participants.filter(p => !p.isLocal && !p.stream).map((participant, index) => (
                <div key={participant.id} className="bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarFallback>
                        {participant.firstName?.[0]}{participant.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">{participant.firstName} {participant.lastName}</p>
                    <p className="text-xs">Connecting...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participants sidebar */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({participants.filter(p => !p.isLocal).length + 1})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(isHost || isAdmin) && pendingApprovals.length > 0 && (
                <div className="p-2 rounded bg-yellow-900/20 border border-yellow-800">
                  <p className="text-yellow-200 text-sm mb-2">Pending Approvals</p>
                  <div className="space-y-2">
                    {pendingApprovals.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="text-white">
                          {p.firstName || 'User'} {p.lastName || ''}
                          <span className="text-xs text-gray-400 ml-2">{p.email}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => approveParticipant(p.id)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectParticipant(p.id)}>Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Current user */}
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium flex items-center gap-2">
                    {user.firstName} {user.lastName} (You)
                    {isHost && <Crown className="h-3 w-3 text-yellow-400" />}
                  </p>
                  <p className="text-gray-400 text-xs">{user.role}</p>
                </div>
                <div className="flex space-x-1">
                  {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                  {!isVideoOn && <VideoOff className="h-3 w-3 text-red-400" />}
                </div>
              </div>

              {/* Other participants - only show remote participants */}
              {participants.filter(p => !p.isLocal).map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {participant.firstName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-white text-sm flex items-center gap-2">
                      {participant.firstName} {participant.lastName}
                      {participant.isHost && <Crown className="h-3 w-3 text-yellow-400" />}
                      <span className="text-xs text-gray-400">[{userIdToRoomId[participant.id] || 'main'}]</span>
                    </p>
                    <p className="text-gray-400 text-xs">{participant.email}</p>
                  </div>
                  <div className="flex space-x-1">
                    {participant.isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                    {participant.isVideoOn === false && <VideoOff className="h-3 w-3 text-red-400" />}
                    {participant.isLocal ? (
                      <Badge variant="default" className="text-xs">Local</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Remote</Badge>
                    )}
                    {participant.stream ? (
                      <Badge variant="default" className="text-xs">Connected</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Connecting</Badge>
                    )}
                  </div>
                  
                  {/* Host controls */}
                  {(isHost || isAdmin) && !participant.isLocal && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => participant.isMuted ? unmuteParticipant(participant.id) : muteParticipant(participant.id)}>
                          {participant.isMuted ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                          {participant.isMuted ? 'Unmute' : 'Mute'} Participant
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleParticipantVideo(participant.id)}>
                          {participant.isVideoOn === false ? <Video className="h-4 w-4 mr-2" /> : <VideoOff className="h-4 w-4 mr-2" />}
                          {participant.isVideoOn === false ? 'Enable' : 'Disable'} Video
                        </DropdownMenuItem>
                        {/* Recording permission */}
                        <DropdownMenuItem onClick={() => setRecordingPermission(participant.id, !allowedRecorders.has(participant.id))}>
                          {allowedRecorders.has(participant.id) ? 'Revoke Recording' : 'Allow Recording'}
                        </DropdownMenuItem>
                        {/* Chat moderation */}
                        <DropdownMenuItem onClick={() => chatMuteUser(participant.id)}>Mute in Chat</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => chatUnmuteUser(participant.id)}>Unmute in Chat</DropdownMenuItem>
                        {/* Move to room submenu naive: list rooms */}
                        {rooms.length > 0 && rooms.map(r => (
                          <DropdownMenuItem key={r} onClick={() => moveParticipantToRoom(participant.id, r)}>
                            Move to {r}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => removeParticipant(participant.id)} className="text-red-600">
                          <UserX className="h-4 w-4 mr-2" />
                          Remove Participant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        {/* Audio Control */}
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="lg"
          onClick={toggleMute}
          disabled={!isInCall}
          className="h-12 w-12 rounded-full"
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        {/* Video Control */}
        <Button
          variant={isVideoOn ? 'secondary' : 'destructive'}
          size="lg"
          onClick={toggleVideo}
          disabled={!isInCall}
          className="h-12 w-12 rounded-full"
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        {/* Screen Share Control */}
        <Button
          variant={isScreenSharing ? 'destructive' : 'secondary'}
          size="lg"
          onClick={toggleScreenShare}
          disabled={!isInCall}
          className="h-12 w-12 rounded-full"
        >
          {isScreenSharing ? <Share className="h-5 w-5" /> : <Share className="h-5 w-5" />}
        </Button>

        {/* Recording Control */}
        <Button
          variant={isRecording ? 'destructive' : 'secondary'}
          size="lg"
          onClick={toggleRecording}
          disabled={!isInCall}
          className="h-12 w-12 rounded-full"
        >
          {isRecording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </Button>

        {/* Leave Call */}
        <Button
          variant="destructive"
          size="lg"
          onClick={leaveCall}
          disabled={!isInCall}
          className="h-12 w-12 rounded-full"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>

        {/* End Call (Host/Admin only) */}
        {(isHost || isAdmin) && (
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            disabled={!isInCall}
          >
            End Call
          </Button>
        )}
      </div>

      {/* Meeting Duration Warning Modal */}
      <MeetingDurationWarning
        isOpen={showWarning}
        onContinue={dismissWarning}
        onStop={endCall}
        meetingTitle={meeting.title}
      />
    </div>
  )
} 