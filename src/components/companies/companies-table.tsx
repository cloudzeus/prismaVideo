/* eslint-disable */
/* eslint-disable indent */
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { CompanyForm } from '@/components/forms/company-form';
import { CreateContactModal } from '@/components/contacts/create-contact-modal';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { 
  Edit, 
  Trash2, 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  Globe,
  MapPin,
  Search,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserPlus,
  AlertCircle
} from 'lucide-react';

interface Company {
  id: string
  COMPANY: string
  LOCKID?: string
  SODTYPE?: string
  name: string
  type: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  // Additional ERP fields
  TRDR?: string
  CODE?: string
  AFM?: string
  IRSDATA?: string
  ZIP?: string
  PHONE01?: string
  PHONE02?: string
  JOBTYPE?: string
  EMAILACC?: string
  INSDATE?: string
  UPDDATE?: string
  default?: boolean
}

type SortField = 'name' | 'AFM' | 'type' | 'address' | 'city' | 'country' | 'IRSDATA' | 'EMAILACC' | 'PHONE01' | 'none'
type SortDirection = 'asc' | 'desc'

interface CompaniesTableProps {
  companies: Company[]
  isAdmin: boolean
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  searchParams?: {
    page?: string
    limit?: string
    search?: string
    type?: string
    sortField?: string
    sortDirection?: string
  }
}

