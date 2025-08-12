'use client';

import { format } from 'date-fns';
import { CalendarIcon, Clock, Users, Video, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedMultiSelect } from '@/components/ui/enhanced-multi-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  type: string;
  status: string;
  password?: string | null;
  streamCallId?: string | null;
  companyId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
  participants: Array<{
    id: string;
    userId: string | null;
    contactId: string | null;
    role: string;
    joinedAt: string;
    leftAt?: string | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
    };
    contact?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string | null;
    };
  }>;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface EditMeetingModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (meeting: Partial<Meeting>) => Promise<void>;
  users: User[];
  isLoading?: boolean;
}

export function EditMeetingModal({
  meeting,
  isOpen,
  onClose,
  onSave,
  users,
  isLoading = false
}: EditMeetingModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    type: 'meeting',
    status: 'scheduled',
    participants: [] as string[],
    isPublic: false,
    allowJoinBeforeHost: true,
    recordMeeting: false,
    location: '',
    agenda: '',
  });

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        startTime: new Date(meeting.startTime),
        endTime: meeting.endTime ? new Date(meeting.endTime) : new Date(Date.now() + 60 * 60 * 1000),
        type: meeting.type || 'meeting',
        status: meeting.status || 'scheduled',
        participants: meeting.participants
          .filter(p => p.userId)
          .map(p => p.userId!)
          .filter(Boolean),
        isPublic: false,
        allowJoinBeforeHost: true,
        recordMeeting: false,
        location: '',
        agenda: '',
      });
    }
  }, [meeting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate that end time is after start time
      if (formData.endTime <= formData.startTime) {
        toast({
          title: "Invalid Time",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        return;
      }

      // Transform participant IDs back to full participant objects
      const updatedParticipants = formData.participants.map(participantId => {
        const existingParticipant = meeting?.participants.find(p => p.userId === participantId);
        if (existingParticipant) {
          return existingParticipant;
        }
        // If it's a new participant, create a basic structure
        const user = users.find(u => u.id === participantId);
        return {
          id: `temp-${participantId}`,
          userId: participantId,
          contactId: null,
          role: 'PARTICIPANT',
          joinedAt: new Date().toISOString(),
          leftAt: null,
          user: {
            id: user?.id || participantId,
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            avatar: user?.avatar || null,
          },
        };
      });

      await onSave({
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        type: formData.type,
        status: formData.status,
        participants: updatedParticipants,
      });

      toast({
        title: "Success",
        description: "Meeting updated successfully.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update meeting.",
        variant: "destructive",
      });
    }
  };

  const userOptions = users.map(user => ({
    label: `${user.firstName} ${user.lastName} (${user.email})`,
    value: user.id,
    avatar: user.avatar,
  }));

  const handleUserSearch = useCallback(async (query: string) => {
    try {
      console.log('Searching for users with query:', query);
      console.log('Current participants:', formData.participants);
      
      // Only include excludeIds if there are participants to exclude
      const excludeIds = formData.participants.length > 0 ? formData.participants.join(',') : '';
      console.log('Exclude IDs:', excludeIds);
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&exclude=${excludeIds}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const { data: searchResults } = await response.json();
      console.log('Search results:', searchResults);
      
      const mappedResults = searchResults.map((user: any) => ({
        label: `${user.firstName} ${user.lastName} (${user.email})`,
        value: user.id,
        avatar: user.avatar,
      }));
      
      console.log('Mapped results:', mappedResults);
      return mappedResults;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, [formData.participants]);

  if (!meeting) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Edit Meeting
          </DialogTitle>
          <DialogDescription>
            Update meeting details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meeting Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Weekly Team Standup"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Meeting Type</Label>
                <Combobox
                  options={[
                    { value: "meeting", label: "Meeting" },
                    { value: "webinar", label: "Webinar" },
                    { value: "training", label: "Training" }
                  ]}
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  placeholder="Select meeting type"
                  searchPlaceholder="Search meeting types..."
                  emptyMessage="No meeting types found"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the meeting..."
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea
                id="agenda"
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                placeholder="Meeting agenda and topics to discuss..."
                className="resize-none"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.startTime && "text-muted-foreground"
                      )}
                    >
                      {formData.startTime ? (
                        format(formData.startTime, "PPP 'at' HH:mm")
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startTime}
                      onSelect={(date) => date && setFormData({ ...formData, startTime: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.endTime && "text-muted-foreground"
                      )}
                    >
                      {formData.endTime ? (
                        format(formData.endTime, "PPP 'at' HH:mm")
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endTime}
                      onSelect={(date) => date && setFormData({ ...formData, endTime: date })}
                      disabled={(date) => date <= formData.startTime || date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Combobox
                options={[
                  { value: "scheduled", label: "Scheduled" },
                  { value: "active", label: "Active" },
                  { value: "ended", label: "Ended" },
                  { value: "cancelled", label: "Cancelled" }
                ]}
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                placeholder="Select status"
                searchPlaceholder="Search statuses..."
                emptyMessage="No statuses found"
              />
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </h3>
            
            <div className="space-y-2">
              <Label>Select Participants</Label>
              <EnhancedMultiSelect
                options={userOptions}
                selected={formData.participants}
                onChange={(value) => setFormData({ ...formData, participants: value })}
                placeholder="Select participants..."
                searchPlaceholder="Search for users..."
                onSearch={handleUserSearch}
                disabled={isLoading}
                minSearchLength={3}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Video className="h-4 w-4" />
              Meeting Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked as boolean })}
                />
                <Label htmlFor="isPublic">Public Meeting</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowJoinBeforeHost"
                  checked={formData.allowJoinBeforeHost}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowJoinBeforeHost: checked as boolean })}
                />
                <Label htmlFor="allowJoinBeforeHost">Allow Join Before Host</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recordMeeting"
                  checked={formData.recordMeeting}
                  onCheckedChange={(checked) => setFormData({ ...formData, recordMeeting: checked as boolean })}
                />
                <Label htmlFor="recordMeeting">Record Meeting</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 