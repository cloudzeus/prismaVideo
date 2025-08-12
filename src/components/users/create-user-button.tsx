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
import { UserForm } from '@/components/forms/user-form';
import { Plus, User } from 'lucide-react';
import { Department, Company } from '@prisma/client';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: string;
}

interface CreateUserButtonProps {
  user: User;
  departments?: Department[];
}

export function CreateUserButton({ user, departments = [] }: CreateUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleUserCreated = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      // User created successfully
      setIsOpen(false)
      // Refresh the page to show the new user
      window.location.reload()
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  };

  // Create a simple company object from the user's companyId
  const company: Company = {
    id: user.companyId,
    name: 'Current Company',
    type: 'internal',
    COMPANY: 'CURRENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    address: null,
    city: null,
    country: null,
    phone: null,
    email: null,
    website: null,
    logo: null,
    LOCKID: null,
    SODTYPE: null,
    TRDR: null,
    CODE: null,
    AFM: null,
    IRSDATA: null,
    ZIP: null,
    PHONE01: null,
    PHONE02: null,
    JOBTYPE: null,
    EMAILACC: null,
    INSDATE: null,
    UPDDATE: null,
    default: false
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <User className="h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to your organization with appropriate permissions and role.
          </DialogDescription>
        </DialogHeader>
        
        <UserForm 
          initialData={{}}
          onSubmit={handleUserCreated}
          departments={departments}
        />
      </DialogContent>
    </Dialog>
  );
} 