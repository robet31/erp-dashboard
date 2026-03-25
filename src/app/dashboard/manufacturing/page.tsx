'use client';

import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useManufacturingData, useStockData, useSellingData } from '@/hooks/useFrappeData';
import {
  Cog, FileText, CheckCircle, Clock,
  Plus, Download, Search, X, ChevronRight,
  ArrowRight, Package, Layers, AlertCircle, Trash2, PlayCircle, StopCircle, Send, Eye, Edit, Loader2, Wrench, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatRupiah, formatDate, getWorkOrderProgress, formatNumber } from '@/lib/utils';
import type { WorkOrder, BOM } from '@/lib/frappe-types';
import { getWarehousesByCompany } from '@/config/frappe-data';

const WO_STATUSES = ['Semua', 'Draft', 'Not Started', 'In Process', 'Completed', 'Stopped'];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Draft': { bg: '#f3f4f6', color: '#6B7280' },
  'Not Started': { bg: '#fef3c7', color: '#d97706' },
  'In Process': { bg: '#dbeafe', color: '#1d4ed8' },
  'Completed': { bg: '#d1fae5', color: '#065f46' },
  'Stopped': { bg: '#fee2e2', color: '#991b1b' },
};

// ==========================================
// HELPER: EXTRACT ERROR MESSAGE DARI ERPNEXT
// ==========================================
function extractFrappeError(data: any, fallback: string): string {
  if (data?._server_messages) {
    try {
      const parsed = JSON.parse(JSON.parse(data._server_messages)[0]);
      return parsed.message?.replace(/<[^>]*>?/gm, '') || fallback;
    } catch { }
  }
  if (data?.exception) {
    const lines = String(data.exception).split('\n').filter(Boolean);
    const last = lines[lines.length - 1] || fallback;
    return last.replace(/^.*Error:\s*/, '');
  }
  if (data?.message) return String(data.message).replace(/<[^>]*>?/gm, '');
  return fallback;
}

