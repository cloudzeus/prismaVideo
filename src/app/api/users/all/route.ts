import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/all - Get all users without pagination (for settings and meeting participants)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    // Users can only see users from their own company
    const targetCompanyId = companyId || user.companyId
    
    if (targetCompanyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden - Can only access users from your own company' }, { status: 403 })
    }

    // Get all users for the user's company
    const users = await prisma.user.findMany({
      where: {
        companyId: targetCompanyId,
        isActive: true, // Only show active users
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        companyId: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching all users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 