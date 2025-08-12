import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  profession: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  workPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  avatarUrl: z.string().optional(),
  companyIds: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    let whereClause = {}
    
    if (companyId) {
      whereClause = {
        companies: {
          some: {
            companyId: companyId
          }
        }
      }
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    const { companyIds, ...contactData } = validatedData

    // Create the contact
    const contact = await prisma.contact.create({
      data: contactData,
    })

    // If companies are selected, create the associations
    if (companyIds.length > 0) {
      const companyAssociations = companyIds.map(companyId => ({
        contactId: contact.id,
        companyId,
      }))

      await prisma.contactCompany.createMany({
        data: companyAssociations,
      })
    }

    // Fetch the created contact with company associations
    const createdContact = await prisma.contact.findUnique({
      where: { id: contact.id },
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
    })

    return NextResponse.json(createdContact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
} 