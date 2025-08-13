'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { prisma } from '@/lib/prisma';

export default function TestRecordingPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recordings');
      if (response.ok) {
        const data = await response.json();
        setRecordings(data.recordings || []);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const testRecordingFlow = async () => {
    try {
      toast({
        title: "Testing Recording Flow",
        description: "This will simulate the recording process to verify Bunny CDN integration",
      });

      // Simulate recording start
      const startResponse = await fetch('/api/meetings/start-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meetingId: 'test-meeting-id',
          action: 'start'
        }),
      });

      if (startResponse.ok) {
        toast({
          title: "Recording Started",
          description: "Test recording started successfully",
        });

        // Wait a bit then stop
        setTimeout(async () => {
          const stopResponse = await fetch('/api/meetings/stop-recording', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              meetingId: 'test-meeting-id',
              action: 'stop'
            }),
          });

          if (stopResponse.ok) {
            toast({
              title: "Recording Stopped",
              description: "Test recording stopped. Check webhook logs for Bunny CDN upload.",
            });
          }
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Recording test failed. Check console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Recording Test Page</h1>
        <p className="text-muted-foreground mt-2">
          Test and verify video conference recording functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recording Test</CardTitle>
            <CardDescription>
              Test the recording flow to verify Stream.io and Bunny CDN integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testRecordingFlow} className="w-full">
              Test Recording Flow
            </Button>
            <p className="text-sm text-muted-foreground">
              This will simulate starting and stopping a recording to test the webhook system.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
            <CardDescription>
              Verify required environment variables are set
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>STREAM_API_KEY:</span>
              <Badge variant={process.env.NEXT_PUBLIC_STREAM_API_KEY ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_STREAM_API_KEY ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>STREAM_SECRET:</span>
              <Badge variant="secondary">Hidden</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>BUNNY_ACCESS_KEY:</span>
              <Badge variant="secondary">Hidden</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>STREAM_WEBHOOK_SECRET:</span>
              <Badge variant="secondary">Hidden</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recordings Database</CardTitle>
          <CardDescription>
            View all recordings stored in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading recordings...</div>
          ) : recordings.length > 0 ? (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div key={recording.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{recording.title}</h3>
                    <Badge variant={recording.status === 'completed' ? 'default' : 'secondary'}>
                      {recording.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{recording.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span> {recording.duration ? `${Math.floor(recording.duration / 60)}m ${recording.duration % 60}s` : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span> {recording.fileSize ? `${(recording.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </div>
                  </div>
                  {recording.bunnyCdnUrl && (
                    <div className="pt-2">
                      <span className="font-medium text-sm">Bunny CDN URL:</span>
                      <a 
                        href={recording.bunnyCdnUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block truncate"
                      >
                        {recording.bunnyCdnUrl}
                      </a>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(recording.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recordings found. Start a video conference and record to see them here.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Testing</CardTitle>
          <CardDescription>
            Test Stream.io webhook endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To test webhooks, you need to configure Stream.io to send webhooks to:
            </p>
            <code className="block bg-muted p-2 rounded text-sm">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/stream` : '/api/webhooks/stream'}
            </code>
            <div className="text-sm text-muted-foreground">
              <p>Required webhook events:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>call.ended</li>
                <li>call.recording.ready</li>
                <li>call.transcription.ready</li>
                <li>call.livestream.ready</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
