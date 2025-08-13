'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditUserModal } from './edit-user-modal';
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
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { Switch } from '@/components/ui/switch';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  isActive: boolean;
  companyId: string;
  departmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  } | null;
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
  role: string;
  departmentId: string;
  status: string;
}

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface UsersTableProps {
  users: User[];
  pagination: Pagination;
  currentFilters: CurrentFilters;
  user: CurrentUser;
  departments: Array<{
    id: string;
    name: string;
  }>;
}

export function UsersTable({ 
  users, 
  pagination, 
  currentFilters, 
  user, 
  departments 
}: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Debug logging
  console.log('UsersTable props:', { users, pagination, currentFilters, user });

  // Ensure currentFilters has all required properties
  const safeFilters = {
    page: currentFilters?.page || 1,
    limit: currentFilters?.limit || 10,
    search: currentFilters?.search || '',
    role: currentFilters?.role || '',
    departmentId: currentFilters?.departmentId || '',
    status: currentFilters?.status || '',
  };

  console.log('Safe filters:', safeFilters);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrator':
        return <Badge variant="destructive">Administrator</Badge>;
      case 'Manager':
        return <Badge variant="default">Manager</Badge>;
      case 'Employee':
        return <Badge variant="secondary">Employee</Badge>;
      case 'Contact':
        return <Badge variant="outline">Contact</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="flex items-center gap-1">
        <UserCheck className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <UserX className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const canEditUser = (targetUser: User) => {
    // Admins can edit anyone
    if (user.role === 'Administrator') return true;
    
    // Managers can edit employees and contacts, but not admins or other managers
    if (user.role === 'Manager') {
      return targetUser.role === 'Employee' || targetUser.role === 'Contact';
    }
    
    return false;
  };

  const canDeleteUser = (targetUser: User) => {
    // Can't delete yourself
    if (user.id === targetUser.id) return false;
    
    // Admins can delete anyone except themselves
    if (user.role === 'Administrator') return true;
    
    // Managers can delete employees and contacts
    if (user.role === 'Manager') {
      return targetUser.role === 'Employee' || targetUser.role === 'Contact';
    }
    
    return false;
  };

  const canToggleUserStatus = (targetUser: User) => {
    // Can't toggle your own status
    if (user.id === targetUser.id) return false;
    
    return canEditUser(targetUser);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
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
      header: 'User',
      cell: ({ row }: { row: any }) => {
        const userData = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.avatar || undefined} />
              <AvatarFallback>
                {userData.firstName?.[0] || ''}{userData.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {userData.firstName || ''} {userData.lastName || ''}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {userData.email || ''}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }: { row: any }) => getRoleBadge(row.original.role),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Building className="h-3 w-3" />
          <span className="text-sm">{row.original.company?.name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.department?.name || 'No department'}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {row.original.phone ? (
            <>
              <Phone className="h-3 w-3" />
              <span>{row.original.phone}</span>
            </>
          ) : (
            <span className="text-muted-foreground">No phone</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => getStatusBadge(row.original.isActive),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {row.original.createdAt ? formatDate(row.original.createdAt) : 'Unknown'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => {
        const userData = row.original;
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
              
              {canEditUser(userData) && (
                <DropdownMenuItem onClick={() => handleEditUser(userData)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => window.open(`mailto:${userData.email || ''}`)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {canToggleUserStatus(userData) && (
                <DropdownMenuItem 
                  onClick={() => handleToggleUserStatus(userData.id, userData.isActive)}
                  className={userData.isActive ? 'text-red-600' : 'text-green-600'}
                >
                  {userData.isActive ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate User
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate User
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              {canDeleteUser(userData) && (
                <DropdownMenuItem 
                  onClick={() => handleDeleteUser(userData.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
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
            Loading users table...
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
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Search users..."
              value={safeFilters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Role:</label>
              <div className="flex space-x-1">
                <Button
                  variant={safeFilters.role === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ role: '' })}
                  className="h-8 text-xs"
                >
                  All
                </Button>
                <Button
                  variant={safeFilters.role === 'Administrator' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ role: 'Administrator' })}
                  className="h-8 text-xs"
                >
                  Admin
                </Button>
                <Button
                  variant={safeFilters.role === 'Manager' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ role: 'Manager' })}
                  className="h-8 text-xs"
                >
                  Manager
                </Button>
                <Button
                  variant={safeFilters.role === 'Employee' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ role: 'Employee' })}
                  className="h-8 text-xs"
                >
                  Employee
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Status:</label>
              <div className="flex space-x-1">
                <Button
                  variant={safeFilters.status === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ status: '' })}
                  className="h-8 text-xs"
                >
                  All
                </Button>
                <Button
                  variant={safeFilters.status === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ status: 'active' })}
                  className="h-8 text-xs"
                >
                  Active
                </Button>
                <Button
                  variant={safeFilters.status === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ status: 'inactive' })}
                  className="h-8 text-xs"
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Temporarily disabled to debug Select component issue */}
            {/* <DataTableViewOptions /> */}
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
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userData) => (
                  <TableRow key={userData.id}>
                    {columns.map((column) => (
                      <TableCell key={column.accessorKey || column.id}>
                        {column.cell({ row: { original: userData } })}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <DataTablePagination
          page={pagination.page || 1}
          limit={pagination.limit || 10}
          total={pagination.total || 0}
          totalPages={pagination.totalPages || 1}
          onPageChange={(page) => updateFilters({ page })}
          onLimitChange={(limit) => updateFilters({ limit })}
        />

        {/* Edit User Modal */}
        <EditUserModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
          departments={departments}
          isLoading={isLoading}
        />
      </div>
    );
  } catch (error) {
    console.error('Error rendering UsersTable:', error);
    return (
      <div className="space-y-4">
        <div className="rounded-md border p-4">
          <p className="text-center text-muted-foreground">
            Error loading users table. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }
} 