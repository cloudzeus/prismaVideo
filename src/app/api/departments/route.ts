import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

import { z } from 'zod';

import { auth } from '@/lib/auth';
import { getDepartmentsByCompany, createDepartment } from '@/lib/data/departments';
import { departmentFormSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const isAdmin = user.role === 'Administrator';
    const isManager = user.role === 'Manager';

    // Only admins and managers can create departments
    if (!isAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    console.log('Department creation request body:', body);
    console.log('User company ID:', user.companyId);

    // Clean up the data - convert empty strings and undefined to null for optional fields
    const cleanedData = {
      name: body.name,
      description: body.description === "" || body.description === undefined ? null : body.description,
      parentId: body.parentId === "" || body.parentId === undefined ? null : body.parentId,
      managerId: body.managerId === "" || body.managerId === undefined ? null : body.managerId,
    };
    
    console.log('Cleaned data:', cleanedData);

    // Validate input using the correct schema
    const validatedData = departmentFormSchema.parse(cleanedData);
    console.log('Validated data:', validatedData);

    // Create department
    const department = await createDepartment({
      ...validatedData,
      companyId: user.companyId,
    });

    // Revalidate multiple paths and tags to ensure data is fresh
    revalidatePath('/settings');
    revalidatePath('/api/departments');
    revalidatePath('/api/departments/all');
    revalidateTag('departments');

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
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