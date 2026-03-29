import { NextRequest, NextResponse } from 'next/server';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Credentials hanya diambil dari env (server-side only), tidak boleh di-expose ke client
const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://127.0.0.1:8080';
const API_KEY    = process.env.FRAPPE_API_KEY    || '';
const API_SECRET = process.env.FRAPPE_API_SECRET || '';

// ─── OFFLINE / MOCK MODE ──────────────────────────────────────────────────────
// Set NEXT_PUBLIC_USE_MOCK_DATA=true di .env.local untuk skip semua koneksi ke ERPNext.
// Berguna saat server ERPNext sedang mati agar tidak ada log timeout yang berisik.
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Timeout: 15s untuk server cloud (GCP) yang mungkin perlu wake-up time
const CONNECT_TIMEOUT_MS = 15_000;  // 15s — cloud server bisa sedikit lambat
const READ_TIMEOUT_MS    = 30_000;  // 30s untuk data besar (tidak digunakan tapi dokumentasi)

// Rate-limiting primitive (per proses, reset tiap deploy)
const _reqMap = new Map<string, number>();
const RATE_LIMIT = 60; // max requests per menit per IP
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
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
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

  // ── Offline / Mock mode: skip semua network call, langsung return 503 ──
  // api.ts sudah handle 503 dengan silent fallback ke mock data
  if (USE_MOCK) {
    return NextResponse.json(
      { ok: false, message: 'Offline mode aktif (NEXT_PUBLIC_USE_MOCK_DATA=true)' },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  // ── Rate limiting ──
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit: maksimal 60 request/menit.' },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  try {
    // ── Build URL ──
    frappeUrl = `${FRAPPE_URL}/api/${pathSegments.join('/')}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${frappeUrl}?${searchParams}` : frappeUrl;

    // ── Validate path (prevent SSRF) ──
    const allowedPaths = ['resource', 'method', 'auth'];
    if (!allowedPaths.some(p => pathSegments[0] === p)) {
      return NextResponse.json(
        { error: 'Forbidden path', message: 'Path tidak diizinkan.' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // ── Auth headers ──
    const hasAuth = Boolean(API_KEY && API_SECRET);
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (hasAuth) {
      // Token tidak di-log secara penuh untuk keamanan
      reqHeaders['Authorization'] = `token ${API_KEY}:${API_SECRET}`;
    }

    // ── AbortController dengan timeout ──
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

    const options: RequestInit = { method, headers: reqHeaders, signal: controller.signal };

    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch { /* no body — ok */ }
    }

    // Hanya log request jika dalam dev mode dan bukan request berulang
    // console.debug(`[Frappe Proxy] → ${method} ${fullUrl}`);

    let response: Response;
    try {
      response = await fetch(fullUrl, options);
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      const err = fetchError as Error & { code?: string };
      const isTimeout = err?.name === 'AbortError'
        || err?.code === 'UND_ERR_CONNECT_TIMEOUT'
        || err?.message?.includes('abort');

      const isConnRefused = err?.message?.includes('ECONNREFUSED')
        || err?.message?.includes('ENOTFOUND')
        || err?.message?.includes('fetch failed');

      // Log error tanpa credential (debug level — tidak muncul di production)
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Frappe Proxy] server offline (${isTimeout ? 'timeout' : 'connect error'})`);
      }

      return NextResponse.json(
        {
          offline: true,
          error: isTimeout ? 'Connection Timeout' : 'Connection Failed',
          message: isTimeout
            ? `Server ERPNext tidak merespons dalam ${CONNECT_TIMEOUT_MS / 1000} detik. Data lama mungkin masih tersedia dari cache.`
            : isConnRefused
              ? `Tidak bisa terhubung ke ${FRAPPE_URL}. Pastikan server ERPNext aktif.`
              : `Gagal fetch: ${err?.message}`,
          hint: 'Data akan ditampilkan dari cache lokal jika tersedia.',
          retryAfter: 10,
        },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    // Only log non-200 responses for debugging
    if (process.env.NODE_ENV === 'development' && response.status !== 200) {
      console.debug(`[Frappe Proxy] ← ${response.status} for ${pathSegments.join('/')}`);
    }

    // ── Handle Frappe error codes ──
    if (response.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'API Key/Secret tidak valid atau kosong.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'User tidak punya akses ke resource ini.' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Resource tidak ditemukan di ERPNext.' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // ── Parse response ──
    let data: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    // No caching — always return fresh data for real-time sync
    const respHeaders: Record<string, string> = { 
      ...CORS_HEADERS,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    return NextResponse.json(data, { status: response.status, headers: respHeaders });

  } catch (error: unknown) {
    const err = error as Error;
    // Do NOT log sensitive info
    console.error('[Frappe Proxy] ❌ Unexpected error:', err?.message, '| Path:', frappeUrl.replace(FRAPPE_URL, '[FRAPPE_URL]'));
    return NextResponse.json(
      {
        error: 'Internal Proxy Error',
        message: 'Terjadi kesalahan internal pada proxy. Coba lagi.',
        offline: true,
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}