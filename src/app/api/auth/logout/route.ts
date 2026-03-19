import { NextResponse } from 'next/server';

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://34.101.192.135:8080';

export async function POST() {
  try {
    await fetch(`${FRAPPE_URL}/api/method/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch { /* ignore */ }

  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.delete('frappe_session');
  return res;
}
