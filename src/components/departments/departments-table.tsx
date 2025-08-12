'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditDepartmentModal } from './edit-department-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Building,
  UserCheck,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  } | null;
  children: Department[];
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  _count: {
    users: number;
    children: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CurrentFilters {
  page: number;
  limit: number;
  search: string;
  parentId: string;
}

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface DepartmentsTableProps {
  departments: Department[];
  pagination: Pagination;
  currentFilters: CurrentFilters;
  user: CurrentUser;
}

export function DepartmentsTable({ 
  departments, 
  pagination, 
  currentFilters, 
  user 
}: DepartmentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Debug logging
  console.log('DepartmentsTable props:', { departments, pagination, currentFilters, user });

  // Ensure currentFilters has all required properties
  const safeFilters = {
    page: currentFilters?.page || 1,
    limit: currentFilters?.limit || 10,
    search: currentFilters?.search || '',
    parentId: currentFilters?.parentId || '',
  };

  console.log('Safe filters:', safeFilters);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getHierarchyLevel = (department: Department): number => {
    let level = 0;
    let current = department;
    while (current.parentId) {
      level++;
      current = departments.find(d => d.id === current.parentId) || current;
    }
    return level;
  };

  const canEditDepartment = (department: Department) => {
    return user.role === 'Administrator' || user.role === 'Manager';
  };

  const canDeleteDepartment = (department: Department) => {
    // Can't delete if it has users or child departments
    if (department._count.users > 0 || department._count.children > 0) {
      return false;
    }
    return user.role === 'Administrator' || user.role === 'Manager';
  };

  const handleEditDepartment = (departmentId: string) => {
    router.push(`/departments/${departmentId}/edit`);
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<CurrentFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when changing filters
    if (Object.keys(newFilters).some(key => key !== 'page')) {
      params.set('page', '1');
    }
    
    router.push(`?${params.toString()}`);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Department',
      cell: ({ row }: { row: any }) => {
        const department = row.original;
        const level = getHierarchyLevel(department);
        
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: level }).map((_, i) => (
                <ChevronRight key={i} className="h-3 w-3 text-muted-foreground" />
              ))}
            </div>
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Building className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{department.name}</p>
              {department.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {department.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'parent',
      header: 'Parent Department',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.parent?.name || 'Top Level'}
        </div>
      ),
    },
    {
      accessorKey: 'manager',
      header: 'Manager',
      cell: ({ row }: { row: any }) => {
        const manager = row.original.manager;
        return manager ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={manager.avatar || undefined} />
              <AvatarFallback>
                {manager.firstName?.[0] || ''}{manager.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{manager.firstName || ''} {manager.lastName || ''}</p>
              <p className="text-xs text-muted-foreground">{manager.email || ''}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No manager assigned</div>
        );
      },
    },
    {
      accessorKey: 'users',
      header: 'Users',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span className="text-sm font-medium">{row.original._count.users}</span>
        </div>
      ),
    },
    {
      accessorKey: 'children',
      header: 'Sub-departments',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Building className="h-3 w-3" />
          <span className="text-sm font-medium">{row.original._count.children}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => {
        const department = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              {canEditDepartment(department) && (
                <DropdownMenuItem onClick={() => handleEditDepartment(department.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Department
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => router.push(`/departments/${department.id}/users`)}>
                <Users className="mr-2 h-4 w-4" />
                View Users
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {canDeleteDepartment(department) && (
                <DropdownMenuItem 
                  onClick={() => handleDeleteDepartment(department.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Department
                </DropdownMenuItem>
              )}
              
              {!canDeleteDepartment(department) && (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cannot delete (has users or sub-departments)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Don't render if critical data is missing
  if (!currentFilters || !pagination || !user) {
    console.log('Missing critical data, showing loading state');
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <p className="text-center text-muted-foreground">
            Loading departments table...
          </p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search departments..."
            value={safeFilters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="h-8 w-[200px] lg:w-[300px]"
          />
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Parent:</label>
            <div className="flex space-x-1">
              <Button
                variant={safeFilters.parentId === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ parentId: '' })}
                className="h-8 text-xs"
              >
                All
              </Button>
              <Button
                variant={safeFilters.parentId === 'top-level' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ parentId: 'top-level' })}
                className="h-8 text-xs"
              >
                Top Level
              </Button>
              {departments
                .filter(d => d._count.children > 0)
                .slice(0, 3) // Limit to first 3 to avoid overflow
                .map((dept) => (
                  <Button
                    key={dept.id}
                    variant={safeFilters.parentId === dept.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ parentId: dept.id })}
                    className="h-8 text-xs max-w-[100px] truncate"
                    title={dept.name}
                  >
                    {dept.name}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey || column.id}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!departments || departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No departments found.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow key={department.id}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey || column.id}>
                      {column.cell({ row: { original: department } })}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Simple Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} departments
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('Error rendering DepartmentsTable:', error);
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <p className="text-center text-muted-foreground">
            Error loading departments table. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }
} 