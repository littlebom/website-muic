/**
 * In-Memory Cache (Simplified)
 * - TTL-based expiration
 * - Type-safe
 * - No Redis dependency
 *
 * Note: Redis support removed. Uses in-memory cache only.
 * For distributed caching, consider reinstalling ioredis package.
 */

import { apiCache } from './api-cache';

interface CacheOptions {
  ttl?: number; // seconds
}

class MemoryCache {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    return apiCache.get<T>(key);
  }

  /**
   * Set cache with optional TTL (in seconds)
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    const ttlMs = options?.ttl ? options.ttl * 1000 : undefined;
    apiCache.set(key, data, ttlMs);
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    apiCache.delete(key);
  }

  /**
   * Clear cache by pattern (e.g., "courses:*")
   */
  async clearPattern(pattern: string): Promise<void> {
    apiCache.clearPattern(pattern);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    apiCache.clear();
  }

  /**
   * Get cache stats
   */
  async getStats() {
    return {
      type: 'memory',
      connected: true,
      ...apiCache.getStats(),
    };
  }

  /**
   * Check if Redis is available (always false now)
   */
  isRedisAvailable(): boolean {
    return false;
  }

  /**
   * Close connection (no-op for in-memory cache)
   */
  async close(): Promise<void> {
    // No-op
  }
}

// Singleton instance
export const redisCache = new MemoryCache();

