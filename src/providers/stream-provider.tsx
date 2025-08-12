"use client"

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';

interface StreamProviderProps {
  children: React.ReactNode;
}

interface StreamContextType {
  client: StreamVideoClient | null;
  isInitialized: boolean;
  error: string | null;
  retry: () => void;
  initializeForMeeting: (callId: string) => Promise<void>;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function useStream() {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
}

export function StreamProvider({ children }: StreamProviderProps) {
  const { data: session, status } = useSession();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateBackoffDelay = (attempt: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  };

  const initializeForMeeting = async (callId: string, attempt: number = 0) => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get token specifically for this meeting
      const response = await fetch('/api/stream/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          forceUpdate: true, // Force update user when joining meeting
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limit specifically
        if (response.status === 429) {
          const delay = calculateBackoffDelay(attempt);
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          
          if (attempt < maxRetries) {
            retryTimeoutRef.current = setTimeout(() => {
              initializeForMeeting(callId, attempt + 1);
            }, delay);
            return;
          } else {
            throw new Error('Rate limit exceeded after multiple retries. Please try again later.');
          }
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const { token, apiKey } = await response.json();

      // Initialize Stream client for this specific meeting
      const streamClient = new StreamVideoClient({
        apiKey,
        token,
        user: {
          id: session.user.id,
          name: `${session.user.firstName} ${session.user.lastName}`,
        },
      });

      setClient(streamClient);
      setIsInitialized(true);
      setError(null);
      setRetryCount(0); // Reset retry count on success
      console.log('Stream client initialized for meeting:', callId);
    } catch (error: any) {
      console.error('Stream initialization error:', error);
      
      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        console.log(`Retrying Stream initialization in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          initializeForMeeting(callId, attempt + 1);
        }, delay);
      } else {
        setError(error.message || 'Failed to initialize Stream');
        setRetryCount(attempt);
      }
    }
  };

  const retry = () => {
    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setError(null);
    setRetryCount(0);
    // Note: retry() now requires a callId parameter
  };

  useEffect(() => {
    // Only initialize basic Stream context when user is authenticated
    // Don't automatically connect to any meeting
    if (status === 'loading' || !session?.user) {
      return;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (client) {
        client.disconnectUser();
      }
    };
  }, [session?.user?.id, status]);

  const value: StreamContextType = {
    client,
    isInitialized,
    error,
    retry,
    initializeForMeeting,
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
} 