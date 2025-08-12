import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/companies/[id] - Update company
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    
    // Validate required fields
    if (!body.COMPANY || !body.name || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if company code already exists (excluding current company)
    if (body.COMPANY !== existingCompany.COMPANY) {
      const duplicateCompany = await prisma.company.findUnique({
        where: { COMPANY: body.COMPANY },
      })

      if (duplicateCompany) {
        return NextResponse.json(
          { error: 'Company code already exists' },
          { status: 400 }
        )
      }
    }

    // Update company
    const company = await prisma.company.update({
      where: { id },
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

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[id] - Delete company
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Delete company
    await prisma.company.delete({
      where: { id },
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

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 