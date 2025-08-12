import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail, generateMeetingInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const body = await request.json()
    
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      agenda,
      participantEmails
    } = body

    if (!title || !startTime || !endTime || !participantEmails || participantEmails.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['title', 'startTime', 'endTime', 'participantEmails']
      }, { status: 400 })
    }

    // Compose and send meeting invitations using real SMTP
    const meeting = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      password: undefined,
    }
    const host = { firstName: user.firstName, lastName: user.lastName }
    const invitationLink = `${process.env.NEXTAUTH_URL}`
    const { subject, html, text } = generateMeetingInvitationEmail(meeting as any, host as any, [], invitationLink)

    const results = await Promise.allSettled(
      participantEmails.map((to: string) => sendEmail(to, subject, html, text))
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (failed > 0 && succeeded === 0) {
      return NextResponse.json({
        error: 'Failed to send meeting invitations',
        details: 'All deliveries failed',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Meeting invitations sent: ${succeeded} succeeded, ${failed} failed`,
      details: {
        recipients: participantEmails.length,
        emails: participantEmails,
        succeeded,
        failed,
      }
    })

  } catch (error) {
    console.error('Error sending meeting invitations:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 