import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/mysql-direct";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth";

export async function GET() {
  try {
    // Only Super Admin can access
    await requireSuperAdmin();

    const users = await query(
      `SELECT id, username, name, email, role, isActive, lastLogin, createdAt, updatedAt
       FROM admin_users
       ORDER BY createdAt DESC`
    );

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Super Admin access required",
        },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admin users",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only Super Admin can create users
    await requireSuperAdmin();

    const body = await request.json();

    // Validate required fields
    if (!body.username || !body.password || !body.name || !body.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: username, password, name, email",
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await queryOne(
      'SELECT id FROM admin_users WHERE username = ?',
      [body.username]
    );

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Username already exists",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await queryOne(
      'SELECT id FROM admin_users WHERE email = ?',
      [body.email]
    );

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const id = `user-${Date.now()}`;
    const now = new Date();

    // Create new admin user
    await execute(
      `INSERT INTO admin_users (id, username, password, name, email, role, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.username,
        hashedPassword,
        body.name,
        body.email,
        body.role || "admin",
        body.isActive !== undefined ? body.isActive : true,
        now,
        now
      ]
    );

    const newUser = await queryOne(
      `SELECT id, username, name, email, role, isActive, createdAt, updatedAt
       FROM admin_users WHERE id = ?`,
      [id]
    );

    return NextResponse.json(
      {
        success: true,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create admin user",
      },
      { status: 500 }
    );
  }
}
