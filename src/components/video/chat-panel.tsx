"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  MessageSquare, 
  Paperclip, 
  Smile,
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: Date
  isEdited: boolean
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
}

interface ChatPanelProps {
  messages: ChatMessage[]
  currentUserId: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
  }>
  onSendMessage: (content: string, attachments?: File[]) => void
  onEditMessage?: (messageId: string, content: string) => void
  onDeleteMessage?: (messageId: string) => void
  className?: string
}

export function ChatPanel({
  messages,
  currentUserId,
  participants,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  className
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("")
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim() || attachments.length > 0) {
      onSendMessage(newMessage.trim(), attachments)
      setNewMessage("")
      setAttachments([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const handleSaveEdit = () => {
    if (editingMessageId && editContent.trim() && onEditMessage) {
      onEditMessage(editingMessageId, editContent.trim())
      setEditingMessageId(null)
      setEditContent("")
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type.startsWith('video/')) return '🎥'
    if (file.type.startsWith('audio/')) return '🎵'
    if (file.type.includes('pdf')) return '📄'
    if (file.type.includes('word') || file.type.includes('document')) return '📝'
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊'
    return '📁'
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[500px]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUserId}
                onEdit={handleEditMessage}
                onDelete={onDeleteMessage}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                isEditing={editingMessageId === message.id}
                editContent={editContent}
                setEditContent={setEditContent}
              />
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Message Input */}
        <div className="p-4 space-y-3">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Attachments:</p>
              <div className="space-y-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileIcon(file)}</span>
                      <div>
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[40px]"
                disabled={attachments.length > 0 && !newMessage.trim()}
              />
            </div>
            
            <div className="flex items-center gap-1">
              {/* File Attachment */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Emoji Picker (placeholder) */}
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
              >
                <Smile className="h-4 w-4" />
              </Button>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && attachments.length === 0}
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  onEdit: (message: ChatMessage) => void
  onDelete?: (messageId: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  isEditing: boolean
  editContent: string
  setEditContent: (content: string) => void
}

function ChatMessageItem({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  isEditing,
  editContent,
  setEditContent
}: ChatMessageItemProps) {
  const [showActions, setShowActions] = useState(false)

  if (isEditing) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit()
                } else if (e.key === 'Escape') {
                  onCancelEdit()
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={onSaveEdit}>Save</Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>Cancel</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[70%] space-y-1 ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback className="text-xs">
              {message.senderName.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          
          <div className={`space-y-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {message.senderName}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(message.timestamp, 'HH:mm')}
              </span>
              {message.isEdited && (
                <Badge variant="outline" className="text-xs">Edited</Badge>
              )}
            </div>
            
            <div className={`relative group ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background/20 rounded">
                      <span className="text-lg">📎</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{attachment.name}</p>
                        <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Menu */}
              {isOwnMessage && showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(message)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(message.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 