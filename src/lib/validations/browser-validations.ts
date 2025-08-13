import * as z from "zod"

// Browser-specific file validation (only use in client components)
export const browserFileUploadSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, "At least one file is required"),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
  allowedTypes: z.array(z.string()).optional(),
})

// Export types
export type BrowserFileUploadValues = z.infer<typeof browserFileUploadSchema>
