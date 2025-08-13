'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Network, Mail, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySettings } from './company-settings';
import { DepartmentHierarchy } from './department-hierarchy';
import { SmtpSettings } from './smtp-settings';

export function SettingsContent() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('company');
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a tab query parameter
    const tabParam = searchParams.get('tab');
    if (tabParam && ['company', 'departments', 'smtp'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Simulate page loading completion
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchParams]);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="text-lg font-medium">Loading Settings...</div>
          <div className="text-sm text-muted-foreground">Please wait while we prepare your settings</div>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="company" className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span>Company</span>
        </TabsTrigger>
        <TabsTrigger value="departments" className="flex items-center space-x-2">
          <Network className="h-4 w-4" />
          <span>Departments</span>
        </TabsTrigger>
        <TabsTrigger value="smtp" className="flex items-center space-x-2">
          <Mail className="h-4 w-4" />
          <span>SMTP</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>
              Set default company and manage company-wide preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanySettings />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="departments" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Hierarchy</CardTitle>
            <CardDescription>
              Manage department structure with drag and drop functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentHierarchy />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="smtp" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
            <CardDescription>
              Configure email server settings for notifications and communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SmtpSettings />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 