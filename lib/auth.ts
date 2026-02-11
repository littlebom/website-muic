import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { queryOne, execute } from './mysql-direct';
import { AdminRole } from './types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'thai-mooc-secret-key-change-in-production'
);

export const COOKIE_NAME = 'admin_session';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  institutionId?: string | null;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create JWT token
export async function createToken(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // ✅ Extended to 7 days (from 24h) with auto-refresh
    .sign(SECRET_KEY);

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload.user as SessionUser;
  } catch (error) {
    return null;
  }
}

// Get current session
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Set session cookie
export async function setSession(user: SessionUser): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();

  // ✅ FIX: Allow overriding secure flag via environment variable
  // This is needed when running production build on HTTP (without HTTPS/SSL)
  const isSecure = process.env.COOKIE_SECURE === 'false'
    ? false
    : process.env.NODE_ENV === 'production';

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days (matching JWT expiration)
    path: '/',
  });
}

// Clear session cookie
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Require authentication (throws error if not authenticated)
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

// Authenticate user
export async function authenticateUser(
  username: string,
  password: string
): Promise<SessionUser | null> {
  const user = await queryOne<any>(
    'SELECT * FROM admin_users WHERE username = ?',
    [username]
  );

  if (!user || !user.isActive) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    return null;
  }

  // Update last login
  await execute(
    'UPDATE admin_users SET lastLogin = NOW() WHERE id = ?',
    [user.id]
  );

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role as AdminRole,
    institutionId: user.institutionId || null,
  };
}

// Check if user is Super Admin
export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === 'super_admin';
}

// Check if user is Institution Admin
export function isInstitutionAdmin(user: SessionUser | null): boolean {
  return user?.role === 'institution_admin' && !!user.institutionId;
}

// Check if user is Admin (any level)
export function isAdmin(user: SessionUser | null): boolean {
  return !!user && ['super_admin', 'institution_admin', 'admin'].includes(user.role);
}

/**
 * Check if user has access to a specific institution.
 * Returns true if:
 * 1. User is Super Admin (access all)
 * 2. User is Institution Admin AND matches the targetInstitutionId
 */
export function hasInstitutionAccess(user: SessionUser | null, targetInstitutionId: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'institution_admin' && user.institutionId === targetInstitutionId) return true;
  return false;
}

// Require Super Admin role (throws error if not super admin)
export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (!isSuperAdmin(session)) {
    throw new Error('Forbidden: Super Admin access required');
  }

  return session;
}
