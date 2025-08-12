"use server"

import { revalidatePath } from "next/cache"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { meetingFormSchema, meetingUpdateSchema } from "@/lib/validations"
import { generateMeetingPassword } from "@/lib/auth"

export async function createMeeting(formData: FormData) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = meetingFormSchema.parse(rawData)

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
        password: generateMeetingPassword(),
        companyId: session.user.companyId,
        createdBy: session.user.id,
        participants: {
          create: [...userParticipants, ...contactParticipants]
        }
      },
      include: {
        company: true,
        participants: {
          include: {
            user: true,
            contact: true
          }
        }
      }
    })

    revalidatePath("/meetings")
    return { success: true, meeting }
  } catch (error) {
    console.error("Error creating meeting:", error)
    throw error
  }
}

export async function updateMeeting(meetingId: string, formData: FormData) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = meetingUpdateSchema.parse(rawData)

    // Check if user has permission to update this meeting
    const existingMeeting = await prisma.call.findFirst({
      where: {
        id: meetingId,
        companyId: session.user.companyId
      }
    })

    if (!existingMeeting) {
      throw new Error("Meeting not found")
    }

    // Only admins, managers, or the meeting creator can update
    if (session.user.role !== "Administrator" && 
        session.user.role !== "Manager" && 
        existingMeeting.createdBy !== session.user.id) {
      throw new Error("Unauthorized: You don't have permission to update this meeting")
    }

    // Update meeting
    const meeting = await prisma.call.update({
      where: { id: meetingId },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
      },
      include: {
        company: true,
        participants: {
          include: {
            user: true
          }
        }
      }
    })

    revalidatePath("/meetings")
    revalidatePath(`/meetings/${meetingId}`)
    return { success: true, meeting }
  } catch (error) {
    console.error("Error updating meeting:", error)
    throw error
  }
}

export async function deleteMeeting(meetingId: string) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has permission to delete this meeting
    const existingMeeting = await prisma.call.findFirst({
      where: {
        id: meetingId,
        companyId: session.user.companyId
      }
    })

    if (!existingMeeting) {
      throw new Error("Meeting not found")
    }

    // Only admins, managers, or the meeting creator can delete
    if (session.user.role !== "Administrator" && 
        session.user.role !== "Manager" && 
        existingMeeting.createdBy !== session.user.id) {
      throw new Error("Unauthorized: You don't have permission to delete this meeting")
    }

    // Delete meeting
    await prisma.call.delete({
      where: { id: meetingId }
    })

    revalidatePath("/meetings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting meeting:", error)
    throw error
  }
}

export async function joinMeeting(meetingId: string) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if meeting exists and user has access
    const meeting = await prisma.call.findFirst({
      where: {
        id: meetingId,
        companyId: session.user.companyId
      },
      include: {
        participants: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!meeting) {
      throw new Error("Meeting not found")
    }

    // Check if user is already a participant
    if (meeting.participants.length > 0) {
      return { success: true, meeting }
    }

    // Add user as participant
    await prisma.callParticipant.create({
      data: {
        callId: meetingId,
        userId: session.user.id,
        role: 'Participant'
      }
    })

    revalidatePath("/meetings")
    revalidatePath(`/meetings/${meetingId}`)
    return { success: true, meeting }
  } catch (error) {
    console.error("Error joining meeting:", error)
    throw error
  }
}

export async function leaveMeeting(meetingId: string) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Remove user from meeting
    await prisma.callParticipant.deleteMany({
      where: {
        callId: meetingId,
        userId: session.user.id
      }
    })

    revalidatePath("/meetings")
    revalidatePath(`/meetings/${meetingId}`)
    return { success: true }
  } catch (error) {
    console.error("Error leaving meeting:", error)
    throw error
  }
}

export async function addParticipant(meetingId: string, userId: string) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has permission to add participants
    const meeting = await prisma.call.findFirst({
      where: {
        id: meetingId,
        companyId: session.user.companyId
      }
    })

    if (!meeting) {
      throw new Error("Meeting not found")
    }

    // Only admins, managers, or the meeting creator can add participants
    if (session.user.role !== "Administrator" && 
        session.user.role !== "Manager" && 
        meeting.createdBy !== session.user.id) {
      throw new Error("Unauthorized: You don't have permission to add participants")
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.callParticipant.findFirst({
      where: {
        callId: meetingId,
        userId: userId
      }
    })

    if (existingParticipant) {
      throw new Error("User is already a participant")
    }

    // Add participant
    await prisma.callParticipant.create({
      data: {
        callId: meetingId,
        userId: userId,
        role: 'Participant'
      }
    })

    revalidatePath("/meetings")
    revalidatePath(`/meetings/${meetingId}`)
    return { success: true }
  } catch (error) {
    console.error("Error adding participant:", error)
    throw error
  }
}

export async function removeParticipant(meetingId: string, userId: string) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has permission to remove participants
    const meeting = await prisma.call.findFirst({
      where: {
        id: meetingId,
        companyId: session.user.companyId
      }
    })

    if (!meeting) {
      throw new Error("Meeting not found")
    }

    // Only admins, managers, or the meeting creator can remove participants
    if (session.user.role !== "Administrator" && 
        session.user.role !== "Manager" && 
        meeting.createdBy !== session.user.id) {
      throw new Error("Unauthorized: You don't have permission to remove participants")
    }

    // Remove participant
    await prisma.callParticipant.deleteMany({
      where: {
        callId: meetingId,
        userId: userId
      }
    })

    revalidatePath("/meetings")
    revalidatePath(`/meetings/${meetingId}`)
    return { success: true }
  } catch (error) {
    console.error("Error removing participant:", error)
    throw error
  }
} 