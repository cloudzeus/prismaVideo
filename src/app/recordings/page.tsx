import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { Navigation } from '@/components/layout/navigation';
import { RecordingsContent } from '@/components/recordings/recordings-content';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function RecordingsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto py-6 pt-24 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
            <p className="text-muted-foreground">
              View and manage all meeting recordings
            </p>
          </div>
        </div>

        <Suspense fallback={<RecordingsSkeleton />}>
          <RecordingsContent />
        </Suspense>
      </main>
    </div>
  );
}

function RecordingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-8 w-[100px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
