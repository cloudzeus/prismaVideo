import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { getAuthSession } from '@/lib/auth';
import { getRecentMeetings, getUpcomingMeetings, getQuickStats } from '@/lib/data/meetings';
import { getCompanyStats } from '@/lib/data/companies';
import { getUserStats } from '@/lib/data/users';
import { Navigation } from '@/components/layout/navigation';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentMeetings } from '@/components/dashboard/recent-meetings';
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default async function DashboardPage() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      redirect('/login');
    }

    const user = session.user;
    const isAdmin = user.role === 'Administrator';
    const isManager = user.role === 'Manager';

    // Fetch data server-side based on user role
    const [recentMeetings, upcomingMeetings, meetingStats, companyStats, userStats] = await Promise.all([
      getRecentMeetings(user.id, user.companyId, isAdmin),
      getUpcomingMeetings(user.id, user.companyId, isAdmin),
      getQuickStats(user.companyId, isAdmin, user.id),
      isAdmin ? getCompanyStats() : null,
      isAdmin ? getUserStats() : null,
    ]);

    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        
        <main className="container-responsive py-6 pt-24">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your video conferences today.
              </p>
            </div>

            {/* Quick Actions */}
            <QuickActions user={user} />

            {/* Statistics */}
            <DashboardStats 
              meetingStats={meetingStats}
              companyStats={companyStats}
              userStats={userStats}
              isAdmin={isAdmin}
            />

            {/* Recent and Upcoming Meetings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentMeetings meetings={recentMeetings} />
              <UpcomingMeetings meetings={upcomingMeetings} />
            </div>

            {/* Additional sections based on role */}
            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Admin-specific content */}
                <div className="bg-card rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">System Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Companies</span>
                      <span className="font-medium">{companyStats?.totalCompanies || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Users</span>
                      <span className="font-medium">{userStats?.active || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Meetings</span>
                      <span className="font-medium">{meetingStats?.totalMeetings || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isManager && (
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Department Overview</h3>
                <p className="text-muted-foreground">
                  Manage your department's meetings and team members.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    redirect('/login');
  }
} 