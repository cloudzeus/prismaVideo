'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testGetContacts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/contacts')
      console.log('GET Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('GET Error response:', error)
        setError(error.error || 'Unknown error')
      } else {
        const data = await response.json()
        console.log('GET Success response:', data)
        setContacts(data)
      }
    } catch (error) {
      console.error('GET Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testCreateContact = async () => {
    setLoading(true)
    setError(null)
    try {
      const testData = {
        firstName: 'Test',
        lastName: 'Contact',
        title: 'Test Title',
        profession: 'Test Profession',
        email: 'test@example.com',
        phone: '+1-555-0000'
      }

      console.log('Testing with data:', testData)

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Error response:', error)
        setError(error.error || 'Unknown error')
      } else {
        const data = await response.json()
        console.log('Success response:', data)
        // Refresh contacts list
        testGetContacts()
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Contacts Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={testGetContacts} disabled={loading}>
          {loading ? 'Testing...' : 'Test Get Contacts'}
        </Button>
        
        <Button onClick={testCreateContact} disabled={loading}>
          {loading ? 'Testing...' : 'Test Create Contact'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contacts ({contacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="p-3 border rounded">
                  <div className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {contact.title} • {contact.profession}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {contact.email} • {contact.phone}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Companies: {contact.companies?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {contacts.length === 0 && !loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>No Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Click "Test Get Contacts" to fetch contacts from the database.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
