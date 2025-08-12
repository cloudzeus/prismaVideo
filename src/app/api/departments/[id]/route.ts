import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDepartmentById, updateDepartment, deleteDepartment } from '@/lib/data/departments'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const updateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

// GET /api/departments/[id] - Get department by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[id] - Update department
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
    if (!body.name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Ensure user can only update departments in their company
    if (existingDepartment.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot update department in different company' },
        { status: 403 }
      )
    }

    // Update department (don't change companyId)
    const department = await prisma.department.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        parentId: body.parentId || null,
        managerId: body.managerId || null,
        // Keep existing companyId
      },
    })

    // Revalidate the settings page to show the updated department
    revalidatePath('/settings');

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error updating department:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete department
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

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if department has users
    const usersCount = await prisma.user.count({
      where: { departmentId: id },
    })

    if (usersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with users. Please reassign users first.' },
        { status: 400 }
      )
    }

    // Check if department has children
    const childrenCount = await prisma.department.count({
      where: { parentId: id },
    })

    if (childrenCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with child departments. Please reassign children first.' },
        { status: 400 }
      )
    }

    // Delete department
    await prisma.department.delete({
      where: { id },
    })

    // Revalidate the settings page to show the updated department list
    revalidatePath('/settings');

    return NextResponse.json({ message: 'Department deleted successfully' })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 