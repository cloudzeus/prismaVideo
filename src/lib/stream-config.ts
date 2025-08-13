import { StreamVideoClient } from '@stream-io/video-react-sdk';

// Stream Video configuration
export const STREAM_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY || '9hjqexaa2ycb',
};

// User interface matching your existing user structure
export interface StreamUser {
  id: string;
  name: string;
  image?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

// Create Stream client instance
export const createStreamClient = (user: StreamUser, token: string) => {
  return new StreamVideoClient({
    apiKey: STREAM_CONFIG.apiKey,
    user: {
      id: user.id,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      image: user.image,
    },
    token,
  });
};

// Call types for different meeting scenarios
export const CALL_TYPES = {
  DEFAULT: 'default',
  MEETING: 'meeting',
  PRESENTATION: 'presentation',
} as const;

export type CallType = typeof CALL_TYPES[keyof typeof CALL_TYPES];