// ==========================================
// 1. MODAL CREATE WORK ORDER (TERINTEGRASI PENUH KE SALES ORDER)
// ==========================================
function CreateWorkOrderModal({ onClose, items, boms, salesOrders, onSuccess, userCompany }: { onClose: () => void; items: any[]; boms: any[]; salesOrders: any[]; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({
    production_item: '', bom_no: '', qty: '1', company: userCompany, 
    sales_order: '', sales_order_item: '', // <--- DITAMBAHKAN AGAR BENAR-BENAR TERHUBUNG KE ERPNEXT
    planned_start_date: new Date().toISOString().split('T')[0], source_warehouse: '', fg_warehouse: '', wip_warehouse: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Mapping SO ID -> { item_code: sales_order_item_id }
  const [soItems, setSoItems] = useState<Record<string, Record<string, string>>>({});

  const activeWarehouses = useMemo(() => getWarehousesByCompany(form.company), [form.company]);

  // Fetch items & sales_order_item ID dari setiap Sales Order
  useEffect(() => {
    const activeSOs = salesOrders.filter((so: any) => so.docstatus === 1 && so.status !== 'Completed' && so.status !== 'Cancelled');
    if (activeSOs.length === 0) return;
    Promise.all(
      activeSOs.map(async (so: any) => {
        try {
          const res = await fetch(`/api/frappe/resource/Sales Order/${encodeURIComponent(so.name)}`, { cache: 'no-store' });
          const data = await res.json();
          const itemsMap: Record<string, string> = {};
          (data.data?.items || []).forEach((i: any) => {
            itemsMap[i.item_code] = i.name; // i.name adalah ID unik dari baris produk tersebut di ERPNext
          });
          return { name: so.name, itemsMap };
        } catch { return { name: so.name, itemsMap: {} }; }
      })
    ).then(results => {
      const map: Record<string, Record<string, string>> = {};
      results.forEach(r => { map[r.name] = r.itemsMap; });
      setSoItems(map);
    });
  }, [salesOrders]);

  // Auto-detect Sales Order yang mengandung production_item yang dipilih
  useEffect(() => {
    if (!form.production_item) return;
    const matchedSO = Object.entries(soItems).find(([soName, itemsMap]) =>
      Object.keys(itemsMap).includes(form.production_item)
    );
    if (matchedSO) {
      setForm(f => ({ 
        ...f, 
        sales_order: matchedSO[0], 
        sales_order_item: matchedSO[1][form.production_item] 
      }));
    } else {
      setForm(f => ({ ...f, sales_order: '', sales_order_item: '' }));
    }
  }, [form.production_item, soItems]);

  const availableBOMsForProduct = useMemo(() => {
    if (!form.production_item) return [];
    return boms.filter((b: any) => String(b.item).trim() === String(form.production_item).trim());
  }, [boms, form.production_item]);

  const activeBOMs = useMemo(() => {
    return availableBOMsForProduct.filter((b: any) => b.docstatus === 1 || b.is_active === 1);
  }, [availableBOMsForProduct]);

  useEffect(() => {
    if (activeBOMs.length === 1) setForm(f => ({ ...f, bom_no: activeBOMs[0].name }));
    else setForm(f => ({ ...f, bom_no: '' }));
  }, [activeBOMs]);

  useEffect(() => {
    const source = activeWarehouses.find(w => w.name.toLowerCase().includes('store') || w.name.toLowerCase().includes('bahan'));
    const fg = activeWarehouses.find(w => w.name.toLowerCase().includes('finished') || w.name.toLowerCase().includes('jadi'));
    const wip = activeWarehouses.find(w => w.name.toLowerCase().includes('work in') || w.name.toLowerCase().includes('wip'));

    setForm(f => ({
      ...f, source_warehouse: source ? source.name : (activeWarehouses[0]?.name || ''),
      fg_warehouse: fg ? fg.name : (activeWarehouses[0]?.name || ''), wip_warehouse: wip ? wip.name : (activeWarehouses[0]?.name || '')
    }));
  }, [activeWarehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bom_no) { setError("Pilih BOM yang Aktif terlebih dahulu."); return; }
    setIsSubmitting(true); setError('');

    try {
      const workOrderData: any = {
        production_item: form.production_item, bom_no: form.bom_no, qty: parseFloat(form.qty), planned_start_date: form.planned_start_date,
        source_warehouse: form.source_warehouse, fg_warehouse: form.fg_warehouse, wip_warehouse: form.wip_warehouse, company: form.company,
        use_multi_level_bom: 0
      };
      
      // KIRIM KEDUA PARAMETER AGAR TERHUBUNG PENUH KE MODUL SELLING
      if (form.sales_order) {
        workOrderData.sales_order = form.sales_order;
        if (form.sales_order_item) {
          workOrderData.sales_order_item = form.sales_order_item;
        }
      }

      const response = await fetch('/api/frappe/resource/Work Order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(workOrderData) });
      const result = await response.json();

      if (!response.ok) throw new Error(extractFrappeError(result, "Gagal membuat Work Order"));

      alert('✅ Work Order berhasil dibuat dan terhubung dengan Sales Order!');
      if (onSuccess) onSuccess(); onClose();
    } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '550px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Buat Work Order Baru (Draft)</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Produk yang akan Dibuat *</label>
            <select required className="erp-input" value={form.production_item} onChange={e => setForm(f => ({ ...f, production_item: e.target.value }))}>
              <option value="">-- Pilih Produk --</option>
              {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>BOM (Bill of Materials) Aktif *</label>
            <select required className="erp-input" value={form.bom_no} disabled={!form.production_item || activeBOMs.length === 0} onChange={e => setForm(f => ({ ...f, bom_no: e.target.value }))}>
              {!form.production_item ? <option value="">Pilih Produk Terlebih Dahulu...</option> :
                activeBOMs.length === 0 ? <option value="">TIDAK ADA BOM AKTIF UNTUK PRODUK INI</option> :
                  <><option value="">-- Pilih Nomor BOM --</option>{activeBOMs.map((b: any) => <option key={b.name} value={b.name}>{b.name}</option>)}</>
              }
            </select>
            {form.production_item && availableBOMsForProduct.length > 0 && activeBOMs.length === 0 && (
              <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', fontWeight: 600, background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>
                ⚠️ BOM untuk produk ini masih berstatus DRAFT. Silakan "Aktifkan" BOM-nya terlebih dahulu di tabel Bill of Materials di bawah.
              </p>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Sales Order (Terhubung ke Produksi)</label>
            <select className="erp-input" value={form.sales_order} onChange={e => {
              const soName = e.target.value;
              const soItemId = soName && soItems[soName] ? soItems[soName][form.production_item] : '';
              setForm(f => ({ ...f, sales_order: soName, sales_order_item: soItemId || '' }));
            }}>
              <option value="">-- Produksi Bebas (Tanpa SO) --</option>
              {salesOrders.filter((so: any) => so.docstatus === 1 && so.status !== 'Completed' && so.status !== 'Cancelled').map((so: any) => (
                <option key={so.name} value={so.name}>
                  {so.name} - {so.customer_name}
                  {soItems[so.name] && Object.keys(soItems[so.name]).includes(form.production_item) ? ' ✓ (Sesuai Produk)' : ''}
                </option>
              ))}
            </select>
            {form.sales_order && form.sales_order_item && (
              <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                ✓ Terintegrasi penuh! Progress produksi ini akan di-update langsung ke Sales Order {form.sales_order}.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Jumlah Produksi</label><input type="number" required min="1" className="erp-input" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tanggal Mulai</label><input type="date" required className="erp-input" value={form.planned_start_date} onChange={e => setForm(f => ({ ...f, planned_start_date: e.target.value }))} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div><label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>1. Ambil Bahan:</label><select required className="erp-input" style={{ fontSize: '11px' }} value={form.source_warehouse} onChange={e => setForm(f => ({ ...f, source_warehouse: e.target.value }))}>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
            <div><label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>2. Diproses Di:</label><select required className="erp-input" style={{ fontSize: '11px' }} value={form.wip_warehouse} onChange={e => setForm(f => ({ ...f, wip_warehouse: e.target.value }))}>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
            <div><label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>3. Barang Jadi Ke:</label><select required className="erp-input" style={{ fontSize: '11px' }} value={form.fg_warehouse} onChange={e => setForm(f => ({ ...f, fg_warehouse: e.target.value }))}>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
          </div>

          {error && <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '6px', color: '#b91c1c', fontSize: '12px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !form.bom_no} style={{ flex: 2 }}>{isSubmitting ? 'Memproses...' : 'Simpan sebagai Draft'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL CREATE BOM 
// ==========================================
function CreateBOMModal({ onClose, items, onSuccess, userCompany }: { onClose: () => void; items: any[]; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({ item: '', quantity: '1', uom: 'Nos' });
  const [bomItems, setBomItems] = useState([{ item_code: '', qty: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.item) { setError('Pilih Item Produksi terlebih dahulu.'); return; }
    const emptyRows = bomItems.filter(bi => !bi.item_code);
    if (emptyRows.length > 0) { setError('Semua baris bahan baku harus dipilih itemnya.'); return; }
    const zeroQty = bomItems.filter(bi => !bi.qty || bi.qty <= 0);
    if (zeroQty.length > 0) { setError('Quantity setiap bahan baku harus lebih dari 0.'); return; }

    setIsSubmitting(true);
    try {
      const selectedMainItem = items.find(i => i.item_code === form.item);

      const bomData = {
        item: form.item,
        quantity: parseFloat(form.quantity) || 1,
        uom: selectedMainItem?.stock_uom || form.uom,
        company: userCompany,
        is_active: 0, 
        is_default: 0,  
        items: bomItems.map(bi => {
          const itemDetail = items.find(it => it.item_code === bi.item_code);
          const fallbackRate = itemDetail?.standard_rate || 1;
          return { item_code: bi.item_code, qty: parseFloat(String(bi.qty)) || 1, uom: itemDetail?.stock_uom || 'Nos', rate: fallbackRate };
        }),
      };

      const response = await fetch('/api/frappe/resource/BOM', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bomData) });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(extractFrappeError(data, 'Gagal membuat BOM. Pastikan item produksi belum memiliki BOM aktif.'));
      }

      const docName = data.data?.name || data.name;

      if (docName) {
        const submitRes = await fetch(`/api/frappe/resource/BOM/${encodeURIComponent(docName)}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: 1, docstatus: 1, is_default: 1 })
        });

        if (!submitRes.ok) {
          const errData = await submitRes.json();
          alert(`⚠️ BOM berhasil dibuat dan tersimpan sebagai DRAFT!\n\nNamun gagal aktif otomatis karena:\n${extractFrappeError(errData, 'Harga/Stok bahan baku belum divalidasi.')}\n\n💡 Solusi: Silakan klik tombol hijau "Aktifkan" pada tabel BOM di bawah.`);
          onClose(); if (onSuccess) onSuccess();
          return;
        }
      }

      alert('✅ BOM berhasil dibuat dan langsung Aktif!');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan BOM.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Buat BOM Baru</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="erp-label">Item Jadi (Produk Akhir) *</label>
            <select required className="erp-input" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}>
              <option value="">-- Pilih Item --</option>
              {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
            </select>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '14px' }}>
            <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>Daftar Bahan Baku:</p>
            {bomItems.map((bi, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <select
                  style={{ flex: 3 }}
                  className="erp-input"
                  value={bi.item_code}
                  onChange={e => {
                    const val = e.target.value;
                    setBomItems(prev => prev.map((b, idx) => idx === i ? { ...b, item_code: val } : b));
                  }}
                >
                  <option value="">-- Pilih Bahan --</option>
                  {items.map((it: any) => <option key={it.name} value={it.item_code}>{it.item_code}</option>)}
                </select>
                <input
                  style={{ flex: 1, minWidth: '70px' }}
                  type="number" min="0.01" step="0.01"
                  className="erp-input"
                  placeholder="Qty"
                  value={bi.qty}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setBomItems(prev => prev.map((b, idx) => idx === i ? { ...b, qty: val } : b));
                  }}
                />
                {bomItems.length > 1 && (
                  <button type="button" onClick={() => setBomItems(prev => prev.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBomItems(prev => [...prev, { item_code: '', qty: 1 }])} style={{ marginTop: '5px' }}>+ Tambah Baris Bahan</button>
          </div>
          {error && <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginTop: '10px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting} style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 2 }}>{isSubmitting ? 'Menyimpan...' : 'Simpan BOM'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. MODAL CREATE JOB CARD
// ==========================================
function CreateJobCardModal({ onClose, workOrders, jobCards, onSuccess, userCompany }: { onClose: () => void; workOrders: any[]; jobCards: any[]; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({ work_order: '', operation: '', workstation: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [operations, setOperations] = useState<string[]>([]);
  const [workstations, setWorkstations] = useState<string[]>([]);
  const [isNewOp, setIsNewOp] = useState(false);
  const [isNewWs, setIsNewWs] = useState(false);

  const activeWOs = useMemo(() => workOrders.filter((wo: any) => {
    const isDraft = wo.docstatus === 0 || wo.status === 'Draft';
    const isFinished = wo.status === 'Completed' || wo.status === 'Stopped' || wo.status === 'Cancelled';
    if (isDraft || isFinished) return false;
    const existingJC = jobCards.find(jc => jc.work_order === wo.name);
    return !existingJC; 
  }), [workOrders, jobCards]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [opRes, wsRes] = await Promise.all([ fetch('/api/frappe/resource/Operation?limit_page_length=1000', { cache: 'no-store' }), fetch('/api/frappe/resource/Workstation?limit_page_length=1000', { cache: 'no-store' }) ]);
        if (opRes.ok) { const opData = await opRes.json(); setOperations(opData.data?.map((o: any) => o.name) || []); }
        if (wsRes.ok) { const wsData = await wsRes.json(); setWorkstations(wsData.data?.map((w: any) => w.name) || []); }
      } catch (err) {}
    };
    fetchMasterData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      if (isNewOp && form.operation) await fetch('/api/frappe/resource/Operation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.operation, operation: form.operation }) });
      if (isNewWs && form.workstation) await fetch('/api/frappe/resource/Workstation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.workstation, workstation_name: form.workstation }) });
      const response = await fetch('/api/frappe/resource/Job Card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, company: userCompany, for_quantity: 1 }) });
      if (!response.ok) { const data = await response.json(); throw new Error(extractFrappeError(data, "Gagal simpan Job Card")); }
      alert('✅ Job Card Berhasil Dibuat sebagai Draft!'); if (onSuccess) onSuccess(); onClose(); 
    } catch (err: any) { setError(err.message); setIsSubmitting(false); } 
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ fontSize: '18px', fontWeight: 800 }}>Buat Job Card Baru</h2><button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20} /></button></div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Pilih Work Order *</label>
            <select required className="erp-input" onChange={e => setForm({ ...form, work_order: e.target.value })}><option value="">-- Pilih WO Aktif --</option>{activeWOs.map((wo: any) => <option key={wo.name} value={wo.name}>{wo.name} - {wo.item_name}</option>)}</select>
            {activeWOs.length === 0 && <p style={{ color: '#d97706', fontSize: '11px', marginTop: '4px' }}>⚠️ Tidak ada WO aktif yang belum diproses. Semua WO sudah memiliki Job Card atau sudah Selesai.</p>}
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Operation (Kegiatan) *</label>
            {!isNewOp ? (<select required className="erp-input" value={form.operation} onChange={e => { if (e.target.value === 'ADD_NEW') { setIsNewOp(true); setForm(f => ({ ...f, operation: '' })); } else { setForm(f => ({ ...f, operation: e.target.value })); } }}><option value="">-- Pilih Operation --</option>{operations.map(op => <option key={op} value={op}>{op}</option>)}<option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#0066B3' }}>+ Tambah Baru...</option></select>) : (<div style={{ display: 'flex', gap: '8px' }}><input required type="text" placeholder="Ketik nama operasi baru..." className="erp-input" style={{ flex: 1 }} value={form.operation} onChange={e => setForm(f => ({ ...f, operation: e.target.value }))} /><button type="button" onClick={() => setIsNewOp(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Batal</button></div>)}
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Workstation (Tempat Produksi) *</label>
            {!isNewWs ? (<select required className="erp-input" value={form.workstation} onChange={e => { if (e.target.value === 'ADD_NEW') { setIsNewWs(true); setForm(f => ({ ...f, workstation: '' })); } else { setForm(f => ({ ...f, workstation: e.target.value })); } }}><option value="">-- Pilih Workstation --</option>{workstations.map(ws => <option key={ws} value={ws}>{ws}</option>)}<option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#0066B3' }}>+ Tambah Baru...</option></select>) : (<div style={{ display: 'flex', gap: '8px' }}><input required type="text" placeholder="Ketik nama workstation baru..." className="erp-input" style={{ flex: 1 }} value={form.workstation} onChange={e => setForm(f => ({ ...f, workstation: e.target.value }))} /><button type="button" onClick={() => setIsNewWs(false)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Batal</button></div>)}
          </div>
          {error && <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '6px', color: '#b91c1c', fontSize: '12px' }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || activeWOs.length === 0} style={{ marginTop: '5px' }}>{isSubmitting ? 'Memproses...' : 'Simpan Job Card'}</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. MODAL DETAIL WO & JOB CARD
// ==========================================
function WorkOrderDetailModal({ wo, jobCards, onClose, onSuccess }: { wo: WorkOrder; jobCards: any[]; onClose: () => void; onSuccess?: () => void }) {
  const { user } = useAuth(); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullData, setFullData] = useState<any>(wo);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ qty: wo.qty, planned_start_date: wo.planned_start_date });

  const isGudangRole = user?.role === 'admin_gudang' || user?.role === 'administrator';

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(wo.name)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.data) { setFullData(data.data); setEditForm({ qty: data.data.qty, planned_start_date: data.data.planned_start_date }); }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetails();
  }, [wo.name]);

  const progress = getWorkOrderProgress(fullData.produced_qty, fullData.qty);
  const isDraft = fullData.docstatus === 0 || fullData.status === 'Draft';
  const isCompleted = fullData.status === 'Completed' || fullData.produced_qty >= fullData.qty;

  const handleUpdateWO = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(fullData.name)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qty: parseFloat(String(editForm.qty)), planned_start_date: editForm.planned_start_date }) });
      if (!response.ok) throw new Error("Gagal update data");
      alert('✅ Data Draft Berhasil Diperbarui!'); setIsEditing(false); if (onSuccess) onSuccess();
    } catch (err: any) { alert(err.message); } finally { setIsProcessing(false); }
  };

  const handleSubmitWO = async () => {
    if (!confirm('Konfirmasi Submit? Data tidak bisa diedit setelah ini.')) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(fullData.name)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docstatus: 1 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(extractFrappeError(data, "Gagal Submit"));
      alert('✅ Work Order disubmit! Sekarang Anda bisa membuat Job Card atau Start Produksi.'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert('Gagal Submit: \n' + err.message); setIsProcessing(false); }
  };

  const handleStartProduction = async () => {
    if (!isGudangRole) return alert('Hanya Admin Gudang yang bisa memulai produksi (Transfer Material).');
    const qtyToStart = prompt(`Jumlah untuk ditarik ke WIP:`, String(fullData.qty - (fullData.produced_qty || 0)));
    if (!qtyToStart) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/frappe/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ work_order_id: fullData.name, purpose: 'Material Transfer for Manufacture', qty: parseFloat(qtyToStart) }) });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(extractFrappeError(data, "Gagal menyiapkan dokumen Transfer"));
      const draftSE = data.message || data.data;
      const createRes = await fetch('/api/frappe/resource/Stock Entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draftSE) });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(extractFrappeError(createData, "Gagal menyimpan Draft Transfer Material"));
      const seName = createData.data?.name || createData.name;
      const submitRes = await fetch(`/api/frappe/resource/Stock Entry/${seName}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docstatus: 1 }) });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(extractFrappeError(submitData, "Gagal me-Submit Transfer Material (Cek stok gudangmu!)"));
      alert('✅ Bahan Baku berhasil dipindahkan ke area WIP!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(`ERROR DARI ERPNEXT:\n${err.message}`); setIsProcessing(false); }
  };

  const handleFinishProduction = async () => {
    if (!isGudangRole) return alert('Hanya Admin Gudang yang berhak memasukkan barang jadi ke gudang.');
    const relatedJCs = jobCards.filter(jc => jc.work_order === fullData.name);
    const unfinishedJCs = relatedJCs.filter(jc => jc.status !== 'Completed');
    if (unfinishedJCs.length > 0) { alert(`⚠️ GAGAL FINISH: Ada ${unfinishedJCs.length} Job Card yang masih belum diselesaikan!`); return; }

    const qtyToFinish = prompt(`Jumlah barang JADI yang selesai dan siap masuk Gudang Akhir (FG):`, String(fullData.qty - (fullData.produced_qty || 0)));
    if (!qtyToFinish) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/frappe/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ work_order_id: fullData.name, purpose: 'Manufacture', qty: parseFloat(qtyToFinish) }) });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(extractFrappeError(data, "Gagal menyiapkan dokumen Manufacture"));
      const draftSE = data.message || data.data;
      const createRes = await fetch('/api/frappe/resource/Stock Entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draftSE) });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(extractFrappeError(createData, "Gagal menyimpan Draft Manufacture"));
      const seName = createData.data?.name || createData.name;
      const submitRes = await fetch(`/api/frappe/resource/Stock Entry/${seName}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docstatus: 1 }) });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(extractFrappeError(submitData, "Gagal me-Submit Manufacture (Cek stok WIP-mu!)"));
      alert('✅ Produk Jadi berhasil masuk stok FG! Work Order Selesai.'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(`ERROR DARI ERPNEXT:\n${err.message}`); setIsProcessing(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isProcessing) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
        {isLoading ? ( <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color="#0066B3" /></div> ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div><h2 style={{ fontSize: '18px', fontWeight: 800 }}>{fullData.name}</h2><span className={`badge ${isDraft ? 'badge-gray' : isCompleted ? 'badge-success' : 'badge-info'}`} style={{ marginTop: '5px' }}>{isDraft ? 'DRAFT' : fullData.status}</span></div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', color: '#6B7280' }}>Sales Order</p>
                {fullData.sales_order ? (
                  <a href={`http://34.101.192.135:8080/app/sales-order/${encodeURIComponent(fullData.sales_order)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 700, color: '#0066B3', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {fullData.sales_order} <ArrowUpRight size={12} />
                  </a>
                ) : (
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>-</p>
                )}
              </div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Produk</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData.production_item}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>BOM No</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData.bom_no}</p></div>
              <div style={{ background: isEditing ? '#fffbeb' : '#f8f9fb', padding: '12px', borderRadius: '8px', border: isEditing ? '1px solid #fcd34d' : '1px solid transparent' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Qty Target</p>{isEditing ? <input type="number" className="erp-input" style={{ marginTop: '4px' }} value={editForm.qty} onChange={e => setEditForm({ ...editForm, qty: Number(e.target.value) })} /> : <p style={{ fontSize: '13px', fontWeight: 700 }}>{formatNumber(fullData.qty)} pcs</p>}</div>
              <div style={{ background: isEditing ? '#fffbeb' : '#f8f9fb', padding: '12px', borderRadius: '8px', border: isEditing ? '1px solid #fcd34d' : '1px solid transparent' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Rencana Mulai</p>{isEditing ? <input type="date" className="erp-input" style={{ marginTop: '4px' }} value={editForm.planned_start_date} onChange={e => setEditForm({ ...editForm, planned_start_date: e.target.value })} /> : <p style={{ fontSize: '13px', fontWeight: 700 }}>{formatDate(fullData.planned_start_date)}</p>}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Progress Produksi</span><span style={{ fontSize: '13px', fontWeight: 700, color: isCompleted ? '#059669' : '#0066B3' }}>{progress}%</span></div>
              <div className="progress-bar" style={{ height: '10px' }}><div className="progress-fill" style={{ width: `${progress}%`, background: isCompleted ? '#10b981' : '#0066B3' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              {isDraft ? (
                <>{isEditing ? (<><button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={isProcessing} style={{ flex: 1 }}>Batal</button><button className="btn btn-primary" onClick={handleUpdateWO} disabled={isProcessing} style={{ flex: 2 }}>Update Draft</button></>) : (<><button className="btn btn-secondary" onClick={() => setIsEditing(true)} disabled={isProcessing} style={{ flex: 1 }}><Edit size={14} /> Edit Data</button><button className="btn btn-primary" onClick={handleSubmitWO} disabled={isProcessing} style={{ flex: 2, background: '#059669' }}><Send size={14} /> Submit Work Order</button></>)}</>
              ) : (
                <>{!isCompleted ? (<>{fullData.status === 'Not Started' && (<button className={`btn ${isGudangRole ? 'btn-primary' : 'btn-secondary'}`} onClick={handleStartProduction} disabled={isProcessing || !isGudangRole} style={{ flex: 1, background: isGudangRole ? '#0066B3' : '#f3f4f6' }} title={!isGudangRole ? 'Hanya Admin Gudang' : ''}><PlayCircle size={14} /> Start Produksi</button>)}<button className={`btn ${isGudangRole ? 'btn-primary' : 'btn-secondary'}`} onClick={handleFinishProduction} disabled={isProcessing || !isGudangRole} style={{ flex: 1, background: isGudangRole ? '#059669' : '#f3f4f6' }} title={!isGudangRole ? 'Hanya Admin Gudang' : ''}><StopCircle size={14} /> Finish Produksi (Gudang)</button></>) : (<div style={{ width: '100%', textAlign: 'center', padding: '10px', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>✓ Produksi Selesai (Barang Masuk Gudang)</div>)}</>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function JobCardDetailModal({ jc, onClose, onSuccess }: { jc: any; onClose: () => void; onSuccess?: () => void }) {
  const { user } = useAuth(); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const isOperatorRole = user?.role === 'operator' || user?.role === 'administrator';

  useEffect(() => {
    const fetchDetails = async () => {
      try { const res = await fetch(`/api/frappe/resource/Job Card/${encodeURIComponent(jc.name)}`, { cache: 'no-store' }); const data = await res.json(); if (data.data) setFullData(data.data); }
      catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetails();
  }, [jc.name]);

  const formatFrappeDate = (d: Date) => { const pad = (n: number) => n < 10 ? '0' + n : n; return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };

  const isDraft = fullData?.docstatus === 0;
  const openLogIndex = fullData?.time_logs?.findIndex((log: any) => log.from_time && !log.to_time);
  const isWIP = openLogIndex !== undefined && openLogIndex >= 0;

  useEffect(() => {
    let interval: any;
    if (isWIP && fullData?.time_logs?.[openLogIndex]?.from_time) {
      const startTimeStr = fullData.time_logs[openLogIndex].from_time.replace(' ', 'T');
      const startTime = new Date(startTimeStr).getTime();
      interval = setInterval(() => {
        const now = new Date().getTime(); const diffMs = now - startTime;
        if (diffMs > 0) {
          const hrs = Math.floor(diffMs / (1000 * 60 * 60)); const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
          const pad = (n: number) => n.toString().padStart(2, '0'); setElapsedTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWIP, fullData, openLogIndex]);

  const handleStartJob = async () => {
    if (!isOperatorRole) return alert('Hanya Operator/Tukang yang bisa memulai pekerjaan.');
    setIsProcessing(true);
    try {
      const now = new Date(); const currentLogs = fullData.time_logs || [];
      const response = await fetch(`/api/frappe/resource/Job Card/${encodeURIComponent(jc.name)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ time_logs: [...currentLogs, { from_time: formatFrappeDate(now), completed_qty: 0 }] }) });
      if (!response.ok) throw new Error("Gagal memulai pekerjaan");
      const updated = await response.json(); setFullData(updated.data); if (onSuccess) onSuccess();
    } catch (err: any) { alert(err.message); } finally { setIsProcessing(false); }
  };

  const handleCompleteAndSubmit = async () => {
    if (!isOperatorRole) return alert('Hanya Operator/Tukang yang bisa menyelesaikan pekerjaan.');
    if (!confirm('Selesaikan pekerjaan ini dan submit Job Card?')) return;
    setIsProcessing(true);
    try {
      const now = new Date(); const updatedLogs = [...fullData.time_logs]; const lastLog = updatedLogs[openLogIndex];
      let fromTimeObj = new Date(lastLog.from_time.replace(' ', 'T')); let toTimeObj = now;
      if (toTimeObj.getTime() - fromTimeObj.getTime() < 60000) { toTimeObj = new Date(fromTimeObj.getTime() + 60000); }
      lastLog.to_time = formatFrappeDate(toTimeObj); lastLog.completed_qty = fullData.for_quantity; lastLog.time_in_mins = Math.ceil((toTimeObj.getTime() - fromTimeObj.getTime()) / 60000);
      const response = await fetch(`/api/frappe/resource/Job Card/${encodeURIComponent(jc.name)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ time_logs: updatedLogs, docstatus: 1 }) });
      const data = await response.json();
      if (!response.ok) { let errorMsg = data.message || "Gagal menyelesaikan"; if (data._server_messages) errorMsg = JSON.parse(JSON.parse(data._server_messages)[0]).message.replace(/<[^>]*>?/gm, ''); throw new Error(errorMsg); }
      alert('✅ Produksi Selesai dan Job Card Disubmit!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(err.message); setIsProcessing(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isProcessing) onClose(); }}>
      <div className="modal-content" style={{ width: '500px' }}>
        {isLoading ? (<div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color="#0066B3" /></div>) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><div><h2 style={{ fontSize: '18px', fontWeight: 800 }}>{fullData.name}</h2><span className={`badge ${isDraft && !isWIP ? 'badge-gray' : isWIP ? 'badge-warning' : 'badge-success'}`} style={{ marginTop: '5px' }}>{isDraft && !isWIP ? 'DRAFT' : isWIP ? 'WORK IN PROGRESS' : 'COMPLETED'}</span></div><button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Work Order</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData.work_order}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Target Qty</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData.for_quantity} pcs</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Operation</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData.operation}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Workstation</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData.workstation}</p></div>
            </div>
            {isWIP && (<div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '16px', borderRadius: '8px', marginBottom: '20px', color: '#92400e', textAlign: 'center' }}><Clock size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: '#d97706' }} /><span style={{ fontSize: '13px', fontWeight: 600 }}>Pekerjaan sedang berlangsung</span><div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{elapsedTime}</div><p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>Waktu Mulai: {fullData.time_logs[openLogIndex].from_time.split(' ')[1]}</p></div>)}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              {isDraft && !isWIP && (<button className={`btn ${isOperatorRole ? 'btn-primary' : 'btn-secondary'}`} onClick={handleStartJob} disabled={isProcessing || !isOperatorRole} style={{ width: '100%', background: isOperatorRole ? '#0066B3' : '#f3f4f6', padding: '12px' }} title={!isOperatorRole ? 'Hanya Operator' : ''}><PlayCircle size={16} /> Mulai Produksi Sekarang</button>)}
              {isDraft && isWIP && (<button className={`btn ${isOperatorRole ? 'btn-primary' : 'btn-secondary'}`} onClick={handleCompleteAndSubmit} disabled={isProcessing || !isOperatorRole} style={{ width: '100%', background: isOperatorRole ? '#059669' : '#f3f4f6', padding: '12px' }} title={!isOperatorRole ? 'Hanya Operator' : ''}><CheckCircle size={16} /> Selesaikan Pekerjaan</button>)}
              {!isDraft && (<a href={`http://34.101.192.135:8080/app/job-card/${encodeURIComponent(fullData.name)}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none', padding: '12px' }}><Eye size={16} style={{ marginRight: '6px' }} /> Buka Detail Proses di ERPNext</a>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 6. MAIN PAGE COMPONENT
// ==========================================
function ManufacturingPageContent() {
  const { user, can } = useAuth();
  const router = useRouter();
  const userCompany = (user as any)?.company || 'Netra Vidya';
  const { workOrders, boms, isLoading, refetch: refetchHook } = useManufacturingData() as any;
  const { items } = useStockData();
  const { salesOrders } = useSellingData();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'bom');
  useEffect(() => { if (tabParam) setActiveTab(tabParam); }, [tabParam]);

  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateWOModal, setShowCreateWOModal] = useState(false);
  const [showCreateBOMModal, setShowCreateBOMModal] = useState(false);
  const [showCreateJCModal, setShowCreateJCModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [selectedJC, setSelectedJC] = useState<any | null>(null);
  const [directJobCards, setDirectJobCards] = useState<any[]>([]);

  const fetchJobCards = useCallback(async () => {
    try {
      const res = await fetch('/api/frappe/resource/Job Card?fields=["name","work_order","operation","workstation","status","docstatus","company","for_quantity","total_time_in_mins","creation"]&limit_page_length=1000', { cache: 'no-store' });
      const data = await res.json();
      if (data.data) setDirectJobCards(data.data);
    } catch (err) { }
  }, []);

  useEffect(() => { fetchJobCards(); }, [fetchJobCards]);

  const handleRefreshAll = useCallback(() => {
    refetchHook();
    fetchJobCards();
    router.refresh();
  }, [refetchHook, fetchJobCards, router]);

  const formatCreationTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // --- SORTING & FILTERING ---
  const myBOMs = useMemo(() => (boms || []).filter((b: any) => b.company === userCompany).sort((a, b) => new Date(b.creation || 0).getTime() - new Date(a.creation || 0).getTime()), [boms, userCompany]);
  const myWOs = useMemo(() => (workOrders || []).filter((w: any) => w.company === userCompany).sort((a, b) => new Date(b.creation || 0).getTime() - new Date(a.creation || 0).getTime()), [workOrders, userCompany]);
  const myJobCards = useMemo(() => (directJobCards || []).filter((jc: any) => jc.company === userCompany).sort((a, b) => new Date(b.creation || 0).getTime() - new Date(a.creation || 0).getTime()), [directJobCards, userCompany]);

  const filteredWOs = myWOs.filter((wo: any) => {
    const s = wo.docstatus === 0 || wo.status === 'Draft' ? 'Draft' : wo.status;
    if (statusFilter !== 'Semua' && s !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (wo.name && wo.name.toLowerCase().includes(q)) || 
           (wo.production_item && wo.production_item.toLowerCase().includes(q));
  });

  const filteredBOMs = myBOMs.filter((b: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (b.name && b.name.toLowerCase().includes(q)) ||
           (b.item_name && b.item_name.toLowerCase().includes(q)) ||
           (b.item && b.item.toLowerCase().includes(q));
  });

  const filteredJobCards = myJobCards.filter((jc: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (jc.name && jc.name.toLowerCase().includes(q)) ||
           (jc.work_order && jc.work_order.toLowerCase().includes(q)) ||
           (jc.operation && jc.operation.toLowerCase().includes(q));
  });

  const workOrderStatus = React.useMemo(() => ({
    total: myWOs.length,
    completed: myWOs.filter((w: any) => w.status === 'Completed').length,
    inProcess: myWOs.filter((w: any) => w.status === 'In Process').length,
    pending: myWOs.filter((w: any) => w.status === 'Not Started' || w.docstatus === 0 || w.status === 'Draft').length,
    rejected: myWOs.filter((w: any) => w.status === 'Cancelled' || w.status === 'Stopped').length,
  }), [myWOs]);

  const donutData = [
    { name: 'Selesai', value: workOrderStatus.completed },
    { name: 'Proses', value: workOrderStatus.inProcess },
    { name: 'Menunggu', value: workOrderStatus.pending },
    { name: 'Batal', value: workOrderStatus.rejected },
  ];
  const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const productionTrend = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const map: Record<string, { planned: number; produced: number }> = {};
    myWOs.forEach((wo: any) => {
      const d = new Date(wo.planned_start_date);
      const key = months[d.getMonth()];
      if (!map[key]) map[key] = { planned: 0, produced: 0 };
      map[key].planned += wo.qty || 0;
      map[key].produced += wo.produced_qty || 0;
    });
    return Array.from({ length: 6 }, (_, i) => {
      const m = (now.getMonth() - 5 + i + 12) % 12;
      return { month: months[m], planned: map[months[m]]?.planned || 0, produced: map[months[m]]?.produced || 0 };
    });
  }, [myWOs]);

  const getPageInfo = () => {
    switch (activeTab) {
      case 'bom': return {
        title: 'Bill of Materials', desc: 'Resep standar pembuatan produk (BOM)',
        stats: [
          { label: 'Total BOMs', value: myBOMs.length, sub: 'Resep Produksi', icon: <Layers size={22} />, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }
        ]
      };
      case 'workorders': return {
        title: 'Work Orders', desc: 'Perintah produksi ke pabrik',
        stats: [
          { label: 'Total Orders', value: myWOs.length, sub: 'Perintah produksi', icon: <Cog size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
          { label: 'In Process', value: workOrderStatus.inProcess, sub: 'Sedang berjalan', icon: <Clock size={22} />, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
          { label: 'Completed', value: workOrderStatus.completed, sub: 'Produksi selesai', icon: <CheckCircle size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
        ]
      };
      case 'jobcards': return {
        title: 'Job Cards', desc: 'Tugas operator pabrik per stasiun kerja',
        stats: [
          { label: 'Total Job Cards', value: myJobCards.length, sub: 'Tugas Mesin/Operator', icon: <Wrench size={22} />, color: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }
        ]
      };
      default: return { title: 'Manufacturing', desc: 'Modul Produksi', stats: [] };
    }
  };

  const pageInfo = getPageInfo();

  const handleSmartDelete = async (doctype: string, docname: string, docstatus: number | undefined, isActive: number | undefined) => {
    if (!confirm(`Yakin ingin menghapus ${doctype} ${docname}?`)) return;
    try {
      const { apiUpdate, apiDelete } = await import('@/lib/api');
      
      if (doctype === 'BOM') {
        try { await apiUpdate(doctype, docname, { is_default: 0, is_active: 0 }); } catch (e) {}
      }

      if (docstatus === 1 || isActive === 1) {
        await apiUpdate(doctype, docname, { docstatus: 2 });
      }
      
      await apiDelete(doctype, docname);
      alert('✅ Berhasil dihapus!');
      handleRefreshAll();
    } catch (err: any) {
      alert(`❌ Gagal Hapus!\n\nAlasan ERPNext: HTTP 417 / Konflik.\n\nTips: Dokumen ini tidak bisa dihapus karena sedang terikat dengan data lain (misal dipakai di Work Order). Klik icon MATA untuk menghapus dokumen terkait terlebih dahulu.`);
    }
  };

  const handleActivateBOM = async (bomName: string) => {
    if (!confirm(`Aktifkan BOM ${bomName} sekarang?`)) return;
    try {
      const response = await fetch(`/api/frappe/resource/BOM/${encodeURIComponent(bomName)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: 1, docstatus: 1, is_default: 1 })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(extractFrappeError(errData, 'Gagal mengaktifkan BOM.'));
      }
      alert('✅ BOM berhasil diaktifkan!');
      handleRefreshAll();
    } catch (err: any) {
      alert(`❌ Gagal mengaktifkan BOM!\n\nAlasan ERPNext: ${err.message}\n\nPastikan semua bahan baku sudah memiliki stok & harga (Valuation Rate) di Gudang.`);
    }
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>

      {/* HEADER DINAMIS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>{pageInfo.title}</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>{pageInfo.desc} <strong>({userCompany})</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'bom' && <button className="btn btn-primary btn-sm" style={{ background: '#7c3aed' }} onClick={() => setShowCreateBOMModal(true)}><Plus size={14} /> BOM Baru</button>}
          {activeTab === 'workorders' && <button className="btn btn-primary btn-sm" onClick={() => setShowCreateWOModal(true)}><Plus size={14} /> Work Order Baru</button>}
          {activeTab === 'jobcards' && <button className="btn btn-primary btn-sm" style={{ background: '#f59e0b' }} onClick={() => setShowCreateJCModal(true)}><Plus size={14} /> Job Card Baru</button>}
        </div>
      </div>

      {/* STATS DINAMIS */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {pageInfo.stats.map((s, idx) => (
          <div key={idx} className="stat-card card-hover" style={{ flex: 1, minWidth: '200px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{s.sub}</p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS (KHUSUS WORK ORDERS) */}
      {activeTab === 'workorders' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', marginBottom: '16px' }}>
          <div className="chart-container">
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>Produksi vs Target (6 Bulan)</p>
            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={productionTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v)}`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, name) => [`${formatNumber(Number(v))} pcs`, String(name) === 'planned' ? 'Target' : 'Diproduksi']} />
                <Bar dataKey="planned" name="Target" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="produced" name="Diproduksi" fill="#0066B3" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Status Work Order</p>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{workOrderStatus.total}</p>
                <p style={{ fontSize: '10px', color: '#6B7280' }}>Total</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
              {donutData.map((item, i) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[i] }} />
                  <span style={{ color: '#6B7280' }}>{item.name}: <strong style={{ color: '#111827' }}>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AREA TABEL DATA */}
      <div className="chart-container">
        {/* BARIS PENCARIAN TERISOLASI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#374151' }}>Daftar {pageInfo.title}</h3>
          <div style={{ position: 'relative', width: '100%', maxWidth: '220px' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder={`Cari data...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '100%' }} />
          </div>
        </div>

        {activeTab === 'workorders' && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {WO_STATUSES.map(f => <button key={f} className={`filter-pill ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>{f}</button>)}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="erp-table">
            <thead>
              {activeTab === 'bom' && <tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>BOM ID & Waktu Dibuat</th><th>Produk</th><th>Status</th><th style={{ width: '120px', textAlign: 'right' }}>Actions</th></tr>}
              {activeTab === 'workorders' && <tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>WO ID & Waktu Dibuat</th><th>Sales Order</th><th>Item Produksi</th><th style={{ textAlign: 'right' }}>Qty</th><th>Tgl Mulai</th><th>Status</th><th style={{ width: '80px', textAlign: 'right' }}>Actions</th></tr>}
              {activeTab === 'jobcards' && <tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>JC ID & Waktu Dibuat</th><th>Work Order</th><th>Operation</th><th>Workstation</th><th>Durasi Kerja</th><th>Status</th><th style={{ width: '80px', textAlign: 'right' }}>Actions</th></tr>}
            </thead>
            <tbody>
              {activeTab === 'bom' && filteredBOMs.map((bom: any, index) => (
                <tr key={bom.name}>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                  <td>
                    <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{bom.name}</div>
                    {bom.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Ditambahkan: {formatCreationTime(bom.creation)}</div>}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{bom.item_name || bom.item}</td>
                  <td>
                    <span className={`badge ${(bom.docstatus === 1 || bom.is_active === 1) ? 'badge-success' : 'badge-gray'}`}>
                      {(bom.docstatus === 1 || bom.is_active === 1) ? 'Aktif' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* PENAMBAHAN TOMBOL AKTIFKAN JIKA MASIH DRAFT */}
                      {(bom.is_active === 0 || bom.docstatus === 0 || !bom.docstatus) && (
                        <button onClick={() => handleActivateBOM(bom.name)} style={{ background: '#059669', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Aktifkan BOM ini">
                          <CheckCircle size={12} /> Aktifkan
                        </button>
                      )}
                      <a href={`http://34.101.192.135:8080/app/bom/${encodeURIComponent(bom.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', padding: '4px', display: 'flex' }} title="Buka di ERPNext" onClick={(e) => e.stopPropagation()}>
                        <Eye size={16} />
                      </a>
                      <button onClick={(e) => { e.stopPropagation(); handleSmartDelete('BOM', bom.name, bom.docstatus, bom.is_active); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', display: 'flex' }} title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeTab === 'workorders' && filteredWOs.map((wo: any, index) => {
                const isDraft = wo.docstatus === 0 || wo.status === 'Draft';
                return (
                  <tr key={wo.name} onClick={() => setSelectedWO(wo)} style={{ cursor: 'pointer' }}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{wo.name}</div>
                      {wo.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Ditambahkan: {formatCreationTime(wo.creation)}</div>}
                    </td>
                    <td style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                      {wo.sales_order ? (
                        <a href={`http://34.101.192.135:8080/app/sales-order/${encodeURIComponent(wo.sales_order)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                          {wo.sales_order} <ArrowUpRight size={12} />
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{wo.item_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{wo.qty} pcs</td>
                    <td style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(wo.planned_start_date)}</td>
                    <td><span className={`badge ${isDraft ? 'badge-gray' : wo.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>{isDraft ? 'Draft' : wo.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a href={`http://34.101.192.135:8080/app/work-order/${encodeURIComponent(wo.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', padding: '4px', display: 'flex' }} title="Buka di ERPNext" onClick={(e) => e.stopPropagation()}>
                          <Eye size={16} />
                        </a>
                        <button onClick={(e) => { e.stopPropagation(); handleSmartDelete('Work Order', wo.name, wo.docstatus, undefined); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', display: 'flex' }} title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activeTab === 'jobcards' && filteredJobCards.map((jc: any, index) => {
                let durationText = '-';
                if (jc.status === 'Completed' && jc.total_time_in_mins) {
                   const hrs = Math.floor(jc.total_time_in_mins / 60); const mins = Math.floor(jc.total_time_in_mins % 60); durationText = hrs > 0 ? `${hrs}j ${mins}m` : `${mins} menit`;
                } else if (jc.status === 'Work In Progress') { durationText = '⏳ Sedang Berjalan'; }
                return (
                  <tr key={jc.name} onClick={() => setSelectedJC(jc)} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{jc.name}</div>
                      {jc.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Ditambahkan: {formatCreationTime(jc.creation)}</div>}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{jc.work_order}</td>
                    <td>{jc.operation}</td>
                    <td>{jc.workstation}</td>
                    <td style={{ fontSize: '12px', color: jc.status === 'Work In Progress' ? '#d97706' : '#6B7280', fontWeight: jc.status === 'Work In Progress' ? 600 : 400 }}>{durationText}</td>
                    <td><span className={`badge ${jc.docstatus === 0 || jc.status === 'Draft' ? 'badge-gray' : jc.status === 'Work In Progress' ? 'badge-warning' : 'badge-success'}`}>{jc.docstatus === 0 ? 'Draft' : jc.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a href={`http://34.101.192.135:8080/app/job-card/${encodeURIComponent(jc.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', padding: '4px', display: 'flex' }} title="Buka di ERPNext" onClick={(e) => e.stopPropagation()}>
                          <Eye size={16} />
                        </a>
                        <button onClick={(e) => { e.stopPropagation(); handleSmartDelete('Job Card', jc.name, jc.docstatus, undefined); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', display: 'flex' }} title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activeTab === 'bom' && filteredBOMs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Tidak ada BOM.</td></tr>}
              {activeTab === 'workorders' && filteredWOs.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Tidak ada Work Order.</td></tr>}
              {activeTab === 'jobcards' && filteredJobCards.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Tidak ada Job Card.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      
      {showCreateWOModal && <CreateWorkOrderModal userCompany={userCompany} items={items} boms={myBOMs} salesOrders={salesOrders} onClose={() => setShowCreateWOModal(false)} onSuccess={handleRefreshAll} />}
      {showCreateBOMModal && <CreateBOMModal userCompany={userCompany} items={items} onClose={() => setShowCreateBOMModal(false)} onSuccess={handleRefreshAll} />}
      {showCreateJCModal && <CreateJobCardModal userCompany={userCompany} workOrders={myWOs} jobCards={myJobCards} onClose={() => setShowCreateJCModal(false)} onSuccess={handleRefreshAll} />}
      {selectedWO && <WorkOrderDetailModal wo={selectedWO} jobCards={myJobCards} onClose={() => setSelectedWO(null)} onSuccess={handleRefreshAll} />}
      {selectedJC && <JobCardDetailModal jc={selectedJC} onClose={() => setSelectedJC(null)} onSuccess={handleRefreshAll} />}
      
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

export default function ManufacturingPage() {
  const router = useRouter();
  const { canAccess } = useAuth();

  useEffect(() => {
    if (!canAccess('manufacturing')) router.push('/dashboard');
  }, [canAccess, router]);

  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat halaman...</div>}>
      <ManufacturingPageContent />
    </Suspense>
  );
}