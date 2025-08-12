'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Building, Users, UserCheck } from 'lucide-react';
import { departmentFormSchema } from "@/lib/validations"

type DepartmentFormData = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  department?: {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    managerId?: string | null;
    isActive: boolean;
  };
  departments: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; email: string; role: string }>;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  isLoading?: boolean;
}

export function DepartmentForm({ department, departments, users, onSubmit, isLoading = false }: DepartmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof departmentFormSchema>>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: department?.name || '',
      description: department?.description || '',
      parentId: department?.parentId || '',
      managerId: department?.managerId || '',
      isActive: department?.isActive !== undefined ? department.isActive : true,
    },
  });

  const handleSubmit = async (data: z.infer<typeof departmentFormSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: 'Success',
        description: department ? 'Department updated successfully' : 'Department created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save department',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Enable or disable this department
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter department description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Department (Optional)</FormLabel>
                <FormControl>
                  <Combobox
                    options={[
                      { value: "", label: "No Parent Department" },
                      ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                    ]}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Select parent department (optional)"
                    searchPlaceholder="Search departments..."
                    emptyMessage="No departments found"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Manager (Optional)</FormLabel>
                <FormControl>
                  <Combobox
                    options={[
                      { value: "", label: "No Manager" },
                      ...users.map(user => ({ 
                        value: user.id, 
                        label: `${user.firstName} ${user.lastName} (${user.email})` 
                      }))
                    ]}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Select department manager (optional)"
                    searchPlaceholder="Search users..."
                    emptyMessage="No users found"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (department ? 'Update Department' : 'Create Department')}
          </Button>
        </div>
      </form>
    </Form>
  );
} 