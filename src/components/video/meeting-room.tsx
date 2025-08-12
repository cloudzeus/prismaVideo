"use client"

import React, { useEffect, useState } from 'react'
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
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StreamVideoClient } from '@stream-io/video-react-sdk'

interface MeetingRoomProps {
  meeting: any
  user: any
  isHost: boolean
  isAdmin: boolean
}

export function MeetingRoom({ meeting, user, isHost, isAdmin }: MeetingRoomProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [isJoining, setIsJoining] = useState(false)

  const initializeStreamForMeeting = async () => {
    if (isJoining) return // Prevent multiple calls
    
    setIsJoining(true)
    setError(null)

    try {
      // Get token specifically for this meeting - this will trigger UpdateUsers only when joining
      const response = await fetch('/api/stream/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: meeting.id,
          forceUpdate: true, // Force update user when joining meeting
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const { token, apiKey } = await response.json()

      // Initialize Stream client for this specific meeting
      const streamClient = new StreamVideoClient({
        apiKey,
        token,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
        },
      })

      setClient(streamClient)
      setIsInitialized(true)
      console.log('Stream client initialized for meeting:', meeting.id)
    } catch (error: any) {
      console.error('Failed to initialize Stream for meeting:', error)
      setError(error.message || 'Failed to connect to meeting')
    } finally {
      setIsJoining(false)
    }
  }

  useEffect(() => {
    // Only initialize Stream when component mounts (user is joining meeting)
    initializeStreamForMeeting()
  }, []) // Empty dependency array - only run once when joining

  useEffect(() => {
    if (client && isInitialized) {
      // Initialize call when Stream client is ready
      initializeCall()
    }
  }, [client, isInitialized])

  const initializeCall = async () => {
    if (!client) return

    try {
      // Join the call
      const call = client.call('default', meeting.streamCallId || meeting.id)
      await call.join({ create: true })
      setIsInCall(true)

      // Get initial participants and set up polling for updates
      const updateParticipants = () => {
        try {
          const currentParticipants = Array.from(call.state.participants.values())
          setParticipants(currentParticipants)
        } catch (err) {
          console.error('Error updating participants:', err)
        }
      }

      updateParticipants()
      
      // Poll for participant updates every 2 seconds
      const participantInterval = setInterval(updateParticipants, 2000)
      
      // Cleanup interval on unmount
      return () => clearInterval(participantInterval)
    } catch (err) {
      console.error('Failed to join call:', err)
      setError('Failed to join the video call')
      return undefined
    }
  }

  const toggleMute = () => {
    if (client && isInCall) {
      const call = client.call('default', meeting.streamCallId || meeting.id)
      if (isMuted) {
        call.microphone.enable()
      } else {
        call.microphone.disable()
      }
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (client && isInCall) {
      const call = client.call('default', meeting.streamCallId || meeting.id)
      if (isVideoOn) {
        call.camera.disable()
      } else {
        call.camera.enable()
      }
      setIsVideoOn(!isVideoOn)
    }
  }

  const leaveCall = async () => {
    if (client && isInCall) {
      const call = client.call('default', meeting.streamCallId || meeting.id)
      await call.leave()
      setIsInCall(false)
      // Redirect to meetings page
      window.location.href = '/meetings'
    }
  }

  const endCall = async () => {
    if (client && isInCall && (isHost || isAdmin)) {
      const call = client.call('default', meeting.streamCallId || meeting.id)
      await call.endCall()
      setIsInCall(false)
      // Redirect to meetings page
      window.location.href = '/meetings'
    }
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
            <Button onClick={initializeStreamForMeeting} disabled={isJoining}>
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
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'}>
            {meeting.status}
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
          {/* Main video area - placeholder for now */}
          <div className="col-span-full lg:col-span-2 xl:col-span-3 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Video className="h-16 w-16 mx-auto mb-4" />
              <p>Video stream will appear here</p>
              <p className="text-sm">Stream.io integration in progress</p>
            </div>
          </div>

          {/* Participants sidebar */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Participants</h3>
            <div className="space-y-3">
              {/* Current user */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {user.firstName} {user.lastName} (You)
                  </p>
                  <p className="text-gray-400 text-xs">{user.role}</p>
                </div>
                <div className="flex space-x-1">
                  {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                  {!isVideoOn && <VideoOff className="h-3 w-3 text-red-400" />}
                </div>
              </div>

              {/* Other participants */}
              {participants.map((participant) => (
                <div key={participant.sessionId} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {participant.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-white text-sm">{participant.name || 'Unknown User'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="lg"
          onClick={toggleMute}
          disabled={!isInCall}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          variant={isVideoOn ? 'secondary' : 'destructive'}
          size="lg"
          onClick={toggleVideo}
          disabled={!isInCall}
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={leaveCall}
          disabled={!isInCall}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>

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
    </div>
  )
} 