import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { getContacts } from '@/lib/data/contacts';

import { Navigation } from '@/components/layout/navigation';
import { ContactsTable } from '@/components/contacts/contacts-table';
import { CreateContactButton } from '@/components/contacts/create-contact-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Contacts | Video Prisma',
  description: 'Manage your contacts and their company associations',
}

function ContactsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}

export default async function ContactsPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user

  const contacts = await getContacts()

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container-responsive py-6 pt-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
              <p className="text-muted-foreground">
                Manage your contacts and their company associations
              </p>
            </div>
            <CreateContactButton />
          </div>
          
          <Suspense fallback={<ContactsTableSkeleton />}>
            <ContactsTable contacts={contacts} />
          </Suspense>
        </div>
      </main>
    </div>
  )
} 