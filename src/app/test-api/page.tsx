'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCreateCompany = async () => {
    setLoading(true)
    try {
      const testData = {
        COMPANY: 'TEST001',
        name: 'Test Company',
        type: 'client',
        default: false
      }

      console.log('Testing with data:', testData)

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const error = await response.json()
        console.error('Error response:', error)
        setResult({ error: error.error || 'Unknown error', status: response.status })
      } else {
        const data = await response.json()
        console.log('Success response:', data)
        setResult({ success: data, status: response.status })
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testGetCompanies = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/companies')
      console.log('GET Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('GET Error response:', error)
        setResult({ error: error.error || 'Unknown error', status: response.status })
      } else {
        const data = await response.json()
        console.log('GET Success response:', data)
        setResult({ success: data, status: response.status })
      }
    } catch (error) {
      console.error('GET Fetch error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="space-y-4">
        <Button onClick={testCreateCompany} disabled={loading}>
          {loading ? 'Testing...' : 'Test Create Company'}
        </Button>
        
        <Button onClick={testGetCompanies} disabled={loading}>
          {loading ? 'Testing...' : 'Test Get Companies'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 