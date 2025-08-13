"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MeetingLobbyProps {
  meeting: any
  user: any
  onJoinMeeting: () => void
  onLeaveLobby: () => void
}

export function MeetingLobby({ meeting, user, onJoinMeeting, onLeaveLobby }: MeetingLobbyProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [participants, setParticipants] = useState<any[]>([])
  const [isReady, setIsReady] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [localVideoRef, setLocalVideoRef] = useState<HTMLVideoElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize local media stream
    initializeLocalMedia()
    
    // Load meeting participants
    if (meeting.participants) {
      setParticipants(meeting.participants)
    }
  }, [])

  const initializeLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLocalStream(stream)
      
      // Display local video
      if (localVideoRef) {
        localVideoRef.srcObject = stream
        localVideoRef.play().catch(console.error)
      }
      
      setIsAudioEnabled(true)
      setIsVideoEnabled(true)
      
      toast({
        title: "Media Access Granted",
        description: "Camera and microphone are ready",
      })
      
    } catch (error: any) {
      console.error('Failed to access media devices:', error)
      toast({
        title: "Media Access Error",
        description: error.message || 'Failed to access camera or microphone',
        variant: 'destructive',
      })
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
        
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
        setIsVideoEnabled(videoTrack.enabled)
        
        toast({
          title: videoTrack.enabled ? "Camera Enabled" : "Camera Disabled",
          description: videoTrack.enabled ? "Your camera is now active" : "Your camera is now off",
        })
      }
    }
  }

  const handleJoinMeeting = () => {
    if (!isAudioEnabled && !isVideoEnabled) {
      toast({
        title: "Media Required",
        description: "Please enable at least camera or microphone to join",
        variant: 'destructive',
      })
      return
    }
    
    setIsReady(true)
    onJoinMeeting()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{meeting.title}</CardTitle>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(meeting.startTime)} at {formatTime(meeting.startTime)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {participants.length + 1} participants
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left side - Local video and controls */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Preview</h3>
                
                {/* Local video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                  {localVideoRef ? (
                    <video
                      ref={setLocalVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Video className="w-16 h-16" />
                    </div>
                  )}
                  
                  {/* Video status overlay */}
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <VideoOff className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Media controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={isAudioEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={toggleAudio}
                    className="h-12 w-12 rounded-full"
                  >
                    {isAudioEnabled ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <Button
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={toggleVideo}
                    className="h-12 w-12 rounded-full"
                  >
                    {isVideoEnabled ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                {/* Media status */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">
                      {isAudioEnabled ? 'Microphone Ready' : 'Microphone Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">
                      {isVideoEnabled ? 'Camera Ready' : 'Camera Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right side - Participants and join button */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Meeting Details</h3>
                
                {/* Meeting info */}
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Meeting Information</h4>
                    <p className="text-sm text-blue-800">{meeting.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-1">Your Status</h4>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">Ready to join</span>
                    </div>
                  </div>
                </div>
                
                {/* Participants list */}
                <div>
                  <h4 className="font-medium mb-3">Participants ({participants.length + 1})</h4>
                  <div className="space-y-2">
                    {/* Current user */}
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {user.firstName} {user.lastName} (You)
                        </p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                      <Badge variant="default" className="text-xs">Host</Badge>
                    </div>
                    
                    {/* Other participants */}
                    {participants.map((participant) => {
                      const participantData = participant.user || participant.contact
                      if (!participantData) return null
                      
                      return (
                        <div key={participant.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {participantData.firstName?.[0]}{participantData.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {participantData.firstName} {participantData.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {participantData.email}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {participant.role || 'Participant'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleJoinMeeting}
                    disabled={!isAudioEnabled && !isVideoEnabled}
                    className="flex-1"
                    size="lg"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Meeting
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={onLeaveLobby}
                    size="lg"
                  >
                    Leave
                  </Button>
                </div>
                
                {/* Requirements notice */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Before joining:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Ensure your camera and microphone are working</li>
                        <li>• Find a quiet location with good lighting</li>
                        <li>• Test your audio and video settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
