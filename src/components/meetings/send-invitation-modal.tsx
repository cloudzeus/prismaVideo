'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X, Mail, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SendInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  meeting: {
    id: string
    title: string
    startTime: string
    description?: string | null
  }
}

export function SendInvitationModal({ isOpen, onClose, meeting }: SendInvitationModalProps) {
  const { toast } = useToast()
  const [emails, setEmails] = useState<string[]>([''])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addEmail = () => {
    setEmails([...emails, ''])
  }

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index))
    }
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async () => {
    const validEmails = emails.filter(email => email.trim() && isValidEmail(email.trim()))
    
    if (validEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one valid email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/send-invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantEmails: validEmails,
          message: message.trim()
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
        onClose()
        // Reset form
        setEmails([''])
        setMessage('')
      } else {
        throw new Error(result.error || 'Failed to send invitations')
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send invitations',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Meeting Invitations
          </DialogTitle>
          <DialogDescription>
            Send email invitations to participants for "{meeting.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meeting Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {new Date(meeting.startTime).toLocaleDateString()}
              </Badge>
              <Badge variant="outline">
                {new Date(meeting.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Badge>
            </div>
            <p className="text-sm font-medium">{meeting.title}</p>
            {meeting.description && (
              <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>
            )}
          </div>

          {/* Email Addresses */}
          <div className="space-y-3">
            <Label>Participant Email Addresses</Label>
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="participant@example.com"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  className="flex-1"
                />
                {emails.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeEmail(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmail}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Email
            </Button>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Invitations'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
