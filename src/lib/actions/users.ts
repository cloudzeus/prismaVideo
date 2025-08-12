"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { userFormSchema, userUpdateSchema } from "@/lib/validations"
import { hash, compare } from "bcryptjs"
import { sendWelcomeEmail } from "@/lib/email"

export async function createUser(formData: FormData) {
  const session = await getAuthSession()
  
  if (!session?.user || session.user.role !== "Administrator") {
    throw new Error("Unauthorized: Only administrators can create users")
  }

  try {
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = userFormSchema.parse(rawData)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Hash password if provided
    let hashedPassword: string | undefined
    if (validatedData.password) {
      hashedPassword = await hash(validatedData.password, 12)
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        role: validatedData.role,
        departmentId: validatedData.departmentId || null,
        isActive: validatedData.isActive,
        avatar: validatedData.avatar,
        password: hashedPassword!,
        companyId: session.user.companyId,
      },
      include: {
        department: true,
        company: true,
      }
    })

    // Send welcome email if password was provided
    if (validatedData.password) {
      await sendWelcomeEmail(user.email, user.firstName)
    }

    revalidatePath("/users")
    return { success: true, user }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Only admins or the user themselves can update user data
  if (session.user.role !== "Administrator" && session.user.id !== userId) {
    throw new Error("Unauthorized: You can only update your own profile")
  }

  try {
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = userUpdateSchema.parse(rawData)

    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: userId }
        }
      })

      if (existingUser) {
        throw new Error("Email is already taken by another user")
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        role: validatedData.role,
        departmentId: validatedData.departmentId || null,
        isActive: validatedData.isActive,
        avatar: validatedData.avatar,
      },
      include: {
        department: true,
        company: true,
      }
    })

    revalidatePath("/users")
    revalidatePath(`/users/${userId}`)
    revalidatePath("/profile")
    return { success: true, user }
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  const session = await getAuthSession()
  
  if (!session?.user || session.user.role !== "Administrator") {
    throw new Error("Unauthorized: Only administrators can delete users")
  }

  try {
    // Check if user exists and belongs to the same company
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: session.user.companyId
      }
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Prevent deleting the last administrator
    if (user.role === "Administrator") {
      const adminCount = await prisma.user.count({
        where: {
          companyId: session.user.companyId,
          role: "Administrator",
          isActive: true
        }
      })

      if (adminCount <= 1) {
        throw new Error("Cannot delete the last administrator")
      }
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export async function bulkUpdateUsers(userIds: string[], updates: Partial<{
  role: string
  departmentId?: string
  isActive: boolean
}>) {
  const session = await getAuthSession()
  
  if (!session?.user || session.user.role !== "Administrator") {
    throw new Error("Unauthorized: Only administrators can perform bulk updates")
  }

  try {
    // Filter out undefined values to avoid Prisma type errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as any

    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        companyId: session.user.companyId
      },
      data: cleanUpdates
    })

    revalidatePath("/users")
    return { success: true, updatedCount: result.count }
  } catch (error) {
    console.error("Error performing bulk update:", error)
    throw error
  }
}

export async function bulkDeleteUsers(userIds: string[]) {
  const session = await getAuthSession()
  
  if (!session?.user || session.user.role !== "Administrator") {
    throw new Error("Unauthorized: Only administrators can perform bulk deletions")
  }

  try {
    // Check if any of the users are administrators
    const admins = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        companyId: session.user.companyId,
        role: "Administrator"
      }
    })

    if (admins.length > 0) {
      const totalAdmins = await prisma.user.count({
        where: {
          companyId: session.user.companyId,
          role: "Administrator",
          isActive: true
        }
      })

      if (totalAdmins <= admins.length) {
        throw new Error("Cannot delete all administrators")
      }
    }

    // Soft delete by setting isActive to false
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        companyId: session.user.companyId
      },
      data: { isActive: false }
    })

    revalidatePath("/users")
    return { success: true, deletedCount: result.count }
  } catch (error) {
    console.error("Error performing bulk deletion:", error)
    throw error
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const session = await getAuthSession()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Only admins or the user themselves can change password
  if (session.user.role !== "Administrator" && session.user.id !== userId) {
    throw new Error("Unauthorized: You can only change your own password")
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Verify current password
    if (user.password) {
      const isValidPassword = await compare(currentPassword, user.password)
      if (!isValidPassword) {
        throw new Error("Current password is incorrect")
      }
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    throw error
  }
}

export async function resetPassword(userId: string) {
  const session = await getAuthSession()
  
  if (!session?.user || session.user.role !== "Administrator") {
    throw new Error("Unauthorized: Only administrators can reset passwords")
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: session.user.companyId
      }
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const hashedPassword = await hash(tempPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // Send password reset email
    await sendWelcomeEmail(user.email, user.firstName)

    return { success: true }
  } catch (error) {
    console.error("Error resetting password:", error)
    throw error
  }
} 