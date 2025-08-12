import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { getMeetingsByCompany } from '@/lib/data/meetings';
import { getUsersByCompany } from '@/lib/data/users';
import { Navigation } from '@/components/layout/navigation';
import { MeetingsTable } from '@/components/meetings/meetings-table';
import { CreateMeetingButton } from '@/components/meetings/create-meeting-button';

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;
  const isAdmin = user.role === 'Administrator';

  // Parse search parameters - await the searchParams first
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const limit = typeof params.limit === 'string' ? parseInt(params.limit) : 10;
  const search = typeof params.search === 'string' ? params.search : '';
  const status = typeof params.status === 'string' ? params.status : '';
  const type = typeof params.type === 'string' ? params.type : '';

  // Fetch meetings server-side
  const meetings = await getMeetingsByCompany(
    user.companyId,
    isAdmin,
    {
      page,
      limit,
      search,
      status,
      type,
    }
  );

  // Transform meetings data to match the MeetingsTable interface
  const transformedMeetings = meetings.data.map(meeting => ({
    ...meeting,
    participants: meeting.participants.map(participant => ({
      id: participant.id,
      userId: participant.userId,
      contactId: participant.contactId,
      role: participant.role,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt,
      user: participant.user ? {
        id: participant.user.id,
        firstName: participant.user.firstName,
        lastName: participant.user.lastName,
        email: participant.user.email,
        avatar: null,
      } : undefined,
      contact: participant.contactId ? {
        id: participant.contactId,
        firstName: '',
        lastName: '',
        email: '',
        avatarUrl: null,
      } : undefined,
    }))
  }));

  // Fetch users for the meeting modal
  const users = await getUsersByCompany(
    user.companyId,
    isAdmin,
    {
      limit: 100, // Get enough users for the modal
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
              <main className="container-responsive py-6 pt-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
              <p className="text-muted-foreground">
                Manage and join your video conferences
              </p>
            </div>
            <CreateMeetingButton user={user} />
          </div>

          {/* Meetings Table */}
          <div className="bg-card rounded-lg border">
            <MeetingsTable 
              meetings={transformedMeetings}
              pagination={meetings.pagination}
              currentFilters={{
                page,
                limit,
                search,
                status,
                type,
              }}
              user={user}
              users={users.data}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 