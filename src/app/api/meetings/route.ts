import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { meetingFormSchema } from '@/lib/validations'
import { generateMeetingPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Debug: Log the incoming data
    console.log('🔍 API Debug: Incoming request body:', body);
    console.log('🔍 API Debug: Body type:', typeof body);
    console.log('🔍 API Debug: Body keys:', Object.keys(body));
    console.log('🔍 API Debug: Participants:', body.participants);
    console.log('🔍 API Debug: Start time:', body.startTime);
    console.log('🔍 API Debug: End time:', body.endTime);
    
    // Fix: Convert string dates to Date objects before validation
    const processedBody = {
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime)
    };
    
    console.log('🔍 API Debug: Processed body with Date objects:', {
      startTime: processedBody.startTime,
      endTime: processedBody.endTime,
      startTimeType: typeof processedBody.startTime,
      endTimeType: typeof processedBody.endTime
    });
    
    let validatedData;
    try {
      validatedData = meetingFormSchema.parse(processedBody)
      console.log('✅ API Debug: Validation successful:', validatedData);
    } catch (validationError: any) {
      console.error('❌ API Debug: Validation failed:', validationError);
      console.error('❌ API Debug: Validation issues:', validationError.issues);
      
      // Return detailed validation error
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationError.issues,
        receivedData: body,
        processedData: processedBody
      }, { status: 400 })
    }

    // Separate user and contact participants
    const userParticipants = []
    const contactParticipants = []

    // Check if each participant is a user or contact
    for (const participantId of validatedData.participants) {
      // Check if it's a user
      const user = await prisma.user.findUnique({
        where: { id: participantId },
        select: { id: true }
      })
      
      if (user) {
        userParticipants.push({
          userId: participantId,
          role: 'Participant'
        })
      } else {
        // Check if it's a contact
        const contact = await prisma.contact.findUnique({
          where: { id: participantId },
          select: { id: true }
        })
        
        if (contact) {
          contactParticipants.push({
            contactId: participantId,
            role: 'Participant'
          })
        }
      }
    }

    // Create meeting
    const meeting = await prisma.call.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        type: validatedData.type,
        status: validatedData.status,
        password: generateMeetingPassword(),
        companyId: session.user.companyId,
        createdById: session.user.id,
        participants: {
          create: [...userParticipants, ...contactParticipants]
        }
      },
      include: {
        company: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        participants: {
          include: {
            user: true,
            contact: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, meeting }, { status: 201 })
  } catch (error) {
    console.error('Error creating meeting:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const userId = searchParams.get('userId')
    const isAdmin = session.user.role === 'Administrator'

    if (!companyId || companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
    }

    const where: any = { companyId }
    
    if (!isAdmin && userId) {
      where.OR = [
        { createdById: userId },
        { participants: { some: { userId } } },
      ]
    }

    const meetings = await prisma.call.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
              }
            },
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}
