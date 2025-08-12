import { prisma, createPagination, createSearchFilter, createDateRangeFilter } from '@/lib/prisma'

export async function getRecentMeetings(userId: string, companyId: string, isAdmin: boolean) {
  const where: any = { companyId }
  
  if (!isAdmin) {
    where.OR = [
      { createdById: userId },
      { participants: { some: { userId } } },
    ]
  }

  return prisma.call.findMany({
    where: {
      ...where,
      endTime: { not: null },
    },
    include: {
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
            }
          }
        }
      }
    },
    orderBy: { endTime: 'desc' },
    take: 10,
  })
}

export async function getUpcomingMeetings(userId: string, companyId: string, isAdmin: boolean) {
  const where: any = { 
    companyId,
    startTime: { gte: new Date() },
    status: { in: ['scheduled', 'active'] }
  }
  
  if (!isAdmin) {
    where.OR = [
      { createdById: userId },
      { participants: { some: { userId } } },
    ]
  }

  return prisma.call.findMany({
    where,
    include: {
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
            }
          }
        }
      }
    },
    orderBy: { startTime: 'asc' },
    take: 10,
  })
}

export async function getMeetingsByCompany(
  companyId: string,
  isAdmin: boolean,
  options: {
    page?: number
    limit?: number
    search?: string
    status?: string
    type?: string
  } = {}
) {
  const { page = 1, limit = 10, search, status, type } = options
  
  const where: any = { companyId }
  
  if (!isAdmin) {
    where.OR = [
      { createdById: 'temp-user-id' }, // Will be replaced with actual user ID
      { participants: { some: { userId: 'temp-user-id' } } },
    ]
  }

  if (search) {
    const searchFilter = createSearchFilter(search, ['title', 'description'])
    Object.assign(where, searchFilter)
  }

  if (status) {
    where.status = status
  }

  if (type) {
    where.type = type
  }

  const [meetings, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
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
              }
            }
          }
        }
      },
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.call.count({ where }),
  ])

  // Convert Date objects to ISO strings for the frontend
  const meetingsWithStringDates = meetings.map(meeting => ({
    ...meeting,
    startTime: meeting.startTime.toISOString(),
    endTime: meeting.endTime?.toISOString() || null,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
    participants: meeting.participants.map(participant => ({
      ...participant,
      joinedAt: participant.joinedAt.toISOString(),
      leftAt: participant.leftAt?.toISOString() || null,
    }))
  }));

  return {
    data: meetingsWithStringDates,
    pagination: createPagination(page, limit, total),
  }
}

export async function getMeetingById(id: string, userId: string, isAdmin: boolean) {
  const where: any = { id }
  
  if (!isAdmin) {
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

export async function getQuickStats(companyId: string, isAdmin: boolean) {
  const where: any = { companyId }
  
  if (!isAdmin) {
    // For non-admin users, we'll need to filter by their participation
    // This is a simplified version - in practice, you'd need to join with participants
    where.createdById = 'temp-user-id' // Will be replaced with actual user ID
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [totalMeetings, monthlyMeetings, scheduledMeetings, activeMeetings] = await Promise.all([
    prisma.call.count({ where }),
    prisma.call.count({
      where: {
        ...where,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      }
    }),
    prisma.call.count({
      where: {
        ...where,
        status: 'scheduled',
        startTime: { gte: now }
      }
    }),
    prisma.call.count({
      where: {
        ...where,
        status: 'active'
      }
    }),
  ])

  return {
    totalMeetings,
    monthlyMeetings,
    scheduledMeetings,
    activeMeetings,
  }
}

export async function getMeetingStatistics(
  companyId: string,
  userId: string,
  isAdmin: boolean,
  options: {
    startDate?: string
    endDate?: string
    period?: string
  } = {}
) {
  const { startDate, endDate, period = '30d' } = options
  
  const where: any = { companyId }
  
  if (!isAdmin) {
    where.OR = [
      { createdById: userId },
      { participants: { some: { userId } } },
    ]
  }

  // Add date range filter
  if (startDate || endDate) {
    const dateFilter = createDateRangeFilter(startDate, endDate, 'startTime')
    Object.assign(where, dateFilter)
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    where.startTime = { gte: thirtyDaysAgo }
  }

  const [totalMeetings, meetingsByType, meetingsByStatus, topParticipants] = await Promise.all([
    prisma.call.count({ where }),
    prisma.call.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
    }),
    prisma.call.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
    prisma.participant.groupBy({
      by: ['userId'],
      where: {
        call: where,
      },
      _count: { userId: true },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    }),
  ])

  return {
    totalMeetings,
    meetingsByType,
    meetingsByStatus,
    topParticipants,
  }
} 

export async function getMeetingsByUser(
  userId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const { page = 1, limit = 10 } = options

  const where = {
    OR: [
      { createdById: userId },
      { participants: { some: { userId } } }
    ]
  }

  const [meetings, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
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
              }
            }
          }
        },
        _count: {
          select: {
            participants: true,
            recordings: true,
          }
        }
      },
      orderBy: [
        { startTime: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.call.count({ where }),
  ])

  return {
    data: meetings,
    pagination: createPagination(page, limit, total),
  }
} 

export async function getMeetingByToken(callId: string, token: string) {
  return prisma.call.findFirst({
    where: {
      id: callId,
      accessToken: token,
    },
    include: {
      company: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
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
            }
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            }
          }
        }
      }
    }
  })
} 