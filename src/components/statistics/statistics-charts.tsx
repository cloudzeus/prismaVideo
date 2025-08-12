'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Video, 
  Activity,
  Building2,
  UserCheck,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

interface MeetingTrendsData {
  date: string;
  meetings: number;
  participants: number;
  duration: number;
}

interface UserActivityData {
  userId: string | null;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  meetingsAttended: number;
  totalDuration: number;
  lastActive: string;
  department?: string;
  role: string;
}

interface CompanyMetricsData {
  companyId: string;
  companyName: string;
  companyType: string;
  totalUsers: number;
  totalMeetings: number;
  totalDuration: number;
  averageMeetingDuration: number;
  userEngagementRate: number;
  meetingCompletionRate: number;
  growthRate: number;
}

interface StatisticsChartsProps {
  meetingTrends: MeetingTrendsData[];
  userActivity: UserActivityData[];
  companyMetrics: CompanyMetricsData[];
  meetingTypes: { name: string; count: number; percentage: number }[];
  isAdmin: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function StatisticsCharts({ 
  meetingTrends, 
  userActivity, 
  companyMetrics, 
  meetingTypes,
  isAdmin 
}: StatisticsChartsProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  // Prepare data for pie chart (meeting types)
  const meetingTypesData: ChartData[] = meetingTypes.map((type, index) => ({
    name: type.name,
    value: type.count,
    fill: COLORS[index % COLORS.length],
  }));

  // Prepare data for bar chart (top users)
  const topUsersData = userActivity.slice(0, 8).map(user => ({
    name: user.userName,
    meetings: user.meetingsAttended,
    duration: user.totalDuration,
  }));

  // Prepare data for area chart (meeting trends)
  const trendsData = meetingTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    meetings: trend.meetings,
    participants: trend.participants,
    duration: trend.duration,
  }));

  // Prepare data for company performance
  const companyPerformanceData = companyMetrics.map(company => ({
    name: company.companyName,
    engagement: Math.round(company.userEngagementRate * 100),
    completion: Math.round(company.meetingCompletionRate * 100),
    growth: company.growthRate,
  }));

  return (
    <div className="space-y-6">
      {/* Meeting Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            Meeting Trends (30 Days)
          </CardTitle>
          <CardDescription>Daily meeting activity and participation</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'meetings' ? value : name === 'duration' ? formatDuration(value) : value,
                  name === 'meetings' ? 'Meetings' : name === 'participants' ? 'Participants' : 'Duration (min)'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="meetings" 
                stackId="1" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="participants" 
                stackId="2" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Meeting Types Distribution
            </CardTitle>
            <CardDescription>Breakdown of meeting types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={meetingTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {meetingTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Meetings']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Users Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Most Active Users
            </CardTitle>
            <CardDescription>Users with highest meeting participation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topUsersData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'meetings' ? value : formatDuration(value),
                    name === 'meetings' ? 'Meetings' : 'Duration'
                  ]}
                />
                <Bar dataKey="meetings" fill="#8884d8" name="Meetings" />
                <Bar dataKey="duration" fill="#82ca9d" name="Duration" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Company Performance (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Performance Metrics
            </CardTitle>
            <CardDescription>Performance comparison across companies</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'engagement' || name === 'completion' ? `${value}%` : `${value}%`,
                    name === 'engagement' ? 'Engagement' : name === 'completion' ? 'Completion' : 'Growth'
                  ]}
                />
                <Bar dataKey="engagement" fill="#8884d8" name="Engagement Rate" />
                <Bar dataKey="completion" fill="#82ca9d" name="Completion Rate" />
                <Bar dataKey="growth" fill="#ffc658" name="Growth Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* User Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">{userActivity.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Active participants
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Meetings</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {userActivity.reduce((sum, user) => sum + user.meetingsAttended, 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Meetings attended
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Total Duration</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {formatDuration(userActivity.reduce((sum, user) => sum + user.totalDuration, 0))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Cumulative time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Avg Duration</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {userActivity.length > 0 
                ? formatDuration(Math.round(userActivity.reduce((sum, user) => sum + user.totalDuration, 0) / userActivity.length))
                : '0m'
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Per user
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 