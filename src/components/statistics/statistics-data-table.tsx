'use client';

import { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  Search, 
  MoreHorizontal,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Building2
} from 'lucide-react';

interface UserActivityData {
  userId: string | null;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  meetingsAttended: number;
  totalDuration: number;
  lastActive: string;
  department?: string;
  role: string;
}

interface MeetingTrendsData {
  date: string;
  meetings: number;
  participants: number;
  duration: number;
}

interface CompanyMetricsData {
  companyId: string;
  companyName: string;
  companyType: string;
  totalUsers: number;
  totalMeetings: number;
  totalDuration: number;
  averageMeetingDuration: number;
  userEngagementRate: number;
  meetingCompletionRate: number;
  growthRate: number;
}

interface StatisticsDataTableProps {
  userActivity: UserActivityData[];
  meetingTrends: MeetingTrendsData[];
  companyMetrics: CompanyMetricsData[];
  isAdmin: boolean;
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const formatLastActive = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'Administrator':
      return 'destructive' as const;
    case 'Manager':
      return 'default' as const;
    case 'Employee':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

const getCompanyTypeBadge = (type: string) => {
  return type === 'client' ? 'default' : 'secondary';
};

const getPerformanceLevel = (engagement: number, completion: number, growth: number) => {
  const score = (engagement + completion + Math.max(growth, 0)) / 3;
  if (score >= 0.8) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
  if (score >= 0.6) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  if (score >= 0.4) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
};

// User Activity Columns
const userActivityColumns: ColumnDef<UserActivityData>[] = [
  {
    accessorKey: 'userName',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.userAvatar} alt={user.userName} />
            <AvatarFallback>
              {user.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.userName}</div>
            <div className="text-sm text-muted-foreground">{user.userEmail}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue('department') || 'No Department'}</div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant={getRoleBadgeVariant(row.getValue('role'))}>
        {row.getValue('role')}
      </Badge>
    ),
  },
  {
    accessorKey: 'meetingsAttended',
    header: 'Meetings',
    cell: ({ row }) => (
      <div className="text-center">
        <div className="font-medium">{row.getValue('meetingsAttended')}</div>
        <div className="text-xs text-muted-foreground">attended</div>
      </div>
    ),
  },
  {
    accessorKey: 'totalDuration',
    header: 'Duration',
    cell: ({ row }) => (
      <div className="text-center">
        <div className="font-medium">{formatDuration(row.getValue('totalDuration'))}</div>
        <div className="text-xs text-muted-foreground">total time</div>
      </div>
    ),
  },
  {
    accessorKey: 'lastActive',
    header: 'Last Active',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatLastActive(row.getValue('lastActive'))}
      </div>
    ),
  },
];

// Company Metrics Columns (Admin only)
const companyMetricsColumns: ColumnDef<CompanyMetricsData>[] = [
  {
    accessorKey: 'companyName',
    header: 'Company',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('companyName')}</div>
    ),
  },
  {
    accessorKey: 'companyType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={getCompanyTypeBadge(row.getValue('companyType'))}>
        {row.getValue('companyType')}
      </Badge>
    ),
  },
  {
    accessorKey: 'totalUsers',
    header: 'Users',
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.getValue('totalUsers')}</div>
    ),
  },
  {
    accessorKey: 'totalMeetings',
    header: 'Meetings',
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.getValue('totalMeetings')}</div>
    ),
  },
  {
    accessorKey: 'userEngagementRate',
    header: 'Engagement',
    cell: ({ row }) => {
      const engagement = row.getValue('userEngagementRate') as number;
      return (
        <div className="text-center">
          <div className="font-medium">{Math.round(engagement * 100)}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'meetingCompletionRate',
    header: 'Completion',
    cell: ({ row }) => {
      const completion = row.getValue('meetingCompletionRate') as number;
      return (
        <div className="text-center">
          <div className="font-medium">{Math.round(completion * 100)}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'growthRate',
    header: 'Growth',
    cell: ({ row }) => {
      const growth = row.getValue('growthRate') as number;
      return (
        <div className="text-center">
          <div className={`font-medium flex items-center justify-center gap-1 ${
            growth > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {growth > 0 ? '+' : ''}{growth}%
          </div>
        </div>
      );
    },
  },
  {
    id: 'performance',
    header: 'Performance',
    cell: ({ row }) => {
      const engagement = row.getValue('userEngagementRate') as number;
      const completion = row.getValue('meetingCompletionRate') as number;
      const growth = row.getValue('growthRate') as number;
      const performance = getPerformanceLevel(engagement, completion, growth);
      
      return (
        <Badge variant="outline" className={performance.color}>
          {performance.level}
        </Badge>
      );
    },
  },
];

export function StatisticsDataTable({ 
  userActivity, 
  meetingTrends, 
  companyMetrics, 
  isAdmin 
}: StatisticsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const userTable = useReactTable({
    data: userActivity,
    columns: userActivityColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const companyTable = useReactTable({
    data: companyMetrics,
    columns: companyMetricsColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-6">
      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Activity Details
          </CardTitle>
          <CardDescription>
            Detailed breakdown of user participation and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter users..."
              value={(userTable.getColumn('userName')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                userTable.getColumn('userName')?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {userTable
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {userTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {userTable.getRowModel().rows?.length ? (
                  userTable.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={userActivityColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {userTable.getFilteredSelectedRowModel().rows.length} of{" "}
              {userTable.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => userTable.previousPage()}
                disabled={!userTable.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => userTable.nextPage()}
                disabled={!userTable.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Metrics Table (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Performance Details
            </CardTitle>
            <CardDescription>
              Detailed performance metrics for all companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter companies..."
                value={(companyTable.getColumn('companyName')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  companyTable.getColumn('companyName')?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {companyTable
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {companyTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {companyTable.getRowModel().rows?.length ? (
                    companyTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={companyMetricsColumns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {companyTable.getFilteredSelectedRowModel().rows.length} of{" "}
                {companyTable.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => companyTable.previousPage()}
                  disabled={!companyTable.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => companyTable.nextPage()}
                  disabled={!companyTable.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 