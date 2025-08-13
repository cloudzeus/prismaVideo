import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database connection utilities
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected')
  } catch (error) {
    console.error('❌ Error disconnecting database:', error)
  }
}

// Query helpers for common operations
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          type: true,
        }
      },
      department: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  })
}

export async function findCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
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

export async function findMeetingById(id: string, userId?: string, isAdmin = false) {
  const where: any = { id }
  
  if (!isAdmin && userId) {
    where.OR = [
      { createdById: userId },
      { participants: { some: { userId } } },
    ]
  }

  return prisma.call.findFirst({
    where,
    include: {
      company: {
        select: {
          id: true,
          name: true,
        }
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            }
          }
        }
      },
      recordings: {
        orderBy: { createdAt: 'desc' }
      },
      livestreams: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
}

export async function findUsersByCompany(companyId: string, isAdmin = false) {
  const where: any = { companyId }
  
  if (!isAdmin) {
    where.isActive = true
  }

  return prisma.user.findMany({
    where,
    include: {
      department: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' }
    ]
  })
}

export async function findDepartmentsByCompany(companyId: string) {
  return prisma.department.findMany({
    where: { companyId },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      _count: {
        select: {
          users: true,
          children: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

// Pagination helper
export function createPagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  }
}

// Search helper
export function createSearchFilter(search: string, fields: string[]) {
  console.log('createSearchFilter called with:', { search, fields });
  
  if (!search || search.length < 2) {
    console.log('Search term too short, returning empty filter');
    return {}
  }

  // Clean the search term and handle special characters
  const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  console.log('Clean search term:', cleanSearch);
  
  // Create OR conditions for each field that contains the search term
  const fieldConditions = fields.map(field => ({
    [field]: {
      contains: cleanSearch
      // Note: mode: 'insensitive' is not supported in this Prisma version
    }
  }))

  const result = {
    OR: fieldConditions
  };
  
  console.log('Search filter result:', result);
  return result;
}

// Date range helper
export function createDateRangeFilter(startDate?: string, endDate?: string, field = 'createdAt') {
  const filter: any = {}
  
  if (startDate) {
    filter.gte = new Date(startDate)
  }
  
  if (endDate) {
    filter.lte = new Date(endDate)
  }
  
  return Object.keys(filter).length > 0 ? { [field]: filter } : {}
}

// Transaction helper
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn)
}

// Soft delete helper (if needed)
export async function softDeleteUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  })
}

// Bulk operations helper
export async function bulkUpdateUsers(userIds: string[], data: any) {
  return prisma.user.updateMany({
    where: { id: { in: userIds } },
    data
  })
}

// Statistics helpers
export async function getMeetingStats(companyId: string, startDate?: Date, endDate?: Date) {
  const where: any = { companyId }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [total, scheduled, active, ended, cancelled] = await Promise.all([
    prisma.call.count({ where }),
    prisma.call.count({ where: { ...where, status: 'scheduled' } }),
    prisma.call.count({ where: { ...where, status: 'active' } }),
    prisma.call.count({ where: { ...where, status: 'ended' } }),
    prisma.call.count({ where: { ...where, status: 'cancelled' } }),
  ])

  return {
    total,
    scheduled,
    active,
    ended,
    cancelled,
  }
}

export async function getUserStats(companyId: string) {
  const [total, active, inactive] = await Promise.all([
    prisma.user.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId, isActive: true } }),
    prisma.user.count({ where: { companyId, isActive: false } }),
  ])

  return {
    total,
    active,
    inactive,
  }
}

export async function getCompanyStats() {
  const [total, clients, suppliers] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { type: 'client' } }),
    prisma.company.count({ where: { type: 'supplier' } }),
  ])

  return {
    total,
    clients,
    suppliers,
  }
} 