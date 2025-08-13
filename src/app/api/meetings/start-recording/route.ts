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

    // Verify the user has permission to record this meeting
    const meeting = await prisma.call.findFirst({
      where: {
        id: meetingId,
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        company: true,
        createdBy: true,
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found or access denied' }, { status: 404 });
    }

    // Check if user is host/admin or has recording permission
    const isHost = meeting.createdById === session.user.id;
    const isAdmin = session.user.role === 'Admin';
    
    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only hosts and admins can record meetings' }, { status: 403 });
    }

    // Start Stream.io recording
    const streamResponse = await fetch('https://api.stream-io-video.com/v1/calls/start-recording', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STREAM_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call_cid: meeting.streamCallId || meeting.id,
        recording: {
          mode: 'available_modes',
          quality: '1080p',
          layout: 'grid'
        }
      }),
    });

    if (!streamResponse.ok) {
      const errorData = await streamResponse.json();
      console.error('Stream.io recording start error:', errorData);
      throw new Error('Failed to start recording on Stream.io');
    }

    const streamData = await streamResponse.json();

    // Create recording record in database
    const recording = await prisma.recording.create({
      data: {
        callId: meeting.id,
        streamRecordingId: streamData.recording_id,
        title: `Recording - ${meeting.title}`,
        description: `Recording of ${meeting.title}`,
        status: 'recording',
      },
    });

    // Update meeting with recording status
    await prisma.call.update({
      where: { id: meetingId },
      data: { 
        status: 'recording',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      recordingId: recording.id,
      streamRecordingId: streamData.recording_id,
      message: 'Recording started successfully'
    });

  } catch (error) {
    console.error('Start recording error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start recording' 
      },
      { status: 500 }
    );
  }
}
