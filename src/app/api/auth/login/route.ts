import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://34.101.192.135:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, usr, pwd } = body;
    
    // Support both new field names (email/password) and old frappe field names (usr/pwd)
    const loginEmail = email || usr;
    const loginPassword = password || pwd;

    if (!loginEmail || !loginPassword) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // 1. Try PostgreSQL Database Login via Prisma
    try {
      const user = await prisma.user.findUnique({
        where: { email: loginEmail }
      });

      if (user && user.password === loginPassword) {
        // Success from Postgres
        return NextResponse.json({
          success: true,
          source: 'postgres',
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        });
      }
    } catch (dbError) {
      console.error('PostgreSQL query error (maybe not configured setup):', dbError);
    }

    // 2. Fallback to Frappe / ERPNext API if user not in Postgres or DB error
    try {
      const response = await fetch(`${FRAPPE_URL}/api/method/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ usr: loginEmail, pwd: loginPassword }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const res = NextResponse.json({ ...data, source: 'frappe' });
        
        // Forward cookies from Frappe
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          res.headers.set('set-cookie', cookies);
        }
        return res;
      }
    } catch (frappeError) {
      console.error('Frappe login error:', frappeError);
    }

    // Both failed
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json({ error: 'Login gagal' }, { status: 500 });
  }
}
