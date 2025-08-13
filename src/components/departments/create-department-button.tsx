'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DepartmentForm } from '@/components/forms/department-form';
import { Plus, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: string;
}

interface Department {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDepartmentButtonProps {
  user: User;
  departments: Department[];
  users: User[];
}

export function CreateDepartmentButton({ user, departments, users }: CreateDepartmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDepartmentCreated = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Clean up the form data - convert empty strings and undefined to null for optional fields
      const cleanedData = {
        name: data.name,
        description: data.description || null,
        parentId: data.parentId === "" || data.parentId === undefined ? null : data.parentId,
        managerId: data.managerId === "" || data.managerId === undefined ? null : data.managerId,
      };
      
      // Create the department via API
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create department');
      }

      const newDepartment = await response.json();
      
      toast({
        title: 'Success',
        description: 'Department created successfully',
      });

      // Close the dialog
      setIsOpen(false);
      
      // Refresh the current page to show updated data
      router.refresh();
      
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create department',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <Building className="h-4 w-4" />
          Create Department
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create New Department
          </DialogTitle>
          <DialogDescription>
            Add a new department to your organization with proper hierarchy and management.
          </DialogDescription>
        </DialogHeader>
        
        <DepartmentForm 
          departments={departments}
          users={users}
          onSubmit={handleDepartmentCreated}
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
} 