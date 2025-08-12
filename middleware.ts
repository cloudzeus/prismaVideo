import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Define protected routes and their required roles
const protectedRoutes = {
  '/meetings': ['Employee', 'Manager', 'Administrator'],
  '/companies': ['Administrator'],
  '/contacts': ['Employee', 'Manager', 'Administrator'],
  '/users': ['Manager', 'Administrator'],
  '/statistics': ['Employee', 'Manager', 'Administrator'],
  '/api/meetings': ['Employee', 'Manager', 'Administrator'],
  '/api/companies': ['Administrator'],
  '/api/contacts': ['Employee', 'Manager', 'Administrator'],
  '/api/users': ['Manager', 'Administrator'],
  '/api/statistics': ['Employee', 'Manager', 'Administrator'],
}

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth',
  '/api/webhooks',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if the route requires authentication
  const requiresAuth = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  )

  if (!requiresAuth) {
    return NextResponse.next()
  }

  // Get the session from the request
  const session = await auth()
  
  // If no session, redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  const userRole = session.user.role as string
  
  // Find the matching protected route
  const matchingRoute = Object.entries(protectedRoutes).find(([route]) => 
    pathname.startsWith(route)
  )

  if (matchingRoute) {
    const [, requiredRoles] = matchingRoute
    
    if (!requiredRoles.includes(userRole)) {
      // User doesn't have required role, redirect to dashboard
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Add user info to headers for server-side access
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.user.id as string)
  requestHeaders.set('x-user-role', session.user.role as string)
  requestHeaders.set('x-user-company-id', session.user.companyId as string)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 