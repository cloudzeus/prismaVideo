"use client"

import React, { useEffect, useRef, useState } from 'react'
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
  Copy,
  Link
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface SimpleVideoConferenceProps {
  meeting: any
  user: any
  isHost: boolean
  isAdmin: boolean
}

export function SimpleVideoConference({ meeting, user, isHost, isAdmin }: SimpleVideoConferenceProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  
  const { toast } = useToast()

  const initializeVideoConference = async () => {
    if (isJoining) return
    
    setIsJoining(true)
    setError(null)

    try {
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // Initialize WebRTC peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      
      peerConnectionRef.current = peerConnection
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })
      
      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real app, you'd send this to other participants via signaling server
          console.log('ICE candidate:', event.candidate)
        }
      }
      
      setIsInCall(true)
      setIsJoining(false)
      
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

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(!videoTrack.enabled)
      }
    }
  }

  const leaveCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    
    setIsInCall(false)
    setParticipants([])
    
    toast({
      title: "Call Ended",
      description: "You've left the video conference",
    })
  }

  const copyMeetingLink = () => {
    const meetingUrl = `${window.location.origin}/meetings/${meeting.id}`
    navigator.clipboard.writeText(meetingUrl)
    
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard",
    })
  }

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      })
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream
      }
      
      toast({
        title: "Screen Sharing Started",
        description: "You're now sharing your screen",
      })
    } catch (error) {
      toast({
        title: "Screen Sharing Failed",
        description: "Could not start screen sharing",
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    // Auto-join when component mounts
    initializeVideoConference()
    
    // Cleanup on unmount
    return () => {
      leaveCall()
    }
  }, [])

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={initializeVideoConference} disabled={isJoining}>
            {isJoining ? 'Connecting...' : 'Retry Connection'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Meeting Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{meeting.title}</CardTitle>
              <p className="text-muted-foreground">
                Meeting ID: {meeting.id} • Password: {meeting.password}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={copyMeetingLink}>
                <Link className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Badge variant={isInCall ? "default" : "secondary"}>
                {isInCall ? "Connected" : "Connecting..."}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Video Conference Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Remote Video (Other Participants) */}
          <Card className="aspect-video bg-black">
            <CardContent className="p-0 h-full flex items-center justify-center">
              {isInCall ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-white text-center">
                  <Users className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <p>Waiting for other participants...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Local Video */}
          <Card className="aspect-video bg-black">
            <CardContent className="p-0 h-full flex items-center justify-center">
              {isInCall ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-white text-center">
                  <Video className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <p>Initializing camera...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Participants Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants ({participants.length + 1})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Current User */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName} (You)
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="secondary">Host</Badge>
                </div>

                {/* Other Participants */}
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.firstName?.[0]}{participant.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {participant.firstName} {participant.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {participant.email}
                      </p>
                    </div>
                    <Badge variant="outline">Participant</Badge>
                  </div>
                ))}

                {participants.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No other participants yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Start Time</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(meeting.startTime).toLocaleString()}
                </p>
              </div>
              {meeting.endTime && (
                <div>
                  <p className="text-sm font-medium">End Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(meeting.endTime).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">{meeting.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant="outline">{meeting.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={toggleMute}
              disabled={!isInCall}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button
              variant={!isVideoOn ? "destructive" : "outline"}
              size="lg"
              onClick={toggleVideo}
              disabled={!isInCall}
            >
              {!isVideoOn ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={shareScreen}
              disabled={!isInCall}
            >
              <Share className="h-5 w-5" />
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={leaveCall}
              disabled={!isInCall}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
