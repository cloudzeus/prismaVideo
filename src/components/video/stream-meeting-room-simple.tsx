'use client';

import React, { useEffect, useState } from 'react';
import {
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';

import '@stream-io/video-react-sdk/dist/css/styles.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface StreamMeetingRoomProps {
  meeting: any;
  user: any;
  isHost: boolean;
  isAdmin: boolean;
}

export function StreamMeetingRoomSimple({ meeting, user, isHost, isAdmin }: StreamMeetingRoomProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStream = async () => {
      try {
        setIsJoining(true);
        setError(null);

        // Get Stream token from your API
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id, meetingId: meeting.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to get Stream token');
        }

        const { token, apiKey } = await response.json();

        // Create Stream client
        const streamClient = new StreamVideoClient({
          apiKey,
          user: {
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            image: user.avatar,
          },
          token,
        });

        setClient(streamClient);

        // Create and join call
        const streamCall = streamClient.call('default', meeting.id);
        await streamCall.join({ create: true });
        setCall(streamCall);

        setIsJoining(false);
      } catch (err: any) {
        console.error('Failed to initialize Stream:', err);
        setError(err.message || 'Failed to connect to video call');
        setIsJoining(false);
      }
    };

    initializeStream();

    return () => {
      if (call) {
        call.leave();
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [meeting.id, user.id, user.firstName, user.lastName, user.avatar]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client || !call || isJoining) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{isJoining ? 'Connecting to meeting...' : 'Initializing video call...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-white font-semibold">{meeting.title}</h1>
            <p className="text-gray-400 text-sm">
              {isHost ? 'Host' : 'Participant'} • Meeting ID: {meeting.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="default">Active</Badge>
          {isHost && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Host
            </Badge>
          )}
        </div>
      </div>

      {/* Stream Video Component */}
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme>
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <SpeakerLayout participantsBarPosition="bottom" />
              </div>
              <CallControls />
            </div>
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
