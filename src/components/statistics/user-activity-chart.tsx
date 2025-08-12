'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Activity, Clock, Calendar } from 'lucide-react';

interface UserActivityData {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  meetingsAttended: number;
  totalDuration: number;
  lastActive: string;
  department?: string;
  role: string;
}

interface UserActivityChartProps {
  data: UserActivityData[];
}

export function UserActivityChart({ data }: UserActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Activity
          </CardTitle>
          <CardDescription>No user activity data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityLevel = (meetings: number, duration: number) => {
    if (meetings >= 10 && duration >= 600) return { level: 'High', color: 'bg-green-500' };
    if (meetings >= 5 && duration >= 300) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-gray-500' };
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'destructive' as const;
      case 'Manager':
        return 'default' as const;
      case 'Employee':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  // Sort by activity (meetings + duration)
  const sortedData = [...data].sort((a, b) => 
    (b.meetingsAttended + b.totalDuration / 60) - (a.meetingsAttended + a.totalDuration / 60)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Activity</h3>
          <p className="text-sm text-muted-foreground">
            Most active users in the last 30 days
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>{data.length} users</span>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {data.reduce((sum, user) => sum + user.meetingsAttended, 0)}
          </div>
          <div className="text-xs text-muted-foreground">Total Meetings</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatDuration(data.reduce((sum, user) => sum + user.totalDuration, 0))}
          </div>
          <div className="text-xs text-muted-foreground">Total Duration</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(data.reduce((sum, user) => sum + user.totalDuration, 0) / data.length)}m
          </div>
          <div className="text-xs text-muted-foreground">Avg Duration</div>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {sortedData.slice(0, 10).map((user, index) => {
          const activityLevel = getActivityLevel(user.meetingsAttended, user.totalDuration);
          
          return (
            <div 
              key={user.userId}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.userAvatar} alt={user.userName} />
                  <AvatarFallback>
                    {user.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.userName}</p>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{user.userEmail}</span>
                    {user.department && (
                      <>
                        <span>•</span>
                        <span>{user.department}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Metrics */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{user.meetingsAttended}</div>
                  <div className="text-xs text-muted-foreground">Meetings</div>
                </div>
                
                <div className="text-center">
                  <div className="font-medium">{formatDuration(user.totalDuration)}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>

                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${activityLevel.color}`} />
                  <span className="text-xs text-muted-foreground">{activityLevel.level}</span>
                </div>
              </div>

              {/* Last Active */}
              <div className="text-right text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatLastActive(user.lastActive)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Level Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>High Activity</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Medium Activity</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span>Low Activity</span>
        </div>
      </div>
    </div>
  );
} 