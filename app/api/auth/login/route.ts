import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอก Username และ Password' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Username หรือ Password ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createToken(user);

    // ✅ FIX: Set cookie via Response headers (Next.js 15 compatible)
    const isSecure = process.env.COOKIE_SECURE === 'false'
      ? false
      : process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set cookie in response headers
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days (matching JWT expiration)
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
