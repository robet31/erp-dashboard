import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto'; // Module bawaan NodeJS, tidak perlu npm install

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

// Fungsi kecil untuk mengenkripsi password dengan SHA-256 bawaan Node.js
// (Abaikan fungsi ini jika database Anda menggunakan Plain Text)
const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 1. Validasi Input Dasar
    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. Harap isi semua kolom.' },
        { status: 400 }
      );
    }

    // 2. Cari User di Database
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan.' },
        { status: 404 }
      );
    }

// 3. Verifikasi Password Lama
    // KITA GUNAKAN PLAIN TEXT (TEKS BIASA)
    const isPasswordMatch = currentPassword === user.password;

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Password lama yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // 4. Siapkan Password Baru
    // KITA GUNAKAN PLAIN TEXT (TEKS BIASA)
    const passwordToSave = newPassword;

    // 5. Update Password di Database
    await prisma.user.update({
      where: { email: email },
      data: { password: passwordToSave }
    });

    // 6. Kembalikan Respon Sukses
    return NextResponse.json(
      { message: 'Password berhasil diperbarui!' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error Change Password:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server internal.' },
      { status: 500 }
    );
  } finally {
    // Memutus koneksi prisma setelah selesai
    await prisma.$disconnect();
  }
}