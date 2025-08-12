'use client';

import { useState, useEffect } from 'react';

import { MeetingForm } from '@/components/forms/meeting-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Plus, Video } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyId: string;
}

interface CreateMeetingButtonProps {
  user: User;
  users: User[];
  contacts: Contact[];
}

export const CreateMeetingButton = ({ user, users, contacts }: CreateMeetingButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Set participants when the modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 Modal opened, setting participants from props...');
      setParticipantsFromProps();
    }
  }, [isOpen, users, contacts]);

  const setParticipantsFromProps = () => {
    try {
      console.log('🎯 Setting participants from props...');
      console.log('🎯 Users from props:', users);
      console.log('🎯 Contacts from props:', contacts);
      
      // Combine and format participants from props
      const allParticipants = [
        ...users.map((user: User) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
        })),
        ...contacts.map((contact: Contact) => ({
          id: contact.id,
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'Unknown Contact',
          email: contact.email,
        })),
      ];
      
      console.log('🎯 All participants from props:', allParticipants);
      console.log('🎯 Setting participants state with:', allParticipants.length, 'participants');
      console.log('🎯 Users count:', users.length);
      console.log('🎯 Contacts count:', contacts.length);
      console.log('🎯 Final participant names:', allParticipants.map(p => ({ id: p.id, name: p.name, email: p.email })));
      setParticipants(allParticipants);
      
      if (allParticipants.length === 0) {
        console.log('🎯 No participants found, showing error toast');
        toast({
          title: 'No Participants Found',
          description: 'No users or contacts found for your company. Please check your company settings.',
        });
      } else {
        console.log('🎯 Participants loaded successfully from props');
        toast({
          title: 'Participants Loaded',
          description: `Successfully loaded ${allParticipants.length} participants`,
        });
      }
    } catch (error) {
      console.error('Failed to set participants from props:', error);
      toast({
        title: 'Error Loading Participants',
        description: error instanceof Error ? error.message : 'Failed to load participants',
        variant: 'destructive',
      });
    }
  };

  const handleMeetingCreated = async (meetingData: any) => {
    try {
      setIsLoading(true);
      
      // Create the meeting via API
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meeting');
      }

      const result = await response.json();
      console.log('Meeting created:', result);

      toast({
        title: 'Success',
        description: 'Meeting created successfully!',
      });

      setIsOpen(false);
      
      // Refresh the page to show the new meeting
      window.location.reload();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create meeting',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <Video className="h-4 w-4" />
          Create Video Conference
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Create New Video Conference
          </DialogTitle>
          <DialogDescription>
            Schedule a new video meeting with your team or external participants.
          </DialogDescription>
        </DialogHeader>

        <MeetingForm
          participants={participants}
          onSubmit={handleMeetingCreated}
          isLoading={isLoading}
        />
        {/* Debug info */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Participants count: {participants.length}</p>
          <p>Users count: {users?.length || 0}</p>
          <p>Contacts count: {contacts?.length || 0}</p>
          <p>Is loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>User company ID: {user.companyId}</p>
          <p>User role: {user.role}</p>
          <p><strong>Users:</strong> {users?.map(u => `${u.firstName} ${u.lastName}`).join(', ') || 'None'}</p>
          <p><strong>Contacts:</strong> {contacts?.map(c => `${c.firstName} ${c.lastName}`).join(', ') || 'None'}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 