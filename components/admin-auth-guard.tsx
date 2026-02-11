"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AdminAuthGuard] Checking auth for path:', pathname);

      // Skip auth check for login page
      if (pathname === "/admin/login") {
        console.log('[AdminAuthGuard] Login page - skip auth check');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        console.log('[AdminAuthGuard] Fetching session...');
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include", // ส่ง cookies ไปด้วย
          cache: "no-cache", // ไม่ cache response
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log('[AdminAuthGuard] Session response:', { status: response.status, data });

        if (data.success) {
          console.log('[AdminAuthGuard] ✅ Authenticated as:', data.user?.username);
          setIsAuthenticated(true);
        } else {
          console.warn('[AdminAuthGuard] ❌ Session check failed:', data);
          console.log('[AdminAuthGuard] Redirecting to login...');
          router.push("/admin/login");
        }
      } catch (error) {
        console.error('[AdminAuthGuard] ❌ Auth check error:', error);
        console.log('[AdminAuthGuard] Redirecting to login...');
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}
