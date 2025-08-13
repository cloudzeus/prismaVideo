import { prisma } from '@/lib/prisma';

interface GetDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
}

interface GetDepartmentsResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getDepartmentsByCompany(
  companyId: string,
  params: GetDepartmentsParams = {}
): Promise<GetDepartmentsResult> {
  const {
    page = 1,
    limit = 10,
    search = '',
    parentId = '',
  } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    companyId,
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (parentId === 'top-level') {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = parentId;
  }

  // Get total count
  const total = await prisma.department.count({ where });

  // Get departments with related data
  const departments = await prisma.department.findMany({
    where,
    skip,
    take: limit,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
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
          role: true,
        },
      },
      _count: {
        select: {
          users: true,
          children: true,
        },
      },
    },
    orderBy: [
      { parentId: 'asc' },
      { name: 'asc' },
    ],
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: departments,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getDepartmentById(id: string) {
  return await prisma.department.findUnique({
    where: { id },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
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
          role: true,
        },
      },
      _count: {
        select: {
          users: true,
          children: true,
        },
      },
    },
  });
}

export async function getDepartmentsForSelect(companyId: string) {
  return await prisma.department.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
    orderBy: [
      { parentId: 'asc' },
      { name: 'asc' },
    ],
  });
}

export async function createDepartment(data: {
  name: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  companyId: string;
}) {
  return await prisma.department.create({
    data,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    },
  });
}

export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    parentId?: string | null;
    managerId?: string | null;
  }
) {
  return await prisma.department.update({
    where: { id },
    data,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    },
  });
}

export async function deleteDepartment(id: string) {
  return await prisma.department.delete({
    where: { id },
  });
} 