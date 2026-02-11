import { NextRequest, NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "./auth";

/**
 * Middleware to check if user is authenticated
 */
export async function withAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Middleware to check if user is Super Admin
 */
export async function withSuperAdmin(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isSuperAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Super Admin access required" },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Helper to create protected API handler with role check
 */
export function createProtectedHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  requireSuperAdmin = false
) {
  if (requireSuperAdmin) {
    return withSuperAdmin(handler);
  }
  return withAuth(handler);
}
