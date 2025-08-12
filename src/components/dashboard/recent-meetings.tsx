import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface RecentMeetingsProps {
  meetings: any[]
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Recent Meetings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No recent meetings
          </p>
        ) : (
          <div className="space-y-4">
            {meetings.slice(0, 5).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{meeting.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(meeting.startTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(meeting.startTime)}
                    </div>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/meetings/${meeting.id}`}>
                    Join
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {meetings.length > 5 && (
          <div className="mt-4 pt-4 border-t">
            <Button asChild variant="outline" className="w-full">
              <Link href="/meetings">
                View All Meetings
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 