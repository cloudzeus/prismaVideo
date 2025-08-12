import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meetingId = params.id

    const meeting = await prisma.call.findUnique({
      where: { id: meetingId },
      include: {
        company: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              }
            },
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Check if user has access to this meeting
    if (meeting.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Convert Date objects to ISO strings for the frontend
    const meetingWithStringDates = {
      ...meeting,
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime?.toISOString() || null,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
      participants: meeting.participants.map(participant => ({
        ...participant,
        joinedAt: participant.joinedAt.toISOString(),
        leftAt: participant.leftAt?.toISOString() || null,
      }))
    }

    return NextResponse.json(meetingWithStringDates)
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: meetingId } = await params
    const body = await request.json()

    // Check if meeting exists and user has access
    const existingMeeting = await prisma.call.findUnique({
      where: { id: meetingId },
      select: { companyId: true, createdById: true }
    })

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    if (existingMeeting.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow editing if user is creator or admin
    if (existingMeeting.createdById !== session.user.id && session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the meeting
    const updatedMeeting = await prisma.call.update({
      where: { id: meetingId },
      data: {
        title: body.title,
        description: body.description,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        type: body.type,
        status: body.status,
        location: body.location,
        agenda: body.agenda,
      },
      include: {
        company: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              }
            },
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    })

    // Convert Date objects to ISO strings for the frontend
    const meetingWithStringDates = {
      ...updatedMeeting,
      startTime: updatedMeeting.startTime.toISOString(),
      endTime: updatedMeeting.endTime?.toISOString() || null,
      createdAt: updatedMeeting.createdAt.toISOString(),
      updatedAt: updatedMeeting.updatedAt.toISOString(),
      participants: updatedMeeting.participants.map(participant => ({
        ...participant,
        joinedAt: participant.joinedAt.toISOString(),
        leftAt: participant.leftAt?.toISOString() || null,
      }))
    }

    return NextResponse.json(meetingWithStringDates)
  } catch (error) {
    console.error('Error updating meeting:', error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: meetingId } = await params

    // Check if meeting exists and user has access
    const existingMeeting = await prisma.call.findUnique({
      where: { id: meetingId },
      select: { companyId: true, createdById: true }
    })

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    if (existingMeeting.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow deletion if user is creator or admin
    if (existingMeeting.createdById !== session.user.id && session.user.role !== 'Administrator') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the meeting
    await prisma.call.delete({
      where: { id: meetingId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}
