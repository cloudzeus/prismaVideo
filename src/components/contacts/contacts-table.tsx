'use client'

import { useState } from 'react'
import { Contact, Company } from '@prisma/client'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Building2, User } from 'lucide-react'
import { EditContactModal } from './edit-contact-modal'
import { DeleteContactDialog } from './delete-contact-dialog'

type ContactWithCompanies = Contact & {
  companies: {
    company: Company
  }[]
}

interface ContactsTableProps {
  contacts?: ContactWithCompanies[]
}

export function ContactsTable({ contacts = [] }: ContactsTableProps) {
  const [editingContact, setEditingContact] = useState<ContactWithCompanies | null>(null)
  const [deletingContact, setDeletingContact] = useState<ContactWithCompanies | null>(null)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    return phone
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Title & Profession</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Companies</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No contacts found. Create your first contact to get started.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatarUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {contact.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.title && (
                        <div className="font-medium">{contact.title}</div>
                      )}
                      {contact.profession && (
                        <div className="text-sm text-muted-foreground">
                          {contact.profession}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="text-sm">
                          <span className="font-medium">Email:</span> {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="text-sm">
                          <span className="font-medium">Phone:</span> {formatPhone(contact.phone)}
                        </div>
                      )}
                      {contact.mobile && (
                        <div className="text-sm">
                          <span className="font-medium">Mobile:</span> {formatPhone(contact.mobile)}
                        </div>
                      )}
                      {contact.workPhone && (
                        <div className="text-sm">
                          <span className="font-medium">Work:</span> {formatPhone(contact.workPhone)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.address && (
                        <div className="text-sm">{contact.address}</div>
                      )}
                      <div className="text-sm">
                        {contact.city && contact.city}
                        {contact.city && contact.zip && ', '}
                        {contact.zip && contact.zip}
                      </div>
                      {contact.country && (
                        <div className="text-sm text-muted-foreground">
                          {contact.country}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {contact.companies.length === 0 ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Individual
                        </Badge>
                      ) : (
                        contact.companies.map(({ company }) => (
                          <Badge key={company.id} variant="outline" className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {company.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingContact(contact)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingContact && (
                    <EditContactModal
              contact={editingContact}
              open={!!editingContact}
              onOpenChange={(open) => !open && setEditingContact(null)}
            />
      )}

      {deletingContact && (
        <DeleteContactDialog
          contact={deletingContact}
          open={!!deletingContact}
          onOpenChange={(open) => !open && setDeletingContact(null)}
        />
      )}
    </>
  )
} 