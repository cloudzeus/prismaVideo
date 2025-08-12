import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/companies - Get all companies (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { COMPANY: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { EMAILACC: { contains: search } },
        { AFM: { contains: search } },
        { PHONE01: { contains: search } },
        { PHONE02: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    
    if (type) {
      where.type = type
    }

    // Get companies with pagination
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.COMPANY || !body.name || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if company code already exists
    const existingCompany = await prisma.company.findUnique({
      where: { COMPANY: body.COMPANY },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company code already exists' },
        { status: 400 }
      )
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        COMPANY: body.COMPANY,
        LOCKID: body.LOCKID || '',
        SODTYPE: body.SODTYPE || (body.type === 'client' ? '13' : '12'),
        name: body.name,
        type: body.type,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        logo: body.logo || null,
        TRDR: body.TRDR || null,
        CODE: body.CODE || null,
        AFM: body.AFM || null,
        IRSDATA: body.IRSDATA || null,
        ZIP: body.ZIP || null,
        PHONE01: body.PHONE01 || null,
        PHONE02: body.PHONE02 || null,
        JOBTYPE: body.JOBTYPE || null,
        EMAILACC: body.EMAILACC || null,
        INSDATE: body.INSDATE ? new Date(body.INSDATE) : null,
        UPDDATE: body.UPDDATE ? new Date(body.UPDDATE) : null,
        default: body.default || false,
      },
    })

    // Revalidate the companies cache
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/companies/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (revalidateError) {
      console.warn('Failed to revalidate companies cache:', revalidateError);
    }

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 