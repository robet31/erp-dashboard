// src/lib/frappe-client.ts
// Frappe/ERPNext API Client

import type { FrappeListParams } from './frappe-types';

const FRAPPE_BASE = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://34.101.192.135:8080';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
const API_KEY = process.env.NEXT_PUBLIC_FRAPPE_API_KEY;
const API_SECRET = process.env.NEXT_PUBLIC_FRAPPE_API_SECRET;

class FrappeAPIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'FrappeAPIError';
  }
}

// Build query string from Frappe list params
function buildQueryString(params: FrappeListParams): string {
  const query = new URLSearchParams();
  if (params.fields) query.set('fields', JSON.stringify(params.fields));
  if (params.filters) query.set('filters', JSON.stringify(params.filters));
  if (params.order_by) query.set('order_by', params.order_by);
  if (params.limit_page_length) query.set('limit_page_length', String(params.limit_page_length));
  if (params.limit_start) query.set('limit_start', String(params.limit_start));
  if (params.or_filters) query.set('or_filters', JSON.stringify(params.or_filters));
  if (params.group_by) query.set('group_by', params.group_by);
  return query.toString();
}

// Get auth headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Use API Key authentication if available
  if (API_KEY && API_SECRET) {
    headers['Authorization'] = `token ${API_KEY}:${API_SECRET}`;
  } else {
    // Fallback to session cookie
    if (typeof window !== 'undefined') {
      const sid = localStorage.getItem('frappe_sid');
      if (sid) {
        headers['Cookie'] = `sid=${sid}`;
      }
    }
  }
  
  return headers;
}

// Generic fetch wrapper
async function fetchFrappe<T>(url: string, options?: RequestInit): Promise<T> {
  // Check if we need to use the proxy
  let fetchUrl = url;
  let useProxy = false;
  
  if (url.startsWith(FRAPPE_BASE) && typeof window !== 'undefined') {
    // Convert direct URL to proxy URL
    const path = url.replace(FRAPPE_BASE + '/api/', '');
    fetchUrl = `/api/frappe/${path}`;
    useProxy = true;
  }
  
  const headers = {
    ...getAuthHeaders(),
    ...options?.headers,
  };
  
  const response = await fetch(fetchUrl, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData._server_messages || errData.message || errData.error || errorMsg;
    } catch { /* ignore */ }
    throw new FrappeAPIError(errorMsg, response.status);
  }

  const data = await response.json();
  return data;
}

// ─── AUTH ──────────────────────────────────────────
export async function loginToFrappe(usr: string, pwd: string) {
  const response = await fetchFrappe<{ message: string; sid?: string; full_name?: string }>(
    `${FRAPPE_BASE}/api/method/login`,
    {
      method: 'POST',
      body: JSON.stringify({ usr, pwd }),
    }
  );
  return response;
}

export async function logoutFromFrappe() {
  return fetchFrappe(`${FRAPPE_BASE}/api/method/logout`, { method: 'POST' });
}

export async function getLoggedUser(): Promise<string> {
  const res = await fetchFrappe<{ message: string }>(`${FRAPPE_BASE}/api/method/frappe.auth.get_logged_user`);
  return res.message;
}

// ─── GENERIC CRUD ──────────────────────────────────
export async function getList<T>(doctype: string, params: FrappeListParams = {}): Promise<T[]> {
  const qs = buildQueryString({ limit_page_length: 100, ...params });
  const url = `${FRAPPE_BASE}/api/resource/${encodeURIComponent(doctype)}?${qs}`;
  const res = await fetchFrappe<{ data: T[] }>(url);
  return res.data;
}

export async function getDoc<T>(doctype: string, name: string): Promise<T> {
  const url = `${FRAPPE_BASE}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
  const res = await fetchFrappe<{ data: T }>(url);
  return res.data;
}

export async function createDoc<T>(doctype: string, data: Partial<T>): Promise<T> {
  const url = `${FRAPPE_BASE}/api/resource/${encodeURIComponent(doctype)}`;
  const res = await fetchFrappe<{ data: T }>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateDoc<T>(doctype: string, name: string, data: Partial<T>): Promise<T> {
  const url = `${FRAPPE_BASE}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
  const res = await fetchFrappe<{ data: T }>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteDoc(doctype: string, name: string): Promise<void> {
  const url = `${FRAPPE_BASE}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
  await fetchFrappe(url, { method: 'DELETE' });
}

// Frappe method call
export async function callFrappeMethod<T>(method: string, args?: Record<string, unknown>): Promise<T> {
  const url = `${FRAPPE_BASE}/api/method/${method}`;
  const res = await fetchFrappe<{ message: T }>(url, {
    method: 'POST',
    body: JSON.stringify(args || {}),
  });
  return res.message;
}

export { USE_MOCK, FRAPPE_BASE, API_KEY, API_SECRET };
