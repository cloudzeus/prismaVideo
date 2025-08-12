'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

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

interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface CompaniesResponse {
  companies: Company[]
  pagination: PaginationInfo
}

interface Department {
  id: string
  name: string
  parentId?: string
  companyId: string
  level: number
  children?: Department[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
}

interface SettingsDataContextType {
  companies: Company[]
  departments: Department[]
  users: User[]
  isLoading: boolean
  error: string | null
  companiesPagination: PaginationInfo | null
  companiesSearch: string
  companiesPage: number
  setCompaniesSearch: (search: string) => void
  setCompaniesPage: (page: number) => void
  refreshData: () => Promise<void>
  refreshCompanies: () => Promise<void>
  refreshDepartments: () => Promise<void>
  refreshUsers: () => Promise<void>
}

const SettingsDataContext = createContext<SettingsDataContextType | undefined>(undefined)

export function useSettingsData() {
  const context = useContext(SettingsDataContext)
  if (!context) {
    throw new Error('useSettingsData must be used within a SettingsDataProvider')
  }
  return context
}

export function SettingsDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [companies, setCompanies] = useState<Company[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companiesPagination, setCompaniesPagination] = useState<PaginationInfo | null>(null)
  const [companiesSearch, setCompaniesSearch] = useState('')
  const [companiesPage, setCompaniesPage] = useState(1)

  const loadData = useCallback(async () => {
    if (!session?.user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Load all data concurrently for better performance
      const [companiesResponse, departmentsResponse, usersResponse] = await Promise.all([
        fetch('/api/companies/all', { headers: { 'Cache-Control': 'no-cache' } }),
        fetch('/api/departments/all', { headers: { 'Cache-Control': 'no-cache' } }),
        fetch('/api/users/all', { headers: { 'Cache-Control': 'no-cache' } })
      ]);
      
      // Check all responses
      if (!companiesResponse.ok || !departmentsResponse.ok || !usersResponse.ok) {
        throw new Error('Failed to fetch data')
      }
      
      // Parse all responses
      const [companiesData, departmentsData, usersData] = await Promise.all([
        companiesResponse.json(),
        departmentsResponse.json(),
        usersResponse.json()
      ]);
      
      // Update state with fetched data
      if (companiesData.companies && companiesData.pagination) {
        setCompanies(companiesData.companies);
        setCompaniesPagination(companiesData.pagination);
      } else {
        // Fallback for old API format
        setCompanies(companiesData);
        setCompaniesPagination(null);
      }
      setDepartments(departmentsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading settings data:', error)
      setError('Failed to load settings data')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user])

  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  const refreshCompanies = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: companiesPage.toString(),
        ...(companiesSearch.length >= 4 && { search: companiesSearch })
      })
      
      const response = await fetch(`/api/companies/all?${params}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }
      
      const data: CompaniesResponse = await response.json()
      setCompanies(data.companies)
      setCompaniesPagination(data.pagination)
    } catch (error) {
      console.error('Error refreshing companies:', error)
      setError('Failed to refresh companies')
    }
  }, [companiesPage, companiesSearch])

  const refreshDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments/all', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments')
      }
      
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      console.error('Error refreshing departments:', error)
      setError('Failed to refresh departments')
    }
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users/all', {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error refreshing users:', error)
      setError('Failed to refresh users')
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      loadData()
    }
  }, [session?.user, loadData])

  const contextValue = useMemo(() => ({
    companies,
    departments,
    users,
    isLoading,
    error,
    companiesPagination,
    companiesSearch,
    companiesPage,
    setCompaniesSearch,
    setCompaniesPage,
    refreshData,
    refreshCompanies,
    refreshDepartments,
    refreshUsers
  }), [
    companies,
    departments,
    users,
    isLoading,
    error,
    companiesPagination,
    companiesSearch,
    companiesPage,
    refreshData,
    refreshCompanies,
    refreshDepartments,
    refreshUsers
  ])

  return (
    <SettingsDataContext.Provider value={contextValue}>
      {children}
    </SettingsDataContext.Provider>
  )
} 