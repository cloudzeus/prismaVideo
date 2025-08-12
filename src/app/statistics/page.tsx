import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { getStatistics } from '@/lib/data/statistics';
import { Navigation } from '@/components/layout/navigation';
import { StatisticsOverview } from '@/components/statistics/statistics-overview';
import { StatisticsCharts } from '@/components/statistics/statistics-charts';
import { StatisticsDataTable } from '@/components/statistics/statistics-data-table';

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;
  const isAdmin = user.role === 'Administrator';
  const isManager = user.role === 'Manager';

  // Parse date range parameters
  const params = await searchParams;
  const startDate = typeof params.startDate === 'string' ? params.startDate : '';
  const endDate = typeof params.endDate === 'string' ? params.endDate : '';
  const period = typeof params.period === 'string' ? params.period : '30d';

  // Fetch statistics server-side
  const stats = await getStatistics(
    user.companyId,
    user.id,
    isAdmin,
    {
      startDate,
      endDate,
      period,
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
              <main className="container-responsive py-6 pt-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'System-wide analytics and insights'
                : isManager
                ? 'Department and team analytics'
                : 'Your meeting and participation statistics'
              }
            </p>
          </div>

          {/* Statistics Overview Cards */}
          <StatisticsOverview stats={stats.overview} isAdmin={isAdmin} />

          {/* Enhanced Charts */}
          <StatisticsCharts 
            meetingTrends={stats.meetingTrends}
            userActivity={stats.userActivity}
            companyMetrics={stats.companyMetrics || []}
            meetingTypes={stats.meetingTypes}
            isAdmin={isAdmin}
          />

          {/* Detailed Data Tables */}
          <StatisticsDataTable 
            userActivity={stats.userActivity}
            meetingTrends={stats.meetingTrends}
            companyMetrics={stats.companyMetrics || []}
            isAdmin={isAdmin}
          />
        </div>
      </main>
    </div>
  );
} 