"use client"

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useSettingsData } from './settings-data-provider'

import { Network, Plus, Edit, Trash2, Users, Building2, GripVertical, RefreshCw } from 'lucide-react'

interface Department {
  id: string
  name: string
  description?: string
  parentId?: string
  managerId?: string
  companyId: string
  children?: Department[]
  level: number
}

interface Company {
  id: string
  name: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

export function DepartmentHierarchy() {
  const { toast } = useToast()
  const { departments: sharedDepartments, companies: sharedCompanies, users: sharedUsers, refreshData } = useSettingsData()
  const [departments, setDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    managerId: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const [departmentsResponse, companiesResponse, usersResponse] = await Promise.all([
        fetch('/api/departments/all', { 
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        }),
        fetch('/api/companies/all', { 
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        }),
        fetch('/api/users/all', { 
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        }),
      ])

      if (!departmentsResponse.ok || !companiesResponse.ok || !usersResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [departmentsData, companiesData, usersData] = await Promise.all([
        departmentsResponse.json(),
        companiesResponse.json(),
        usersResponse.json(),
      ])

      console.log('API Response Data:', {
        departments: departmentsData,
        companies: companiesData,
        users: usersData
      });

      // Handle new API response structure for companies (with pagination)
      const companiesArray = companiesData.companies || companiesData
      const departmentsArray = departmentsData.departments || departmentsData
      const usersArray = usersData.users || usersData
      
      console.log('Processed Arrays:', {
        companies: companiesArray,
        departments: departmentsArray,
        users: usersArray
      });
      
      // Validate that we have arrays
      if (!Array.isArray(companiesArray) || !Array.isArray(departmentsArray) || !Array.isArray(usersArray)) {
        throw new Error('Invalid data format received from API')
      }
      
      setCompanies(companiesArray)
      setUsers(usersArray)
      
      // Build hierarchy with levels
      const departmentsWithLevels = buildHierarchy(departmentsArray)
      console.log('Departments with levels:', departmentsWithLevels);
      setDepartments(departmentsWithLevels)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load department data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const buildHierarchy = (depts: any[], parentId?: string, level: number = 0): Department[] => {
    if (!Array.isArray(depts)) {
      console.warn('buildHierarchy received non-array data:', depts)
      return []
    }
    
    return depts
      .filter(dept => dept && dept.parentId === parentId)
      .map(dept => ({
        ...dept,
        level,
        children: buildHierarchy(depts, dept.id, level + 1)
      }))
  }

  const flattenHierarchy = (depts: Department[]): Department[] => {
    const result: Department[] = []
    const flatten = (items: Department[]) => {
      items.forEach(item => {
        result.push(item)
        if (item.children && item.children.length > 0) {
          flatten(item.children)
        }
      })
    }
    flatten(depts)
    return result
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      // Get flattened departments for easier manipulation
      const flatDepartments = flattenHierarchy(departments)
      const draggedDepartment = flatDepartments.find(dept => dept.id === active.id)
      const targetDepartment = flatDepartments.find(dept => dept.id === over?.id)
      
      if (!draggedDepartment || !targetDepartment) return

      try {
        // Update the parent ID based on drop location
        const newParentId = getNewParentId(flatDepartments, targetDepartment, draggedDepartment)
        
        // Update in database
        const response = await fetch(`/api/departments/${draggedDepartment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parentId: newParentId
          }),
        })

        if (response.ok) {
          // Reload data to reflect changes
          await loadData()
          toast({
            title: "Success",
            description: "Department hierarchy updated successfully",
          })
        }
      } catch (error) {
        console.error('Error updating department hierarchy:', error)
        toast({
          title: "Error",
          description: "Failed to update department hierarchy",
          variant: "destructive",
        })
      }
    }
  }

  const getNewParentId = (flatDepts: Department[], targetDept: Department, draggedDept: Department): string | undefined => {
    // If dropping on the same level, keep the same parent
    if (targetDept.level === draggedDept.level) {
      return targetDept.parentId
    }

    // If dropping on a higher level, make it a child of that department
    if (targetDept.level < draggedDept.level) {
      return targetDept.id
    }

    // If dropping on a lower level, find the appropriate parent
    return targetDept.parentId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Clean up the form data - convert empty strings and undefined to null for optional fields
      const cleanedFormData = {
        name: formData.name,
        description: formData.description || null,
        parentId: formData.parentId === "" || formData.parentId === undefined ? null : formData.parentId,
        managerId: formData.managerId === "" || formData.managerId === undefined ? null : formData.managerId,
      };
      
      if (editingDepartment) {
        const response = await fetch(`/api/departments/${editingDepartment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedFormData),
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update department')
        }
        
        toast({
          title: "Success",
          description: "Department updated successfully",
        })
      } else {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedFormData),
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create department')
        }
        
        toast({
          title: "Success",
          description: "Department created successfully",
        })
      }
      
      setIsDialogOpen(false)
      setEditingDepartment(null)
      resetForm()
      
      // Refresh the data to show the new/updated department
      await loadData()
      
      // Also refresh the shared data context
      if (refreshData) {
        await refreshData()
      }
    } catch (error) {
      console.error('Error saving department:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save department',
        variant: "destructive",
      })
    }
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || '',
      parentId: department.parentId || '',
      managerId: department.managerId || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete department')
      }
      
      toast({
        title: "Success",
        description: "Department deleted successfully",
      })
      await loadData()
    } catch (error) {
      console.error('Error deleting department:', error)
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
      managerId: '',
    })
  }

  const openCreateDialog = () => {
    setEditingDepartment(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const renderDepartmentItem = (department: Department, index: number) => {
    if (!department || !department.id) {
      console.warn('Invalid department data:', department)
      return null
    }

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: department.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      marginLeft: `${department.level * 24}px`,
    };

    const companyName = companies.find(c => c.id === department.companyId)?.name || 'Unknown Company'
    const managerName = department.managerId ? 
      users.find(u => u.id === department.managerId) : null

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 border rounded-lg mb-2 ${
          isDragging ? 'shadow-lg bg-accent' : 'bg-card'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <Network className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium">{department.name || 'Unnamed Department'}</div>
              {department.description && (
                <div className="text-sm text-muted-foreground">{department.description}</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Building2 className="h-3 w-3" />
              <span>{companyName}</span>
            </Badge>
            
            {managerName && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>
                  {managerName.firstName} {managerName.lastName}
                </span>
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(department)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(department.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {department.children && department.children.length > 0 && (
          <div className="mt-3">
            {department.children.map((child, childIndex) => 
              renderDepartmentItem(child, index + childIndex + 1)
            )}
          </div>
        )}
      </div>
    );
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Department Structure</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop departments to reorganize the hierarchy
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadData} 
            variant="outline" 
            className="flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button onClick={openCreateDialog} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Department</span>
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={departments.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[400px]">
            {departments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No departments found</p>
                <p className="text-sm">Create your first department to get started</p>
              </div>
            ) : (
              departments.map((department, index) => {
                try {
                  return renderDepartmentItem(department, index)
                } catch (error) {
                  console.error('Error rendering department item:', error, department)
                  return (
                    <div key={department?.id || index} className="p-4 border rounded-lg mb-2 bg-red-50 border-red-200">
                      <p className="text-red-600">Error rendering department: {department?.name || 'Unknown'}</p>
                    </div>
                  )
                }
              })
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Create/Edit Department Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Edit Department' : 'Create Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment 
                ? 'Update department information and hierarchy'
                : 'Add a new department to the organization'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter department name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter department description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Department</Label>
                <Combobox
                  options={[
                    { value: "", label: "No parent (top level)" },
                    ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                  ]}
                  value={formData.parentId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}
                  placeholder="No parent (top level)"
                  searchPlaceholder="Search departments..."
                  emptyMessage="No departments found"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager">Department Manager</Label>
                <Combobox
                  options={[
                    { value: "", label: "Select manager (optional)" },
                    ...users.map(user => ({ 
                      value: user.id, 
                      label: `${user.firstName} ${user.lastName} (${user.email})` 
                    }))
                  ]}
                  value={formData.managerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}
                  placeholder="Select manager (optional)"
                  searchPlaceholder="Search users..."
                  emptyMessage="No users found"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingDepartment ? 'Update' : 'Create'} Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 