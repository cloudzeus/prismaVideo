import { prisma } from '@/lib/prisma'

export async function getContacts() {
  try {
    const contacts = await prisma.contact.findMany({
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

    return contacts
  } catch (error) {
    console.error('Error fetching contacts:', error)
    throw new Error('Failed to fetch contacts')
  }
}

export async function getContactById(id: string) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
    })

    return contact
  } catch (error) {
    console.error('Error fetching contact:', error)
    throw new Error('Failed to fetch contact')
  }
}

export async function getContactsByCompany(companyId: string) {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        companies: {
          some: {
            companyId,
          },
        },
      },
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    })

    return contacts
  } catch (error) {
    console.error('Error fetching contacts by company:', error)
    throw new Error('Failed to fetch contacts by company')
  }
} 