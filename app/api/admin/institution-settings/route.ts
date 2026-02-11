
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hasInstitutionAccess } from "@/lib/auth";
import db from "@/lib/mysql-direct";

export const dynamic = 'force-dynamic';

// GET: Fetch current institution settings
export async function GET(req: NextRequest) {
    try {
        const user = await requireAuth();

        if (!user.institutionId) {
            return NextResponse.json(
                { success: false, error: "No institution assigned to this user" },
                { status: 400 }
            );
        }

        if (!hasInstitutionAccess(user, user.institutionId)) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        // Fetch institution data
        const institution = await db.queryOne(
            `SELECT * FROM institutions WHERE id = ?`,
            [user.institutionId]
        );

        if (!institution) {
            return NextResponse.json(
                { success: false, error: "Institution not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: institution });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 401 }
        );
    }
}

// PUT: Update institution settings
export async function PUT(req: NextRequest) {
    try {
        const user = await requireAuth();
        const data = await req.json();

        if (!user.institutionId) {
            return NextResponse.json(
                { success: false, error: "No institution assigned to this user" },
                { status: 400 }
            );
        }

        if (!hasInstitutionAccess(user, user.institutionId)) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const allowedUpdates: any = {};
        const allowedFields = [
            'name', 'nameEn', 'description', 'descriptionEn', 'primaryColor', 'secondaryColor',
            'address', 'addressEn', 'phoneNumber', 'email', 'socialLinks',
            'website', 'bannerUrl', 'mapUrl'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                allowedUpdates[field] = data[field];
            }
        }

        // Construct SQL
        const setClause: string[] = [];
        const values: any[] = [];

        // JSON stringify socialLinks if it's an object
        if (allowedUpdates.socialLinks && typeof allowedUpdates.socialLinks === 'object') {
            allowedUpdates.socialLinks = JSON.stringify(allowedUpdates.socialLinks);
        }

        for (const [key, value] of Object.entries(allowedUpdates)) {
            setClause.push(`\`${key}\` = ?`);
            values.push(value);
        }

        // Add updatedAt
        setClause.push(`updatedAt = NOW()`);

        if (setClause.length === 0) {
            return NextResponse.json({ success: true, message: "No changes to save" });
        }

        values.push(user.institutionId);

        await db.execute(
            `UPDATE institutions SET ${setClause.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({ success: true, message: "Institution settings updated" });

    } catch (error: any) {
        console.error("Update error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
