// Stream.io utility functions for cache management and monitoring

// Cache management
let userCache = new Map<string, { user: any; timestamp: number }>();
let rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const STREAM_CACHE_CONFIG = {
  USER_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 5, // 5 requests per minute per user
};

export function clearStreamCache() {
  userCache.clear();
  rateLimitMap.clear();
  console.log('Stream cache cleared');
}

export function getStreamCacheStats() {
  return {
    userCacheSize: userCache.size,
    rateLimitMapSize: rateLimitMap.size,
    userCacheEntries: Array.from(userCache.entries()).map(([id, data]) => ({
      id,
      timestamp: data.timestamp,
      age: Date.now() - data.timestamp,
    })),
  };
}

export function cleanupExpiredCache() {
  const now = Date.now();
  let cleanedUsers = 0;
  let cleanedRateLimits = 0;

  // Clean expired user cache
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > STREAM_CACHE_CONFIG.USER_CACHE_DURATION) {
      userCache.delete(key);
      cleanedUsers++;
    }
  }

  // Clean expired rate limit entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
      cleanedRateLimits++;
    }
  }

  if (cleanedUsers > 0 || cleanedRateLimits > 0) {
    console.log(`Stream cache cleanup: ${cleanedUsers} users, ${cleanedRateLimits} rate limits`);
  }
}

// Export cache maps for use in API routes
export { userCache, rateLimitMap };

// Auto-cleanup every 10 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredCache, 10 * 60 * 1000);
} 