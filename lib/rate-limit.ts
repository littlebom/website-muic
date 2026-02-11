/**
 * Simple In-Memory Rate Limiter
 * สำหรับ Phase 1 - ป้องกัน DOS attacks
 *
 * ⚠️ Note: ใช้ in-memory store ซึ่งไม่ work กับ horizontal scaling
 * Phase 3 ควรเปลี่ยนเป็น Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  /** จำนวน requests สูงสุดต่อ window */
  limit: number;
  /** Window time ในหน่วยมิลลิวินาที (default: 60000 = 1 นาที) */
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Rate limit checker
 * @param identifier - Unique identifier (IP address, API key, etc.)
 * @param config - Rate limit configuration
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs = 60000 } = config;
  const now = Date.now();

  let entry = store.get(identifier);

  // Create new entry if not exists or expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    store.set(identifier, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return {
    success,
    limit,
    remaining,
    reset: new Date(entry.resetTime),
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Try various headers for IP
  const headers = request.headers;

  // Check Cloudflare
  let ip: string | null = headers.get('cf-connecting-ip');

  // Check other common proxy headers
  if (!ip) ip = headers.get('x-real-ip');
  if (!ip) ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (!ip) ip = headers.get('x-client-ip');

  // Fallback
  return ip || 'unknown';
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  /** API routes ทั่วไป: 100 req/นาที */
  API_DEFAULT: { limit: 100, windowMs: 60000 },

  /** Auth routes (login, register): 5 req/นาที */
  API_AUTH: { limit: 5, windowMs: 60000 },

  /** Search/Query routes: 30 req/นาที */
  API_SEARCH: { limit: 30, windowMs: 60000 },

  /** Write operations (POST, PUT, DELETE): 20 req/นาที */
  API_WRITE: { limit: 20, windowMs: 60000 },

  /** Heavy operations (analytics, reports): 10 req/นาที */
  API_HEAVY: { limit: 10, windowMs: 60000 },

  /** Polling endpoints (chatbot, notifications): 200 req/นาที */
  API_POLLING: { limit: 200, windowMs: 60000 },

  /** Public pages: 200 req/นาที */
  PAGE_PUBLIC: { limit: 200, windowMs: 60000 },
};
