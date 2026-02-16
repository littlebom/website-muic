import { NextRequest, NextResponse } from "next/server";
import { redisCache } from "@/lib/redis-cache";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // In a real app, you might want to add stricter auth checks here
        // For now, we rely on the middleware protection for /admin routes

        const body = await request.json();
        const pattern = body.pattern;

        if (pattern) {
            await redisCache.clearPattern(pattern);
            console.log(`[Cache] Cleared pattern: ${pattern}`);
        } else {
            await redisCache.clear();
            console.log('[Cache] Cleared all cache');
        }

        // Revalidate critical paths
        revalidatePath('/');
        revalidatePath('/courses');
        revalidatePath('/news');
        revalidatePath('/admin');

        return NextResponse.json({
            success: true,
            message: pattern ? `Cleared cache for pattern: ${pattern}` : "System cache cleared successfully",
        });
    } catch (error: any) {
        console.error('Failed to clear cache:', error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to clear cache",
            },
            { status: 500 }
        );
    }
}
