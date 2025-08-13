import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { getUsersByCompany } from '@/lib/data/users';
import { getDepartmentsByCompany } from '@/lib/data/departments';
import { Navigation } from '@/components/layout/navigation';
import { UsersTable } from '@/components/users/users-table';
import { CreateUserButton } from '@/components/users/create-user-button';
import { DepartmentsTable } from '@/components/departments/departments-table';
import { CreateDepartmentButton } from '@/components/departments/create-department-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building } from 'lucide-react';

export default async function UsersPage({
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

  // Only admins and managers can access user management
  if (!isAdmin && !isManager) {
    redirect('/');
  }

  // Parse search parameters
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const limit = typeof params.limit === 'string' ? parseInt(params.limit) : 10;
  const search = typeof params.search === 'string' ? params.search : '';
  const role = typeof params.role === 'string' ? params.role : '';
  const departmentId = typeof params.departmentId === 'string' ? params.departmentId : '';
  const status = typeof params.status === 'string' ? params.status : '';
  const activeTab = typeof params.tab === 'string' ? params.tab : 'users';

  // Use the existing data function instead of API call for server-side rendering
  const users = await getUsersByCompany(
    user.companyId,
    isAdmin,
    {
      page,
      limit,
      search,
      role,
      departmentId,
      status,
    }
  );

  // Debug logging
  console.log('UsersPage Debug:', {
    userCompanyId: user.companyId,
    isAdmin,
    usersCount: users.data.length,
    users: users.data.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName })),
    pagination: users.pagination
  });

  // Fetch departments server-side
  const departments = await getDepartmentsByCompany(
    user.companyId,
    {
      page,
      limit,
      search: typeof params.deptSearch === 'string' ? params.deptSearch : '',
      parentId: typeof params.deptParentId === 'string' ? params.deptParentId : '',
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
              <main className="container-responsive py-6 pt-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">User & Department Management</h1>
            <p className="text-muted-foreground">
              Manage users, departments, and organizational structure
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={activeTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Departments
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Users</h2>
                  <p className="text-muted-foreground">
                    Manage users and their permissions
                  </p>
                </div>
                <CreateUserButton user={user} departments={departments.data} />
              </div>

              <div className="bg-card rounded-lg border">
                <UsersTable 
                  users={users.data}
                  pagination={users.pagination}
                  currentFilters={{
                    page,
                    limit,
                    search,
                    role,
                    departmentId,
                    status,
                  }}
                  user={user}
                  departments={departments.data}
                />
              </div>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Departments</h2>
                  <p className="text-muted-foreground">
                    Manage organizational structure and hierarchy
                  </p>
                </div>
                <CreateDepartmentButton 
                  user={user}
                  departments={departments.data}
                  users={users.data}
                />
              </div>

              <div className="bg-card rounded-lg border">
                <DepartmentsTable 
                  departments={departments.data}
                  pagination={departments.pagination}
                  currentFilters={{
                    page,
                    limit,
                    search: typeof params.deptSearch === 'string' ? params.deptSearch : '',
                    parentId: typeof params.deptParentId === 'string' ? params.deptParentId : '',
                  }}
                  user={user}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 