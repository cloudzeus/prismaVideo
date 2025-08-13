import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = await request.json();

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Verify the user has permission to stop recording
    const meeting = await prisma.call.findFirst({
      where: {
        id: meetingId,
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        recordings: {
          where: { status: 'recording' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found or access denied' }, { status: 404 });
    }

    // Check if user is host/admin
    const isHost = meeting.createdById === session.user.id;
    const isAdmin = session.user.role === 'Admin';
    
    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only hosts and admins can stop recording' }, { status: 403 });
    }

    // Find the active recording
    const activeRecording = meeting.recordings[0];
    if (!activeRecording) {
      return NextResponse.json({ error: 'No active recording found' }, { status: 400 });
    }

    // Stop Stream.io recording
    const streamResponse = await fetch('https://api.stream-io-video.com/v1/calls/stop-recording', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STREAM_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call_cid: meeting.streamCallId || meeting.id,
        recording_id: activeRecording.streamRecordingId
      }),
    });

    if (!streamResponse.ok) {
      const errorData = await streamResponse.json();
      console.error('Stream.io recording stop error:', errorData);
      throw new Error('Failed to stop recording on Stream.io');
    }

    // Update recording status to processing
    await prisma.recording.update({
      where: { id: activeRecording.id },
      data: { 
        status: 'processing',
        updatedAt: new Date()
      }
    });

    // Update meeting status
    await prisma.call.update({
      where: { id: meetingId },
      data: { 
        status: 'active',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      recordingId: activeRecording.id,
      message: 'Recording stopped successfully. It will be processed and saved to cloud storage shortly.'
    });

  } catch (error) {
    console.error('Stop recording error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording' 
      },
      { status: 500 }
    );
  }
}
