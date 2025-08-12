'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { CreateContactModal } from './create-contact-modal'
export function CreateContactButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Add Contact
      </Button>
      
      <CreateContactModal
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
} 