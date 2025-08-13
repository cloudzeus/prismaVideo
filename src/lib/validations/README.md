# Validation Schemas

This directory contains Zod validation schemas for the application.

## File Structure

- `index.ts` - Main validation schemas (server-safe)
- `browser-validations.ts` - Browser-specific validations (client components only)

## Usage

### Server-Side (API Routes, Server Components)
```typescript
import { fileUploadSchema } from '@/lib/validations'

// Use the server-safe schema
const validatedData = fileUploadSchema.parse(data)
```

### Client-Side (Client Components)
```typescript
import { browserFileUploadSchema } from '@/lib/validations/browser-validations'

// Use the browser-specific schema with File API
const validatedData = browserFileUploadSchema.parse(data)
```

## Important Notes

- **Never import `browser-validations.ts` in server-side code** (API routes, server components)
- **Only import `browser-validations.ts` in client components** where the File API is available
- The main `index.ts` file contains server-safe schemas that work in both environments
- Browser validations are separated to prevent build errors during server-side builds
