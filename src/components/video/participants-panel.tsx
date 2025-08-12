"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Crown, 
  MoreHorizontal,
  User,
  Users
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Participant {
  id: string
  name: string
  email: string
  avatar?: string
  isHost: boolean
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  isSpeaking: boolean
  role: "HOST" | "PARTICIPANT" | "MODERATOR"
  joinedAt: Date
}

interface ParticipantsPanelProps {
  participants: Participant[]
  currentUserId: string
  isHost: boolean
  onMuteParticipant?: (participantId: string) => void
  onRemoveParticipant?: (participantId: string) => void
  onMakeHost?: (participantId: string) => void
  onMakeModerator?: (participantId: string) => void
  className?: string
}

export function ParticipantsPanel({
  participants,
  currentUserId,
  isHost,
  onMuteParticipant,
  onRemoveParticipant,
  onMakeHost,
  onMakeModerator,
  className
}: ParticipantsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hosts = filteredParticipants.filter(p => p.isHost)
  const moderators = filteredParticipants.filter(p => p.role === "MODERATOR" && !p.isHost)
  const regularParticipants = filteredParticipants.filter(p => p.role === "PARTICIPANT")

  const getParticipantStatus = (participant: Participant) => {
    if (participant.isScreenSharing) return "sharing"
    if (participant.isSpeaking) return "speaking"
    if (!participant.isAudioEnabled && !participant.isVideoEnabled) return "muted"
    return "active"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sharing": return "bg-blue-500"
      case "speaking": return "bg-green-500"
      case "muted": return "bg-gray-500"
      default: return "bg-green-500"
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 p-4">
            {/* Hosts */}
            {hosts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Hosts ({hosts.length})
                </h4>
                {hosts.map((participant) => (
                  <ParticipantItem
                    key={participant.id}
                    participant={participant}
                    currentUserId={currentUserId}
                    isHost={isHost}
                    onMuteParticipant={onMuteParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                    onMakeHost={onMakeHost}
                    onMakeModerator={onMakeModerator}
                  />
                ))}
                <Separator />
              </div>
            )}

            {/* Moderators */}
            {moderators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Moderators ({moderators.length})
                </h4>
                {moderators.map((participant) => (
                  <ParticipantItem
                    key={participant.id}
                    participant={participant}
                    currentUserId={currentUserId}
                    isHost={isHost}
                    onMuteParticipant={onMuteParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                    onMakeHost={onMakeHost}
                    onMakeModerator={onMakeModerator}
                  />
                ))}
                <Separator />
              </div>
            )}

            {/* Regular Participants */}
            {regularParticipants.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Participants ({regularParticipants.length})
                </h4>
                {regularParticipants.map((participant) => (
                  <ParticipantItem
                    key={participant.id}
                    participant={participant}
                    currentUserId={currentUserId}
                    isHost={isHost}
                    onMuteParticipant={onMuteParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                    onMakeHost={onMakeHost}
                    onMakeModerator={onMakeModerator}
                  />
                ))}
              </div>
            )}

            {filteredParticipants.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No participants found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface ParticipantItemProps {
  participant: Participant
  currentUserId: string
  isHost: boolean
  onMuteParticipant?: (participantId: string) => void
  onRemoveParticipant?: (participantId: string) => void
  onMakeHost?: (participantId: string) => void
  onMakeModerator?: (participantId: string) => void
}

function ParticipantItem({
  participant,
  currentUserId,
  isHost,
  onMuteParticipant,
  onRemoveParticipant,
  onMakeHost,
  onMakeModerator
}: ParticipantItemProps) {
  const isCurrentUser = participant.id === currentUserId
  const status = getParticipantStatus(participant)
  const statusColor = getStatusColor(status)

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar} alt={participant.name} />
            <AvatarFallback>
              {participant.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${statusColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {participant.name}
              {isCurrentUser && " (You)"}
            </p>
            {participant.isHost && (
              <Crown className="h-3 w-3 text-yellow-500" />
            )}
            {participant.role === "MODERATOR" && (
              <Badge variant="secondary" className="text-xs">Mod</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {participant.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Audio/Video Status */}
        <div className="flex items-center gap-1">
          {participant.isAudioEnabled ? (
            <Mic className="h-3 w-3 text-green-500" />
          ) : (
            <MicOff className="h-3 w-3 text-red-500" />
          )}
          {participant.isVideoEnabled ? (
            <Video className="h-3 w-3 text-green-500" />
          ) : (
            <VideoOff className="h-3 w-3 text-red-500" />
          )}
        </div>

        {/* Actions Menu */}
        {isHost && !isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onMuteParticipant && (
                <DropdownMenuItem onClick={() => onMuteParticipant(participant.id)}>
                  {participant.isAudioEnabled ? "Mute" : "Unmute"}
                </DropdownMenuItem>
              )}
              {onMakeHost && participant.role !== "HOST" && (
                <DropdownMenuItem onClick={() => onMakeHost(participant.id)}>
                  Make Host
                </DropdownMenuItem>
              )}
              {onMakeModerator && participant.role === "PARTICIPANT" && (
                <DropdownMenuItem onClick={() => onMakeModerator(participant.id)}>
                  Make Moderator
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onRemoveParticipant && (
                <DropdownMenuItem 
                  onClick={() => onRemoveParticipant(participant.id)}
                  className="text-destructive"
                >
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function getParticipantStatus(participant: Participant) {
  if (participant.isScreenSharing) return "sharing"
  if (participant.isSpeaking) return "speaking"
  if (!participant.isAudioEnabled && !participant.isVideoEnabled) return "muted"
  return "active"
}

function getStatusColor(status: string) {
  switch (status) {
    case "sharing": return "bg-blue-500"
    case "speaking": return "bg-green-500"
    case "muted": return "bg-gray-500"
    default: return "bg-green-500"
  }
} 