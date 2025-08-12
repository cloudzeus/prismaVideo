import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/departments/all - Get all departments without pagination (for settings)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const isAdmin = user.role === 'Administrator'
    const isManager = user.role === 'Manager'

    // Only admins and managers can access departments
    if (!isAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all departments for the user's company
    const departments = await prisma.department.findMany({
      where: {
        companyId: user.companyId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        managerId: true,
        companyId: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching all departments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 