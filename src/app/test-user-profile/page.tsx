import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { User, Building, Shield, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/layout/navigation'

export const metadata: Metadata = {
  title: 'Test User Profile - Video Conference Manager',
  description: 'Test page to display current user profile information',
}

export default async function TestUserProfilePage() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      redirect('/login')
    }

    const user = session.user

    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        
        <main className="container-responsive py-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <User className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Test User Profile</h1>
                <p className="text-muted-foreground">
                  Debug information about the current user session
                </p>
              </div>
            </div>

            {/* User Profile Debug Info */}
            <Suspense fallback={<UserProfileSkeleton />}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* User Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      User Information
                    </CardTitle>
                    <CardDescription>
                      Current user session details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{user.firstName} {user.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Role:</span>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">User ID:</span>
                        <span className="font-mono text-sm">{user.id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                    <CardDescription>
                      Company association details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Company Name:</span>
                        <span>{user.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Company Type:</span>
                        <span>{user.companyType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Company ID:</span>
                        <span className="font-mono text-sm">{user.companyId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Department:</span>
                        <span>{user.departmentName || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Department ID:</span>
                        <span className="font-mono text-sm">{user.departmentId || 'None'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Permissions
                    </CardTitle>
                    <CardDescription>
                      User permissions and access levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Can Access Departments:</span>
                        <Badge variant={user.role === 'Administrator' || user.role === 'Manager' ? 'default' : 'destructive'}>
                          {user.role === 'Administrator' || user.role === 'Manager' ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Can Create Departments:</span>
                        <Badge variant={user.role === 'Administrator' || user.role === 'Manager' ? 'default' : 'destructive'}>
                          {user.role === 'Administrator' || user.role === 'Manager' ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Can Edit Departments:</span>
                        <Badge variant={user.role === 'Administrator' || user.role === 'Manager' ? 'default' : 'destructive'}>
                          {user.role === 'Administrator' || user.role === 'Manager' ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Can Delete Departments:</span>
                        <Badge variant={user.role === 'Administrator' || user.role === 'Manager' ? 'default' : 'destructive'}>
                          {user.role === 'Administrator' || user.role === 'Manager' ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Session Information
                    </CardTitle>
                    <CardDescription>
                      Authentication session details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Session Active:</span>
                        <Badge variant="default">Yes</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Auth Provider:</span>
                        <span>Credentials</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Session Strategy:</span>
                        <span>JWT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Debug Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Debug Actions</CardTitle>
                  <CardDescription>
                    Test API endpoints and data fetching
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <a 
                      href="/api/departments/all" 
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Test Departments API
                    </a>
                    <a 
                      href="/api/companies/all" 
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                    >
                      Test Companies API
                    </a>
                    <a 
                      href="/api/users/all" 
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                    >
                      Test Users API
                    </a>
                  </div>
                </CardContent>
              </Card>
            </Suspense>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Test user profile error:', error);
    redirect('/login');
  }
}

function UserProfileSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 