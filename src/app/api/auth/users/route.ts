import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ 
      users: users.map(u => ({
        name: u.id,
        full_name: u.full_name,
        first_name: u.full_name?.split(' ')[0] || '',
        last_name: u.full_name?.split(' ').slice(1).join(' ') || '',
        email: u.email,
        enabled: 1,
        role: u.role,
        creation: u.created_at?.toISOString(),
        source: 'postgres',
      }))
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ users: [], error: 'Failed to fetch users from database' }, { status: 200 });
  }
}

// PATCH: Update a user's role or info
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, full_name, enabled } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (full_name) updateData.full_name = full_name;
    // enabled is handled at Frappe level, not in our DB

    const updated = await prisma.user.update({
      where: { email },
      data: updateData,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE: Remove a user from the database
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { email } });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
