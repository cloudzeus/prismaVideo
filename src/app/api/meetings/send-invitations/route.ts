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

    // Send meeting invitation emails
    const emailSent = await simpleEmailService.sendMeetingInvitation({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      agenda,
      hostName: `${user.firstName} ${user.lastName}`,
      hostEmail: user.email,
      participantEmails,
    })

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Meeting invitations sent successfully',
        details: {
          recipients: participantEmails.length,
          emails: participantEmails
        }
      })
    } else {
      return NextResponse.json({
        error: 'Failed to send meeting invitations',
        details: 'Email service returned false'
      }, { status: 500 })
    }

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