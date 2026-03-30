import { NextRequest, NextResponse } from 'next/server';

// ─── CONFIG KONEKSI FRAPPE ───────────────────────────────────────────────────
// URL dan Kredensial hardcoded sesuai permintaan
const FRAPPE_URL = 'https://erpnextgcpnew.browniesqu.my.id';
const API_KEY    = 'e0473f1b24140b9';
const API_SECRET = '8d3f1310796a1b0';

// Pastikan Mock mode mati agar selalu menarik data asli
const USE_MOCK = false; 

// Timeout bertingkat: 5s connect timeout, fallback 503
const CONNECT_TIMEOUT_MS = 5_000;   
const READ_TIMEOUT_MS    = 15_000;  

// Rate-limiting primitive
const _reqMap = new Map<string, number>();
const RATE_LIMIT = 600; // Dilonggarkan agar tidak cepat terblokir saat testing
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const count = _reqMap.get(ip) || 0;
  if (count === 0) {
    setTimeout(() => _reqMap.delete(ip), RATE_WINDOW);
  }
  _reqMap.set(ip, count + 1);
  return count < RATE_LIMIT;
}

// ─── CORS HEADERS ─────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ─── ROUTE HANDLERS ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyToFrappe(request, resolvedParams.path, 'DELETE');
}

// ─── PROXY CORE ──────────────────────────────────────────────────────────────
async function proxyToFrappe(request: NextRequest, pathSegments: string[], method: string) {
  let frappeUrl = '';

  if (USE_MOCK) {
    return NextResponse.json(
      { ok: false, message: 'Offline mode aktif' },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit tercapai.' },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  try {
    // ── Build URL ──
    frappeUrl = `${FRAPPE_URL}/api/${pathSegments.join('/')}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${frappeUrl}?${searchParams}` : frappeUrl;

    const allowedPaths = ['resource', 'method', 'auth'];
    if (!allowedPaths.some(p => pathSegments[0] === p)) {
      return NextResponse.json({ error: 'Forbidden path' }, { status: 403, headers: CORS_HEADERS });
    }

    // ── PENGATURAN HEADER AUTHORIZATION KE FRAPPE ──
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Format resmi Frappe API: "token <api_key>:<api_secret>"
      'Authorization': `token ${API_KEY}:${API_SECRET}`
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

    const options: RequestInit = { method, headers: reqHeaders, signal: controller.signal };

    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch { /* no body */ }
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, options);
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const err = fetchError as Error;
      console.error(`[Frappe Proxy] Gagal fetch ke ${fullUrl}:`, err.message);
      
      return NextResponse.json(
        { offline: true, error: 'Connection Failed', message: `Tidak bisa terhubung ke ${FRAPPE_URL}.` },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    if (response.status === 401) {
      return NextResponse.json({ error: 'Unauthorized', message: 'API Key/Secret tidak valid atau ditolak server.' }, { status: 401, headers: CORS_HEADERS });
    }
    if (response.status === 403) {
      return NextResponse.json({ error: 'Forbidden', message: 'User API tidak punya akses (Cek Role Profile di ERPNext).' }, { status: 403, headers: CORS_HEADERS });
    }
    if (response.status === 404) {
      return NextResponse.json({ error: 'Not Found', message: 'Data tidak ditemukan di ERPNext.' }, { status: 404, headers: CORS_HEADERS });
    }

    let data: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    const respHeaders: Record<string, string> = { ...CORS_HEADERS };
    if (method === 'GET' && response.status === 200) {
      respHeaders['Cache-Control'] = 'public, s-maxage=5, stale-while-revalidate=10';
    }

    return NextResponse.json(data, { status: response.status, headers: respHeaders });

  } catch (error: unknown) {
    console.error('[Frappe Proxy] Error Internal:', error);
    return NextResponse.json({ error: 'Internal Proxy Error', offline: true }, { status: 502, headers: CORS_HEADERS });
  }
}