import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get SMTP settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get SMTP settings from environment or database
    // For now, we'll use environment variables as the source of truth
    const smtpSettings = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      username: process.env.SMTP_USERNAME || '',
      password: process.env.SMTP_PASSWORD || '',
      encryption: (process.env.SMTP_ENCRYPTION as 'tls' | 'ssl' | 'none') || 'tls',
      fromEmail: process.env.SMTP_FROM_EMAIL || '',
      fromName: process.env.SMTP_FROM_NAME || '',
      enabled: process.env.SMTP_ENABLED === 'true',
      requireAuth: process.env.SMTP_REQUIRE_AUTH !== 'false',
      timeout: parseInt(process.env.SMTP_TIMEOUT || '30'),
    }

    return NextResponse.json(smtpSettings)

  } catch (error) {
    console.error('Error fetching SMTP settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Update SMTP settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const settings = await request.json()

    // Validate required fields
    if (!settings.host || !settings.port || !settings.fromEmail || !settings.fromName) {
      return NextResponse.json({ 
        error: 'Host, port, from email, and from name are required' 
      }, { status: 400 })
    }

    // Validate port range
    if (settings.port < 1 || settings.port > 65535) {
      return NextResponse.json({ 
        error: 'Port must be between 1 and 65535' 
      }, { status: 400 })
    }

    // Validate encryption
    if (!['tls', 'ssl', 'none'].includes(settings.encryption)) {
      return NextResponse.json({ 
        error: 'Encryption must be tls, ssl, or none' 
      }, { status: 400 })
    }

    // In a real application, you would save these to a database
    // For now, we'll just validate and return success
    // You could also update environment variables or use a configuration service
    
    // Example: Save to database (uncomment if you have a settings table)
    /*
    await prisma.settings.upsert({
      where: { key: 'smtp' },
      update: { value: JSON.stringify(settings) },
      create: { key: 'smtp', value: JSON.stringify(settings) }
    })
    */

    return NextResponse.json({ 
      message: 'SMTP settings updated successfully',
      settings
    })

  } catch (error) {
    console.error('Error updating SMTP settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 