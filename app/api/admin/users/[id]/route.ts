import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/mysql-direct";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only Super Admin can access
    await requireSuperAdmin();

    const { id } = await params;
    const user = await queryOne(
      `SELECT id, username, name, email, role, isActive, lastLogin, createdAt, updatedAt
       FROM admin_users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admin user",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only Super Admin can update users
    await requireSuperAdmin();

    const { id } = await params;
    const body = await request.json();

    // Check if user exists
    const existingUser = await queryOne(
      'SELECT username, email FROM admin_users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if username is being changed and already exists
    if (body.username && body.username !== (existingUser as any).username) {
      const usernameExists = await queryOne(
        'SELECT id FROM admin_users WHERE username = ?',
        [body.username]
      );

      if (usernameExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Username already exists",
          },
          { status: 400 }
        );
      }
    }

    // Check if email is being changed and already exists
    if (body.email && body.email !== (existingUser as any).email) {
      const emailExists = await queryOne(
        'SELECT id FROM admin_users WHERE email = ?',
        [body.email]
      );

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Email already exists",
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updates: string[] = [];
    const values: any[] = [];

    if (body.username) {
      updates.push('username = ?');
      values.push(body.username);
    }
    if (body.name) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.email) {
      updates.push('email = ?');
      values.push(body.email);
    }
    if (body.role) {
      updates.push('role = ?');
      values.push(body.role);
    }
    if (body.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(body.isActive);
    }

    // Hash new password if provided
    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    updates.push('updatedAt = ?');
    values.push(new Date());

    values.push(id);

    // Update user
    await execute(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedUser = await queryOne(
      `SELECT id, username, name, email, role, isActive, lastLogin, createdAt, updatedAt
       FROM admin_users WHERE id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admin user",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only Super Admin can delete users
    await requireSuperAdmin();

    const { id } = await params;

    // Check if user exists
    const existingUser = await queryOne(
      'SELECT id FROM admin_users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Delete user
    await execute('DELETE FROM admin_users WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete admin user",
      },
      { status: 500 }
    );
  }
}
