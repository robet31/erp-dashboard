import { NextRequest, NextResponse } from 'next/server';

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://34.101.192.135:8080';
// Server-side only — aman, tidak exposed ke browser
const API_KEY = process.env.FRAPPE_API_KEY || '';
const API_SECRET = process.env.FRAPPE_API_SECRET || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'DELETE');
}

async function proxyToFrappe(request: NextRequest, pathSegments: string[], method: string) {
  let frappeUrl = '';
  try {
    frappeUrl = `${FRAPPE_URL}/api/${pathSegments.join('/')}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${frappeUrl}?${searchParams}` : frappeUrl;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Debug: Log apakah API key ada atau tidak
    console.log('[Frappe Proxy] API Key configured:', API_KEY ? 'YES' : 'NO');
    console.log('[Frappe Proxy] API Secret configured:', API_SECRET ? 'YES' : 'NO');

    // Gunakan API token (server-side) — lebih aman dari cookies
    if (API_KEY && API_SECRET) {
      headers['Authorization'] = `token ${API_KEY}:${API_SECRET}`;
    } else {
      console.warn('[Frappe Proxy] WARNING: No API Key/Secret configured!');
    }

    const options: RequestInit = { 
      method, 
      headers,
    };

    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch { /* no body */ }
    }

    console.log('[Frappe Proxy] Request:', method, fullUrl);
    const response = await fetch(fullUrl, options);
    console.log('[Frappe Proxy] Response status:', response.status);

    // Handle 403 Forbidden
    if (response.status === 403) {
      const errorText = await response.text();
      console.error('[Frappe Proxy] 403 Error response:', errorText);
      return NextResponse.json(
        { 
          error: 'Access Forbidden (403)', 
          message: 'API Key atau API Secret mungkin salah/expired',
          detail: 'Cek konfigurasi FRAPPE_API_KEY dan FRAPPE_API_SECRET di .env.local',
          serverResponse: errorText 
        },
        { status: 403 }
      );
    }

    // Handle 417 Expectation Failed - return empty data gracefully
    if (response.status === 417) {
      const pathStr = pathSegments.join('/');
      console.warn('[Frappe Proxy] 417 Error for:', pathStr);
      // For list endpoints, return empty array
      if (pathStr.includes('/resource/')) {
        return NextResponse.json({ data: [] });
      }
      return NextResponse.json(
        { error: 'Server ERP busy', message: 'Silakan coba lagi dalam beberapa saat' },
        { status: 200 } // Return 200 with empty to prevent client error
      );
    }

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    // Check for Frappe error messages
    if (data.exc || data.error || (data._server_messages)) {
      let errorMsg = data.message || data.error || 'Unknown error';
      try {
        if (data._server_messages) {
          const messages = JSON.parse(data._server_messages);
          errorMsg = messages[0] ? JSON.parse(messages[0]).message : errorMsg;
        }
      } catch { /* ignore parse errors */ }
      
      return NextResponse.json(
        { error: errorMsg },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Frappe Proxy] Error:', error, 'URL:', frappeUrl);
    return NextResponse.json(
      {
        error: 'Failed to connect to ERPNext',
        message: String(error),
        url: frappeUrl,
        hint: 'Periksa apakah server ERPNext aktif dan API Key benar di .env.local',
      },
      { status: 502 }
    );
  }
}
