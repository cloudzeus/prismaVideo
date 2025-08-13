import { prisma, createDateRangeFilter } from '@/lib/prisma'

export async function getStatistics(
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

  const [
    overview,
    meetingTrends,
    userActivity,
    companyMetrics,
    topUsers,
    meetingTypes
  ] = await Promise.all([
    getOverviewStats(companyId, isAdmin, where),
    getMeetingTrends(where),
    getUserActivity(companyId, isAdmin, where),
    isAdmin ? getCompanyMetrics() : null,
    getTopUsers(where),
    getMeetingTypes(where),
  ])

  return {
    overview,
    meetingTrends,
    userActivity,
    companyMetrics,
    topUsers,
    meetingTypes,
  }
}

async function getOverviewStats(companyId: string, isAdmin: boolean, where: any) {
  const [
    totalMeetings, 
    totalUsers, 
    totalRecordings, 
    completedMeetings,
    activeMeetings,
    totalCompanies,
    totalDepartments,
    allMeetings
  ] = await Promise.all([
    prisma.call.count({ where }),
    prisma.user.count({ where: { companyId, isActive: true } }),
    prisma.recording.count({ 
      where: { 
        call: where
      } 
    }),
    prisma.call.findMany({
      where: { ...where, endTime: { not: null } },
      select: {
        startTime: true,
        endTime: true,
      }
    }),
    prisma.call.count({ where: { ...where, status: 'active' } }),
    isAdmin ? prisma.company.count() : 0,
    isAdmin ? prisma.department.count() : prisma.department.count({ where: { companyId } }),
    prisma.call.findMany({
      where,
      select: {
        startTime: true,
        endTime: true,
        status: true,
      }
    }),
  ])

  // Calculate total duration from completed meetings
  const totalDuration = completedMeetings.reduce((total, meeting) => {
    if (meeting.startTime && meeting.endTime) {
      const duration = meeting.endTime.getTime() - meeting.startTime.getTime()
      return total + duration
    }
    return total
  }, 0)

  // Convert milliseconds to minutes for display
  const totalDurationMinutes = Math.round(totalDuration / (1000 * 60))

  // Calculate average meeting duration
  const completedCount = completedMeetings.length
  const averageMeetingDuration = completedCount > 0 ? Math.round(totalDurationMinutes / completedCount) : 0

  // Calculate meeting completion rate
  const scheduledMeetings = allMeetings.filter(m => m.status === 'scheduled').length
  const endedMeetings = allMeetings.filter(m => m.status === 'ended').length
  const totalScheduled = scheduledMeetings + endedMeetings
  const meetingCompletionRate = totalScheduled > 0 ? endedMeetings / totalScheduled : 0

  return {
    totalMeetings,
    totalUsers,
    totalRecordings,
    totalDuration: totalDurationMinutes,
    activeMeetings,
    totalCompanies,
    totalDepartments,
    averageMeetingDuration,
    meetingCompletionRate,
  }
}

async function getMeetingTrends(where: any) {
  // Get meetings grouped by date for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const meetings = await prisma.call.findMany({
    where: {
      ...where,
      startTime: { gte: thirtyDaysAgo }
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      participants: {
        select: {
          id: true,
        }
      }
    },
    orderBy: { startTime: 'asc' },
  })

  // Group by date
  const trends = meetings.reduce((acc, meeting) => {
    const date = meeting.startTime.toISOString().split('T')[0]
    if (date) {
      if (!acc[date]) {
        acc[date] = {
          date,
          meetings: 0,
          participants: 0,
          duration: 0,
        }
      }
      acc[date].meetings++
      acc[date].participants += meeting.participants.length
      
      if (meeting.endTime) {
        const duration = meeting.endTime.getTime() - meeting.startTime.getTime()
        acc[date].duration += Math.round(duration / (1000 * 60)) // Convert to minutes
      }
    }
    
    return acc
  }, {} as Record<string, { date: string; meetings: number; participants: number; duration: number }>)

  return Object.values(trends)
}

