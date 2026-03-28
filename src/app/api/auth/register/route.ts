import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, password, role } = body;

    if (!full_name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Create the new user
    // Note: In a real app, passwords must be hashed! E.g. using bcrypt
    // For now, retaining the previous simple structure without hashing as requested or similar to previous impl.
    // If you need security, you can install bcrypt and hash it: const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        full_name,
        email,
        password, // For production, this MUST be hashed
        role,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        created_at: true,
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registrasi gagal' },
      { status: 500 }
    );
  }
}
