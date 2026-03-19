'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Send, Copy, RefreshCw, ChevronDown, ChevronRight, Check } from 'lucide-react';

const FRAPPE_BASE = 'http://34.101.192.135:8080';

const PRESET_ENDPOINTS = [
  { label: 'GET - List Sales Orders', method: 'GET', path: '/api/resource/Sales Order', body: '', params: 'limit_page_length=20&fields=["name","customer_name","status","grand_total","transaction_date"]' },
  { label: 'GET - List Items', method: 'GET', path: '/api/resource/Item', body: '', params: 'limit_page_length=50&fields=["name","item_code","item_name","item_group","standard_rate"]' },
  { label: 'GET - List Work Orders', method: 'GET', path: '/api/resource/Work Order', body: '', params: 'limit_page_length=20&fields=["name","production_item","qty","produced_qty","status"]' },
  { label: 'GET - List Bin (Stock)', method: 'GET', path: '/api/resource/Bin', body: '', params: 'limit_page_length=50&fields=["name","item_code","warehouse","actual_qty","projected_qty","stock_value"]' },
  { label: 'GET - List Customers', method: 'GET', path: '/api/resource/Customer', body: '', params: 'limit_page_length=50&fields=["name","customer_name","customer_type","territory"]' },
  { label: 'GET - List BOM', method: 'GET', path: '/api/resource/BOM', body: '', params: 'limit_page_length=20&fields=["name","item","item_name","quantity","is_active","total_cost"]' },
  { label: 'GET - List Warehouses', method: 'GET', path: '/api/resource/Warehouse', body: '', params: 'limit_page_length=30&fields=["name","warehouse_name","company","is_group"]' },
  { label: 'GET - List Delivery Notes', method: 'GET', path: '/api/resource/Delivery Note', body: '', params: 'limit_page_length=20&fields=["name","customer_name","posting_date","status","total_qty"]' },
  { label: 'GET - Logged User', method: 'GET', path: '/api/method/frappe.auth.get_logged_user', body: '', params: '' },
  { label: 'POST - Create Sales Order', method: 'POST', path: '/api/resource/Sales Order', params: '', body: JSON.stringify({ customer: "PT Bangunan Jaya", delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], items: [{ item_code: "MJA-01", qty: 50, rate: 5000, warehouse: "Finished Goods - NV" }] }, null, 2) },
  { label: 'POST - Create Work Order', method: 'POST', path: '/api/resource/Work Order', params: '', body: JSON.stringify({ production_item: "BT-PET-600", bom_no: "BOM-BT-PET-600-001", qty: 10000, planned_start_date: new Date().toISOString().split('T')[0], fg_warehouse: "Finished Goods - NV", wip_warehouse: "Work In Progress - NV", company: "PT Nusantara Plastik" }, null, 2) },
  { label: 'POST - Create Stock Entry', method: 'POST', path: '/api/resource/Stock Entry', params: '', body: JSON.stringify({ stock_entry_type: "Material Receipt", posting_date: new Date().toISOString().split('T')[0], items: [{ item_code: "MJA-01", qty: 1000, t_warehouse: "Stores - NV", basic_rate: 1200 }] }, null, 2) },
];

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  GET: { bg: '#d1fae5', color: '#065f46' },
  POST: { bg: '#dbeafe', color: '#1d4ed8' },
  PUT: { bg: '#fef3c7', color: '#92400e' },
  DELETE: { bg: '#fee2e2', color: '#991b1b' },
};

