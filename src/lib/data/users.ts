import { prisma, createPagination, createSearchFilter } from '@/lib/prisma'

export async function getUsersByCompany(
  companyId: string,
  isAdmin: boolean,
  options: {
    page?: number
    limit?: number
    search?: string
    role?: string
    departmentId?: string
    status?: string
  } = {}
) {
  const { page = 1, limit = 10, search, role, departmentId, status } = options
  
  const where: any = { companyId }
  
  if (!isAdmin) {
    where.isActive = true
  }

  // Only apply search filter if search term is provided and has at least 2 characters
  if (search && search.trim().length >= 2) {
    const searchFilter = createSearchFilter(search, ['firstName', 'lastName', 'email'])
    Object.assign(where, searchFilter)
  }

  if (role) {
    where.role = role
  }

  if (departmentId) {
    where.departmentId = departmentId
  }

  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  }

  // Debug logging
  console.log('getUsersByCompany Debug:', {
    companyId,
    isAdmin,
    where,
    options
  });

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          }
        },
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
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  // Debug logging
  console.log('getUsersByCompany Results:', {
    usersFound: users.length,
    total,
    firstUser: users[0] ? { id: users[0].id, email: users[0].email, firstName: users[0].firstName, lastName: users[0].lastName } : null
  });

  // Convert Date objects to ISO strings for the frontend
  const usersWithStringDates = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return {
    data: usersWithStringDates,
    pagination: createPagination(page, limit, total),
  }
}

export async function getUserStats(companyId?: string) {
  const where: any = {}
  
  if (companyId) {
    where.companyId = companyId
  }

  const [total, active, inactive] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, isActive: true } }),
    prisma.user.count({ where: { ...where, isActive: false } }),
  ])

  return {
    total,
    active,
    inactive,
  }
} 

export async function getUserById(userId: string, companyId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      companyId: companyId,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        }
      },
      department: {
        select: {
          id: true,
          name: true,
        }
      },
      participants: {
        include: {
          call: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              status: true,
              type: true,
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        },
        take: 10
      },
      calls: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          type: true,
          _count: {
            select: {
              participants: true
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        },
        take: 10
      }
    }
  })
} 

export async function searchUsers(
  companyId: string,
  query: string,
  excludeUserIds: string[] = [],
  limit: number = 20
) {
  if (query.length < 3) {
    return []
  }

  const where: any = {
    companyId,
    isActive: true,
  }

  // Only add notIn filter if there are IDs to exclude
  if (excludeUserIds.length > 0) {
    where.id = { notIn: excludeUserIds }
  }

  const searchFilter = createSearchFilter(query, ['firstName', 'lastName', 'email'])
  Object.assign(where, searchFilter)

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      role: true,
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' }
    ],
    take: limit,
  })

  return users.map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  }))
} 