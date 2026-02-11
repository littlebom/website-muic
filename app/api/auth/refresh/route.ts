import { NextResponse } from 'next/server';
import { getSession, createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 401 }
      );
    }

    // Create new token with refreshed expiration
    const newToken = await createToken(session);

    const isSecure = process.env.COOKIE_SECURE === 'false'
      ? false
      : process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      user: session,
    });

    // Set new cookie with extended expiration
    response.cookies.set({
      name: COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}
