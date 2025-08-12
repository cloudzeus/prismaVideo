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
  Square
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t",
      className
    )}>
      {/* Audio Control */}
      <Button
        variant={isAudioEnabled ? "default" : "destructive"}
        size="icon"
        onClick={onToggleAudio}
        className="h-12 w-12 rounded-full"
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
        onClick={onToggleVideo}
        className="h-12 w-12 rounded-full"
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
        onClick={onToggleRecording}
        className="h-12 w-12 rounded-full"
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
      >
        <Users className="h-5 w-5" />
      </Button>

      {/* Chat */}
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenChat}
        className="h-12 w-12 rounded-full"
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
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share className="mr-2 h-4 w-4" />
            Share Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <PhoneOff className="mr-2 h-4 w-4" />
            End Call
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Leave Call */}
      <Button
        variant="destructive"
        size="icon"
        onClick={onLeaveCall}
        className="h-12 w-12 rounded-full"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  )
} 