export function CompaniesTable({ companies, isAdmin, pagination, searchParams }: CompaniesTableProps) {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams?.search || '')
  const [selectedType, setSelectedType] = useState<string>(searchParams?.type || 'all')
  const [sortField, setSortField] = useState<SortField>(
    (searchParams?.sortField as SortField) || 'none'
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (searchParams?.sortDirection as SortDirection) || 'asc'
  )
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()
  const isMounted = useRef(true)

  // Debounced search effect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    try {
      // Only trigger search if the search term is different from what's in the URL
      const currentSearchParam = searchParams?.search || '';
      
      console.log('Search effect triggered:', { 
        searchTerm, 
        currentSearchParam, 
        searchTermLength: searchTerm?.length,
        isDifferent: searchTerm !== currentSearchParam 
      });
      
      // Don't search if the terms are the same
      if (searchTerm === currentSearchParam) {
        console.log('Search terms are the same, skipping search');
        return;
      }
      
      // Clear any existing timer
      if (timer) {
        clearTimeout(timer);
      }
      
      // Set searching state immediately
      setIsSearching(true);
      
      // Create a new timer for the search
      timer = setTimeout(() => {
        if (isMounted.current) {
          try {
            console.log('Executing search navigation for:', searchTerm);
            const params = new URLSearchParams(window.location.search);
            
            if (searchTerm && searchTerm.length >= 3) {
              params.set('search', searchTerm);
              console.log('Setting search param:', searchTerm);
            } else {
              params.delete('search');
              console.log('Clearing search param');
            }
            
            params.set('page', '1');
            const newUrl = `?${params.toString()}`;
            console.log('Navigating to:', newUrl);
            router.push(newUrl);
          } catch (navigationError) {
            console.error('Error during search navigation:', navigationError);
            toast({
              title: "Search Error",
              description: "Failed to update search results",
              variant: "destructive",
            });
          } finally {
            setIsSearching(false);
          }
        }
      }, 300); // Reduced delay to 300ms for better responsiveness
    } catch (error) {
      console.error('Error in search effect:', error);
      setIsSearching(false);
      toast({
        title: "Search Error",
        description: "An unexpected error occurred during search",
        variant: "destructive",
      });
    }

    // Return cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [searchTerm, searchParams?.search]); // Removed router and toast from dependencies

  // Effect to sync searchTerm with URL params when they change
  useEffect(() => {
    const currentSearchParam = searchParams?.search || '';
    if (searchTerm !== currentSearchParam) {
      console.log('Syncing searchTerm with URL params:', { searchTerm, currentSearchParam });
      setSearchTerm(currentSearchParam);
    }
  }, [searchParams?.search, searchTerm]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const { page: currentPage, limit: RECORDS_PER_PAGE, total, totalPages } = pagination || {
    page: 1,
    limit: 200,
    total: 0,
    totalPages: 1
  }

  // Filter companies based on search term and type (client-side filtering for immediate feedback)
  const filteredCompanies = useMemo(() => {
    try {
      let filtered = companies.filter(company => {
        // Type filter
        if (selectedType !== 'all' && company.type !== selectedType) {
          return false
        }

        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            company.name?.toLowerCase().includes(searchLower) ||
            company.AFM?.toLowerCase().includes(searchLower) ||
            company.email?.toLowerCase().includes(searchLower) ||
            company.EMAILACC?.toLowerCase().includes(searchLower) ||
            company.phone?.toLowerCase().includes(searchLower) ||
            company.PHONE01?.toLowerCase().includes(searchLower) ||
            company.PHONE02?.toLowerCase().includes(searchLower) ||
            company.COMPANY?.toLowerCase().includes(searchLower) ||
            company.TRDR?.toLowerCase().includes(searchLower) ||
            company.CODE?.toLowerCase().includes(searchLower) ||
            company.address?.toLowerCase().includes(searchLower) ||
            company.city?.toLowerCase().includes(searchLower)
          )
        }

        return true
      })

      // Sort companies: those with emails first, then by selected sort field
      filtered.sort((a, b) => {
        // First priority: companies with emails come first
        const aHasEmail = !!(a.email || a.EMAILACC)
        const bHasEmail = !!(b.email || b.EMAILACC)
        
        if (aHasEmail && !bHasEmail) return -1
        if (!aHasEmail && bHasEmail) return 1
        
        // Second priority: sort by selected field
        if (sortField !== 'none') {
          let aValue = a[sortField as keyof Company]
          let bValue = b[sortField as keyof Company]
          
          // Handle undefined values
          if (aValue === undefined || aValue === null) aValue = ''
          if (bValue === undefined || bValue === null) bValue = ''
          
          if (sortDirection === 'asc') {
            return String(aValue).localeCompare(String(bValue))
          } else {
            return String(bValue).localeCompare(String(aValue))
          }
        }
        
        // If no sort field specified, maintain email priority order
        return 0
      })

      return filtered
    } catch (error) {
      console.error('Error filtering companies:', error);
      toast({
        title: "Filter Error",
        description: "Failed to filter companies",
        variant: "destructive",
      });
      return companies; // Fallback to unfiltered list
    }
  }, [companies, searchTerm, selectedType, sortField, sortDirection, toast])

  // Use server-side pagination values
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE
  const endIndex = startIndex + companies.length
  const paginatedCompanies = companies

  // Reset to first page when filters change (will trigger server-side refresh)
  React.useEffect(() => {
    // This will be handled by server-side navigation
  }, [searchTerm, selectedType, sortField, sortDirection]);

  // Clear search and filters
  const clearFilters = () => {
    try {
      setSearchTerm('')
      setSelectedType('all')
      setSortField('none')
      setSortDirection('asc')
      
      // Navigate to base URL without filters
      router.push('/companies')
    } catch (error) {
      console.error('Error clearing filters:', error);
      toast({
        title: "Error",
        description: "Failed to clear filters",
        variant: "destructive",
      });
    }
  }

  // Helper function for navigation
  const navigateToPage = (page: number) => {
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('page', page.toString());
      router.push(`?${params.toString()}`);
    } catch (error) {
      console.error('Error navigating to page:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to the selected page",
        variant: "destructive",
      });
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    try {
      const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
      const params = new URLSearchParams(window.location.search);
      params.set('sortField', field);
      params.set('sortDirection', newDirection);
      params.set('page', '1');
      router.push(`?${params.toString()}`);
    } catch (error) {
      console.error('Error handling sort:', error);
      toast({
        title: "Sort Error",
        description: "Failed to sort the companies",
        variant: "destructive",
      });
    }
  }

  // Get sort icon for a column
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  // Highlight search term in text
  const highlightText = (text: string, searchTerm: string | undefined | null) => {
    if (!text || !searchTerm || searchTerm.length < 3) return text;
    
    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded font-semibold">
            {part}
          </mark>
        ) : part
      );
    } catch (error) {
      console.error('Error highlighting text:', error);
      return text; // Fallback to original text if regex fails
    }
  }

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleEdit = (company: Company) => {
    setSelectedCompany(company)
    setIsEditModalOpen(true)
  }

  const handleDelete = (company: Company) => {
    setSelectedCompany(company)
    setIsDeleteModalOpen(true)
  }

  const handleAddContact = (company: Company) => {
    try {
      // Set the selected company and open the contact creation modal
      setSelectedCompany(company)
      setIsContactModalOpen(true)
    } catch (error) {
      console.error('Error opening contact modal:', error)
      toast({
        title: "Error",
        description: "Failed to open contact creation modal",
        variant: "destructive",
      })
    }
  }

  const handleCreateSubmit = async (data: any) => {
    try {
      console.log('Creating company with data:', data)
      
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('Create response status:', response.status)
      console.log('Create response headers:', response.headers)

      if (!response.ok) {
        let errorMessage = 'Failed to create company'
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          // Use status text if we can't parse the response
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Create success result:', result)

      toast({
        title: "Success",
        description: "Company created successfully",
      })
      setIsCreateModalOpen(false)
      
      // Refresh the page to show the new company
      window.location.reload()
    } catch (error) {
      console.error('Error creating company:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create company"
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "No company selected for editing",
        variant: "destructive",
      })
      return
    }
    
    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update company'
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Success",
        description: "Company updated successfully",
      })
      setIsEditModalOpen(false)
      setSelectedCompany(null)
      
      // Refresh the page to show the updated company
      window.location.reload()
    } catch (error) {
      console.error('Error updating company:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update company"
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "No company selected for deletion",
        variant: "destructive",
      })
      return
    }
    
    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        let errorMessage = 'Failed to delete company'
        try {
          const error = await response.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Success",
        description: "Company deleted successfully",
      })
      setIsDeleteModalOpen(false)
      setSelectedCompany(null)
      
      // Refresh the page to show the updated list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting company:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete company"
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Main component render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Companies</h2>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <div className="relative">
                <Input
                  placeholder="Search by name, AFM, email, phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    try {
                      const newValue = e.target.value;
                      console.log('Search input changed:', { oldValue: searchTerm, newValue });
                      setSearchTerm(newValue);
                      
                      // Clear search immediately if empty
                      if (!newValue || newValue.length === 0) {
                        console.log('Search input cleared, removing search param');
                        const params = new URLSearchParams(window.location.search);
                        params.delete('search');
                        params.set('page', '1');
                        const newUrl = `?${params.toString()}`;
                        console.log('Navigating to clear search:', newUrl);
                        router.push(newUrl);
                      }
                    } catch (error) {
                      console.error('Error updating search term:', error);
                      toast({
                        title: "Search Error",
                        description: "Failed to update search term",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full sm:w-[200px] md:w-[300px] pr-8"
                />
                {isSearching && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    try {
                      console.log('Clearing search term');
                      setSearchTerm('');
                      const params = new URLSearchParams(window.location.search);
                      params.delete('search');
                      params.set('page', '1');
                      const newUrl = `?${params.toString()}`;
                      console.log('Navigating to clear search:', newUrl);
                      router.push(newUrl);
                    } catch (error) {
                      console.error('Error clearing search:', error);
                      toast({
                        title: "Search Error",
                        description: "Failed to clear search",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Search results indicator */}
            {searchTerm && (
              <div className="text-sm text-gray-600 mt-2">
                {searchTerm.length < 3 ? (
                  <span className="text-orange-600">
                    Type {3 - searchTerm.length} more character{3 - searchTerm.length !== 1 ? 's' : ''} to search...
                  </span>
                ) : (
                  <>
                    <Search className="h-4 w-4 inline mr-1" />
                    Searching for "{searchTerm}"...
                    {isSearching && (
                      <span className="ml-2 text-blue-600">
                        <RefreshCw className="h-3 w-3 inline animate-spin mr-1" />
                        Searching...
                      </span>
                    )}
                    {!isSearching && total > 0 && (
                      <span className="ml-2 text-green-600">
                        ✓ Found {total} matching companies
                      </span>
                    )}
                    {!isSearching && total === 0 && searchTerm.length >= 3 && (
                      <span className="ml-2 text-gray-500">
                        No companies found matching "{searchTerm}"
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedType}
                onChange={(e) => {
                  try {
                    setSelectedType(e.target.value);
                    const params = new URLSearchParams(window.location.search);
                    if (e.target.value === 'all') {
                      params.delete('type');
                    } else {
                      params.set('type', e.target.value);
                    }
                    params.set('page', '1');
                    router.push(`?${params.toString()}`);
                  } catch (error) {
                    console.error('Error updating type filter:', error);
                    toast({
                      title: "Filter Error",
                      description: "Failed to update type filter",
                      variant: "destructive",
                    });
                  }
                }}
                className="border rounded-md p-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="client">Clients</option>
                <option value="supplier">Suppliers</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch('/api/companies/revalidate', { method: 'POST' });
                    router.refresh();
                  } catch (error) {
                    console.error('Failed to revalidate cache:', error);
                    toast({
                      title: "Refresh Error",
                      description: "Failed to refresh data, but attempting to reload",
                      variant: "destructive",
                    });
                    // Still try to refresh the router even if revalidation fails
                    try {
                      router.refresh();
                    } catch (refreshError) {
                      console.error('Failed to refresh router:', refreshError);
                      toast({
                        title: "Critical Error",
                        description: "Failed to refresh the page. Please reload manually.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Results counter */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, total)} of {total} companies
            {totalPages > 1 && (
              <span className="ml-2">(Page {currentPage} of {totalPages})</span>
            )}
            {(searchTerm || selectedType !== 'all' || sortField !== 'none') && (
              <span className="ml-2">
                (filtered by {searchTerm ? `"${searchTerm}"` : ''} {searchTerm && selectedType !== 'all' ? 'and ' : ''}{selectedType !== 'all' ? selectedType : ''} {sortField !== 'none' ? `sorted by ${sortField}` : ''})
              </span>
            )}
            {(searchTerm || selectedType !== 'all' || sortField !== 'none') ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-2 h-6 px-2 text-xs"
              >
                Clear filters
              </Button>
            ) : null}
          </div>

          {/* Error boundary for table rendering */}
          {(() => {
            try {
              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('AFM')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>AFM</span>
                          {getSortIcon('AFM')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone01</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('address')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Location</span>
                          {getSortIcon('address')}
                        </div>
                      </TableHead>
                      {isAdmin && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.AFM || 'N/A'}</div>
                            <div className="text-sm text-gray-500">
                              {company.IRSDATA || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {highlightText(company.name || 'N/A', searchTerm)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.type === 'client' ? 'default' : 'secondary'}>
                            {company.type || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {company.email || company.EMAILACC ? (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {highlightText(company.email || company.EMAILACC || '', searchTerm)}
                              </div>
                            ) : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {company.PHONE01 && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                {highlightText(company.PHONE01, searchTerm)}
                              </div>
                            )}
                            {!company.PHONE01 && 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {company.address && highlightText(company.address, searchTerm)}
                            {company.city && (
                              <>
                                {company.address && ', '}
                                {highlightText(company.city, searchTerm)}
                              </>
                            )}
                            {company.country && (
                              <>
                                {(company.address || company.city) && ', '}
                                {highlightText(company.country, searchTerm)}
                              </>
                            )}
                            {!company.address && !company.city && !company.country && 'N/A'}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAddContact(company)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add Contact</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(company)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(company)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            } catch (tableError) {
              console.error('Error rendering table:', tableError);
              return (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Error Rendering Table</h3>
                    <p className="text-sm text-gray-600">
                      There was an error displaying the companies table.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Reload Page
                  </Button>
                </div>
              );
            }
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {isCreateModalOpen && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>
                Add a new company to the system
              </DialogDescription>
            </DialogHeader>
            <CompanyForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {isEditModalOpen && selectedCompany && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>
                Update company information
              </DialogDescription>
            </DialogHeader>
            <CompanyForm
              company={selectedCompany}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {isDeleteModalOpen && selectedCompany && (
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Company</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedCompany.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Contact Creation Modal */}
      {isContactModalOpen && selectedCompany && (
        <CreateContactModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
          company={selectedCompany}
        />
      )}
    </div>
  );
} 