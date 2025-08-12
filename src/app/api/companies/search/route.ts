import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { searchCompanies } from '@/lib/data/companies'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('Company search API called with query:', query, 'limit:', limit)

    if (!query || query.length < 3) {
      console.log('Query too short, returning empty array')
      return NextResponse.json({ companies: [] })
    }

    const companies = await searchCompanies(query, limit)
    console.log('Search results:', companies.length, 'companies found')
    
    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Error searching companies:', error)
    return NextResponse.json(
      { error: 'Failed to search companies' },
      { status: 500 }
    )
  }
} 