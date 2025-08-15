import { useState, useEffect, useRef } from 'react';

interface UseMeetingDurationProps {
  startTime: Date;
  isHost: boolean;
  onDurationWarning: () => void;
  onAutoStop: () => void;
}

interface UseMeetingDurationReturn {
  duration: string;
  showWarning: boolean;
  hasShownWarning: boolean;
  dismissWarning: () => void;
}

export function useMeetingDuration({
  startTime,
  isHost,
  onDurationWarning,
  onAutoStop,
}: UseMeetingDurationProps): UseMeetingDurationReturn {
  const [duration, setDuration] = useState('00:00:00');
  const [showWarning, setShowWarning] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateDuration = () => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const durationString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setDuration(durationString);

      // Check if meeting has exceeded 1 hour (3600000 ms)
      if (diff >= 3600000 && isHost && !hasShownWarning) {
        setShowWarning(true);
        setHasShownWarning(true);
        onDurationWarning();

        // Set up auto-stop after 30 seconds if no response
        warningTimeoutRef.current = setTimeout(() => {
          if (showWarning) {
            onAutoStop();
          }
        }, 30000);
      }
    };

    // Update duration immediately
    updateDuration();

    // Set up interval to update duration every second
    intervalRef.current = setInterval(updateDuration, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [startTime, isHost, hasShownWarning, showWarning, onDurationWarning, onAutoStop]);

  const dismissWarning = () => {
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  };

  return {
    duration,
    showWarning,
    hasShownWarning,
    dismissWarning,
  };
}
