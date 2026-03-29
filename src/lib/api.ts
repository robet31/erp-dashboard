// src/lib/api.ts
// Central API helper — semua request ke ERPNext melalui Next.js proxy
// Token disisipkan secara eksplisit untuk mencegah 403 Forbidden

export interface FrappeListParams {
  limit?: number;
  fields?: string[];
  filters?: [string, string, string, string | number | boolean][];
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface FrappeListResponse<T> {
  data: T[];
}

export interface FrappeSingleResponse<T> {
  data: T;
}

const API_KEY = process.env.NEXT_PUBLIC_FRAPPE_API_KEY || '';
const API_SECRET = process.env.NEXT_PUBLIC_FRAPPE_API_SECRET || '';
const AUTH_TOKEN = `token ${API_KEY}:${API_SECRET}`;

// ─── CIRCUIT BREAKER ───────────────────────────────────────────────────────
// After N consecutive server failures, skip retrying for OFFLINE_TTL_MS to
// avoid flooding logs and blocking renders with long timeouts on every load.
const _cb = { offline: false, until: 0, count: 0 };
const OFFLINE_TTL_MS = 30_000;  // 30 seconds cooldown (was 60)
const FAILURE_THRESHOLD = 3;    // trip after 3 consecutive failures (was 1)

function circuitIsOpen(): boolean {
  if (_cb.offline && Date.now() < _cb.until) return true; // Still in cooldown
  if (_cb.offline) {
    // Cooldown expired — try once more
    _cb.offline = false;
    _cb.count = 0;
  }
  return false;
}

function tripCircuit(reason: string) {
  _cb.count++;
  if (_cb.count >= FAILURE_THRESHOLD) {
    _cb.offline = true;
    _cb.until = Date.now() + OFFLINE_TTL_MS;
    if (typeof window !== 'undefined') {
      console.debug(`[ERP] Server offline after ${FAILURE_THRESHOLD} failures (${reason}). Skipping for ${OFFLINE_TTL_MS / 1000}s.`);
    }
  }
}
// ───────────────────────────────────────────────────────────────────────────

export async function apiGetList<T>(doctype: string, params?: FrappeListParams): Promise<T[]> {
  // ── Circuit breaker: skip request if server is known offline ──
  if (circuitIsOpen()) {
    const empty: T[] = [];
    (empty as any).__offline = true;
    return empty;
  }

  const q = new URLSearchParams();
  if (params?.limit) q.set('limit_page_length', String(params.limit));
  q.set('fields', params?.fields ? JSON.stringify(params.fields) : '["*"]');
  if (params?.filters) q.set('filters', JSON.stringify(params.filters));
  if (params?.orderBy) q.set('order_by', `${params.orderBy} ${params.orderDir || 'desc'}`);

  const encodedDoctype = encodeURIComponent(doctype);
  const url = `/api/frappe/resource/${encodedDoctype}${q.toString() ? '?' + q.toString() : ''}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Authorization': AUTH_TOKEN },
      cache: 'no-store',
    });

    // ── Offline / unreachable server → trip circuit breaker & return [] ──
    if (res.status === 503 || res.status === 502) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      tripCircuit(`HTTP ${res.status} for ${doctype}`);
      const empty: T[] = [];
      (empty as any).__offline = true;
      (empty as any).__message = body.message || 'Server tidak tersedia';
      return empty;
    }

    // ── Real client/server errors → throw so callers know ──
    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as Record<string, unknown>;
      const errMsg = (errData.message || errData.error || `HTTP ${res.status}`) as string;
      throw new Error(errMsg);
    }

    // ── Success → reset circuit breaker ──
    _cb.offline = false;
    _cb.count = 0;
    const json: FrappeListResponse<T> = await res.json();
    return json.data || [];

  } catch (err) {
    // Network-level error (fetch failed = no connection at all)
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
      tripCircuit(`Network error for ${doctype}`);
      const empty: T[] = [];
      (empty as any).__offline = true;
      return empty;
    }
    // Rethrow real errors (4xx, logic errors, etc.)
    throw err;
  }
}

// Generic GET single document
export async function apiGetDoc<T>(doctype: string, name: string): Promise<T> {
  const encodedDoctype = encodeURIComponent(doctype);
  const encodedName = encodeURIComponent(name);
  const url = `/api/frappe/resource/${encodedDoctype}/${encodedName}`;

  try {
    const res = await fetch(url, { 
      method: 'GET', 
      headers: { 
        'Accept': 'application/json',
        'Authorization': AUTH_TOKEN
      } 
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }
    const json: FrappeSingleResponse<T> = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[apiGetDoc] Error:', err, 'URL:', url);
    if (err instanceof TypeError && err.message === 'fetch failed') {
      throw new Error('Tidak dapat terhubung ke server ERP. Periksa koneksi jaringan Anda.');
    }
    throw err;
  }
}

// Generic POST create (Digunakan untuk Buat BOM, SO, dll)
export async function apiCreate<T>(doctype: string, data: Partial<T>): Promise<T> {
  const encodedDoctype = encodeURIComponent(doctype);
  const url = `/api/frappe/resource/${encodedDoctype}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Authorization': AUTH_TOKEN
      },
      body: JSON.stringify(data),
    });
    
    const json = await res.json();
    if (!res.ok) {
      throw json; // Lempar JSON mentah agar bisa di-extract server messages-nya
    }
    return json.data || json;
  } catch (err) {
    console.warn('[apiCreate] Error:', err);
    if (err instanceof TypeError && err.message === 'fetch failed') {
      throw new Error('Tidak dapat terhubung ke server ERP. Periksa koneksi jaringan Anda.');
    }
    throw err; // Lempar terus ke UI
  }
}

