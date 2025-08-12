'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface MeetingTrendsData {
  date: string;
  meetings: number;
  participants: number;
  duration: number;
}

interface MeetingTrendsChartProps {
  data: MeetingTrendsData[];
}

export function MeetingTrendsChart({ data }: MeetingTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meeting Trends
          </CardTitle>
          <CardDescription>No meeting data available for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxMeetings = Math.max(...data.map(d => d.meetings));
  const maxParticipants = Math.max(...data.map(d => d.participants));
  const maxDuration = Math.max(...data.map(d => d.duration));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate trends
  const recentData = data.slice(-7); // Last 7 data points
  const previousData = data.slice(-14, -7); // Previous 7 data points
  
  const recentAvg = recentData.reduce((sum, d) => sum + d.meetings, 0) / recentData.length;
  const previousAvg = previousData.reduce((sum, d) => sum + d.meetings, 0) / previousData.length;
  
  const trendPercentage = previousAvg > 0 
    ? ((recentAvg - previousAvg) / previousAvg) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Header with trend indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Meeting Trends</h3>
          <p className="text-sm text-muted-foreground">
            Meeting activity over the last 30 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          {trendPercentage !== 0 && (
            <>
              {trendPercentage > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <Badge 
                variant={trendPercentage > 0 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {trendPercentage > 0 ? '+' : ''}{Math.round(trendPercentage)}%
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-6">
        {/* Meetings Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Meetings</span>
            <span className="text-sm text-muted-foreground">
              {data.reduce((sum, d) => sum + d.meetings, 0)} total
            </span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {data.map((point, index) => (
              <div
                key={index}
                className="flex-1 bg-primary/20 rounded-t-sm relative group"
                style={{
                  height: `${(point.meetings / maxMeetings) * 100}%`,
                  minHeight: '4px'
                }}
              >
                <div className="absolute inset-0 bg-primary/40 rounded-t-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {point.meetings} meetings
                  <br />
                  {formatDate(point.date)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            {(() => {
              const firstItem = data[0];
              const lastItem = data[data.length - 1];
              return firstItem && lastItem ? (
                <>
                  <span>{formatDate(firstItem.date)}</span>
                  <span>{formatDate(lastItem.date)}</span>
                </>
              ) : null;
            })()}
          </div>
        </div>

        {/* Participants Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Participants</span>
            <span className="text-sm text-muted-foreground">
              {data.reduce((sum, d) => sum + d.participants, 0)} total
            </span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {data.map((point, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-500/20 rounded-t-sm relative group"
                style={{
                  height: `${(point.participants / maxParticipants) * 100}%`,
                  minHeight: '4px'
                }}
              >
                <div className="absolute inset-0 bg-blue-500/40 rounded-t-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {point.participants} participants
                  <br />
                  {formatDate(point.date)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duration Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Duration</span>
            <span className="text-sm text-muted-foreground">
              {formatDuration(data.reduce((sum, d) => sum + d.duration, 0))} total
            </span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {data.map((point, index) => (
              <div
                key={index}
                className="flex-1 bg-green-500/20 rounded-t-sm relative group"
                style={{
                  height: `${(point.duration / maxDuration) * 100}%`,
                  minHeight: '4px'
                }}
              >
                <div className="absolute inset-0 bg-green-500/40 rounded-t-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {formatDuration(point.duration)}
                  <br />
                  {formatDate(point.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary/20 rounded" />
          <span>Meetings</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500/20 rounded" />
          <span>Participants</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500/20 rounded" />
          <span>Duration</span>
        </div>
      </div>
    </div>
  );
} 