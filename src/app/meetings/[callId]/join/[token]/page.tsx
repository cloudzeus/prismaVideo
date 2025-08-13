import { redirect, notFound } from 'next/navigation';
import { getMeetingByToken } from '@/lib/data/meetings';
import { ContactMeetingRoom } from '@/components/video/contact-meeting-room';

interface ContactMeetingPageProps {
  params: Promise<{
    callId: string;
    token: string;
  }>;
}

export default async function ContactMeetingPage({ params }: ContactMeetingPageProps) {
  const { callId, token } = await params;

  // Fetch meeting data by token
  const meeting = await getMeetingByToken(callId, token);

  if (!meeting) {
    notFound();
  }

  // Check if meeting is accessible
  const now = new Date();
  const startTime = new Date(meeting.startTime);
  const endTime = meeting.endTime ? new Date(meeting.endTime) : null;
  
  // Can join if meeting is active or within 15 minutes of start time
  const canJoin = meeting.status === 'active' || 
    (meeting.status === 'scheduled' && now >= startTime && now <= new Date(startTime.getTime() + 15 * 60 * 1000)) ||
    (meeting.status === 'scheduled' && now >= startTime && (!endTime || now <= endTime));

  if (!canJoin) {
    redirect(`/meetings/${callId}/join/${token}/waiting`);
  }

  return (
    <div className="h-screen bg-background">
      <ContactMeetingRoom 
        meeting={{
          ...meeting,
          startTime: meeting.startTime instanceof Date ? meeting.startTime.toISOString() : meeting.startTime,
          endTime: meeting.endTime instanceof Date ? meeting.endTime.toISOString() : meeting.endTime,
          participants: meeting.participants.map(participant => ({
            id: participant.id,
            role: participant.role,
            joinedAt: participant.joinedAt instanceof Date ? participant.joinedAt.toISOString() : participant.joinedAt,
            leftAt: participant.leftAt instanceof Date ? participant.leftAt.toISOString() : participant.leftAt,
            user: participant.user ? {
              firstName: participant.user.firstName,
              lastName: participant.user.lastName,
              email: participant.user.email,
              avatar: participant.user.avatar,
            } : undefined,
            contact: participant.contact ? {
              firstName: participant.contact.firstName,
              lastName: participant.contact.lastName,
              email: participant.contact.email || '',
              avatarUrl: participant.contact.avatarUrl,
            } : undefined,
          })),
        }}
        token={token}
      />
    </div>
  );
}
