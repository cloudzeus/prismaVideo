import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/companies/all - Get companies with pagination and search
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const pageSize = 100 // Fixed page size as requested

    // Build where clause for search - now includes AFM, email, and phone fields
    const where = search.length >= 4 ? {
      OR: [
        { name: { contains: search } },
        { type: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
        { AFM: { contains: search } },
        { EMAILACC: { contains: search } },
        { phone: { contains: search } },
        { PHONE01: { contains: search } },
        { PHONE02: { contains: search } },
      ]
    } : {}

    // Get total count for pagination
    const totalCount = await prisma.company.count({ where })

    // Get companies with pagination and search - now includes additional fields
    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        default: true,
        type: true,
        city: true,
        country: true,
        AFM: true,
        EMAILACC: true,
        phone: true,
        PHONE01: true,
        PHONE02: true,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const totalPages = Math.ceil(totalCount / pageSize)

    return NextResponse.json({
      companies,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 