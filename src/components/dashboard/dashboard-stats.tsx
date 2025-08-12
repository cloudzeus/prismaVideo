import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Video, Building2, BarChart3 } from 'lucide-react'

interface DashboardStatsProps {
  meetingStats: any
  companyStats: any
  userStats: any
  isAdmin: boolean
}

export function DashboardStats({ meetingStats, companyStats, userStats, isAdmin }: DashboardStatsProps) {
  const stats = [
    {
      title: 'Total Meetings',
      value: meetingStats?.totalMeetings || 0,
      icon: Video,
      description: 'All time meetings',
    },
    {
      title: 'Active Users',
      value: userStats?.activeUsers || 0,
      icon: Users,
      description: 'Currently active',
    },
    ...(isAdmin ? [{
      title: 'Companies',
      value: companyStats?.totalCompanies || 0,
      icon: Building2,
      description: 'Total companies',
    }] : []),
    {
      title: 'This Month',
      value: meetingStats?.monthlyMeetings || 0,
      icon: BarChart3,
      description: 'Meetings this month',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 