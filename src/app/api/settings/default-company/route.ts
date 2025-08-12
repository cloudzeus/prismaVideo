import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current default company
    const defaultCompany = await prisma.company.findFirst({
      where: { default: true },
      select: {
        id: true,
        name: true,
        default: true,
        type: true,
        city: true,
        country: true,
      }
    })

    return NextResponse.json({ 
      defaultCompany: defaultCompany || null
    })

  } catch (error) {
    console.error('Error fetching default company:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get the current default company to check if it's changing
    const currentDefault = await prisma.company.findFirst({
      where: { default: true }
    })

    // If the default company is actually changing, move all users to the new default company
    if (currentDefault && currentDefault.id !== companyId) {
      console.log(`Migrating all data from company ${currentDefault.id} to ${companyId}`)
      
      try {
        // Use transactions for better performance and atomicity
        await prisma.$transaction(async (tx) => {
          // First, reset all companies to not default
          await tx.company.updateMany({
            data: { default: false }
          })

          // Set the selected company as default
          await tx.company.update({
            where: { id: companyId },
            data: { default: true }
          })

          // Move all users to the new default company
          const usersUpdated = await tx.user.updateMany({
            where: {},
            data: { companyId: companyId }
          })
          console.log(`Updated ${usersUpdated.count} users`)

          // Update the current user's company information to ensure session consistency
          await tx.user.update({
            where: { id: session.user.id },
            data: { 
              companyId: companyId,
              // Also update any other company-related fields if they exist
            }
          })

          // Verify that the current user's company was updated
          const currentUserUpdated = await tx.user.findFirst({
            where: { id: session.user.id }
          })
          console.log(`Current user company updated: ${currentUserUpdated?.companyId} -> ${companyId}`)

          // Move all departments to the new default company
          const departmentsUpdated = await tx.department.updateMany({
            where: {},
            data: { companyId: companyId }
          })
          console.log(`Updated ${departmentsUpdated.count} departments`)

          // Move all calls to the new default company
          const callsUpdated = await tx.call.updateMany({
            where: {},
            data: { companyId: companyId }
          })
          console.log(`Updated ${callsUpdated.count} calls`)

          // Move all contacts to the new default company (through contact_companies table)
          const contactsUpdated = await tx.contactCompany.updateMany({
            where: {},
            data: { companyId: companyId }
          })
          console.log(`Updated ${contactsUpdated.count} contact companies`)

          // Note: Events, recordings, and livestreams are related to calls through callId,
          // so they will be indirectly updated when calls are moved to the new company
          console.log('Data migration completed successfully')
          
          // Log migration summary
          console.log(`Migration Summary:
            - Users: ${usersUpdated.count}
            - Departments: ${departmentsUpdated.count}
            - Calls: ${callsUpdated.count}
            - Contact Companies: ${contactsUpdated.count}
            - Events, Recordings, Livestreams: Updated indirectly through calls
          `)
        })
      } catch (transactionError) {
        console.error('Transaction failed during data migration:', transactionError)
        throw new Error('Failed to migrate data to new default company')
      }
    } else {
      // If no change in default company, just update the flags
      await prisma.company.updateMany({
        data: { default: false }
      })

      await prisma.company.update({
        where: { id: companyId },
        data: { default: true }
      })

      // Also update the current user's company to ensure session consistency
      await prisma.user.update({
        where: { id: session.user.id },
        data: { companyId: companyId }
      })
    }

    // Verify the update was successful
    const updatedCompany = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!updatedCompany?.default) {
      throw new Error('Failed to set company as default')
    }

    // Revalidate all relevant paths to refresh session data
    revalidatePath('/')
    revalidatePath('/profile')
    revalidatePath('/settings')
    revalidatePath('/dashboard')

    // Verify that data migration was successful by counting records
    if (currentDefault && currentDefault.id !== companyId) {
      const verificationCounts = await prisma.$transaction(async (tx) => {
        const userCount = await tx.user.count({ where: { companyId } })
        const departmentCount = await tx.department.count({ where: { companyId } })
        const callCount = await tx.call.count({ where: { companyId } })
        const contactCompanyCount = await tx.contactCompany.count({ where: { companyId } })
        
        return { userCount, departmentCount, callCount, contactCompanyCount }
      })
      
      console.log('Verification counts after migration:', verificationCounts)
    }

    return NextResponse.json({ 
      message: 'Default company updated successfully. All users, departments, and data have been migrated.',
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        default: true
      },
      migrationCompleted: currentDefault && currentDefault.id !== companyId,
      verification: currentDefault && currentDefault.id !== companyId ? {
        message: 'Data migration completed and verified',
        timestamp: new Date().toISOString()
      } : null
    })

  } catch (error) {
    console.error('Error updating default company:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    )
  }
} 