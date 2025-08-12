"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Building2, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useSettingsData } from './settings-data-provider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Company {
  id: string
  name: string
  default: boolean
  type: string
  city?: string
  country?: string
  AFM?: string
  EMAILACC?: string
  phone?: string
  PHONE01?: string
  PHONE02?: string
}

export function CompanySettings() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { 
    companies, 
    isLoading, 
    companiesPagination,
    companiesSearch,
    companiesPage,
    setCompaniesSearch,
    setCompaniesPage,
    refreshCompanies 
  } = useSettingsData()
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [defaultCompany, setDefaultCompany] = useState<Company | null>(null)
  const [isLoadingDefault, setIsLoadingDefault] = useState(true)

  // Fetch default company
  const fetchDefaultCompany = async () => {
    try {
      setIsLoadingDefault(true)
      const response = await fetch('/api/settings/default-company', {
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDefaultCompany(data.defaultCompany)
        
        // Set selected company to current default
        if (data.defaultCompany) {
          setSelectedCompany(data.defaultCompany.id)
        }
      }
    } catch (error) {
      console.error('Error fetching default company:', error)
    } finally {
      setIsLoadingDefault(false)
    }
  }

  useEffect(() => {
    fetchDefaultCompany()
  }, [])

  useEffect(() => {
    // Set selected company when companies data is available
    if (companies.length > 0) {
      const defaultCompanyFromList = companies.find(company => company.default)
      if (defaultCompanyFromList) {
        setSelectedCompany(defaultCompanyFromList.id)
        // Also update our local default company state
        setDefaultCompany(defaultCompanyFromList)
      }
    }
  }, [companies])

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== companiesSearch) {
        setCompaniesSearch(searchValue)
        setCompaniesPage(1) // Reset to first page when searching
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, companiesSearch, setCompaniesSearch, setCompaniesPage])

  // Refresh companies when page or search changes
  useEffect(() => {
    refreshCompanies()
  }, [companiesPage, companiesSearch, refreshCompanies])

  const handleSetDefaultCompany = async () => {
    if (!selectedCompany) return

      // If changing from current default, show confirmation dialog
  if (defaultCompany && selectedCompany !== defaultCompany.id) {
    setShowConfirmDialog(true)
    return
  }

    // If setting initial default or same company, proceed directly
    await updateDefaultCompany()
  }

  const updateDefaultCompany = async () => {
    try {
      setIsUpdating(true)
      
      // Show progress toast
      toast({
        title: "Updating Company",
        description: "Changing default company and migrating data... This may take a few moments.",
      })
      
      // Update the default company in the database
      const response = await fetch('/api/settings/default-company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId: selectedCompany }),
      })

      if (!response.ok) {
        throw new Error('Failed to update default company')
      }

      const result = await response.json()
      
      // Refresh shared data to get updated company information
      await refreshCompanies()
      
      // Refresh the default company
      await fetchDefaultCompany()

      // Show success message
      toast({
        title: "Success",
        description: "Default company updated successfully! All data has been migrated.",
      })

      // Close confirmation dialog if it was open
      setShowConfirmDialog(false)
      
    } catch (error) {
      console.error('Error updating default company:', error)
      toast({
        title: "Error",
        description: "Failed to update default company",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCompaniesPage(newPage)
  }



  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Default Company */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Current Default Company</span>
          </CardTitle>
          <CardDescription>
            This company will be used as the default for new users and meetings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {defaultCompany ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">{defaultCompany.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {defaultCompany.type} • {defaultCompany.city}, {defaultCompany.country}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">Default</Badge>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">No default company set</div>
                <div className="text-sm text-yellow-700">
                  Please select a default company below
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company List with Search and Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>
            Overview of all companies in the system. Use the search box to filter results (minimum 4 characters).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, type, city, country, AFM, email, or phone (min 4 characters)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Companies Table */}
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  company.default ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedCompany === company.id}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCompany(company.id)
                      }
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center space-x-4">
                        <span>{company.type} • {company.city}, {company.country}</span>
                        {company.AFM && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            AFM: {company.AFM}
                          </span>
                        )}
                      </div>
                      {(company.EMAILACC || company.phone || company.PHONE01 || company.PHONE02) && (
                        <div className="flex items-center space-x-4 text-xs">
                          {company.EMAILACC && (
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {company.EMAILACC}
                            </span>
                          )}
                          {(company.phone || company.PHONE01 || company.PHONE02) && (
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {company.phone || company.PHONE01 || company.PHONE02}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {company.default && (
                    <Badge variant="default">Default</Badge>
                  )}
                  <Badge variant="outline">{company.type}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {companiesPagination && companiesPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((companiesPagination.page - 1) * companiesPagination.pageSize) + 1} to{' '}
                {Math.min(companiesPagination.page * companiesPagination.pageSize, companiesPagination.totalCount)} of{' '}
                {companiesPagination.totalCount} companies
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(companiesPagination.page - 1)}
                  disabled={!companiesPagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {companiesPagination.page} of {companiesPagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(companiesPagination.page + 1)}
                  disabled={!companiesPagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Set Default Button */}
          {selectedCompany && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handleSetDefaultCompany}
                disabled={isUpdating}
                className="w-full"
                variant={selectedCompany && defaultCompany && selectedCompany !== defaultCompany.id ? "destructive" : "default"}
              >
                {isUpdating ? 'Updating...' : (
                  selectedCompany && defaultCompany && selectedCompany !== defaultCompany.id 
                    ? 'Change Default Company (Move All Data)' 
                    : 'Set as Default Company'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Company Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the default company from <strong>{defaultCompany?.name}</strong> to <strong>{companies.find(c => c.id === selectedCompany)?.name}</strong>.
              <br /><br />
              This will move ALL data to the new company:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>All users (managers, employees, administrators)</li>
                <li>All departments and their hierarchy</li>
                <li>All calls and recordings</li>
                <li>All contacts and meetings</li>
                <li>All other company-related data</li>
              </ul>
              <br />
              <strong className="text-red-600">This action cannot be undone!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={updateDefaultCompany}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Move All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 