import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

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

    // Send test email using real SMTP transporter
    const html = `
      <h2>SMTP Test</h2>
      <p>This is a test email to verify SMTP delivery.</p>
      <p><strong>Triggered by:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    `
    const text = `SMTP Test\n\nTriggered by: ${user.firstName} ${user.lastName} (${user.email})\nTime: ${new Date().toLocaleString()}`

    const result = await sendEmail(testEmail, 'SMTP Test Email - Video Conference Manager', html, text)

    return NextResponse.json({
      success: true,
      message: 'SMTP test email sent',
      details: {
        messageId: result.messageId,
        recipient: testEmail,
      }
    })

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