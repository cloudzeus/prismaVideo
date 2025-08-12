"use client"

import { useState } from 'react'
import { CompanyForm } from '@/components/forms/company-form'

export default function TestVatLookupPage() {
  const [testData, setTestData] = useState<any>(null)

  const handleSubmit = async (data: any) => {
    console.log('Form submitted with data:', data)
    setTestData(data)
  }

  const handleCancel = () => {
    console.log('Form cancelled')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">VAT Lookup Test Page</h1>
            <p className="text-muted-foreground">
              This page demonstrates the VAT lookup functionality. Enter a VAT number and click the search icon to retrieve company details from the Greek government.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <CompanyForm 
              onSubmit={handleSubmit} 
              onCancel={handleCancel}
            />
          </div>

          {testData && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Submitted Data:</h2>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 