// src/lib/api.ts
// Central API helper — request ke ERPNext melalui Next.js proxy

export interface FrappeListParams {
  limit?: number;
  fields?: string[];
  filters?: [string, string, string, string | number | boolean][];
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface FrappeListResponse<T> { data: T[]; }
export interface FrappeSingleResponse<T> { data: T; }

// ─── CIRCUIT BREAKER ───────────────────────────────────────────────────────
const _cb = { offline: false, until: 0, count: 0 };
const OFFLINE_TTL_MS = 60_000; 

function circuitIsOpen(): boolean {
  if (_cb.offline && Date.now() < _cb.until) return true;
  if (_cb.offline) { _cb.offline = false; _cb.count = 0; }
  return false;
}

function tripCircuit(reason: string) {
  _cb.offline = true;
  _cb.count++;
  _cb.until = Date.now() + OFFLINE_TTL_MS;
}
// ───────────────────────────────────────────────────────────────────────────

export async function apiGetList<T>(doctype: string, params?: FrappeListParams): Promise<T[]> {
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
    // Tidak perlu kirim Authorization header dari client, Proxy Route yang akan menambahkannya
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (res.status === 503 || res.status === 502) {
      tripCircuit(`HTTP ${res.status} for ${doctype}`);
      const empty: T[] = [];
      (empty as any).__offline = true;
      return empty;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error((errData.message || errData.error || `HTTP ${res.status}`) as string);
    }

    _cb.offline = false;
    _cb.count = 0;
    const json: FrappeListResponse<T> = await res.json();
    return json.data || [];

  } catch (err) {
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
      tripCircuit(`Network error for ${doctype}`);
      const empty: T[] = [];
      (empty as any).__offline = true;
      return empty;
    }
    throw err;
  }
}

export async function apiGetDoc<T>(doctype: string, name: string): Promise<T> {
  const url = `/api/frappe/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
  const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: FrappeSingleResponse<T> = await res.json();
  return json.data;
}

export async function apiCreate<T>(doctype: string, data: Partial<T>): Promise<T> {
  const url = `/api/frappe/resource/${encodeURIComponent(doctype)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json.data || json;
}

export async function apiUpdate<T>(doctype: string, name: string, data: Partial<T>): Promise<T> {
  const url = `/api/frappe/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json.data || json;
}

export async function apiDelete(doctype: string, name: string): Promise<void> {
  const url = `/api/frappe/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
  const res = await fetch(url, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}