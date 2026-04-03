import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Ambil semua data user dari PostgreSQL
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
      orderBy: { full_name: 'asc' }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Gagal mengambil data user' }, { status: 500 });
  }
}

// PUT: Update data user di PostgreSQL
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, full_name, role, password } = body;

    // Siapkan data yang akan di-update
    const dataToUpdate: any = { full_name, role };
    
    // Jika password diisi, ikut sertakan dalam update
    // Catatan: Jika Anda menggunakan hashing, lakukan hashing (bcrypt) disini
    if (password && password.trim() !== '') {
      dataToUpdate.password = password; 
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data user' }, { status: 500 });
  }
}

// DELETE: Hapus data user dari PostgreSQL
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email wajib disertakan' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { email },
    });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Gagal menghapus data user' }, { status: 500 });
  }
}