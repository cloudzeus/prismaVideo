import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { getAllCompanies, getUserCompany } from '@/lib/data/companies';
import { Navigation } from '@/components/layout/navigation';
import { CompaniesTable } from '@/components/companies/companies-table';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Companies | Video Prisma',
  description: 'Manage and view all companies in the system',
};

// Cache only the count and basic stats, not the full dataset
const getCachedCompanyStats = unstable_cache(
  async () => {
    try {
      const { prisma } = await import('@/lib/prisma');
      const [total, clients, suppliers] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { type: 'client' } }),
        prisma.company.count({ where: { type: 'supplier' } }),
      ]);
      return { total, clients, suppliers };
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw new Error('Failed to fetch company stats');
    }
  },
  ['company-stats'],
  {
    revalidate: 300, // Revalidate every 5 minutes
    tags: ['companies'],
  }
);

export default async function CompaniesPage({
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

  // Parse search parameters
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const limit = typeof params.limit === 'string' ? parseInt(params.limit) : 50;
  const search = typeof params.search === 'string' ? params.search : '';
  const type = typeof params.type === 'string' ? params.type : '';
  let sortField = typeof params.sortField === 'string' ? params.sortField : 'none';
  let sortDirection: 'asc' | 'desc' = typeof params.sortDirection === 'string' ? (params.sortDirection as 'asc' | 'desc') : 'asc';
  
  // Debug logging
  console.log('Companies page - Raw search params:', params);
  console.log('Companies page - Parsed search:', search);
  console.log('Companies page - Parsed type:', type);
  console.log('Companies page - Parsed sortField:', sortField);
  console.log('Companies page - Parsed sortDirection:', sortDirection);

  // Validate sort field - only allow valid database fields
  const validSortFields = ['name', 'AFM', 'type', 'address', 'city', 'country', 'EMAILACC', 'PHONE01'] as const;
  if (!validSortFields.includes(sortField as any)) {
    sortField = 'none'; // Default to none if invalid
  }

  let companies: any[] = [];
  let pagination: any;

  if (isAdmin) {
    try {
      // Use the optimized function
      const result = await getAllCompanies(user.companyId, isAdmin, {
        page,
        limit,
        search,
        type,
        sortField,
        sortDirection,
      });
      
      companies = result.data;
      pagination = result.pagination;
    } catch (error) {
      console.error('Error fetching companies:', error);
      companies = [];
      pagination = {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 1,
      };
    }
  } else {
    // Regular users only see their company
    const company = await getUserCompany(user.companyId);
    companies = company ? [company] : [];
    pagination = {
      page: 1,
      limit: 1,
      total: companies.length,
      totalPages: 1,
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
              <main className="container-responsive py-6 pt-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isAdmin ? 'Companies' : 'Company Information'}
              </h1>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? 'Manage all companies in the system'
                  : 'View your company information'
                }
              </p>
            </div>
          </div>

          {/* Companies Table */}
          <CompaniesTable 
            companies={companies}
            isAdmin={isAdmin}
            pagination={pagination}
            searchParams={{
              page: Array.isArray(params.page) ? params.page[0] : params.page,
              limit: Array.isArray(params.limit) ? params.limit[0] : params.limit,
              search: Array.isArray(params.search) ? params.search[0] : params.search,
              type: Array.isArray(params.type) ? params.type[0] : params.type,
              sortField: Array.isArray(params.sortField) ? params.sortField[0] : params.sortField,
              sortDirection: Array.isArray(params.sortDirection) ? params.sortDirection[0] : params.sortDirection,
            }}
          />
        </div>
      </main>
    </div>
  );
} 