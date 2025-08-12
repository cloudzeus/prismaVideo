import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/layout/navigation'
import { UserProfile } from '@/components/users/user-profile'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Profile - Video Conference Manager',
  description: 'View and edit your user profile information',
}

export default async function ProfilePage() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      redirect('/login')
    }

    // Fetch complete user data including isActive
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      redirect('/login')
    }

    // Merge database user data with session data to get computed fields
    const fullUser = {
      ...user,
      companyName: session.user.companyName,
      companyType: session.user.companyType,
      departmentId: session.user.departmentId,
      departmentName: session.user.departmentName
    }

    // Fetch user's calls (meetings) with proper structure
    const calls = await prisma.call.findMany({
      where: { 
        participants: { some: { userId: user.id } },
        companyId: user.companyId
      },
      include: {
        company: { select: { name: true } },
        participants: { 
          include: { 
            user: { select: { firstName: true, lastName: true, email: true } } 
          } 
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 10
    })

    // Transform calls to match the expected meeting structure
    const meetings = calls.map(call => ({
      id: call.id,
      title: call.title,
      description: call.description,
      startTime: call.startTime,
      endTime: call.endTime,
      type: call.type,
      status: call.status,
      createdById: call.createdById,
      participants: call.participants,
      _count: call._count,
      company: call.company
    }))

    // Fetch departments for the user's company
    const departments = await prisma.department.findMany({
      where: { companyId: user.companyId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        
        <main className="container-responsive py-6 pt-24">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <User className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">
                  View and edit your user profile information
                </p>
              </div>
            </div>

            {/* Profile Content */}
            <Suspense fallback={<ProfileSkeleton />}>
              <UserProfile 
                user={fullUser} 
                currentUser={fullUser}
                meetings={meetings} 
                departments={departments}
              />
            </Suspense>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Profile error:', error);
    redirect('/login');
  }
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
} 