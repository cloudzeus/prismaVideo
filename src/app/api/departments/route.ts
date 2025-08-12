import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDepartmentsByCompany, createDepartment } from '@/lib/data/departments';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user;
    const isAdmin = user.role === 'Administrator';
    const isManager = user.role === 'Manager';

    // Only admins and managers can access departments
    if (!isAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const parentId = searchParams.get('parentId') || '';

    const departments = await getDepartmentsByCompany(user.companyId, {
      page,
      limit,
      search,
      parentId,
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user;
    const isAdmin = user.role === 'Administrator';
    const isManager = user.role === 'Manager';

    // Only admins and managers can create departments
    if (!isAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createDepartmentSchema.parse(body);

    // Create department
    const department = await createDepartment({
      ...validatedData,
      companyId: user.companyId,
    });

    // Revalidate the settings page to show the new department
    revalidatePath('/settings');

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 