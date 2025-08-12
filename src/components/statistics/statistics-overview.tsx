'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Video, 
  Activity,
  Building2,
  UserCheck
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

interface StatisticsOverviewProps {
  stats: {
    totalUsers: number;
    totalMeetings: number;
    totalDuration: number;
    activeMeetings: number;
    totalCompanies: number;
    totalDepartments: number;
    averageMeetingDuration: number;
    meetingCompletionRate: number;
  };
  isAdmin: boolean;
}

export function StatisticsOverview({ stats, isAdmin }: StatisticsOverviewProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: 'Active users in the system',
      icon: <Users className="h-4 w-4" />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Total Meetings',
      value: stats.totalMeetings.toLocaleString(),
      description: 'Meetings created this period',
      icon: <Calendar className="h-4 w-4" />,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Total Duration',
      value: formatDuration(stats.totalDuration),
      description: 'Cumulative meeting time',
      icon: <Clock className="h-4 w-4" />,
      trend: { value: 15, isPositive: true },
    },
    {
      title: 'Active Meetings',
      value: stats.activeMeetings,
      description: 'Currently running meetings',
      icon: <Video className="h-4 w-4" />,
      badge: {
        text: 'Live',
        variant: 'destructive',
      },
    },
  ];

  // Admin-only stats
  const adminStatCards: StatCard[] = [
    {
      title: 'Companies',
      value: stats.totalCompanies,
      description: 'Total companies in system',
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      description: 'Total departments',
      icon: <UserCheck className="h-4 w-4" />,
    },
    {
      title: 'Avg Duration',
      value: formatDuration(stats.averageMeetingDuration),
      description: 'Average meeting length',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: 'Completion Rate',
      value: formatPercentage(stats.meetingCompletionRate),
      description: 'Meetings completed vs scheduled',
      icon: <Activity className="h-4 w-4" />,
      badge: {
        text: stats.meetingCompletionRate > 0.8 ? 'Excellent' : 'Good',
        variant: stats.meetingCompletionRate > 0.8 ? 'default' : 'secondary',
      },
    },
  ];

  const displayCards = isAdmin ? [...statCards, ...adminStatCards] : statCards;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayCards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>
              {card.badge && (
                <Badge variant={card.badge.variant} className="text-xs">
                  {card.badge.text}
                </Badge>
              )}
            </div>
            
            {card.trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp 
                  className={`h-3 w-3 ${
                    card.trend.isPositive ? 'text-green-500' : 'text-red-500'
                  }`} 
                />
                <span 
                  className={`text-xs ${
                    card.trend.isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {card.trend.isPositive ? '+' : '-'}{card.trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">from last period</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 