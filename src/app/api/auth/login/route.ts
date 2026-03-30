import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Ganti dengan URL Frappe kamu
const FRAPPE_URL = 'https://erpnextgcpnew.browniesqu.my.id';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, usr, pwd } = body;
    
    const loginEmail = email || usr;
    const loginPassword = password || pwd;

    if (!loginEmail || !loginPassword) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: loginEmail }
      });

      if (user && user.password === loginPassword) {
        return NextResponse.json({
          success: true,
          source: 'postgres',
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        });
      }
    } catch (dbError) {
      console.error('PostgreSQL query error:', dbError);
    }

    try {
      const response = await fetch(`${FRAPPE_URL}/api/method/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ usr: loginEmail, pwd: loginPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        const res = NextResponse.json({ ...data, source: 'frappe' });
        
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          res.headers.set('set-cookie', cookies);
        }
        return res;
      }
    } catch (frappeError) {
      console.error('Frappe login error:', frappeError);
    }

    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json({ error: 'Login gagal' }, { status: 500 });
  }
}