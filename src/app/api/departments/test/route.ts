import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/departments/test - Test endpoint to debug departments issue
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const isAdmin = user.role === 'Administrator'
    const isManager = user.role === 'Manager'

    // Debug info
    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName,
      },
      permissions: {
        canAccessDepartments: isAdmin || isManager,
        isAdmin,
        isManager,
      },
      query: {
        url: request.url,
        searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
      }
    }

    // Only admins and managers can access departments
    if (!isAdmin && !isManager) {
      return NextResponse.json({ 
        error: 'Forbidden',
        debugInfo,
        message: 'User does not have Administrator or Manager role'
      }, { status: 403 })
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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        id: true,
        name: true,
        type: true,
      }
    })

    // Get total count
    const totalCount = await prisma.department.count({
      where: {
        companyId: user.companyId,
      },
    })

    // Get all departments count (for comparison)
    const allDepartmentsCount = await prisma.department.count()

    return NextResponse.json({
      success: true,
      debugInfo,
      data: {
        departments,
        company,
        counts: {
          userCompanyDepartments: totalCount,
          allDepartments: allDepartmentsCount,
        }
      }
    })
  } catch (error) {
    console.error('Error in departments test endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 