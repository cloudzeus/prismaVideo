import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Video, BarChart3, Users, Building2 } from 'lucide-react'
import Link from 'next/link'

interface QuickActionsProps {
  user: any
}

export function QuickActions({ user }: QuickActionsProps) {
  const isAdmin = user.role === 'Administrator'
  const isManager = user.role === 'Manager'

  const actions = [
    {
      title: 'Create Meeting',
      description: 'Schedule a new video conference',
      icon: Plus,
      href: '/meetings/create',
      variant: 'default' as const,
    },
    {
      title: 'Join Meeting',
      description: 'Join an existing meeting',
      icon: Video,
      href: '/meetings',
      variant: 'outline' as const,
    },
    {
      title: 'View Statistics',
      description: 'Check usage and analytics',
      icon: BarChart3,
      href: '/statistics',
      variant: 'outline' as const,
    },
    ...(isManager || isAdmin ? [{
      title: 'Manage Users',
      description: 'Add or edit user accounts',
      icon: Users,
      href: '/users',
      variant: 'outline' as const,
    }] : []),
    ...(isAdmin ? [{
      title: 'Manage Companies',
      description: 'Company settings and configuration',
      icon: Building2,
      href: '/companies',
      variant: 'outline' as const,
    }] : []),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                asChild
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <Link href={action.href}>
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 