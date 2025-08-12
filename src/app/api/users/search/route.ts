import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/lib/data/users'
import { getAuthSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized or company not found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const excludeParam = searchParams.get('exclude')
    const excludeIds = excludeParam && excludeParam.trim() !== '' ? excludeParam.split(',').filter(Boolean) : []
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 3) {
      return NextResponse.json({ data: [] })
    }

    const users = await searchUsers(session.user.companyId, query, excludeIds, limit)
    
    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 