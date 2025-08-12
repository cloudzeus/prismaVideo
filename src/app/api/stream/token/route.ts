import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { StreamVideo } from '@stream-io/video-react-sdk';

import { prisma } from '@/lib/prisma';

// Enhanced rate limiting with caching
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const userCache = new Map<string, { user: any; timestamp: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Back to 10 since we're reducing calls
const USER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache for user data

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

function getCachedUser(userId: string): any | null {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_DURATION) {
    return cached.user;
  }
  return null;
}

function setCachedUser(userId: string, user: any): void {
  userCache.set(userId, { user, timestamp: Date.now() });
}

// Stream Video API key and secret
const STREAM_API_KEY = process.env.STREAM_API_KEY!;
const STREAM_SECRET = process.env.STREAM_SECRET!;

// Map our custom roles to Stream Video roles
const getStreamRole = (role: string) => {
  switch (role.toLowerCase()) {
    case 'administrator':
      return 'admin'
    case 'manager':
      return 'moderator'
    case 'employee':
    case 'contact':
    default:
      return 'user'
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const user = session.user;
    const { callId, forceUpdate = false } = await request.json();

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // Check cache first - only update user if forced or not cached
    let streamUser = getCachedUser(user.id);
    
    if (!streamUser || forceUpdate) {
      // Create or update Stream user only when starting a meeting or forced
      streamUser = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        image: user.avatar,
        role: getStreamRole(user.role),
        company: user.companyName,
        department: user.departmentName,
      };

      try {
        // For Stream Video, we don't need to upsert users - just cache the user data
        setCachedUser(user.id, streamUser);
        console.log(`Updated Stream Video user for meeting: ${user.id} (call: ${callId})`);
      } catch (error: any) {
        console.error('Stream Video user creation error:', error);
        throw error;
      }
    } else {
      console.log(`Using cached Stream user: ${user.id} (call: ${callId})`);
    }

    // Generate user token with appropriate permissions
    const token = streamClient.createToken(user.id, Math.floor(Date.now() / 1000) + 60 * 60 * 24);

    return NextResponse.json({
      token,
      user: streamUser,
      apiKey: process.env.STREAM_API_KEY,
    });

  } catch (error: any) {
    console.error('Stream token generation error:', error);
    
    // Handle Stream.io specific errors
    if (error.code === 9 && error.status === 429) {
      return NextResponse.json(
        { error: 'Stream.io rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const user = session.user;

    // For GET requests, only use cached user - no UpdateUsers call
    let streamUser = getCachedUser(user.id);
    
    if (!streamUser) {
      // If no cached user, create a basic user object without calling Stream API
      streamUser = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        image: user.avatar,
        role: getStreamRole(user.role),
        company: user.companyName,
        department: user.departmentName,
      };
      
      // Cache this basic user object
      setCachedUser(user.id, streamUser);
      console.log(`Created basic user object (no Stream API call): ${user.id}`);
    } else {
      console.log(`Using cached user for general access: ${user.id}`);
    }

    // Generate user token for general access
    const token = streamClient.createToken(user.id, Math.floor(Date.now() / 1000) + 60 * 60 * 24);

    return NextResponse.json({
      token,
      user: streamUser,
      apiKey: process.env.STREAM_API_KEY,
    });

  } catch (error: any) {
    console.error('Stream token generation error:', error);
    
    // Handle Stream.io specific errors
    if (error.code === 9 && error.status === 429) {
      return NextResponse.json(
        { error: 'Stream.io rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 