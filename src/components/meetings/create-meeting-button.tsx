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
}

export const CreateMeetingButton = ({ user }: CreateMeetingButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch participants (users and contacts) when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchParticipants();
    }
  }, [isOpen]);

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching participants for company:', user.companyId);
      console.log('Current user role:', user.role);
      
      // Check if user has required permissions
      if (!user.companyId) {
        throw new Error('User does not have a company ID');
      }

      // Fetch users from the company
      const usersResponse = await fetch(`/api/users/all?companyId=${user.companyId}`);
      console.log('Users response status:', usersResponse.status);
      
      if (!usersResponse.ok) {
        const errorText = await usersResponse.text();
        console.error('Users API error:', errorText);
        throw new Error(`Failed to fetch users: ${usersResponse.status} - ${errorText}`);
      }
      
      const usersData = await usersResponse.json();
      console.log('Users data:', usersData);
      
      // Fetch contacts from the company
      const contactsResponse = await fetch(`/api/contacts?companyId=${user.companyId}`);
      console.log('Contacts response status:', contactsResponse.status);
      
      if (!contactsResponse.ok) {
        const errorText = await contactsResponse.text();
        console.error('Contacts API error:', errorText);
        throw new Error(`Failed to fetch contacts: ${contactsResponse.status} - ${errorText}`);
      }
      
      const contactsData = await contactsResponse.json();
      console.log('Contacts data:', contactsData);
      
      // Filter contacts by company ID since the API doesn't filter by company
      const companyContacts = contactsData.filter((contact: any) =>
        contact.companies && contact.companies.some((company: any) => company.companyId === user.companyId),
      );
      
      console.log('Filtered company contacts:', companyContacts);
      
      // Combine and format participants
      const allParticipants = [
        ...usersData.map((user: User) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        })),
        ...companyContacts.map((contact: Contact) => ({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
        })),
      ];
      
      console.log('All participants:', allParticipants);
      setParticipants(allParticipants);
      
      if (allParticipants.length === 0) {
        toast({
          title: 'No Participants Found',
          description: 'No users or contacts found for your company. Please check your company settings.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Participants Loaded',
          description: `Successfully loaded ${allParticipants.length} participants`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      toast({
        title: 'Error Loading Participants',
        description: error instanceof Error ? error.message : 'Failed to load participants',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeetingCreated = async (meetingData: any) => {
    setIsOpen(false);

    // Email invitations will be sent server-side when the meeting is created
    console.log('Meeting created:', meetingData);

    // Optionally refresh the page or update the meetings list
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <Video className="h-4 w-4" />
          Create Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Create New Meeting
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
      </DialogContent>
    </Dialog>
  );
}; 