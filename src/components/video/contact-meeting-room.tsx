'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Users, 
  Settings,
  Calendar,
  Clock
} from 'lucide-react'

interface ContactMeetingRoomProps {
  meeting: {
    id: string
    title: string
    description?: string | null
    startTime: string
    endTime?: string | null
    status: string
    createdBy: {
      firstName: string
      lastName: string
      email: string
      avatar?: string | null
    }
    participants: Array<{
      id: string
      role: string
      joinedAt: string
      leftAt?: string | null
      user?: {
        firstName: string
        lastName: string
        email: string
        avatar?: string | null
      }
      contact?: {
        firstName: string
        lastName: string
        email: string
        avatarUrl?: string | null
      }
    }>
  }
  token: string
}

export function ContactMeetingRoom({ meeting, token }: ContactMeetingRoomProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [participantName, setParticipantName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)

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

  const handleJoinMeeting = async () => {
    if (!participantName.trim()) return

    try {
      // Here you would typically join the video call
      // For now, we'll just simulate joining
      setIsJoined(true)
      setShowNamePrompt(false)
      
      // In a real implementation, you would:
      // 1. Join the video stream
      // 2. Register the participant
      // 3. Connect to other participants
      
    } catch (error) {
      console.error('Error joining meeting:', error)
    }
  }

  const toggleVideo = () => setIsVideoOn(!isVideoOn)
  const toggleAudio = () => setIsAudioOn(!isAudioOn)

  const leaveMeeting = () => {
    setIsJoined(false)
    setShowNamePrompt(true)
    setParticipantName('')
  }

  if (showNamePrompt) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Join Meeting</CardTitle>
            <CardDescription>
              Enter your name to join "{meeting.title}"
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinMeeting()}
              />
            </div>
            
            <Button 
              onClick={handleJoinMeeting}
              disabled={!participantName.trim()}
              className="w-full"
            >
              Join Meeting
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold">{meeting.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(meeting.startTime)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(meeting.startTime)}
                  {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'}>
              {meeting.status === 'active' ? 'Live' : meeting.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={leaveMeeting}>
              Leave Meeting
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 p-6">
          <div className="h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-muted-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {isVideoOn ? (
                  <Video className="w-16 h-16 text-muted-foreground" />
                ) : (
                  <VideoOff className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground">
                {isVideoOn ? 'Camera is on' : 'Camera is off'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {participantName}
              </p>
            </div>
          </div>
        </div>

        {/* Participants Panel */}
        <div className="w-80 bg-card border-l p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Participants</h3>
            <Badge variant="secondary" className="ml-auto">
              {meeting.participants.length + 1}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {/* Host */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <Avatar className="w-8 h-8">
                <AvatarImage src={meeting.createdBy.avatar || undefined} />
                <AvatarFallback>
                  {meeting.createdBy.firstName[0]}{meeting.createdBy.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {meeting.createdBy.firstName} {meeting.createdBy.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {meeting.createdBy.email}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">Host</Badge>
            </div>

            {/* Other Participants */}
            {meeting.participants.map((participant) => {
              const participantData = participant.user || participant.contact
              if (!participantData) return null
              
              return (
                <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <Avatar className="w-8 h-8">
                                         <AvatarImage src={
                       'avatar' in participantData && participantData.avatar 
                         ? participantData.avatar 
                         : 'avatarUrl' in participantData && participantData.avatarUrl 
                           ? participantData.avatarUrl 
                           : undefined
                     } />
                    <AvatarFallback>
                      {participantData.firstName[0]}{participantData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {participantData.firstName} {participantData.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {participantData.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {participant.role}
                  </Badge>
                </div>
              )
            })}

            {/* Current User */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-200">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  {participantName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{participantName}</p>
                <p className="text-xs text-muted-foreground">You</p>
              </div>
              <Badge variant="default" className="text-xs">You</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border-t px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isAudioOn ? 'default' : 'secondary'}
            size="icon"
            onClick={toggleAudio}
            className="w-12 h-12 rounded-full"
          >
            {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isVideoOn ? 'default' : 'secondary'}
            size="icon"
            onClick={toggleVideo}
            className="w-12 h-12 rounded-full"
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            onClick={leaveMeeting}
            className="w-12 h-12 rounded-full"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
