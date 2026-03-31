'use client';

import React, { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import {
  Plus, X, Trash2, Eye, Search, Layers, Wrench, PlayCircle, CheckCircle, AlertCircle, Send, Loader2, Info, AlertTriangle, MapPin
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { TableSkeleton } from '@/components/EmptyState';

const FIXED_COMPANY = 'Artavista';
const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#FFB800'; // Disamakan dengan Selling (Kuning)

// ==========================================
// TRANSLATOR ERROR FRAPPE
// ==========================================
const extractFrappeError = (err: any, fallbackMsg: string = 'Terjadi kesalahan sistem') => {
  let errorMsg = typeof err === 'string' ? err : (err?.message || err?.error?.message || fallbackMsg);

  if (err?._server_messages) {
    try {
      const parsed = JSON.parse(err._server_messages);
      errorMsg = JSON.parse(parsed[0]).message.replace(/<[^>]*>?/gm, '');
    } catch (e) { }
  }

  const lowerErr = errorMsg.toLowerCase();

  if (lowerErr.includes('could not find company')) {
    const companyMatch = errorMsg.match(/Company:\s*(.*)/i);
    const companyName = companyMatch ? companyMatch[1].replace(/['"]/g, '').trim() : FIXED_COMPANY;
    return `Gagal Menyimpan! Perusahaan "${companyName}" belum terdaftar.`;
  }

  if (lowerErr.includes('valuation rate not found')) {
    const match = errorMsg.match(/Item (.*?) /i) || errorMsg.match(/Item (.*?)$/i);
    const itemCode = match ? match[1].replace(/['"]/g, '').trim() : 'tersebut';
    return `Gagal! Harga Standar (Valuation Rate) untuk komponen "${itemCode}" belum diatur. Buka menu Gudang > Master Items, isi "Standard Rate (Rp)".`;
  }

  if (lowerErr.includes('linked with') || lowerErr.includes('cannot delete')) {
    return `Gagal Dihapus! Dokumen ini sudah digunakan di transaksi lain yang sudah berjalan. Batalkan dulu transaksi yang terkait.`;
  }

  if (lowerErr.includes('negative stock') || lowerErr.includes('insufficient')) {
    return `❌ Gagal! Stok Bahan Baku Tidak Cukup!\n\n👉 Sistem menolak karena stok fisiknya di Gudang Sumber kurang atau kosong. Silakan restock terlebih dahulu.`;
  }

  return errorMsg;
};

const formatCreationTime = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ==========================================
// KOMPONEN UI UX (TOAST, CONFIRM, QUANTITY MODAL)
// ==========================================
function Toast({ show, message, type }: { show: boolean, message: string, type: 'success' | 'error' | 'info' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (show) {
      setRender(true);
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      setTimeout(() => setRender(false), 300);
    }
  }, [show]);

  if (!render) return null;

  const colors = {
    success: { border: '#10b981', icon: <CheckCircle size={22} color="#10b981" />, title: 'Berhasil' },
    error: { border: '#ef4444', icon: <AlertCircle size={22} color="#ef4444" />, title: 'Gagal Memproses' },
    info: { border: '#3b82f6', icon: <Info size={22} color="#3b82f6" />, title: 'Informasi' }
  };
  const config = colors[type];

  return (
    <div className={`modern-toast ${isVisible ? 'show' : ''}`} style={{ borderLeft: `4px solid ${config.border}` }}>
      <div style={{ marginTop: '2px', flexShrink: 0 }}>{config.icon}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontWeight: 800, color: '#111827', fontSize: '14px' }}>{config.title}</span>
        {message.split('\n').map((line, i) => (
          <span key={i} style={{ color: '#4B5563', lineHeight: 1.4, fontWeight: line.includes('👉') ? 700 : 500, fontSize: '13px' }}>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

function ConfirmModal({ show, title, desc, onConfirm, onCancel, confirmText = "Ya, Lanjutkan" }: any) {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ width: '60px', height: '60px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={30} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, marginBottom: '24px', whiteSpace: 'pre-wrap' }}>{desc}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
          <button onClick={onConfirm} className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function SelectQuantityModal({ title, label, maxQty, onClose, onSubmit, isSubmitting }: any) {
  const [qty, setQty] = useState<number | string>(maxQty);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '450px', padding: '0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#111827' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '24px 20px' }}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="erp-label" style={{ fontWeight: 500, fontSize: '13px', color: '#374151', marginBottom: '8px' }}>{label}</label>
            <input
              type="number" min="1" max={maxQty} step="any" className="erp-input"
              value={qty} onChange={e => setQty(e.target.value)}
              style={{ fontSize: '14px', padding: '10px 14px' }}
            />
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>Max: {maxQty}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={() => onSubmit(Number(qty))}
              disabled={isSubmitting || Number(qty) <= 0 || Number(qty) > maxQty}
              style={{ background: '#111827', borderColor: '#111827', padding: '8px 24px', fontSize: '13px', fontWeight: 600, borderRadius: '6px' }}
            >
              {isSubmitting ? 'Memproses...' : 'Sahkan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const getDynamicCompany = (warehouses: any[]) => {
  const validWarehouse = (warehouses || []).find((w: any) => !w.is_group && w.company);
  return validWarehouse ? validWarehouse.company : FIXED_COMPANY;
};

// ==========================================
// MODAL CREATE & PREVIEW BOM
// ==========================================
function CreateBOMModal({ onClose, items, warehouses, onSuccess, showToast }: any) {
  const defaultCompany = useMemo(() => getDynamicCompany(warehouses), [warehouses]);
  const [form, setForm] = useState({ item: '', quantity: '1' });
  const [bomItems, setBomItems] = useState([{ item_code: '', qty: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item) return setError("Pilih Produk Akhir.");
    if (bomItems.some(bi => !bi.item_code)) return setError("Pilih semua bahan baku.");
    if (Number(form.quantity) <= 0) return setError("Target produksi BOM harus lebih dari 0.");

    setIsSubmitting(true); setError('');
    try {
      const selectedMainItem = (items || []).find((i: any) => i.item_code === form.item);
      const bomData = {
        item: form.item,
        quantity: parseFloat(form.quantity),
        uom: selectedMainItem?.stock_uom || 'Nos',
        company: defaultCompany,
        is_active: 1,
        items: bomItems.map((bi: any) => {
          const itemDetail = (items || []).find((it: any) => it.item_code === bi.item_code);
          return { item_code: bi.item_code, qty: parseFloat(String(bi.qty)), uom: itemDetail?.stock_uom || 'Nos', rate: itemDetail?.standard_rate || 0 };
        })
      };

      const { apiCreate, apiUpdate } = await import('@/lib/api');
      const res: any = await apiCreate('BOM', bomData);

      const docName = res.data?.name || res.name;
      if (docName) await apiUpdate('BOM', docName, { docstatus: 1 });

      showToast('Resep BOM Berhasil dibuat dan langsung Aktif!', 'success');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(extractFrappeError(err, "Gagal membuat BOM."));
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Buat Resep Baru (BOM)</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Bill of Materials untuk panduan pabrik</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">Produk Jadi (Item yang dirakit) *</label>
              <select required className="erp-input" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}>
                <option value="">-- Pilih Barang Jadi --</option>
                {(items || []).map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="erp-label">Qty Dihasilkan *</label>
              <input type="number" required min="1" className="erp-input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p className="section-title" style={{ margin: 0, padding: 0, border: 'none' }}>Daftar Bahan Baku (Komponen)</p>
            </div>

            {bomItems.map((bi, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }} className="mobile-flex-col">
                <div style={{ flex: 3 }}>
                  <select className="erp-input" value={bi.item_code} onChange={e => { const n = [...bomItems]; n[i].item_code = e.target.value; setBomItems(n); }}>
                    <option value="">-- Pilih Komponen --</option>
                    {(items || []).map((it: any) => <option key={it.name} value={it.item_code}>{it.item_code}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                  <input style={{ flex: 1, textAlign: 'center' }} type="number" min="0.1" step="any" placeholder="Qty" className="erp-input" value={bi.qty} onChange={e => { const n = [...bomItems]; n[i].qty = Number(e.target.value); setBomItems(n); }} />
                  {bomItems.length > 1 && <button type="button" onClick={() => setBomItems(bomItems.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm mobile-full-width" onClick={() => setBomItems([...bomItems, { item_code: '', qty: 1 }])} style={{ color: COLOR_PRIMARY, borderColor: COLOR_PRIMARY, background: '#eff6ff', marginTop: '4px' }} disabled={bomItems[bomItems.length - 1].item_code === ''}>+ Tambah Bahan Lain</button>
          </div>

          {error && (
            <div className="error-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> <span>Ada Kendala:</span></div>
              {error.split('\n').map((line, idx) => (
                <span key={idx} style={{ fontWeight: line.includes('👉') ? 800 : 500, fontSize: '12px' }}>{line}</span>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }} disabled={isSubmitting}>{isSubmitting ? 'Memproses...' : 'Simpan & Aktifkan BOM'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailBOMModal({ bom, workOrders, onClose }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const usedInWOs = (workOrders || []).filter((wo: any) => wo.bom_no === bom.name);
  const isUsed = usedInWOs.length > 0;

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/BOM/${encodeURIComponent(bom.name)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.data) setFullData(data.data);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetail();
  }, [bom.name]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${fullData?.is_active ? 'badge-success' : 'badge-gray'}`}>{fullData?.is_active ? 'Aktif Digunakan' : 'Non-Aktif'}</span>
                  <span className={`badge ${isUsed ? 'badge-info' : 'badge-warning'}`}>{isUsed ? 'Dipakai di WO' : 'Belum Dipakai'}</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Produk Jadi Target</p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: COLOR_PRIMARY }}>{fullData?.item}</p>
              </div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Kuantitas Produksi</p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{fullData?.quantity} {fullData?.uom}</p>
              </div>
            </div>

            {isUsed && (
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px dashed #bfdbfe', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 700, marginBottom: '4px' }}>DIPAKAI OLEH WORK ORDER:</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {usedInWOs.map((wo: any) => <span key={wo.name} style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, border: '1px solid #bfdbfe', color: '#1e3a8a' }}>{wo.name}</span>)}
                </div>
              </div>
            )}

            <p className="section-title">Bahan Baku (Komponen yang Diperlukan)</p>
            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1px' }}>
              <table className="erp-table" style={{ width: '100%', minWidth: '400px' }}>
                <thead><tr><th>Kode Material</th><th style={{ textAlign: 'right' }}>Jumlah Dibutuhkan</th></tr></thead>
                <tbody>
                  {(fullData?.items || []).map((item: any, i: number) => (
                    <tr key={i}>
                      <td><span style={{ color: COLOR_SECONDARY, fontWeight: 700 }}>{item.item_code}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#111827' }}>{Number(item.qty)} <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600 }}>{item.uom}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary mobile-btn" onClick={onClose}>Tutup Preview</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MODAL CREATE WORK ORDER (AUTO SUBMIT)
// ==========================================
function CreateWorkOrderModal({ onClose, boms, warehouses, onSuccess, showToast }: any) {
  const defaultCompany = useMemo(() => getDynamicCompany(warehouses), [warehouses]);
  const activeWarehouses = useMemo(() => (warehouses || []).filter((w: any) => w.type === 'Stores' || !w.is_group), [warehouses]);

  const [form, setForm] = useState({
    production_item: '',
    bom_no: '',
    qty: '1',
    source_warehouse: '',
    wip_warehouse: '',
    fg_warehouse: '',
    scrap_warehouse: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleBOMChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBomName = e.target.value;
    const bomDetails = (boms || []).find((b: any) => b.name === selectedBomName);
    setForm(f => ({ ...f, bom_no: selectedBomName, production_item: bomDetails?.item || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.production_item || !form.bom_no) return setError("Item To Manufacture dan BOM No wajib diisi.");
    if (Number(form.qty) <= 0) return setError("Qty To Manufacture harus lebih dari 0.");
    if (!form.source_warehouse) return setError("Source Warehouse wajib diisi.");
    if (!form.wip_warehouse) return setError("Work-in-Progress Warehouse wajib diisi.");
    if (!form.fg_warehouse) return setError("Target Warehouse wajib diisi.");

    setIsSubmitting(true); setError('');
    try {
      const woData = {
        production_item: form.production_item,
        bom_no: form.bom_no,
        qty: parseFloat(form.qty),
        company: defaultCompany,
        source_warehouse: form.source_warehouse,
        wip_warehouse: form.wip_warehouse,
        fg_warehouse: form.fg_warehouse,
        scrap_warehouse: form.scrap_warehouse,
        use_multi_level_bom: 0
      };

      const { apiCreate, apiUpdate } = await import('@/lib/api');

      // 1. Buat WO
      const res: any = await apiCreate('Work Order', woData);
      const woName = res.data?.name || res.name;

      // 2. MAGIC: Langsung Sahkan (Submit) WO tersebut
      if (woName) {
        await apiUpdate('Work Order', woName, { docstatus: 1 });
      }

      showToast('Work Order berhasil dibuat dan Otomatis Disahkan!', 'success');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, "Gagal membuat Work Order.")); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '650px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>New Work Order</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">BOM No *</label>
              <select required className="erp-input" value={form.bom_no} onChange={handleBOMChange}>
                <option value="">-- Select BOM --</option>
                {(boms || []).map((b: any) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.item}) {b.docstatus === 0 ? '- Draft' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="erp-label">Item To Manufacture *</label>
              <input type="text" className="erp-input disabled-input" value={form.production_item} readOnly placeholder="Auto-filled by BOM" />
            </div>
          </div>

          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">Qty To Manufacture *</label>
              <input type="number" required min="1" step="any" className="erp-input" value={form.qty} onChange={e => { if (!e.target.value.includes('-')) setForm(f => ({ ...f, qty: e.target.value })) }} />
            </div>
            <div className="form-group">
              <label className="erp-label">Source Warehouse *</label>
              <select required className="erp-input" value={form.source_warehouse} onChange={e => setForm(f => ({ ...f, source_warehouse: e.target.value }))}>
                <option value="">-- Select Source --</option>
                {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
              </select>
              <p className="helper-text">Gudang asal bahan baku</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
            <h3 className="section-title" style={{ fontSize: '13px', marginBottom: '12px' }}><Layers size={14} /> Target Warehouse Details</h3>
            <div className="responsive-grid">
              <div className="form-group">
                <label className="erp-label">Work-in-Progress Warehouse *</label>
                <select required className="erp-input" value={form.wip_warehouse} onChange={e => setForm(f => ({ ...f, wip_warehouse: e.target.value }))}>
                  <option value="">-- Select WIP --</option>
                  {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
                <p className="helper-text">Lokasi mesin/perakitan.</p>
              </div>
              <div className="form-group">
                <label className="erp-label">Target Warehouse *</label>
                <select required className="erp-input" value={form.fg_warehouse} onChange={e => setForm(f => ({ ...f, fg_warehouse: e.target.value }))}>
                  <option value="">-- Select Target --</option>
                  {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
                <p className="helper-text">Lokasi penyimpanan hasil akhir.</p>
              </div>
            </div>
            <div className="form-group" style={{ width: '50%', paddingRight: '8px' }}>
              <label className="erp-label">Scrap Warehouse</label>
              <select className="erp-input" value={form.scrap_warehouse} onChange={e => setForm(f => ({ ...f, scrap_warehouse: e.target.value }))}>
                <option value="">-- Optional Scrap --</option>
                {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="error-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> <span>Error:</span></div>
              {error.split('\n').map((line, idx) => (
                <span key={idx} style={{ fontWeight: line.includes('👉') ? 800 : 500, fontSize: '12px' }}>{line}</span>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Cancel</button>
            <button type="submit" className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Buat & Sahkan WO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailWorkOrderModal({ wo, onClose }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(wo.name)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.data) setFullData(data.data);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetail();
  }, [wo.name]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Rincian Perintah: {fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${fullData?.status === 'Completed' ? 'badge-success' : fullData?.status === 'In Process' ? 'badge-info' : fullData?.status === 'Draft' ? 'badge-gray' : 'badge-warning'}`}>{fullData?.status || wo.status}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Dibuat: {formatDate(fullData?.creation)}</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Barang yang Diproduksi</p><p style={{ fontSize: '14px', fontWeight: 800, color: COLOR_PRIMARY }}>{fullData?.production_item}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>BOM No</p><p style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{fullData?.bom_no}</p></div>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}><p style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Qty To Manufacture</p><p style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>{fullData?.qty}</p></div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
              <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0, border: 'none' }}><MapPin size={14} /> Pengaturan Alur Gudang</h3>
              <div className="responsive-grid" style={{ gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Sumber Bahan Baku (Source)</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{fullData?.source_warehouse || '-'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Penyimpanan Hasil Jadi (FG)</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>{fullData?.fg_warehouse || '-'}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary mobile-btn" onClick={onClose}>Tutup Preview</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. MAIN PAGE CONTENT
// ==========================================
function ManufacturingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'workorders';
  const [activeTab, setActiveTab] = useState(tabParam);
  useEffect(() => { setActiveTab(tabParam || 'workorders'); }, [tabParam]);

  const { boms, workOrders, isLoading, refetch } = useManufacturingData() as any;
  const { items, warehouses } = useStockData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateBOM, setShowCreateBOM] = useState(false);
  const [showCreateWO, setShowCreateWO] = useState(false);

  const [selectedBOM, setSelectedBOM] = useState<any>(null);
  const [selectedWO, setSelectedWO] = useState<any>(null);

  // States for Start and Finish modals
  const [startWO, setStartWO] = useState<any>(null);
  const [finishWO, setFinishWO] = useState<any>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // TOAST REWORKED
  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, desc: string, action: any, confirmText?: string }>({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });
  const showConfirm = (title: string, desc: string, action: any, confirmText = 'Ya, Lanjutkan') => setConfirmModal({ show: true, title, desc, action, confirmText });
  const closeConfirm = () => setConfirmModal({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });

  const sortByNewest = (data: any[]) => {
    return [...(data || [])].sort((a, b) => {
      let timeA = new Date(a.creation || 0).getTime();
      let timeB = new Date(b.creation || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return String(b.name).localeCompare(String(a.name));
    });
  };

  const sortedBOMs = useMemo(() => sortByNewest(boms || []), [boms]);
  const sortedWOs = useMemo(() => sortByNewest(workOrders || []), [workOrders]);

  const filteredBOMs = sortedBOMs.filter((b: any) => !searchQuery || (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.item || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWOs = sortedWOs.filter((w: any) => !searchQuery || (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (w.production_item || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSmartDelete = (doctype: string, docname: string, docstatus: number) => {
    if (!docname) return;
    showConfirm(`Hapus Dokumen ${doctype}?`, `Apakah Anda yakin ingin menghapus data ${docname} secara permanen? Jika data ini sudah terkait pembukuan ERPNext, ERPNext akan menolak penghapusan.`, () => {
      closeConfirm();
      setTimeout(() => {
        import('@/lib/api').then(({ apiUpdate, apiDelete }) => {
          if (docstatus === 1) apiUpdate(doctype, docname, { docstatus: 2 }).then(() => apiDelete(doctype, docname)).catch((err) => showToast(extractFrappeError(err), 'error'));
          else apiDelete(doctype, docname).catch((err) => showToast(extractFrappeError(err), 'error'));
        }).catch(() => { });
      }, 50);
      showToast(`Proses hapus ${doctype} sedang dijalankan...`, 'info');
      setTimeout(() => { refetch(); }, 800);
    }, "Ya, Hapus Saja"
    );
  };

  // 💡 FUNGSI SIHIR 1: START (Material Transfer for Manufacture)
  const handleStartConfirm = async (transferQty: number) => {
    setIsSubmittingAction(true);
    try {
      const { apiCreate, apiUpdate } = await import('@/lib/api');

      const woRes = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(startWO.name)}`, { cache: 'no-store' });
      const fullWo = (await woRes.json()).data;
      const bomRes = await fetch(`/api/frappe/resource/BOM/${encodeURIComponent(fullWo.bom_no)}`, { cache: 'no-store' });
      const bomData = (await bomRes.json()).data;

      // 1. Map komponen untuk dipindah ke WIP
      const seItems = bomData.items.map((rm: any) => ({
        item_code: rm.item_code,
        s_warehouse: fullWo.source_warehouse, // Dari Gudang Asal
        t_warehouse: fullWo.wip_warehouse,    // Ke Gudang Mesin/WIP
        qty: Number(rm.qty) * transferQty,
        uom: rm.uom
      }));

      const transferData = {
        stock_entry_type: "Material Transfer for Manufacture",
        work_order: fullWo.name,
        company: fullWo.company,
        from_bom: 1,
        bom_no: fullWo.bom_no,
        use_multi_level_bom: fullWo.use_multi_level_bom || 0,
        fg_completed_qty: transferQty,
        items: seItems
      };

      // 2. Eksekusi Create & Submit Stock Entry
      const seRes: any = await apiCreate('Stock Entry', transferData);
      const seName = seRes.data?.name || seRes.name;
      await apiUpdate('Stock Entry', seName, { docstatus: 1 });

      // 3. 🔍 PROSES VALIDASI KONFIRMASI (Mengecek ke DB ERPNext)
      showToast("Memverifikasi perpindahan stok di sistem...", "info");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Beri waktu Frappe memproses background job

      const verifyWoRes = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(fullWo.name)}`, { cache: 'no-store' });
      const verifiedWo = (await verifyWoRes.json()).data;

      if (verifiedWo.status === 'In Process' || verifiedWo.material_transferred_for_manufacturing > 0) {
        showToast("✅ Validasi Sukses: Bahan baku terkonfirmasi ditarik! (Status: In Process)", "success");
      } else {
        showToast("⚠️ Stock Entry terbuat, tapi ada delay update status dari server Frappe. Silakan refresh.", "info");
      }

      setStartWO(null);
      refetch();
    } catch (err: any) {
      showToast(extractFrappeError(err, "Gagal transfer bahan baku."), "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 💡 FUNGSI SIHIR 2: FINISH (Manufacture)
  const handleFinishConfirm = async (manufactureQty: number) => {
    setIsSubmittingAction(true);
    try {
      const { apiCreate, apiUpdate } = await import('@/lib/api');

      const woRes = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(finishWO.name)}`, { cache: 'no-store' });
      const fullWo = (await woRes.json()).data;
      const bomRes = await fetch(`/api/frappe/resource/BOM/${encodeURIComponent(fullWo.bom_no)}`, { cache: 'no-store' });
      const bomData = (await bomRes.json()).data;

      const seItems: any[] = [];

      // 1. Bahan Baku DIKONSUMSI (BERKURANG) dari Gudang WIP
      bomData.items.forEach((rm: any) => {
        seItems.push({
          item_code: rm.item_code,
          s_warehouse: fullWo.wip_warehouse,
          t_warehouse: "", // 👈 KOSONG (Wajib! Penanda bahan baku hangus dipakai)
          qty: Number(rm.qty) * manufactureQty,
          uom: rm.uom
        });
      });

      // 2. Barang Jadi DIBUAT (BERTAMBAH) di Gudang Target
      seItems.push({
        item_code: fullWo.production_item,
        s_warehouse: "", // 👈 KOSONG (Wajib! Penanda barang ini baru diciptakan)
        t_warehouse: fullWo.fg_warehouse,
        qty: manufactureQty,
        is_finished_item: 1,
        uom: bomData.uom || bomData.stock_uom || 'Nos'
      });

      const seData = {
        stock_entry_type: "Manufacture",
        work_order: fullWo.name,
        company: fullWo.company,
        from_bom: 1,
        bom_no: fullWo.bom_no,
        use_multi_level_bom: fullWo.use_multi_level_bom || 0,
        fg_completed_qty: manufactureQty,
        items: seItems
      };

      // 3. Eksekusi Create & Submit Stock Entry Manufacture
      const seRes: any = await apiCreate('Stock Entry', seData);
      const seName = seRes.data?.name || seRes.name;
      await apiUpdate('Stock Entry', seName, { docstatus: 1 });

      // 4. 🔍 PROSES VALIDASI KONFIRMASI (Mengecek ke DB ERPNext)
      showToast("Menyimpan hasil rakitan ke Gudang Finish Good...", "info");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Beri waktu Frappe memproses mutasi

      const verifyWoRes = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(fullWo.name)}`, { cache: 'no-store' });
      const verifiedWo = (await verifyWoRes.json()).data;

      if (verifiedWo.produced_qty > 0 || verifiedWo.status === 'Completed') {
        showToast(`🎉 Validasi Sukses: Produksi Selesai! Stok barang jadi masuk ke Gudang!`, 'success');
      } else {
        showToast("⚠️ Manufacture SE selesai, namun proses update status WO mengalami delay di latar belakang.", 'info');
      }

      setFinishWO(null);
      refetch();
    } catch (err: any) {
      showToast(extractFrappeError(err, "Gagal menyelesaikan proses produksi."), 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getAvatar = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // ── LOGIKA DINAMIS HERO CARD ──
  let heroTitle = '';
  let heroSubtitle = '';
  let heroBtnText = '';
  let heroBtnAction = () => { };

  if (activeTab === 'bom') {
    const activeBoms = boms?.filter((b: any) => b.is_active).length || 0;
    heroTitle = 'Manajemen Resep Produksi';
    heroSubtitle = `Saat ini terdapat ${activeBoms} resep (BOM) aktif di sistem. Pastikan standar komposisi material sesuai sebelum memulai produksi.`;
    heroBtnText = 'Buat BOM Baru';
    heroBtnAction = () => setShowCreateBOM(true);
  } else {
    // default: workorders
    const activeWOs = workOrders?.filter((w: any) => w.docstatus === 1 && w.status !== 'Completed').length || 0;
    heroTitle = 'Halo, Tim Produksi!';
    heroSubtitle = `Hari ini Anda memiliki ${activeWOs} perintah kerja aktif yang siap diproses. Segera eksekusi agar tidak menumpuk.`;
    heroBtnText = 'Buat Work Order Baru';
    heroBtnAction = () => setShowCreateWO(true);
  }

  return (
    <div className="tw-root" style={{ fontFamily: "'Inter', 'Poppins', sans-serif", animation: 'fadeIn 0.4s ease-out' }}>
      <Toast show={toast.show} message={toast.msg} type={toast.type} />
      <ConfirmModal show={confirmModal.show} title={confirmModal.title} desc={confirmModal.desc} confirmText={confirmModal.confirmText} onConfirm={confirmModal.action} onCancel={closeConfirm} />

      {isLoading && <div style={{ background: 'white', borderRadius: '16px', padding: '12px', marginBottom: '20px' }}><TableSkeleton rows={6} cols={5} /></div>}

      {/* MODALS */}
      {showCreateBOM && <CreateBOMModal items={items} warehouses={warehouses} onClose={() => setShowCreateBOM(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateWO && <CreateWorkOrderModal boms={sortedBOMs.filter((b: any) => b.docstatus === 1 || b.is_active)} warehouses={warehouses} onClose={() => setShowCreateWO(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {selectedBOM && <DetailBOMModal bom={selectedBOM} workOrders={sortedWOs} onClose={() => setSelectedBOM(null)} />}
      {selectedWO && <DetailWorkOrderModal wo={selectedWO} onClose={() => setSelectedWO(null)} />}

      {/* SELECT QUANTITY MODALS FOR START & FINISH */}
      {startWO && (
        <SelectQuantityModal
          title="Tarik Bahan Baku (Start)"
          label="Berapa banyak bahan baku yang ingin ditarik?"
          maxQty={startWO.qty - (startWO.material_transferred_for_manufacturing || 0)}
          onClose={() => setStartWO(null)}
          onSubmit={handleStartConfirm}
          isSubmitting={isSubmittingAction}
        />
      )}
      {finishWO && (
        <SelectQuantityModal
          title="Selesaikan Produksi (Finish)"
          label="Berapa unit barang jadi yang berhasil dibuat?"
          maxQty={finishWO.qty - (finishWO.produced_qty || 0)}
          onClose={() => setFinishWO(null)}
          onSubmit={handleFinishConfirm}
          isSubmitting={isSubmittingAction}
        />
      )}

      {/* HERO SECTION */}
      <div className="tw-hero-layout">
        <div className="tw-hero-card">
          <div className="tw-hero-content">
            <h2 className="tw-hero-title">{heroTitle}</h2>
            <p className="tw-hero-subtitle">{heroSubtitle}</p>
            <button className="tw-btn-yellow" onClick={heroBtnAction}>{heroBtnText}</button>
          </div>
          <div className="tw-hero-illustration">
            <img src="/images/ill-mfg.png" alt="Manufacturing" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        <div className="tw-stats-col">
          <div className="tw-stat-card">
            <div>
              <p className="tw-stat-label">Resep BOM Aktif</p>
              <h3 className="tw-stat-value">{boms?.filter((b: any) => b.is_active).length || 0}</h3>
            </div>
            <div className="tw-stat-icon-blue"><Layers size={20} /></div>
          </div>
          <div className="tw-stat-card">
            <div>
              <p className="tw-stat-label">WO Sedang Diproses</p>
              <h3 className="tw-stat-value">{workOrders?.filter((w: any) => w.docstatus === 1 && w.status === 'In Process').length || 0}</h3>
            </div>
            <div className="tw-stat-icon-orange"><Wrench size={20} /></div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="tw-table-wrapper">
        <div className="tw-table-header" style={{ marginBottom: '16px' }}>
          <h3 className="tw-table-title">
            {activeTab === 'bom' ? 'Bill of Materials (BOM)' : 'Work Orders (WO)'}
          </h3>
          {/* TABS MENU DIHAPUS KARENA SUDAH DI SIDEBAR */}
        </div>

        <div className="tw-table-filters" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          {/* BARIS 1: Search Bar & Tombol Action (+ Baru) */}
          <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minWidth: '200px', maxWidth: '400px' }} className="mobile-search-full">
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Pencarian data..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="tw-search-input" />
            </div>

            {/* TOMBOL (+BARU) DI EDIT DISINI (WARNA KUNING) */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {activeTab === 'bom' && (
                <button
                  className="tw-btn-action"
                  onClick={() => setShowCreateBOM(true)}
                  style={{ background: COLOR_PRIMARY, color: 'white' }}
                >
                  <Plus size={14} /> Baru
                </button>
              )}
              {activeTab === 'workorders' && (
                <button
                  className="tw-btn-action"
                  onClick={() => setShowCreateWO(true)}
                  style={{ background: COLOR_PRIMARY, color: 'white' }}
                >
                  <Plus size={14} /> Baru
                </button>
              )}
            </div>
          </div>
        </div>

        {!isLoading && (
          <div style={{ overflowX: 'auto' }}>
            <table className="twithr-table">
              <thead>
                {activeTab === 'bom' && (
                  <tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>BOM ID & Target</th><th>Status</th><th>Kuantitas</th><th style={{ width: '100px', textAlign: 'center' }}>Aksi</th></tr>
                )}
                {activeTab === 'workorders' && (
                  <tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>WO ID & Waktu</th><th>Status & Progress</th><th>Barang Produksi</th><th>BOM Ref</th><th style={{ textAlign: 'center' }}>Target</th><th style={{ width: '160px', textAlign: 'center' }}>Tindakan</th></tr>
                )}
              </thead>
              <tbody>

                {/* BOM ROWS */}
                {activeTab === 'bom' && filteredBOMs.map((bom: any, index: number) => {
                  return (
                    <tr key={bom.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div className="tw-avatar-name">
                          <div className="tw-avatar" style={{ background: '#e0e7ff', color: COLOR_PRIMARY }}>{getAvatar(bom.item)}</div>
                          <div className="tw-name-col">
                            <span className="tw-name">{bom.name}</span>
                            <span className="tw-sub">Bahan Jadi: {bom.item}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`tw-pill`} style={{ background: bom.is_active ? '#D1FAE5' : '#F3F4F6', color: bom.is_active ? '#059669' : '#4B5563' }}>
                          {bom.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#111827', fontSize: '13px' }}>{bom.quantity}</td>
                      <td>
                        <div className="tw-actions">
                          <button onClick={() => setSelectedBOM(bom)} className="tw-icon-btn" title="View"><Eye size={16} /></button>
                          <button onClick={() => handleSmartDelete('BOM', bom.name, bom.docstatus)} className="tw-icon-btn tw-icon-red" title="Hapus"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {/* WORK ORDER ROWS */}
                {activeTab === 'workorders' && filteredWOs.map((wo: any, index: number) => {
                  let statusBg = '#F3F4F6'; let statusColor = '#4B5563';

                  if (wo.status === 'Completed' || wo.produced_qty >= wo.qty) { statusBg = '#D1FAE5'; statusColor = '#059669'; }
                  else if (wo.status === 'In Process' || wo.produced_qty > 0) { statusBg = '#E0F2FE'; statusColor = '#0284C7'; }
                  else if (wo.status !== 'Draft') { statusBg = '#FEF3C7'; statusColor = '#D97706'; }

                  // Kalkulasi batasan Start & Finish agar tombol pintar
                  const transferredQty = wo.material_transferred_for_manufacturing || 0;
                  const producedQty = wo.produced_qty || 0;

                  // Boleh start kalau bahan yang ditarik masih kurang dari target
                  const canStart = wo.docstatus === 1 && (transferredQty < wo.qty);
                  // Boleh finish kalau ada bahan yang udah ditarik (In Process) DAN belum selesai semua
                  const canFinish = wo.docstatus === 1 && (transferredQty > 0) && (producedQty < wo.qty);

                  return (
                    <tr key={wo.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div className="tw-name-col">
                          <span className="tw-name">{wo.name}</span>
                          {wo.creation && <span className="tw-sub">{formatCreationTime(wo.creation)}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="tw-dot-status">
                          <div className="tw-dot" style={{ background: statusColor }}></div>
                          <div className="tw-name-col">
                            <span style={{ fontSize: '12px', color: statusColor, fontWeight: 600 }}>{wo.docstatus === 1 ? wo.status || 'Submitted' : 'Draft'}</span>
                            <span className="tw-sub" style={{ fontSize: '10px' }}>Selesai: {producedQty} / {wo.qty}</span>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{wo.production_item}</span></td>
                      <td><span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>{wo.bom_no}</span></td>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px' }}>{wo.qty}</td>
                      <td>
                        <div className="tw-actions" style={{ justifyContent: 'flex-start' }}>

                          {canStart && (
                            <button onClick={() => setStartWO(wo)} className="tw-btn-action" style={{ background: '#1e293b', color: 'white', padding: '6px 12px' }}>
                              Start
                            </button>
                          )}

                          {canFinish && (
                            <button onClick={() => setFinishWO(wo)} className="tw-btn-action" style={{ background: COLOR_PRIMARY, color: 'white', padding: '6px 12px' }}>
                              Finish
                            </button>
                          )}

                          <button onClick={() => setSelectedWO(wo)} className="tw-icon-btn" title="Rincian"><Eye size={16} /></button>
                          {(wo.docstatus === 0 || wo.docstatus === 2) && <button onClick={() => handleSmartDelete('Work Order', wo.name, wo.docstatus)} className="tw-icon-btn tw-icon-red" title="Hapus"><Trash2 size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}

              </tbody>
            </table>

            {/* EMPTY STATES */}
            {activeTab === 'bom' && filteredBOMs.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Belum ada Resep BOM yang terdaftar.</div>}
            {activeTab === 'workorders' && filteredWOs.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Belum ada Work Order.</div>}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .tw-root { background-color: #EEF2F6; min-height: calc(100vh - 80px); padding: 20px; border-radius: 16px; margin: -10px; }
        .tw-hero-layout { display: flex; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
        .tw-hero-card { flex: 1 1 60%; background: linear-gradient(135deg, ${COLOR_PRIMARY} 0%, #17C3CC 100%); border-radius: 16px; padding: 30px; color: white; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(5, 76, 199, 0.2); display: flex; justify-content: space-between; align-items: center; }
        .tw-hero-content { flex: 1; z-index: 2; }
        .tw-hero-illustration { width: 180px; height: 160px; margin-left: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 12px; z-index: 2; }
        .tw-hero-title { font-size: 26px; font-weight: 800; margin: 0 0 8px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .tw-hero-subtitle { font-size: 13px; margin: 0 0 20px 0; max-width: 90%; opacity: 0.9; line-height: 1.5; }
        
        /* CLASS UNTUK TOMBOL KUNING KONSISTEN (Digunakan juga di tombol Baru) */
      
        /* Ubah color menjadi #ffffff (putih) */
        .tw-btn-yellow { background: ${COLOR_SECONDARY}; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 10px rgba(255, 184, 0, 0.3); }

        /* ... beberapa baris ke bawah ... */

        /* Hapus CSS HOVER TOMBOL KUNING karena tombol filter sudah jadi biru */

        .tw-btn-yellow:hover { opacity: 0.9; transform: translateY(-2px); }
        
        .tw-stats-col { flex: 1 1 30%; display: flex; flex-direction: column; gap: 16px; }
        .tw-stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px rgba(0,0,0,0.02); flex: 1; }
        .tw-stat-label { margin: 0; font-size: 12px; color: #6B7280; font-weight: 500; }
        .tw-stat-value { margin: 4px 0 0 0; font-size: 22px; font-weight: 800; color: #111827; }
        .tw-stat-icon-blue { background: #e0f2fe; color: ${COLOR_PRIMARY}; padding: 12px; border-radius: 12px; }
        .tw-stat-icon-orange { background: #FEF3C7; color: #D97706; padding: 12px; border-radius: 12px; }

        .tw-table-wrapper { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .tw-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
        .tw-table-title { font-size: 18px; font-weight: 800; color: #111827; margin: 0; }
        
        .tw-search-input { padding: 8px 12px 8px 36px; border: 1px solid #E5E7EB; border-radius: 20px; font-size: 12px; width: 100%; outline: none; transition: border-color 0.2s; background: #F9FAFB; }
        .tw-search-input:focus { border-color: ${COLOR_PRIMARY}; background: white; }
        
        .tw-btn-action { background: #F3F4F6; border: none; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #374151; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s; }
        .tw-btn-action:hover { opacity: 0.85; }

        .twithr-table { width: 100%; border-collapse: collapse; min-width: 700px; }
        .twithr-table th { text-align: left; font-size: 12px; color: #9CA3AF; font-weight: 500; padding: 12px 16px; border-bottom: 1px solid #F3F4F6; }
        .twithr-table td { padding: 16px; vertical-align: middle; border-bottom: 1px solid #F9FAFB; }
        .twithr-table tr:hover td { background: #F8FAFC; }

        .tw-avatar-name { display: flex; alignItems: center; gap: 12px; }
        .tw-avatar { width: 36px; height: 36px; border-radius: 50%; background: #e0e7ff; color: ${COLOR_PRIMARY}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0; }
        .tw-name-col { display: flex; flex-direction: column; }
        .tw-name { font-size: 13px; font-weight: 700; color: #111827; }
        .tw-sub { font-size: 11px; color: #9CA3AF; margin-top: 2px; }

        .tw-pill { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; white-space: nowrap; }
        .tw-dot-status { display: flex; align-items: center; gap: 8px; }
        .tw-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        .tw-actions { display: flex; gap: 8px; align-items: center; }
        .tw-icon-btn { background: transparent; border: none; color: #9CA3AF; padding: 6px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .tw-icon-btn:hover { background: #F3F4F6; color: #374151; }
        .tw-icon-btn.tw-icon-red:hover { background: #FEE2E2; color: #DC2626; }

        .erp-label { font-size: 12px; font-weight: 700; color: #1e293b; display: block; margin-bottom: 6px; }
        .helper-text { font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.4; font-weight: 500; }
        .erp-input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; transition: all 0.2s; }
        .erp-input:focus { border-color: ${COLOR_PRIMARY}; box-shadow: 0 0 0 3px rgba(5, 76, 199, 0.1); }
        .disabled-input { background-color: #f1f5f9; cursor: not-allowed; color: #64748b; font-weight: 600; }
        .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; color: #b91c1c; font-size: 13px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px; font-weight: 600; }
        .section-title { font-size: 14px; font-weight: 800; color: ${COLOR_PRIMARY}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .form-group { margin-bottom: 16px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .modal-footer { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 20px; }

        .modern-toast { position: fixed; top: 30px; left: 50%; transform: translate(-50%, -20px); opacity: 0; background: white; padding: 16px 20px; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); display: flex; align-items: flex-start; gap: 12px; z-index: 99999; min-width: 320px; max-width: 450px; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none; }
        .modern-toast.show { transform: translate(-50%, 0); opacity: 1; }
        
        /* HOVER UNTUK TOMBOL KUNING DI TABEL FILTER */
        .tw-btn-action[style*="background: #FFB800"]:hover { background: #E5A100; color: #111827; }

        @media (max-width: 768px) { .tw-hero-layout { flex-direction: column; } .tw-hero-card { flex-direction: column; align-items: flex-start; gap: 20px; } .tw-hero-illustration { margin-left: 0; width: 100%; height: 120px; } .tw-stats-col { flex-direction: row; } .modern-toast { width: 90%; min-width: auto; top: 16px; } }
        @media (max-width: 640px) { 
          .tw-stats-col { flex-direction: column; } 
          .responsive-grid { grid-template-columns: 1fr; } 
          .mobile-search-full { max-width: 100% !important; flex: 1 1 100% !important; }
        }
      `}</style>
    </div>
  );
}

export default function ManufacturingPage() {
  const router = useRouter();
  return (<Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" /><p>Memuat halaman...</p></div>}><ManufacturingPageContent /></Suspense>);
}