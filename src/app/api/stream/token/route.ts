import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_SECRET = process.env.STREAM_SECRET;

if (!STREAM_API_KEY || !STREAM_SECRET) {
  throw new Error('Stream.io API key and secret are required');
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { callId } = await request.json();

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    // Verify the user has access to this meeting
    const meeting = await prisma.call.findFirst({
      where: {
        id: callId,
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        participants: true
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found or access denied' }, { status: 404 });
    }

    // Generate Stream Video token
    const token = generateStreamVideoToken(session.user.id);

    return NextResponse.json({
      token,
      apiKey: STREAM_API_KEY,
      userId: session.user.id,
      userName: `${session.user.firstName} ${session.user.lastName}`,
      callId: callId,
    });

  } catch (error) {
    console.error('Error generating Stream Video token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

// Generate Stream Video token
function generateStreamVideoToken(userId: string): string {
  const { createHmac } = require('crypto');
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    user_id: userId,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000),
    iss: STREAM_API_KEY
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = createHmac('sha256', STREAM_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
