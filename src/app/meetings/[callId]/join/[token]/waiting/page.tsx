import { notFound } from 'next/navigation';
import { getMeetingByToken } from '@/lib/data/meetings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, Video } from 'lucide-react';

interface WaitingPageProps {
  params: Promise<{
    callId: string;
    token: string;
  }>;
}

export default async function WaitingPage({ params }: WaitingPageProps) {
  const { callId, token } = await params;

  // Fetch meeting data by token
  const meeting = await getMeetingByToken(callId, token);

  if (!meeting) {
    notFound();
  }

  const startTime = new Date(meeting.startTime);
  const endTime = meeting.endTime ? new Date(meeting.endTime) : null;
  const now = new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntilStart = () => {
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} hours ${mins} minutes`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Meeting Not Started Yet</CardTitle>
          <CardDescription>
            The meeting "{meeting.title}" hasn't started yet. Please wait until the scheduled time.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Meeting Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {formatTime(startTime)}
                {endTime && ` - ${formatTime(endTime)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                Hosted by {meeting.createdBy.firstName} {meeting.createdBy.lastName}
              </span>
            </div>
            {meeting.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {meeting.description}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="text-sm">
              {meeting.status === 'scheduled' ? 'Scheduled' : meeting.status}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Meeting starts in <span className="font-medium">{getTimeUntilStart()}</span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll be able to join automatically when the meeting starts</li>
              <li>• The host will begin the meeting at the scheduled time</li>
              <li>• You'll receive a notification when it's time to join</li>
              <li>• Keep this page open to join automatically</li>
            </ul>
          </div>

          {/* Auto-refresh notice */}
          <div className="text-center text-sm text-muted-foreground">
            <p>This page will automatically refresh every minute to check if the meeting has started.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