export default function APITesterPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/resource/Sales Order');
  const [params, setParams] = useState('limit_page_length=20&fields=["name","customer_name","status","grand_total"]');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<{ data: unknown; status: number; time: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState(true);

  const sendRequest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    const startTime = Date.now();

    try {
      const cleanPath = path.replace(/^\/api\//, '').replace(/^api\//, '');
      const proxyUrl = `/api/frappe/${cleanPath}${params ? '?' + params : ''}`;

      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
      };
      if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
        options.body = body;
      }

      const res = await fetch(proxyUrl, options);
      const data = await res.json().catch(() => ({}));
      setResponse({ data, status: res.status, time: Date.now() - startTime });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (preset: typeof PRESET_ENDPOINTS[0]) => {
    setMethod(preset.method);
    setPath(preset.path);
    setParams(preset.params);
    setBody(preset.body);
    setResponse(null);
    setError(null);
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Redirect if user doesn't have access to api_tester module
  useEffect(() => {
    if (!canAccess('api_tester')) {
      router.push('/dashboard');
    }
  }, [canAccess, router]);

  const fullUrl = `${FRAPPE_BASE}${path}${params ? '?' + params : ''}`;

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>🔧 API Tester</h1>
        <p style={{ fontSize: '12px', color: '#6B7280' }}>Test endpoint Frappe/ERPNext secara langsung — GET, POST, PUT, DELETE via proxy</p>
        <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
          Base URL: <span style={{ color: '#0066B3', fontWeight: 600 }}>{FRAPPE_BASE}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
        {/* Preset Sidebar */}
        <div>
          <button
            onClick={() => setShowPresets(!showPresets)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}
          >
            📋 Preset Endpoints {showPresets ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {showPresets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {PRESET_ENDPOINTS.map((preset, i) => {
                const mc = METHOD_COLORS[preset.method];
                return (
                  <button key={i} onClick={() => loadPreset(preset)}
                    style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: "'Montserrat', sans-serif", transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0066B3'; e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}
                  >
                    <span style={{ background: mc.bg, color: mc.color, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>{preset.method}</span>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px', lineHeight: 1.3 }}>{preset.label.replace(/^(GET|POST|PUT|DELETE) - /, '')}</p>
                    <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.path}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="chart-container">
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>⚡ Request Builder</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={method} onChange={e => setMethod(e.target.value)} className="erp-input" style={{ width: '100px', fontSize: '13px', fontWeight: 700 }}>
                {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m}>{m}</option>)}
              </select>
              <input type="text" value={path} onChange={e => setPath(e.target.value)} className="erp-input" style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace' }} placeholder="/api/resource/Sales Order" />
            </div>

            <div style={{ background: '#f8f9fb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', color: '#6B7280', fontFamily: 'monospace', marginBottom: '12px', wordBreak: 'break-all' }}>
              <span style={{ color: '#9CA3AF' }}>URL: </span><span style={{ color: '#0066B3' }}>{fullUrl}</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Query Params <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>(key=value&key2=value2)</span>
              </label>
              <input type="text" value={params} onChange={e => setParams(e.target.value)} className="erp-input" style={{ fontSize: '12px', fontFamily: 'monospace' }} placeholder="limit_page_length=20&fields=[...]" />
            </div>

            {(method === 'POST' || method === 'PUT') && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Body <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>(JSON)</span>
                </label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="erp-input" style={{ fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }} placeholder='{"key": "value"}' />
              </div>
            )}

            <button onClick={sendRequest} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', fontSize: '14px' }}>
              {isLoading
                ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Mengirim...</>
                : <><Send size={15} /> Kirim Request</>
              }
            </button>
          </div>

          {(response || error) && (
            <div className="chart-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>📥 Response</p>
                  {response && (
                    <>
                      <span style={{ background: response.status >= 200 && response.status < 300 ? '#d1fae5' : '#fee2e2', color: response.status >= 200 && response.status < 300 ? '#065f46' : '#991b1b', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                        {response.status}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{response.time}ms</span>
                    </>
                  )}
                </div>
                {response && (
                  <button onClick={copyResponse} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: copied ? '#d1fae5' : 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: copied ? '#065f46' : '#374151', fontFamily: "'Montserrat', sans-serif" }}>
                    {copied ? <><Check size={12} /> Tersalin!</> : <><Copy size={12} /> Salin JSON</>}
                  </button>
                )}
              </div>

              {error ? (
                <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '14px', color: '#991b1b', fontSize: '13px' }}>
                  <strong>❌ Error:</strong> {error}
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>Pastikan server ERPNext aktif dan API Key dikonfigurasi di .env.local</div>
                </div>
              ) : (
                <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: '10px', padding: '16px', fontSize: '12px', overflowX: 'auto', maxHeight: '500px', overflowY: 'auto', lineHeight: 1.6, fontFamily: 'monospace' }}>
                  {JSON.stringify(response?.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* API Guide */}
          <div className="chart-container" style={{ background: 'linear-gradient(135deg, #f8f9fb, #eff6ff)' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>📖 Panduan API ERPNext</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              {[
                { method: 'GET', desc: 'List documents', example: '/api/resource/Sales Order?limit_page_length=20' },
                { method: 'GET', desc: 'Get single doc', example: '/api/resource/Sales Order/SAL-ORD-001' },
                { method: 'POST', desc: 'Create document', example: '/api/resource/Sales Order + JSON body' },
                { method: 'PUT', desc: 'Update document', example: '/api/resource/Sales Order/ID + JSON body' },
                { method: 'DELETE', desc: 'Delete document', example: '/api/resource/Sales Order/SAL-ORD-001' },
                { method: 'GET', desc: 'Call Frappe method', example: '/api/method/frappe.auth.get_logged_user' },
              ].map((item, i) => {
                const mc = METHOD_COLORS[item.method];
                return (
                  <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ background: mc.bg, color: mc.color, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>{item.method}</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{item.desc}</span>
                    </div>
                    <p style={{ fontFamily: 'monospace', color: '#6B7280', fontSize: '11px' }}>{item.example}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
