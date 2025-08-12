'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { Building, Users, UserCheck } from 'lucide-react';

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

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface EditDepartmentModalProps {
  department: Department | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (department: Partial<Department>) => Promise<void>;
  departments: Department[];
  users: User[];
  isLoading?: boolean;
}

export function EditDepartmentModal({
  department,
  isOpen,
  onClose,
  onSave,
  departments,
  users,
  isLoading = false
}: EditDepartmentModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: '',
    parentId: '',
    managerId: '',
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        companyId: department.companyId || '',
        parentId: department.parentId || '',
        managerId: department.managerId || '',
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSave({
        name: formData.name,
        description: formData.description,
        companyId: formData.companyId,
        parentId: formData.parentId || null,
        managerId: formData.managerId || null,
      });

      toast({
        title: "Success",
        description: "Department updated successfully.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update department.",
        variant: "destructive",
      });
    }
  };

  // Filter out current department and its children from parent options
  const availableParentDepartments = departments.filter(d => 
    d.id !== department?.id && 
    !department?.children.some(child => child.id === d.id)
  );

  if (!department) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Edit Department
          </DialogTitle>
          <DialogDescription>
            Update department information and hierarchy
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter department name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter department description"
                rows={3}
              />
            </div>
          </div>

          {/* Company and Hierarchy */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company & Hierarchy
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Department (Optional)</Label>
              <Combobox
                options={[
                  { value: "", label: "No Parent Department" },
                  ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                ]}
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                placeholder="Select parent department (optional)"
                searchPlaceholder="Search departments..."
                emptyMessage="No departments found"
              />
            </div>
          </div>

          {/* Manager */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Department Manager
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager (Optional)</Label>
              <Combobox
                options={[
                  { value: "", label: "No Manager" },
                  ...users.map(user => ({ 
                    value: user.id, 
                    label: `${user.firstName} ${user.lastName} (${user.email})` 
                  }))
                ]}
                value={formData.managerId}
                onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                placeholder="Select department manager (optional)"
                searchPlaceholder="Search users..."
                emptyMessage="No users found"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 