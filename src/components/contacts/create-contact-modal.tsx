'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EnhancedMultiSelect } from '@/components/ui/enhanced-multi-select'
import { useToast } from '@/hooks/use-toast'
import { Company } from '@prisma/client'

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  profession: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  workPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  avatarUrl: z.string().optional(),
  companyIds: z.array(z.string()).default([]).optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface CreateContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateContactModal({ 
  open, 
  onOpenChange
}: CreateContactModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      title: '',
      profession: '',
      email: '',
      phone: '',
      mobile: '',
      workPhone: '',
      address: '',
      city: '',
      zip: '',
      country: '',
      avatarUrl: '',
      companyIds: [],
    },
  })

  // Watch the companyIds field for debugging
  const watchedCompanyIds = form.watch('companyIds')
  console.log('Watched companyIds:', watchedCompanyIds)

  const handleCompanySearch = async (query: string) => {
    console.log('🚀 handleCompanySearch called with query:', query)
    console.log('Query length:', query.length, 'minSearchLength: 3')
    
    if (query.length < 3) {
      console.log('❌ Query too short, returning empty array')
      return []
    }
    
    try {
      console.log('Fetching from API:', `/api/companies/search?q=${encodeURIComponent(query)}&limit=20`)
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}&limit=20`)
      
      if (!response.ok) {
        console.error('Search failed with status:', response.status)
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Search response:', data)
      
      const options = data.companies.map((company: any) => ({
        label: company.name,
        value: company.id,
      }))
      
      console.log('Returning options:', options)
      return options
    } catch (error) {
      console.error('Error searching companies:', error)
      return []
    }
  }

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create contact')
      }

      toast({
        title: 'Success',
        description: 'Contact created successfully',
      })

      form.reset()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating contact:', error)
      toast({
        title: 'Error',
        description: 'Failed to create contact. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your system. You can associate them with one or more companies or leave them as an individual contact.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="CEO, Manager, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer, Designer, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 987-6543" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Main Street, Suite 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyIds"
              render={({ field }) => (
                <FormItem>
                                    <FormLabel>Associated Companies</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <EnhancedMultiSelect
                        options={[]}
                        selected={field.value || []}
                        onChange={(selected) => {
                          console.log('CreateContactModal onChange called with:', selected)
                          console.log('Field value before change:', field.value)
                          field.onChange(selected)
                          console.log('Field value after change:', field.value)
                        }}
                        onSearch={handleCompanySearch}
                        placeholder="Select companies (optional)"
                        searchPlaceholder="Search companies (type 3+ characters)..."
                        className="w-full"
                        minSearchLength={3}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('🧪 Test button clicked')
                          handleCompanySearch('AERIO')
                        }}
                        className="w-full"
                      >
                        🧪 Test Search "AERIO"
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground mt-1">
                    Selected: {(field.value || []).length} company{(field.value || []).length !== 1 ? 's' : ''}
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Contact'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 