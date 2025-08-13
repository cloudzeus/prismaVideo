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
  const [localParticipant, setLocalParticipant] = useState<any>(null)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  
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
      
      // Set local participant
      setLocalParticipant({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        isLocal: true,
        isHost: isHost
      })
      
      // Load meeting participants
      if (meeting.participants && meeting.participants.length > 0) {
        const meetingParticipants = meeting.participants.map((p: any) => ({
          id: p.userId || p.contactId,
          firstName: p.user?.firstName || p.contact?.firstName,
          lastName: p.user?.lastName || p.contact?.lastName,
          email: p.user?.email || p.contact?.email,
          avatar: p.user?.avatar || p.contact?.avatarUrl,
          isLocal: false,
          isHost: p.userId === meeting.createdById
        }))
        setParticipants(meetingParticipants)
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
    
    setIsInCall(false)
    setParticipants([])
    setLocalParticipant(null)
    
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

          {/* Participants Grid */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Conference Participants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Local Participant */}
                {localParticipant && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={localParticipant.avatar} />
                      <AvatarFallback>
                        {localParticipant.firstName?.[0]}{localParticipant.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {localParticipant.firstName} {localParticipant.lastName} (You)
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {localParticipant.email}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {localParticipant.isHost && <Badge variant="secondary">Host</Badge>}
                        <Badge variant="default">Local</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Participants */}
                {participants.map((participant, index) => (
                  <div key={participant.id || index} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                    <Avatar className="h-12 w-12">
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
                      <div className="flex gap-1 mt-1">
                        {participant.isHost && <Badge variant="secondary">Host</Badge>}
                        <Badge variant="outline">Remote</Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {participants.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No other participants yet</p>
                    <p className="text-sm">Share the meeting link to invite others</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Info Panel */}
        <div className="space-y-4">

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