async function getUserActivity(companyId: string, isAdmin: boolean, where: any) {
  const userActivity = await prisma.participant.groupBy({
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
  })

  // Get user details for the top participants
  const userIds = userActivity.map(ua => ua.userId).filter((id): id is string => id !== null)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      role: true,
      department: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get completed meetings for duration calculation
  const completedMeetings = await prisma.call.findMany({
    where: { ...where, endTime: { not: null } },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      participants: {
        where: { userId: { in: userIds } },
        select: { userId: true }
      }
    }
  })

  // Calculate duration per user
  const userDurations = new Map<string, number>()
  completedMeetings.forEach(meeting => {
    if (meeting.startTime && meeting.endTime) {
      const duration = meeting.endTime.getTime() - meeting.startTime.getTime()
      const durationMinutes = Math.round(duration / (1000 * 60))
      
      meeting.participants.forEach(participant => {
        if (participant.userId) {
          const current = userDurations.get(participant.userId) || 0
          userDurations.set(participant.userId, current + durationMinutes)
        }
      })
    }
  })

  // Get last activity for each user
  const lastActivity = await prisma.participant.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      call: where,
    },
    _max: {
      joinedAt: true,
    },
  })

  const lastActivityMap = new Map<string, Date>()
  lastActivity.forEach(la => {
    if (la.userId && la._max?.joinedAt) {
      lastActivityMap.set(la.userId, la._max.joinedAt)
    }
  })

  return userActivity.map(ua => {
    const user = users.find(u => u.id === ua.userId)
    const totalDuration = userDurations.get(ua.userId || '') || 0
    const lastActive = lastActivityMap.get(ua.userId || '') || new Date()
    
    return {
      userId: ua.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
      userEmail: user?.email || '',
      userAvatar: user?.avatar || undefined,
      meetingsAttended: ua._count.userId,
      totalDuration,
      lastActive: (lastActive as Date).toISOString(),
      department: user?.department?.name,
      role: user?.role || 'Employee',
    }
  })
}

async function getCompanyMetrics() {
  // Get all companies with their metrics
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      users: {
        where: { isActive: true },
        select: { id: true }
      },
      calls: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
        }
      }
    }
  })

  return companies.map(company => {
    const totalUsers = company.users.length
    const totalMeetings = company.calls.length
    
    // Calculate total duration from completed meetings
    const completedMeetings = company.calls.filter(call => 
      call.status === 'ended' && call.startTime && call.endTime
    )
    const totalDuration = completedMeetings.reduce((total, meeting) => {
      const duration = meeting.endTime!.getTime() - meeting.startTime.getTime()
      return total + Math.round(duration / (1000 * 60)) // Convert to minutes
    }, 0)

    // Calculate average meeting duration
    const averageMeetingDuration = completedMeetings.length > 0 
      ? Math.round(totalDuration / completedMeetings.length) 
      : 0

    // Calculate user engagement rate (users who participated in meetings)
    // For now, we'll use a simplified calculation based on meeting attendance
    const userEngagementRate = totalUsers > 0 ? Math.min(totalMeetings / totalUsers, 1) : 0

    // Calculate meeting completion rate
    const scheduledMeetings = company.calls.filter(call => call.status === 'scheduled').length
    const endedMeetings = company.calls.filter(call => call.status === 'ended').length
    const totalScheduled = scheduledMeetings + endedMeetings
    const meetingCompletionRate = totalScheduled > 0 ? endedMeetings / totalScheduled : 0

    // Mock growth rate (in a real app, this would be calculated from historical data)
    const growthRate = Math.random() * 20 - 5 // Random between -5% and 15%

    return {
      companyId: company.id,
      companyName: company.name,
      companyType: company.type,
      totalUsers,
      totalMeetings,
      totalDuration,
      averageMeetingDuration,
      userEngagementRate,
      meetingCompletionRate,
      growthRate,
    }
  })
}

async function getTopUsers(where: any) {
  const topUsers = await prisma.participant.groupBy({
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
    take: 5,
  })

  const userIds = topUsers.map(tu => tu.userId).filter((id): id is string => id !== null)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get completed meetings for duration calculation
  const completedMeetings = await prisma.call.findMany({
    where: { ...where, endTime: { not: null } },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      participants: {
        where: { userId: { in: userIds } },
        select: { userId: true }
      }
    }
  })

  // Calculate duration per user
  const userDurations = new Map<string, number>()
  completedMeetings.forEach(meeting => {
    if (meeting.startTime && meeting.endTime) {
      const duration = meeting.endTime.getTime() - meeting.startTime.getTime()
      const durationHours = duration / (1000 * 60 * 60)
      
      meeting.participants.forEach(participant => {
        if (participant.userId) {
          const current = userDurations.get(participant.userId) || 0
          userDurations.set(participant.userId, current + durationHours)
        }
      })
    }
  })

  return topUsers.map(tu => {
    const user = users.find(u => u.id === tu.userId)
    const totalDuration = Math.round((userDurations.get(tu.userId || '') || 0) * 100) / 100
    
    return {
      id: tu.userId,
      name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
      department: user?.department?.name || 'No Department',
      meetingCount: tu._count.userId,
      totalDuration,
    }
  })
}

async function getMeetingTypes(where: any) {
  const meetingTypes = await prisma.call.groupBy({
    by: ['type'],
    where,
    _count: { type: true },
    orderBy: {
      _count: {
        type: 'desc',
      },
    },
  })

  const total = meetingTypes.reduce((sum, mt) => sum + mt._count.type, 0)

  return meetingTypes.map(mt => ({
    name: mt.type,
    count: mt._count.type,
    percentage: total > 0 ? Math.round((mt._count.type / total) * 100) : 0,
  }))
} 