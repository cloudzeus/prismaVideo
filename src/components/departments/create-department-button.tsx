'use client';

import { useState } from 'react';
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

  const handleDepartmentCreated = async () => {
    setIsOpen(false);
    // Optionally refresh the page or update the departments list
    window.location.reload();
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
        />
      </DialogContent>
    </Dialog>
  );
} 