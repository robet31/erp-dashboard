'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Send, Copy, RefreshCw, ChevronDown, ChevronRight, Check } from 'lucide-react';

const FRAPPE_BASE = 'http://34.101.192.135:8080';

const PRESET_ENDPOINTS = [
  { label: 'GET - List Sales Orders', method: 'GET', path: '/api/resource/Sales Order', body: '', params: 'limit_page_length=20&fields=["name","customer_name","status","grand_total","transaction_date","creation","docstatus"]&order_by=creation desc' },
  { label: 'GET - List Items', method: 'GET', path: '/api/resource/Item', body: '', params: 'limit_page_length=50&fields=["name","item_code","item_name","item_group","standard_rate","creation"]&order_by=creation desc' },
  { label: 'GET - List Work Orders', method: 'GET', path: '/api/resource/Work Order', body: '', params: 'limit_page_length=20&fields=["name","production_item","qty","produced_qty","status","creation","docstatus"]&order_by=creation desc' },
  { label: 'GET - List Job Cards', method: 'GET', path: '/api/resource/Job Card', body: '', params: 'limit_page_length=20&fields=["name","work_order","operation","workstation","status","docstatus","for_quantity","creation"]&order_by=creation desc' },
  { label: 'GET - List Bin (Stock)', method: 'GET', path: '/api/resource/Bin', body: '', params: 'limit_page_length=50&fields=["name","item_code","warehouse","actual_qty","projected_qty","stock_value"]' },
  { label: 'GET - List Customers', method: 'GET', path: '/api/resource/Customer', body: '', params: 'limit_page_length=50&fields=["name","customer_name","customer_type","territory","creation"]&order_by=creation desc' },
  { label: 'GET - List BOM', method: 'GET', path: '/api/resource/BOM', body: '', params: 'limit_page_length=20&fields=["name","item","item_name","quantity","is_active","total_cost","creation"]&order_by=creation desc' },
  { label: 'GET - Logged User', method: 'GET', path: '/api/method/frappe.auth.get_logged_user', body: '', params: '' },

  { label: 'POST - Create Item', method: 'POST', path: '/api/resource/Item', params: '', body: JSON.stringify({ item_code: "API-ITEM-001", item_name: "Item Test API", item_group: "Products", stock_uom: "Nos", is_stock_item: 1, standard_rate: 50000 }, null, 2) },
  { label: 'POST - Create Customer', method: 'POST', path: '/api/resource/Customer', params: '', body: JSON.stringify({ customer_name: "PT API Testing", customer_type: "Company", customer_group: "Commercial", territory: "Indonesia" }, null, 2) },
  { label: 'POST - Create Stock Entry (Receipt)', method: 'POST', path: '/api/resource/Stock Entry', params: '', body: JSON.stringify({ stock_entry_type: "Material Receipt", company: "Netra Vidya", set_posting_time: 1, to_warehouse: "Finished Goods - NV", items: [{ item_code: "API-ITEM-001", qty: 100, t_warehouse: "Finished Goods - NV", basic_rate: 50000 }] }, null, 2) },
  { label: 'POST - Create Sales Order', method: 'POST', path: '/api/resource/Sales Order', params: '', body: JSON.stringify({ customer: "PT API Testing", company: "Netra Vidya", transaction_date: new Date().toISOString().split('T')[0], delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], currency: "IDR", items: [{ item_code: "API-ITEM-001", qty: 10, rate: 75000, warehouse: "Finished Goods - NV" }] }, null, 2) },
  { label: 'POST - Create Work Order', method: 'POST', path: '/api/resource/Work Order', params: '', body: JSON.stringify({ production_item: "API-ITEM-001", bom_no: "BOM-API-ITEM-001-001", qty: 50, planned_start_date: new Date().toISOString().split('T')[0], fg_warehouse: "Finished Goods - NV", wip_warehouse: "Work In Progress - NV", company: "Netra Vidya", use_multi_level_bom: 0 }, null, 2) },

  { label: 'PUT - Submit Document (Draft ke Submit)', method: 'PUT', path: '/api/resource/Sales Order/SAL-ORD-202X-0001', params: '', body: JSON.stringify({ docstatus: 1 }, null, 2) },
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
  const [showPresets, setShowPresets] = useState(false);

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
      if (!res.ok) {
        let errorMsg = data.message || `HTTP Error ${res.status}`;
        if (data._server_messages) {
          try { errorMsg = JSON.parse(JSON.parse(data._server_messages)[0]).message.replace(/<[^>]*>?/gm, ''); } catch (e) {}
        }
        throw new Error(errorMsg);
      }
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
    setShowPresets(false); 
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    // FIX: Typecasting "api_tester" ke any agar TS tidak memblokir proses build
    if (!canAccess('api_tester' as any)) router.push('/dashboard');
  }, [canAccess, router]);

  const fullUrl = `${FRAPPE_BASE}${path}${params ? '?' + params : ''}`;

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>🔧 API Tester</h1>
        <p style={{ fontSize: '12px', color: '#6B7280' }}>Test endpoint Frappe/ERPNext — GET, POST, PUT, DELETE via proxy</p>
        <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', wordBreak: 'break-all' }}>
          Base URL: <span style={{ color: '#0066B3', fontWeight: 600 }}>{FRAPPE_BASE}</span>
        </p>
      </div>

      <div className="api-tester-layout">
        <div className="api-tester-sidebar">
          <button
            onClick={() => setShowPresets(!showPresets)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '10px 14px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
              fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px'
            }}
          >
            📋 Preset Endpoints {showPresets ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {showPresets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px' }}>
              {PRESET_ENDPOINTS.map((preset, i) => {
                const mc = METHOD_COLORS[preset.method];
                return (
                  <button key={i} onClick={() => loadPreset(preset)}
                    style={{
                      background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                      padding: '10px 12px', cursor: 'pointer', textAlign: 'left', width: '100%',
                      fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s'
                    }}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <div className="chart-container">
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>⚡ Request Builder</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <select value={method} onChange={e => setMethod(e.target.value)} className="erp-input"
                style={{ width: '100px', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m}>{m}</option>)}
              </select>
              <input type="text" value={path} onChange={e => setPath(e.target.value)} className="erp-input"
                style={{ flex: 1, minWidth: '0', fontSize: '12px', fontFamily: 'monospace' }}
                placeholder="/api/resource/Sales Order" />
            </div>

            <div style={{
              background: '#f8f9fb', border: '1px solid #e5e7eb', borderRadius: '6px',
              padding: '8px 12px', fontSize: '11px', color: '#6B7280', fontFamily: 'monospace',
              marginBottom: '12px', wordBreak: 'break-all', overflowWrap: 'anywhere'
            }}>
              <span style={{ color: '#9CA3AF' }}>URL: </span>
              <span style={{ color: '#0066B3' }}>{fullUrl}</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Query Params <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>(key=value&key2=value2)</span>
              </label>
              <input type="text" value={params} onChange={e => setParams(e.target.value)} className="erp-input"
                style={{ fontSize: '12px', fontFamily: 'monospace' }}
                placeholder='limit_page_length=20&fields=["name"]' />
            </div>

            {(method === 'POST' || method === 'PUT') && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Body <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>(JSON)</span>
                </label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="erp-input"
                  style={{ fontSize: '12px', fontFamily: 'monospace', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                  placeholder='{"key": "value"}' />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>📥 Response</p>
                  {response && (
                    <>
                      <span style={{
                        background: response.status >= 200 && response.status < 300 ? '#d1fae5' : '#fee2e2',
                        color: response.status >= 200 && response.status < 300 ? '#065f46' : '#991b1b',
                        padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700
                      }}>{response.status}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{response.time}ms</span>
                    </>
                  )}
                </div>
                {response && (
                  <button onClick={copyResponse} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: copied ? '#d1fae5' : 'white', border: '1px solid #e5e7eb',
                    borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600, color: copied ? '#065f46' : '#374151',
                    fontFamily: "'Poppins', sans-serif"
                  }}>
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
                <pre style={{
                  background: '#0f172a', color: '#e2e8f0', borderRadius: '10px', padding: '16px',
                  fontSize: '12px', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto',
                  lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {JSON.stringify(response?.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="chart-container" style={{ background: 'linear-gradient(135deg, #f8f9fb, #eff6ff)' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>📖 Panduan API ERPNext</p>
            <div className="api-guide-grid">
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
                      <span style={{ fontWeight: 600, color: '#374151', fontSize: '12px' }}>{item.desc}</span>
                    </div>
                    <p style={{ fontFamily: 'monospace', color: '#6B7280', fontSize: '11px', wordBreak: 'break-all' }}>{item.example}</p>
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

        .api-tester-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 16px;
          align-items: start;
        }
        .api-tester-sidebar {
          position: sticky;
          top: 16px;
        }
        .api-guide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 768px) {
          .api-tester-layout {
            grid-template-columns: 1fr;
          }
          .api-tester-sidebar {
            position: static;
          }
        }

        @media (max-width: 480px) {
          .api-guide-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}