import { NextRequest, NextResponse } from 'next/server';

const FRAPPE_URL = process.env.FRAPPE_URL || 'http://34.101.192.135:8080';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const res = await fetch(`${FRAPPE_URL}/api/method/frappe.auth.get_logged_user`, {
      headers: { Cookie: cookie, Accept: 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Guest' });
  }
}
