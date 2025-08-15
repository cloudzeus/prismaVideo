'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, Play, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MeetingDurationWarningProps {
  isOpen: boolean;
  onContinue: () => void;
  onStop: () => void;
  meetingTitle: string;
}

export function MeetingDurationWarning({ 
  isOpen, 
  onContinue, 
  onStop, 
  meetingTitle 
}: MeetingDurationWarningProps) {
  const [countdown, setCountdown] = useState(30);
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setCountdown(30);
      setIsResponding(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-stop the meeting if no response
          clearInterval(timer);
          toast({
            title: "Meeting Auto-Stopped",
            description: "No response received within 30 seconds. Meeting has been automatically terminated.",
            variant: "destructive",
          });
          onStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onStop, toast]);

  const handleContinue = () => {
    setIsResponding(true);
    toast({
      title: "Meeting Extended",
      description: "You have chosen to continue the meeting. The warning will not appear again for this session.",
    });
    onContinue();
  };

  const handleStop = () => {
    setIsResponding(true);
    toast({
      title: "Meeting Stopped",
      description: "You have chosen to stop the meeting.",
    });
    onStop();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Meeting Duration Warning</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The meeting <strong>"{meetingTitle}"</strong> has exceeded 1 hour. 
              Please decide whether to continue or stop the meeting.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Auto-stop in:</span>
              <span className={`font-mono text-lg ${countdown <= 10 ? 'text-red-600 font-bold' : ''}`}>
                {countdown}s
              </span>
            </div>
            
            {countdown <= 10 && (
              <div className="text-red-600 text-sm font-medium">
                ⚠️ Respond quickly! Meeting will auto-stop soon.
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleContinue}
              disabled={isResponding}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Meeting
            </Button>
            
            <Button
              onClick={handleStop}
              disabled={isResponding}
              variant="destructive"
              className="flex-1"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop Meeting
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            If you don't respond within 30 seconds, the meeting will be automatically stopped.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
