"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useSessionRefresh() {
    const router = useRouter();

    useEffect(() => {
        // 20 minutes in milliseconds
        const REFRESH_INTERVAL = 20 * 60 * 1000;

        const refreshSession = async () => {
            try {
                const response = await fetch("/api/auth/refresh", {
                    method: "POST",
                });

                if (!response.ok) {
                    // If refresh fails (e.g. token expired), redirect to login
                    // but only if it's a 401 error
                    if (response.status === 401) {
                        console.log("Session expired, redirecting to login");
                        router.push("/admin/login");
                    } else {
                        console.error("Failed to refresh session");
                    }
                } else {
                    console.log("Session refreshed successfully");
                }
            } catch (error) {
                console.error("Error refreshing session:", error);
            }
        };

        // Initial check (optional, but good to verify session on mount)
        // refreshSession(); 
        // Commented out initial check to avoid double-call on mount if not needed immediately
        // or we can let the interval handle it. Use interval to ensure it happens periodically.

        const intervalId = setInterval(refreshSession, REFRESH_INTERVAL);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [router]);
}
