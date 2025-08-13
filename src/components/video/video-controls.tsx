"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Phone,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  MoreHorizontal,
  Share,
  Circle,
  Square,
  Volume2,
  VolumeX
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface VideoControlsProps {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  isRecording: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleRecording: () => void
  onLeaveCall: () => void
  onOpenSettings: () => void
  onOpenParticipants: () => void
  onOpenChat: () => void
  className?: string
}

export function VideoControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onLeaveCall,
  onOpenSettings,
  onOpenParticipants,
  onOpenChat,
  className
}: VideoControlsProps) {
  const { toast } = useToast()

  const handleToggleAudio = () => {
    onToggleAudio()
    toast({
      title: isAudioEnabled ? "Microphone Disabled" : "Microphone Enabled",
      description: isAudioEnabled ? "Your microphone is now muted" : "Your microphone is now active",
    })
  }

  const handleToggleVideo = () => {
    onToggleVideo()
    toast({
      title: isVideoEnabled ? "Camera Disabled" : "Camera Enabled",
      description: isVideoEnabled ? "Your camera is now off" : "Your camera is now active",
    })
  }

  const handleToggleRecording = () => {
    onToggleRecording()
    if (!isRecording) {
      toast({
        title: "Recording Started",
        description: "Meeting recording is now active",
      })
    } else {
      toast({
        title: "Recording Stopped",
        description: "Meeting recording has been stopped",
      })
    }
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t",
      className
    )}>
      {/* Audio Control */}
      <Button
        variant={isAudioEnabled ? "default" : "destructive"}
        size="icon"
        onClick={handleToggleAudio}
        className="h-12 w-12 rounded-full"
        title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
      </Button>

      {/* Video Control */}
      <Button
        variant={isVideoEnabled ? "default" : "destructive"}
        size="icon"
        onClick={handleToggleVideo}
        className="h-12 w-12 rounded-full"
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </Button>

      {/* Screen Share Control */}
      <Button
        variant={isScreenSharing ? "destructive" : "default"}
        size="icon"
        onClick={onToggleScreenShare}
        className="h-12 w-12 rounded-full"
        title={isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
      >
        {isScreenSharing ? (
          <MonitorOff className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5" />
        )}
      </Button>

      {/* Recording Control */}
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="icon"
        onClick={handleToggleRecording}
        className="h-12 w-12 rounded-full"
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <Square className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </Button>

      {/* Participants */}
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenParticipants}
        className="h-12 w-12 rounded-full"
        title="View participants"
      >
        <Users className="h-5 w-5" />
      </Button>

      {/* Chat */}
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenChat}
        className="h-12 w-12 rounded-full"
        title="Open chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            title="More options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLeaveCall} className="text-red-600">
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave Call
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Leave Call Button */}
      <Button
        variant="destructive"
        size="icon"
        onClick={onLeaveCall}
        className="h-12 w-12 rounded-full"
        title="Leave call"
      >
        <Phone className="h-5 w-5" />
      </Button>
    </div>
  )
} 