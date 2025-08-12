import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMeetingInvitationEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const { id } = await params
    const body = await request.json()
    
    const { participantEmails, message } = body

    if (!participantEmails || participantEmails.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['participantEmails']
      }, { status: 400 })
    }

    // Get the meeting
    const meeting = await prisma.call.findUnique({
      where: { id },
      include: {
        company: true,
        createdBy: true,
        participants: {
          include: {
            user: true,
            contact: true
          }
        }
      }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Check if user can send invitations (creator or admin)
    if (meeting.createdById !== user.id && user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate unique access token if not exists
    if (!meeting.accessToken) {
      const accessToken = generateUniqueToken()
      await prisma.call.update({
        where: { id },
        data: { accessToken }
      })
      meeting.accessToken = accessToken
    }

    // Send invitations to each participant
    const results = []
    
    for (const email of participantEmails) {
      try {
        // Check if contact exists, create if not
        let contact = await prisma.contact.findFirst({
          where: { email }
        })

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              firstName: email.split('@')[0], // Use email prefix as first name
              lastName: '',
              email,
              companies: {
                create: {
                  companyId: meeting.companyId
                }
              }
            }
          })
        }

        // Add participant to meeting if not already added
        const existingParticipant = await prisma.participant.findFirst({
          where: {
            callId: id,
            contactId: contact.id
          }
        })

        if (!existingParticipant) {
          await prisma.participant.create({
            data: {
              callId: id,
              contactId: contact.id,
              role: 'participant'
            }
          })
        }

        // Send invitation email
        const invitationLink = `${process.env.NEXTAUTH_URL}/meetings/${id}/join/${meeting.accessToken}`
        
        await sendMeetingInvitationEmail({
          to: email,
          meeting,
          host: meeting.createdBy,
          invitationLink,
          message: message || ''
        })

        results.push({
          email,
          success: true,
          message: 'Invitation sent successfully'
        })

      } catch (error) {
        console.error(`Error sending invitation to ${email}:`, error)
        results.push({
          email,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Invitations sent: ${successCount} successful, ${failureCount} failed`,
      results,
      invitationLink: `${process.env.NEXTAUTH_URL}/meetings/${id}/join/${meeting.accessToken}`
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

function generateUniqueToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
