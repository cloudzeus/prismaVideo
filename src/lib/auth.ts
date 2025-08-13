import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                }
              },
              department: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          });

          if (!user || !user.isActive) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            companyId: user.companyId,
            companyName: (user as any).company.name,
            companyType: (user as any).company.type,
            departmentId: user.departmentId,
            departmentName: (user as any).department?.name || null,
            avatar: user.avatar,
            phone: user.phone,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.companyType = user.companyType;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.avatar = user.avatar;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          role: token.role as string,
          companyId: token.companyId as string,
          companyName: token.companyName as string,
          companyType: token.companyType as string,
          departmentId: token.departmentId as string | null,
          departmentName: token.departmentName as string | null,
          avatar: token.avatar as string | null,
          phone: token.phone as string | null,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})

// Type definitions for extended session
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: string
      companyId: string
      companyName: string
      companyType: string
      departmentId: string | null
      departmentName: string | null
      avatar: string | null
      phone: string | null
    }
  }

  interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    companyId: string
    companyName: string
    companyType: string
    departmentId: string | null
    departmentName: string | null
    avatar: string | null
    phone: string | null
  }
}

// JWT module declaration removed for NextAuth v5 compatibility

// Role checking utilities
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'Contact': 1,
    'Employee': 2,
    'Manager': 3,
    'Administrator': 4,
  }
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy]
}

export function isAdmin(role: string): boolean {
  return role === 'Administrator'
}

export function isManager(role: string): boolean {
  return role === 'Manager' || role === 'Administrator'
}

export function isUser(role: string): boolean {
  return role === 'Contact' || role === 'Employee' || role === 'Manager' || role === 'Administrator'
}

// Session utilities
export function getSessionUser(session: any) {
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    companyId: session.user.companyId,
    companyName: session.user.companyName,
    companyType: session.user.companyType,
    departmentId: session.user.departmentId,
    departmentName: session.user.departmentName,
    avatar: session.user.avatar,
    phone: session.user.phone,
  }
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Token utilities
export function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateMeetingPassword(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// New function to get session safely in Next.js 15 with NextAuth v5
export async function getAuthSession() {
  try {
    // In NextAuth v5, we use the auth function directly
    return await auth()
  } catch (error) {
    console.error('Error getting auth session:', error)
    return null
  }
} 