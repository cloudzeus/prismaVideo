"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface CreateCompanyButtonProps {
  onClick: () => void
}

export function CreateCompanyButton({ onClick }: CreateCompanyButtonProps) {
  return (
    <Button onClick={onClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add Company
    </Button>
  )
} 