import { NextRequest, NextResponse } from 'next/server';

import { StreamChat } from 'stream-chat';

import { auth } from '@/lib/auth';

const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_SECRET = process.env.STREAM_SECRET;

if (!STREAM_API_KEY || !STREAM_SECRET) {
  throw new Error('Stream.io API key and secret are required');
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, meetingId } = await request.json();

    // Verify the user is requesting their own token
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate Stream Video token using server SDK
    const serverClient = StreamChat.getInstance(STREAM_API_KEY!, STREAM_SECRET!);

    // Create a user token for video calls
    const token = serverClient.createToken(userId);

    return NextResponse.json({
      token,
      apiKey: STREAM_API_KEY,
      userId: session.user.id,
      meetingId,
    });

  } catch (error) {
    console.error('Stream token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
