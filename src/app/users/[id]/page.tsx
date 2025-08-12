import { redirect, notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { getUserById } from '@/lib/data/users';
import { getMeetingsByUser } from '@/lib/data/meetings';
import { getDepartmentsByCompany } from '@/lib/data/departments';
import { Navigation } from '@/components/layout/navigation';
import { UserProfile } from '@/components/users/user-profile';

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect('/login');
  }

  const currentUser = session.user;
  const { id } = await params;

  // Check permissions
  const canViewProfile = 
    currentUser.id === id || 
    currentUser.role === 'Administrator' || 
    currentUser.role === 'Manager';

  if (!canViewProfile) {
    redirect('/users');
  }

  // Fetch user data
  const user = await getUserById(id, currentUser.companyId);

  if (!user) {
    notFound();
  }

  // Fetch user's meetings
  const meetings = await getMeetingsByUser(id, {
    page: 1,
    limit: 50,
  });

  // Fetch departments for profile editing
  const departments = await getDepartmentsByCompany(currentUser.companyId, {
    page: 1,
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={currentUser} />
      
      <main className="container-responsive py-6">
        <UserProfile 
          user={user}
          currentUser={currentUser}
          meetings={meetings.data}
          departments={departments.data}
        />
      </main>
    </div>
  );
} 