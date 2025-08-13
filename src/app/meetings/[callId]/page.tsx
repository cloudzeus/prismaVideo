import { redirect, notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { getMeetingById } from '@/lib/data/meetings';
import { StreamMeetingRoomSimple } from '@/components/video/stream-meeting-room-simple';

interface MeetingPageProps {
  params: Promise<{
    callId: string;
  }>;
  searchParams: Promise<{
    password?: string;
  }>;
}

export default async function MeetingPage({ params, searchParams }: MeetingPageProps) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;
  const { callId } = await params;
  const { password } = await searchParams;

  // Fetch meeting data server-side
  const meeting = await getMeetingById(callId, user.id, user.role === 'Administrator');

  if (!meeting) {
    notFound();
  }

  // Check if user is a participant
  const isParticipant = meeting.participants.some(p => p.userId === user.id);
  const isHost = meeting.createdById === user.id;
  const isAdmin = user.role === 'Administrator';

  if (!isParticipant && !isHost && !isAdmin) {
    redirect('/meetings');
  }

  // Check password if meeting has one
  if (meeting.password && meeting.password !== password && !isHost && !isAdmin) {
    redirect(`/meetings/${callId}/join?error=password`);
  }

  return (
    <div className="h-screen bg-background">
      <StreamMeetingRoomSimple 
        meeting={meeting}
        user={user}
        isHost={isHost}
        isAdmin={isAdmin}
      />
    </div>
  );
} 