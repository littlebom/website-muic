/**
 * Cache Headers Helper
 * สำหรับเพิ่ม cache headers ใน API responses
 */

export interface CacheConfig {
  /** Cache duration ในหน่วยวินาที */
  maxAge: number;
  /** ให้ browser cache ได้หรือไม่ (default: true) */
  public?: boolean;
  /** Revalidate every request (default: false) */
  mustRevalidate?: boolean;
  /** Stale-while-revalidate duration (optional) */
  staleWhileRevalidate?: number;
}

/**
 * สร้าง Cache-Control header string
 */
export function getCacheControl(config: CacheConfig): string {
  const parts: string[] = [];

  parts.push(config.public !== false ? 'public' : 'private');
  parts.push(`max-age=${config.maxAge}`);

  if (config.mustRevalidate) {
    parts.push('must-revalidate');
  }

  if (config.staleWhileRevalidate) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  return parts.join(', ');
}

/**
 * Predefined cache configurations
 */
export const CACHE_CONFIGS = {
  /** No cache - สำหรับข้อมูลที่เปลี่ยนแปลงบ่อย */
  NO_CACHE: {
    maxAge: 0,
    public: false,
    mustRevalidate: true,
  } as CacheConfig,

  /** Short cache (1 นาที) - สำหรับ dynamic content */
  SHORT: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30,
  } as CacheConfig,

  /** Medium cache (5 นาที) - สำหรับ semi-static content */
  MEDIUM: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60,
  } as CacheConfig,

  /** Long cache (15 นาที) - สำหรับ static content */
  LONG: {
    maxAge: 900, // 15 minutes
    staleWhileRevalidate: 300,
  } as CacheConfig,

  /** Very long cache (1 ชั่วโมง) - สำหรับ rarely changing content */
  VERY_LONG: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 900,
  } as CacheConfig,

  /** Static files (1 วัน) */
  STATIC: {
    maxAge: 86400, // 24 hours
    public: true,
  } as CacheConfig,
};

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  headers: Headers,
  config: CacheConfig | keyof typeof CACHE_CONFIGS
): void {
  const cacheConfig = typeof config === 'string' ? CACHE_CONFIGS[config] : config;
  headers.set('Cache-Control', getCacheControl(cacheConfig));
}
