import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oldEmail, newFullName, newEmail } = body;

    // 1. Validasi Input Dasar
    if (!oldEmail || !newFullName || !newEmail) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. Harap isi nama dan email.' },
        { status: 400 }
      );
    }

    // 2. Update Data di Database PostgreSQL menggunakan Prisma
    const updatedUser = await prisma.user.update({
      where: { 
        email: oldEmail 
      },
      data: {
        full_name: newFullName,
        email: newEmail,
      }
    });

    // 3. Kembalikan Respon Sukses ke Frontend
    return NextResponse.json(
      { message: 'Profil berhasil diperbarui!', user: updatedUser },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error Update Profile:', error);
    
    // P2002 adalah kode error resmi Prisma jika ada konflik data "Unique"
    // Contoh: User mengganti email dengan email yang ternyata sudah dipakai akun lain.
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email tersebut sudah terdaftar dan digunakan oleh akun lain.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan internal pada server saat menyimpan profil.' },
      { status: 500 }
    );
  } finally {
    // Memutus koneksi prisma setelah selesai
    await prisma.$disconnect();
  }
}