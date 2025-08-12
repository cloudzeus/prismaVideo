import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { uploadToBunnyCDN } from '@/lib/bunny';
import { sendRecordingNotification } from '@/lib/email';

const STREAM_WEBHOOK_SECRET = process.env.STREAM_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    // Verify webhook signature
    if (STREAM_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', STREAM_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    console.log('Stream webhook event:', event.type);

    switch (event.type) {
      case 'call.ended':
        await handleCallEnded(event);
        break;

      case 'call.recording.ready':
        await handleRecordingReady(event);
        break;

      case 'call.transcription.ready':
        await handleTranscriptionReady(event);
        break;

      case 'call.livestream.ready':
        await handleLivestreamReady(event);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCallEnded(event: any) {
  try {
    const { call_cid } = event;

    // Update call status in database
    await prisma.call.updateMany({
      where: { streamCallId: call_cid },
      data: {
        status: 'ended',
        endTime: new Date(),
      },
    });

    console.log('Call ended:', call_cid);
  } catch (error) {
    console.error('Error handling call ended:', error);
  }
}

async function handleRecordingReady(event: any) {
  try {
    const { call_cid, recording_id, recording_url, duration, file_size } = event;

    // Find the call in our database
    const call = await prisma.call.findFirst({
      where: { streamCallId: call_cid },
      include: {
        company: true,
        createdBy: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!call) {
      console.error('Call not found for recording:', call_cid);
      return;
    }

    // Download recording from Stream.io
    const response = await fetch(recording_url);
    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }

    const recordingBuffer = Buffer.from(await response.arrayBuffer());

    // Upload to Bunny CDN
    const timestamp = Date.now();
    const fileName = `recording-${call_cid}-${timestamp}.mp4`;
    const filePath = `recordings/${call.companyId}/${fileName}`;

    const bunnyCdnUrl = await uploadToBunnyCDN(
      recordingBuffer,
      filePath,
      'video/mp4'
    );

    // Create or update recording record
    const recording = await prisma.recording.upsert({
      where: {
        id: recording_id, // Use the recording_id as the id
      },
      update: {
        url: recording_url,
        bunnyCdnUrl,
        duration: Math.round(duration),
        fileSize: file_size,
        status: 'completed',
      },
      create: {
        id: recording_id, // Set the id to recording_id
        callId: call.id,
        streamRecordingId: recording_id,
        title: `Recording - ${call.title}`,
        description: `Recording of ${call.title}`,
        url: recording_url,
        bunnyCdnUrl,
        duration: Math.round(duration),
        fileSize: file_size,
        status: 'completed',
      },
    });

    // Send notification emails to participants
    const participants = call.participants.map(p => p.user);
    await sendRecordingNotification(recording, call, participants);

    console.log('Recording processed and uploaded to Bunny CDN:', recording_id);
  } catch (error) {
    console.error('Error handling recording ready:', error);
  }
}

async function handleTranscriptionReady(event: any) {
  try {
    const { call_cid, transcription_url, language } = event;

    // Find the call in our database
    const call = await prisma.call.findFirst({
      where: { streamCallId: call_cid },
    });

    if (!call) {
      console.error('Call not found for transcription:', call_cid);
      return;
    }

    // Download transcription from Stream.io
    const response = await fetch(transcription_url);
    if (!response.ok) {
      throw new Error(`Failed to download transcription: ${response.statusText}`);
    }

    const transcriptionBuffer = Buffer.from(await response.arrayBuffer());

    // Upload transcription to Bunny CDN
    const timestamp = Date.now();
    const fileName = `transcription-${call_cid}-${timestamp}.json`;
    const filePath = `transcriptions/${call.companyId}/${fileName}`;

    const bunnyCdnUrl = await uploadToBunnyCDN(
      transcriptionBuffer,
      filePath,
      'application/json'
    );

    // Store transcription URL in call metadata or create separate table
    // For now, we'll log it
    console.log('Transcription uploaded to Bunny CDN:', bunnyCdnUrl);

  } catch (error) {
    console.error('Error handling transcription ready:', error);
  }
}

async function handleLivestreamReady(event: any) {
  try {
    const { call_cid, livestream_id, livestream_url } = event;

    // Find the call in our database
    const call = await prisma.call.findFirst({
      where: { streamCallId: call_cid },
    });

    if (!call) {
      console.error('Call not found for livestream:', call_cid);
      return;
    }

    // Create or update livestream record
    await prisma.livestream.upsert({
      where: {
        id: livestream_id, // Use the livestream_id as the id
      },
      update: {
        url: livestream_url,
        status: 'live',
      },
      create: {
        id: livestream_id, // Set the id to livestream_id
        callId: call.id,
        streamLivestreamId: livestream_id,
        title: `Livestream - ${call.title}`,
        description: `Livestream of ${call.title}`,
        url: livestream_url,
        status: 'live',
      },
    });

    console.log('Livestream ready:', livestream_id);
  } catch (error) {
    console.error('Error handling livestream ready:', error);
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 