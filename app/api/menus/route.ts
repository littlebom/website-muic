import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/mysql-direct"; // Use direct MySQL
import { getSession } from "@/lib/auth"; // Use local auth
import { nanoid } from "nanoid";

// GET /api/menus - Get menus for an institution
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const institutionId = searchParams.get("institutionId");

        if (!institutionId) {
            return NextResponse.json(
                { error: "Institution ID is required" },
                { status: 400 }
            );
        }

        // Get all menus for this institution
        const menus = await db.query(
            "SELECT * FROM menus WHERE institutionId = ?",
            [institutionId]
        );

        // Build the complete response structure
        const responseData: { header: any[], footer: any[] } = {
            header: [],
            footer: []
        };

        // If menus exist, fetch their items
        for (const menu of menus as any[]) {
            const items = await db.query(
                "SELECT * FROM menu_items WHERE menuId = ? ORDER BY `order` ASC",
                [menu.id]
            );

            if (menu.position === 'header') {
                responseData.header = items;
            } else if (menu.position === 'footer') {
                responseData.footer = items;
            }
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Error fetching menus:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST /api/menus - Create/Update menus
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "super_admin" && session.role !== "institution_admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { institutionId, position, items } = body;

        if (!institutionId || !position || !Array.isArray(items)) {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        // Check if user is authorized for this institution
        if (session.role === "institution_admin" && session.institutionId !== institutionId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Check if menu exists for this position
        let menuId: string;
        const existingMenus = await db.query(
            "SELECT id FROM menus WHERE institutionId = ? AND position = ?",
            [institutionId, position]
        );

        const existingMenu = existingMenus[0] as any;

        if (existingMenu) {
            menuId = existingMenu.id;
            // Clear existing items to rewrite them (simple approach)
            await db.execute("DELETE FROM menu_items WHERE menuId = ?", [menuId]);
        } else {
            // Create new menu
            menuId = nanoid();
            await db.execute(
                "INSERT INTO menus (id, name, position, institutionId, isActive) VALUES (?, ?, ?, ?, ?)",
                [menuId, `${position.charAt(0).toUpperCase() + position.slice(1)} Menu`, position, institutionId, true]
            );
        }

        // 2. Insert new items
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await db.execute(
                "INSERT INTO menu_items (id, menuId, label, url, `order`, target) VALUES (?, ?, ?, ?, ?, ?)",
                [nanoid(), menuId, item.label, item.url, i, item.target || '_self']
            );
        }

        return NextResponse.json({ success: true, menuId });
    } catch (error) {
        console.error("Error saving menu:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
