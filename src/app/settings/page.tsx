import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/layout/navigation'
import { SettingsContent } from '@/components/settings/settings-content'
import { SettingsDataProvider } from '@/components/settings/settings-data-provider'

export const metadata: Metadata = {
  title: 'Settings - Video Conference Manager',
  description: 'Manage system settings, company defaults, department hierarchy, and SMTP configuration',
}

export default async function SettingsPage() {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      redirect('/login')
    }

    const user = session.user

    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        
        <main className="container-responsive py-6 pt-24">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                  Manage system settings, company defaults, department hierarchy, and SMTP configuration
                </p>
              </div>
            </div>

            {/* Settings Content */}
            <Suspense fallback={<SettingsSkeleton />}>
              <SettingsDataProvider>
                <SettingsContent />
              </SettingsDataProvider>
            </Suspense>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Settings error:', error);
    redirect('/login');
  }
}

function SettingsSkeleton() {
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