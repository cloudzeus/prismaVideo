import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { simpleEmailService } from '@/lib/simple-email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const isAdmin = user.role === 'Administrator'

    // Only admins can test SMTP
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email is required' }, { status: 400 })
    }

    // Test SMTP connection
    const connectionTest = await simpleEmailService.testConnection()
    
    if (!connectionTest) {
      return NextResponse.json({ 
        error: 'SMTP connection failed',
        details: 'Could not establish connection to SMTP server'
      }, { status: 500 })
    }

    // Send test email
    const emailSent = await simpleEmailService.sendEmail({
      to: testEmail,
      subject: 'SMTP Test Email - Video Conference Manager',
      html: `
        <h2>SMTP Test Successful!</h2>
        <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
        <p><strong>Test sent by:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
        <p><strong>Test time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>If you received this email, your SMTP settings are configured correctly and you can send meeting invitations to participants.</em></p>
      `,
      text: `
SMTP Test Successful!

This is a test email to verify that your SMTP configuration is working correctly.

Test sent by: ${user.firstName} ${user.lastName} (${user.email})
Test time: ${new Date().toLocaleString()}

If you received this email, your SMTP settings are configured correctly and you can send meeting invitations to participants.
      `
    })

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'SMTP test successful',
        details: {
          connection: 'Connected',
          emailSent: 'Yes',
          recipient: testEmail
        }
      })
    } else {
      return NextResponse.json({
        error: 'Failed to send test email',
        details: 'SMTP connection successful but email delivery failed'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('SMTP test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 