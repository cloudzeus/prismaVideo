import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
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

    // Create transporter configuration
    const transporterConfig: any = {
      host: settings.host,
      port: settings.port,
      secure: settings.encryption === 'ssl',
      auth: settings.requireAuth ? {
        user: settings.username,
        pass: settings.password,
      } : undefined,
      tls: {
        rejectUnauthorized: false, // For testing purposes
      },
      connectionTimeout: settings.timeout * 1000,
      greetingTimeout: settings.timeout * 1000,
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig)

    // Test connection
    await transporter.verify()

    // Send test email
    const testEmail = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: session.user.email, // Send to the current user's email
      subject: 'SMTP Test Email - Video Conference Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0;">Configuration Details:</h3>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li><strong>Host:</strong> ${settings.host}</li>
              <li><strong>Port:</strong> ${settings.port}</li>
              <li><strong>Encryption:</strong> ${settings.encryption.toUpperCase()}</li>
              <li><strong>Authentication:</strong> ${settings.requireAuth ? 'Required' : 'Not Required'}</li>
              <li><strong>From Email:</strong> ${settings.fromEmail}</li>
              <li><strong>From Name:</strong> ${settings.fromName}</li>
            </ul>
          </div>
          <p>If you received this email, your SMTP configuration is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated test email from the Video Conference Manager settings page.
          </p>
        </div>
      `,
      text: `
SMTP Configuration Test

This is a test email to verify your SMTP configuration is working correctly.

Configuration Details:
- Host: ${settings.host}
- Port: ${settings.port}
- Encryption: ${settings.encryption.toUpperCase()}
- Authentication: ${settings.requireAuth ? 'Required' : 'Not Required'}
- From Email: ${settings.fromEmail}
- From Name: ${settings.fromName}

If you received this email, your SMTP configuration is working correctly!

---
This is an automated test email from the Video Conference Manager settings page.
      `,
    }

    // Send the email
    await transporter.sendMail(testEmail)

    return NextResponse.json({ 
      message: 'Test email sent successfully',
      details: {
        host: settings.host,
        port: settings.port,
        encryption: settings.encryption,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        sentTo: session.user.email,
      }
    })

  } catch (error) {
    console.error('Error testing SMTP:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send test email'
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused. Please check the host and port.'
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Connection timed out. Please check your network and try again.'
      } else if (error.message.includes('EAUTH')) {
        errorMessage = 'Authentication failed. Please check your username and password.'
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Host not found. Please check the SMTP host address.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 })
  }
} 