import { prisma, createSearchFilter } from '@/lib/prisma'

export async function getAllCompanies(
  companyId: string,
  isAdmin: boolean,
  options: {
    page?: number
    limit?: number
    search?: string
    type?: string
    sortField?: string
    sortDirection?: 'asc' | 'desc'
  } = {}
) {
  const { page = 1, limit = 50, search, type, sortField = 'name', sortDirection = 'asc' } = options
  
  console.log('getAllCompanies called with options:', { page, limit, search, type, sortField, sortDirection });
  
  const where: any = {}
  
  if (search) {
    console.log('Search term received:', search);
    const searchFilter = createSearchFilter(search, ['name', 'AFM', 'EMAILACC', 'PHONE01', 'PHONE02', 'phone', 'email'])
    console.log('Search filter created:', searchFilter);
    Object.assign(where, searchFilter)
    console.log('Final where clause:', where);
  }
  
  if (type && type !== 'all') {
    where.type = type
  }

  console.log('Final where clause for query:', where);
  console.log('Query parameters:', { page, limit, sortField, sortDirection });

  // Handle sorting - map client-side sort fields to actual database fields
  let orderBy: any = {}
  if (sortField && sortField !== 'none') {
    if (sortField === 'address') {
      // For address, sort by address first, then city, then country
      orderBy = [
        { address: sortDirection },
        { city: sortDirection },
        { country: sortDirection }
      ]
    } else {
      orderBy = { [sortField]: sortDirection }
    }
  }

  console.log('Order by clause:', orderBy);

  try {
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          city: true,
          country: true,
          email: true,
          AFM: true,
          PHONE01: true,
          PHONE02: true,
          phone: true,
          EMAILACC: true,
          COMPANY: true,
          TRDR: true,
          CODE: true,
          createdAt: true,
          updatedAt: true,
          // Only count related records, don't fetch them
          _count: {
            select: {
              users: true,
              departments: true,
              calls: true,
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ])

    console.log('Query results:', { companiesFound: companies.length, total });

    return {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Error in getAllCompanies query:', error);
    throw error;
  }
}

export async function searchCompanies(query: string, limit: number = 20) {
  console.log('searchCompanies called with query:', query, 'limit:', limit)
  
  if (!query || query.length < 3) {
    console.log('Query too short, returning empty array')
    return []
  }
  
  try {
             const companies = await prisma.company.findMany({
           where: {
             OR: [
               { name: { contains: query } },
               { CODE: { contains: query } },
               { AFM: { contains: query } },
             ]
           },
      select: {
        id: true,
        name: true,
        CODE: true,
        AFM: true,
        city: true,
        country: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    })
    
    console.log('Found companies:', companies.length, 'companies')
    return companies
  } catch (error) {
    console.error('Error in searchCompanies:', error)
    throw error
  }
}

export async function getUserCompany(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      departments: {
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      users: {
        include: {
          department: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    }
  })
}

export async function getCompanyStats() {
  const [totalCompanies, clients, suppliers] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { type: 'client' } }),
    prisma.company.count({ where: { type: 'supplier' } }),
  ])

  return {
    totalCompanies,
    clients,
    suppliers,
  }
} 

export const companies = [
  {
    id: '1',
    COMPANY: 'COMP001',
    LOCKID: 'ERP001',
    SODTYPE: 'E',
    name: 'Acme Corporation',
    type: 'client',
    address: '123 Business St',
    city: 'New York',
    country: 'USA',
    phone: '+1-555-0123',
    email: 'contact@acme.com',
    website: 'https://acme.com',
    logo: '/logos/acme.png',
    // Additional ERP fields
    TRDR: 'ERP001',
    CODE: 'COMP001',
    AFM: '123456789',
    IRSDATA: 'NYC Tax Office',
    ZIP: '10001',
    PHONE01: '+1-555-0123',
    PHONE02: '+1-555-0124',
    JOBTYPE: 'Technology',
    EMAILACC: 'accounting@acme.com',
    INSDATE: '2024-01-15',
    UPDDATE: '2024-01-15',
    default: false,
  },
  {
    id: '2',
    COMPANY: 'COMP002',
    LOCKID: 'ERP002',
    SODTYPE: 'E',
    name: 'Global Industries',
    type: 'supplier',
    address: '456 Industrial Ave',
    city: 'Los Angeles',
    country: 'USA',
    phone: '+1-555-0456',
    email: 'info@global.com',
    website: 'https://global.com',
    logo: '/logos/global.png',
    // Additional ERP fields
    TRDR: 'ERP002',
    CODE: 'COMP002',
    AFM: '987654321',
    IRSDATA: 'LA Tax Office',
    ZIP: '90210',
    PHONE01: '+1-555-0456',
    PHONE02: '+1-555-0457',
    JOBTYPE: 'Manufacturing',
    EMAILACC: 'accounts@global.com',
    INSDATE: '2024-01-16',
    UPDDATE: '2024-01-16',
    default: false,
  },
  {
    id: '3',
    COMPANY: 'COMP003',
    LOCKID: 'ERP003',
    SODTYPE: 'E',
    name: 'Tech Solutions Ltd',
    type: 'client',
    address: '789 Innovation Dr',
    city: 'San Francisco',
    country: 'USA',
    phone: '+1-555-0789',
    email: 'hello@techsolutions.com',
    website: 'https://techsolutions.com',
    logo: '/logos/tech.png',
    // Additional ERP fields
    TRDR: 'ERP003',
    CODE: 'COMP003',
    AFM: '456789123',
    IRSDATA: 'SF Tax Office',
    ZIP: '94102',
    PHONE01: '+1-555-0789',
    PHONE02: '+1-555-0790',
    JOBTYPE: 'Software Development',
    EMAILACC: 'finance@techsolutions.com',
    INSDATE: '2024-01-17',
    UPDDATE: '2024-01-17',
    default: true,
  },
]; 