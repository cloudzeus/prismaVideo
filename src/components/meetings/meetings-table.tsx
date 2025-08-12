'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditMeetingModal } from './edit-meeting-modal';
import { SendInvitationModal } from './send-invitation-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { 
  MoreHorizontal, 
  Play, 
  Edit, 
  Trash2, 
  Copy, 
  Calendar,
  Clock,
  Users,
  Video,
  ExternalLink,
  Mail
} from 'lucide-react';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CurrentFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  type: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface MeetingsTableProps {
  meetings: Meeting[];
  pagination: Pagination;
  currentFilters: CurrentFilters;
  user: User;
  users: User[];
}

export function MeetingsTable({ 
  meetings, 
  pagination, 
  currentFilters, 
  user,
  users
}: MeetingsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSendInvitationModalOpen, setIsSendInvitationModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Debug logging
  console.log('MeetingsTable props:', { meetings, pagination, currentFilters, user });

  // Ensure currentFilters has all required properties
  const safeFilters = {
    page: currentFilters?.page || 1,
    limit: currentFilters?.limit || 10,
    search: currentFilters?.search || '',
    status: currentFilters?.status || '',
    type: currentFilters?.type || '',
  };

  console.log('Safe filters:', safeFilters);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'active':
        return <Badge variant="default">Live</Badge>;
      case 'ended':
        return <Badge variant="outline">Ended</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Badge variant="default">Meeting</Badge>;
      case 'webinar':
        return <Badge variant="secondary">Webinar</Badge>;
      case 'training':
        return <Badge variant="outline">Training</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const canJoinMeeting = (meeting: Meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = meeting.endTime ? new Date(meeting.endTime) : null;
    
    // Can join if meeting is active
    if (meeting.status === 'active') return true;
    
    // Can join if meeting is scheduled
    if (meeting.status === 'scheduled') {
      // Allow joining up to 30 minutes before start time
      const canJoinBefore = new Date(startTime.getTime() - 30 * 60 * 1000);
      
      // Can join if:
      // 1. Current time is within 30 minutes before start time, OR
      // 2. Current time is after start time and before end time (if end time exists), OR
      // 3. Current time is after start time and no end time specified
      if (now >= canJoinBefore) {
        if (!endTime || now <= endTime) {
          return true;
        }
      }
    }
    
    return false;
  };

  const canEditMeeting = (meeting: Meeting) => {
    return user.id === meeting.createdById || user.role === 'Administrator';
  };

  const canDeleteMeeting = (meeting: Meeting) => {
    return user.id === meeting.createdById || user.role === 'Administrator';
  };

  const handleJoinMeeting = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsEditModalOpen(true);
  };

  const handleSendInvitation = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsSendInvitationModalOpen(true);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMeeting = async (meetingData: Partial<Meeting>) => {
    if (!selectedMeeting) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to update meeting');
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (meeting: Meeting) => {
    const link = `${window.location.origin}/meetings/${meeting.id}`;
    navigator.clipboard.writeText(link);
  };

  const updateFilters = (newFilters: Partial<CurrentFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when changing filters
    if (Object.keys(newFilters).some(key => key !== 'page')) {
      params.set('page', '1');
    }
    
    router.push(`?${params.toString()}`);
  };

  const columns = [
    {
      accessorKey: 'title',
      header: 'Meeting',
      cell: ({ row }: { row: any }) => {
        const meeting = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={meeting.createdBy?.avatar || undefined} />
                <AvatarFallback>
                  {meeting.createdBy?.firstName?.[0] || ''}{meeting.createdBy?.lastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{meeting.title || ''}</p>
              <p className="text-sm text-muted-foreground truncate">
                by {meeting.createdBy?.firstName || ''} {meeting.createdBy?.lastName || ''}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'startTime',
      header: 'Date & Time',
      cell: ({ row }: { row: any }) => {
        const meeting = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3" />
              {formatDate(meeting.startTime)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(meeting.startTime)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: { row: any }) => getTypeBadge(row.original.type),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'participants',
      header: 'Participants',
      cell: ({ row }: { row: any }) => {
        const meeting = row.original;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="text-sm">{meeting.participants.length}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }: { row: any }) => {
        const meeting = row.original;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDuration(meeting.startTime, meeting.endTime)}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => {
        const meeting = row.original;
        return (
          <div className="flex items-center gap-2">
            {/* Prominent Join Button */}
            {canJoinMeeting(meeting) && (
              <Button
                onClick={() => handleJoinMeeting(meeting.id)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="mr-2 h-3 w-3" />
                Join
              </Button>
            )}
            
            {/* Other Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                
                <DropdownMenuItem onClick={() => handleCopyLink(meeting)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleSendInvitation(meeting)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitations
                </DropdownMenuItem>
                
                {canEditMeeting(meeting) && (
                  <DropdownMenuItem onClick={() => handleEditMeeting(meeting)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Meeting
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {canDeleteMeeting(meeting) && (
                  <DropdownMenuItem 
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Meeting
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Don't render if critical data is missing
  if (!currentFilters || !pagination || !user) {
    console.log('Missing critical data, showing loading state');
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <p className="text-center text-muted-foreground">
            Loading meetings table...
          </p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-4">
      {/* Filters */}
      <DataTableToolbar>
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search meetings..."
            value={safeFilters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Status:</label>
            <div className="flex space-x-1">
              <Button
                variant={safeFilters.status === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ status: '' })}
                className="h-8 text-xs"
              >
                All
              </Button>
              <Button
                variant={safeFilters.status === 'scheduled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ status: 'scheduled' })}
                className="h-8 text-xs"
              >
                Scheduled
              </Button>
              <Button
                variant={safeFilters.status === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ status: 'active' })}
                className="h-8 text-xs"
              >
                Active
              </Button>
              <Button
                variant={safeFilters.status === 'ended' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ status: 'ended' })}
                className="h-8 text-xs"
              >
                Ended
              </Button>
              <Button
                variant={safeFilters.status === 'cancelled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ status: 'cancelled' })}
                className="h-8 text-xs"
              >
                Cancelled
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Type:</label>
            <div className="flex space-x-1">
              <Button
                variant={safeFilters.type === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ type: '' })}
                className="h-8 text-xs"
              >
                All
              </Button>
              <Button
                variant={safeFilters.type === 'meeting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ type: 'meeting' })}
                className="h-8 text-xs"
              >
                Meeting
              </Button>
              <Button
                variant={safeFilters.type === 'webinar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ type: 'webinar' })}
                className="h-8 text-xs"
              >
                Webinar
              </Button>
              <Button
                variant={safeFilters.type === 'training' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ type: 'training' })}
                className="h-8 text-xs"
              >
                Training
              </Button>
            </div>
          </div>
        </div>
      </DataTableToolbar>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey || column.id}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!meetings || meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No meetings found.
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey || column.id}>
                      {column.cell({ row: { original: meeting } })}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
            <DataTablePagination
        page={pagination.page || 1}
        limit={pagination.limit || 10}
        total={pagination.total || 0}
        totalPages={pagination.totalPages || 1}
        onPageChange={(page) => updateFilters({ page })}
        onLimitChange={(limit) => updateFilters({ limit })}
      />

      {/* Edit Meeting Modal */}
      <EditMeetingModal
        meeting={selectedMeeting}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMeeting(null);
        }}
        onSave={handleSaveMeeting}
        users={users}
        isLoading={isLoading}
      />

      {/* Send Invitation Modal */}
      {selectedMeeting && (
        <SendInvitationModal
          meeting={selectedMeeting}
          isOpen={isSendInvitationModalOpen}
          onClose={() => {
            setIsSendInvitationModalOpen(false);
            setSelectedMeeting(null);
          }}
        />
      )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering MeetingsTable:', error);
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
        <p className="text-center text-muted-foreground">
          Error loading meetings table. Please refresh the page.
        </p>
      </div>
    </div>
    );
  }
} 