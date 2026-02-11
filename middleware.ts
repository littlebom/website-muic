import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Global Middleware - Rate Limiting
 * ป้องกัน DOS attacks และจำกัดการใช้งาน API
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);

  // กำหนด rate limit config ตาม route
  let rateLimitConfig = RATE_LIMITS.PAGE_PUBLIC;

  if (pathname.startsWith('/api/')) {
    // API routes
    if (pathname === '/api/auth/refresh' || pathname === '/api/auth/session') {
      // Session endpoints - ใช้ limit สูงเพราะถูกเรียกบ่อย
      // - /api/auth/refresh: ถูกเรียกทุก 20 นาที
      // - /api/auth/session: ถูกเรียกทุกครั้งที่เปลี่ยนหน้า
      rateLimitConfig = RATE_LIMITS.API_DEFAULT;
    } else if (pathname === '/api/chat/messages' && request.method === 'GET') {
      // Chatbot polling - ใช้ limit สูงเพราะมี polling ทุก 5 วินาที (12 req/นาที)
      rateLimitConfig = RATE_LIMITS.API_POLLING;
    } else if (pathname.startsWith('/api/auth/')) {
      // Auth routes อื่นๆ (login, logout) - จำกัดเข้มงวด
      rateLimitConfig = RATE_LIMITS.API_AUTH;
    } else if (pathname.startsWith('/api/analytics')) {
      rateLimitConfig = RATE_LIMITS.API_HEAVY;
    } else if (
      pathname.includes('/search') ||
      pathname.startsWith('/api/courses') ||
      pathname.startsWith('/api/tickets/track')
    ) {
      rateLimitConfig = RATE_LIMITS.API_SEARCH;
    } else if (
      request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'DELETE' ||
      request.method === 'PATCH'
    ) {
      rateLimitConfig = RATE_LIMITS.API_WRITE;
    } else {
      rateLimitConfig = RATE_LIMITS.API_DEFAULT;
    }
  }

  // Check rate limit
  const result = rateLimit(`${clientIP}:${pathname}`, rateLimitConfig);

  // Add rate limit headers
  const response = result.success
    ? NextResponse.next()
    : NextResponse.json(
        {
          success: false,
          error: 'Too Many Requests',
          message: 'คุณส่ง request มากเกินไป กรุณารอสักครู่แล้วลองใหม่',
        },
        { status: 429 }
      );

  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString());

  return response;
}

/**
 * Config - กำหนด paths ที่ต้องการ rate limiting
 * ปล่อย static files (/\_next, /images, /favicon.ico ฯลฯ)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
