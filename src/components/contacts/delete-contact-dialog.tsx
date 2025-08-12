'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Contact, Company } from '@prisma/client'

type ContactWithCompanies = Contact & {
  companies: {
    company: Company
  }[]
}

interface DeleteContactDialogProps {
  contact: ContactWithCompanies
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteContactDialog({ 
  contact, 
  open, 
  onOpenChange 
}: DeleteContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete contact. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Contact</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              {contact.firstName} {contact.lastName}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="text-sm text-muted-foreground">
            <p>This will permanently remove the contact and all associated data.</p>
            {contact.companies.length > 0 && (
              <p className="mt-2">
                The contact will also be removed from {contact.companies.length} company association(s).
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 