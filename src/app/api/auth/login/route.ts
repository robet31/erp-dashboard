import { NextRequest, NextResponse } from 'next/server';

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://34.101.192.135:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${FRAPPE_URL}/api/method/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();
    
    const res = NextResponse.json(data);
    
    // Forward cookies from Frappe
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      res.headers.set('set-cookie', cookies);
    }
    
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
