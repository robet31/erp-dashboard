// src/lib/api.ts
// Central API helper — semua request ke ERPNext melalui Next.js proxy
// Token ditangani di server-side (/api/frappe/[...path]/route.ts)

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

// Generic GET list
export async function apiGetList<T>(doctype: string, params?: FrappeListParams): Promise<T[]> {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit_page_length', String(params.limit));
  if (params?.fields) q.set('fields', JSON.stringify(params.fields));
  if (params?.filters) q.set('filters', JSON.stringify(params.filters));
  if (params?.orderBy) q.set('order_by', `${params.orderBy} ${params.orderDir || 'desc'}`);

  const encodedDoctype = encodeURIComponent(doctype);
  const url = `/api/frappe/resource/${encodedDoctype}${q.toString() ? '?' + q.toString() : ''}`;

  try {
    const res = await fetch(url, { 
      method: 'GET', 
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errData = await res.json();
        errMsg = errData.message || errData.error || errData._server_messages || errMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errMsg);
    }
    
    const json: FrappeListResponse<T> = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('[apiGetList] Error:', err, 'URL:', url);
    if (err instanceof TypeError) {
      throw new Error('Tidak dapat terhubung ke server ERP. Periksa koneksi jaringan atau server Frappe.');
    }
    throw err;
  }
}

// Generic GET single document
export async function apiGetDoc<T>(doctype: string, name: string): Promise<T> {
  const encodedDoctype = encodeURIComponent(doctype);
  const encodedName = encodeURIComponent(name);
  const url = `/api/frappe/resource/${encodedDoctype}/${encodedName}`;

  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
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

// Generic POST create
export async function apiCreate<T>(doctype: string, data: Partial<T>): Promise<T> {
  const encodedDoctype = encodeURIComponent(doctype);
  const url = `/api/frappe/resource/${encodedDoctype}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.exception || err.error || `HTTP ${res.status}`);
    }
    const json: FrappeSingleResponse<T> = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[apiCreate] Error:', err);
    if (err instanceof TypeError && err.message === 'fetch failed') {
      throw new Error('Tidak dapat terhubung ke server ERP. Periksa koneksi jaringan Anda.');
    }
    throw err;
  }
}

// Generic PUT update
export async function apiUpdate<T>(doctype: string, name: string, data: Partial<T>): Promise<T> {
  const encodedDoctype = encodeURIComponent(doctype);
  const encodedName = encodeURIComponent(name);
  const url = `/api/frappe/resource/${encodedDoctype}/${encodedName}`;

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.exception || err.error || `HTTP ${res.status}`);
    }
    const json: FrappeSingleResponse<T> = await res.json();
    return json.data;
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
      headers: { Accept: 'application/json' },
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
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
