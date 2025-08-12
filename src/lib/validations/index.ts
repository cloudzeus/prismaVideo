import * as z from "zod"

const userFormBaseSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 500 characters"),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional(),
  role: z.enum(["Administrator", "Manager", "Employee", "Contact"]),
  departmentId: z.string().optional(),
  isActive: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true' || val === '1')
  ]).optional(),
  avatar: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
})

const userCreateSchema = userFormBaseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
})

export const userFormSchema = userCreateSchema.refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const userUpdateSchema = userFormBaseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If password is provided, confirmPassword must match
  if (data.password && data.password !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Meeting validation schemas
export const meetingFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
  type: z.enum(["VIDEO_CALL", "AUDIO_CALL", "SCREEN_SHARE", "PRESENTATION"]),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  participants: z.array(z.string()).min(1, "At least one participant is required"),
  isPublic: z.boolean().default(false),
  allowJoinBeforeHost: z.boolean().default(true),
  recordMeeting: z.boolean().default(false),
  location: z.string().max(255, "Location must be less than 255 characters").optional(),
  agenda: z.string().max(2000, "Agenda must be less than 2000 characters").optional(),
  attachments: z.array(z.string()).optional(),
}).refine((data) => {
  return data.endTime > data.startTime
}, {
  message: "End time must be after start time",
  path: ["endTime"],
})

// Company validation schemas
export const companyFormSchema = z.object({
  COMPANY: z.string().min(1, "Company ID is required").max(50, "Company ID must be less than 50 characters"),
  LOCKID: z.string().max(50, "Lock ID must be less than 50 characters").optional(),
  SODTYPE: z.string().max(50, "SOD Type must be less than 50 characters").optional(),
  name: z.string().min(2, "Company name must be at least 2 characters").max(100, "Company name must be less than 100 characters"),
  type: z.enum(["client", "partner", "vendor", "internal"]),
  address: z.string().max(255, "Address must be less than 255 characters").optional(),
  city: z.string().max(100, "City must be less than 100 characters").optional(),
  country: z.string().max(100, "Country must be less than 100 characters").optional(),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional(),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters").optional(),
  website: z.string().url("Invalid website URL").max(255, "Website must be less than 255 characters").optional(),
  logo: z.string().optional(),
})

// Department validation schemas
export const departmentFormSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters").max(100, "Department name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean(),
})

// File upload validation schemas
export const fileUploadSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, "At least one file is required"),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
  allowedTypes: z.array(z.string()).optional(),
})

// Search and filter validation schemas
export const searchSchema = z.object({
  query: z.string().max(100, "Search query must be less than 100 characters").optional(),
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be less than 100").default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

// Pagination validation schemas
export const paginationSchema = z.object({
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be less than 100").default(10),
})

// Authentication validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
})

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  companyId: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Profile update validation schemas
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
  confirmNewPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false
  }
  return true
}, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
})

// Settings validation schemas
export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.enum(["en", "es", "fr", "de"]).default("en"),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }),
  privacy: z.object({
    profileVisibility: z.enum(["public", "private", "company"]).default("company"),
    showOnlineStatus: z.boolean().default(true),
    allowDirectMessages: z.boolean().default(true),
  }),
})

// Export types
export type UserFormValues = z.infer<typeof userFormSchema>
export type UserUpdateValues = z.infer<typeof userUpdateSchema>
export type MeetingFormValues = z.infer<typeof meetingFormSchema>
export type CompanyFormValues = z.infer<typeof companyFormSchema>
export type DepartmentFormValues = z.infer<typeof departmentFormSchema>
export type FileUploadValues = z.infer<typeof fileUploadSchema>
export type SearchValues = z.infer<typeof searchSchema>
export type PaginationValues = z.infer<typeof paginationSchema>
export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>
export type SettingsValues = z.infer<typeof settingsSchema> 