// Generic PUT update (Digunakan untuk Submit, Start Produksi, Finish, dll)
export async function apiUpdate<T>(doctype: string, name: string, data: Partial<T>): Promise<T> {
  const encodedDoctype = encodeURIComponent(doctype);
  const encodedName = encodeURIComponent(name);
  const url = `/api/frappe/resource/${encodedDoctype}/${encodedName}`;

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Authorization': AUTH_TOKEN
      },
      body: JSON.stringify(data),
    });
    
    const json = await res.json();
    if (!res.ok) {
      throw json;
    }
    return json.data || json;
  } catch (err) {
    console.warn('[apiUpdate] Error:', err);
    if (err instanceof TypeError && err.message === 'fetch failed') {
      throw new Error('Tidak dapat terhubung ke server ERP. Periksa koneksi jaringan Anda.');
    }
    throw err;
  }
}

// Generic DELETE
export async function apiDelete(doctype: string, name: string): Promise<void> {
  const encodedDoctype = encodeURIComponent(doctype);
  const encodedName = encodeURIComponent(name);
  const url = `/api/frappe/resource/${encodedDoctype}/${encodedName}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 
        'Accept': 'application/json',
        'Authorization': AUTH_TOKEN
      },
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[apiDelete] Error:', err);
    if (err instanceof TypeError && err.message === 'fetch failed') {
      throw new Error('Tidak dapat terhubung ke server ERP. Periksa koneksi jaringan Anda.');
    }
    throw err;
  }
}

// Call Frappe method
export async function apiCallMethod<T = unknown>(method: string, args?: Record<string, unknown>): Promise<T> {
  const url = `/api/frappe/method/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json',
      'Authorization': AUTH_TOKEN
    },
    body: JSON.stringify(args || {}),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorMsg = err.message || err.exception || err.error || `HTTP ${res.status}`;
    throw new Error(errorMsg);
  }
  
  const json = await res.json();
  return json.message as T;
}

// Format ERPNext error message
export function formatAPIError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Terjadi kesalahan';
}