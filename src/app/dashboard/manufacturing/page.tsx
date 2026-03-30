'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useManufacturingData, useStockData, useSellingData } from '@/hooks/useFrappeData';
import {
  Cog, Plus, X, Trash2, Eye, Search, Layers, Wrench, PlayCircle, CheckCircle, AlertCircle, Send, Timer, MonitorPlay, CheckSquare, Loader2, Info, AlertTriangle, MapPin
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const FIXED_COMPANY = 'Artavista'; 
const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';

// ==========================================
// TRANSLATOR ERROR FRAPPE
// ==========================================
const extractFrappeError = (err: any, fallbackMsg: string = 'Terjadi kesalahan sistem') => {
  let errorMsg = typeof err === 'string' ? err : (err?.message || err?.error?.message || fallbackMsg);
  
  if (err?._server_messages) {
    try { 
      const parsed = JSON.parse(err._server_messages);
      errorMsg = JSON.parse(parsed[0]).message.replace(/<[^>]*>?/gm, ''); 
    } catch(e) {}
  }

  const lowerErr = errorMsg.toLowerCase();

  if (lowerErr.includes('time logs are required')) {
    return `Gagal Disahkan! Frappe membutuhkan catatan waktu (Time Log).\n\n👉 Sistem aplikasi sedang mencoba menambahkan catatan waktu otomatis. Silakan coba klik Submit sekali lagi.`;
  }

  if (lowerErr.includes('could not find company')) {
    const companyMatch = errorMsg.match(/Company:\s*(.*)/i);
    const companyName = companyMatch ? companyMatch[1].replace(/['"]/g, '').trim() : FIXED_COMPANY;
    return `Gagal Menyimpan! Perusahaan "${companyName}" belum terdaftar di database.\n\n👉 Solusi: Buka sistem ERPNext/Frappe Anda, cari menu "Company", lalu buat perusahaan baru dengan nama persis "${companyName}". Setelah itu coba proses lagi di sini.`;
  }
  
  if (lowerErr.includes('valuation rate not found')) {
    const match = errorMsg.match(/Item (.*?) /i) || errorMsg.match(/Item (.*?)$/i);
    const itemCode = match ? match[1].replace(/['"]/g, '').trim() : 'tersebut';
    return `Gagal! Harga Standar (Valuation Rate) untuk komponen "${itemCode}" belum diatur.\n\n👉 Solusi: Buka menu Gudang > Master Items, klik Edit pada barang ini, dan isi "Standard Rate (Rp)". Sistem pabrik butuh nilai ini untuk menghitung biaya produksi.`;
  }

  if (lowerErr.includes('not found') && (lowerErr.includes('operation') || lowerErr.includes('workstation'))) {
    return `Gagal Menyimpan! Operation atau Workstation yang Anda ketik belum ada di Frappe.\n\n👉 Solusi: Pastikan Anda mengetik nama Operation (misal: Perakitan) dan Workstation yang sudah terdaftar di master data Manufacturing ERPNext Anda.`;
  }
  
  if (lowerErr.includes('linked with') || lowerErr.includes('cannot delete')) {
    return `Gagal Dihapus!\n\n👉 Dokumen ini tidak bisa dihapus karena sudah digunakan di transaksi lain (misalnya Work Order yang sudah berjalan). Batalkan dulu transaksi yang terkait jika ingin menghapusnya.`;
  }

  return errorMsg;
};

const formatTimer = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const formatCreationTime = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatUang = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

// ==========================================
// KOMPONEN UI UX (TOAST & CONFIRM)
// ==========================================
function Toast({ show, message, type }: { show: boolean, message: string, type: 'success' | 'error' | 'info' }) {
  if (!show) return null;
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  return (
    <div className="custom-toast" style={{ background: bg, alignItems: 'flex-start', maxWidth: '450px' }}>
      <div style={{ marginTop: '2px' }}>
        {type === 'success' && <CheckCircle size={18} />}
        {type === 'error' && <AlertCircle size={18} />}
        {type === 'info' && <Info size={18} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {message.split('\n').map((line, i) => (
          <span key={i} style={{ lineHeight: 1.4, fontWeight: line.includes('👉') ? 800 : 500 }}>
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

const getDynamicCompany = (warehouses: any[]) => {
  const validWarehouse = (warehouses || []).find((w: any) => !w.is_group && w.company);
  return validWarehouse ? validWarehouse.company : FIXED_COMPANY;
};

// ==========================================
// 1. MODAL CREATE & PREVIEW BOM
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
      if(docName) await apiUpdate('BOM', docName, { docstatus: 1 });
      
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
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        
        <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: `1px solid ${COLOR_PRIMARY}30`, display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Info size={16} color={COLOR_PRIMARY} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '11px', color: '#1e3a8a', lineHeight: 1.4, margin: 0 }}>BOM (Bill of Materials) adalah resep. Sistem butuh tahu barang apa yang ingin dihasilkan dan komponen apa saja yang harus diambil dari gudang.</p>
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
                  {bomItems.length > 1 && <button type="button" onClick={() => setBomItems(bomItems.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border:'none', background:'#fee2e2', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm mobile-full-width" onClick={() => setBomItems([...bomItems, { item_code: '', qty: 1 }])} style={{ color: COLOR_PRIMARY, borderColor: COLOR_PRIMARY, background: '#eff6ff', marginTop: '4px' }} disabled={bomItems[bomItems.length - 1].item_code === ''}>+ Tambah Bahan Lain</button>
          </div>
          
          {error && (
            <div className="error-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> <span>Ada Kendala:</span></div>
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
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280"/></button>
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
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#111827' }}>{Number(item.qty)} <span style={{fontSize: '10px', color: '#6B7280', fontWeight: 600}}>{item.uom}</span></td>
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
// 2. MODAL CREATE & PREVIEW WORK ORDER
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
      
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Work Order', woData);
      showToast('Work Order berhasil dibuat (Draft).', 'success'); 
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
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">BOM No *</label>
              <select required className="erp-input" value={form.bom_no} onChange={handleBOMChange}>
                <option value="">-- Select BOM --</option>
                {/* Menampilkan semua BOM (baik Draft maupun Active) */}
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
              <input type="number" required min="1" step="any" className="erp-input" value={form.qty} onChange={e => { if(!e.target.value.includes('-')) setForm(f => ({ ...f, qty: e.target.value }))}} />
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
            <h3 className="section-title" style={{ fontSize: '13px', marginBottom: '12px' }}><Layers size={14}/> Target Warehouse Details</h3>
            <div className="responsive-grid">
              <div className="form-group">
                <label className="erp-label">Work-in-Progress Warehouse *</label>
                <select required className="erp-input" value={form.wip_warehouse} onChange={e => setForm(f => ({ ...f, wip_warehouse: e.target.value }))}>
                  <option value="">-- Select WIP --</option>
                  {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
                <p className="helper-text">This is a location where operations are executed.</p>
              </div>
              <div className="form-group">
                <label className="erp-label">Target Warehouse *</label>
                <select required className="erp-input" value={form.fg_warehouse} onChange={e => setForm(f => ({ ...f, fg_warehouse: e.target.value }))}>
                  <option value="">-- Select Target --</option>
                  {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
                <p className="helper-text">This is a location where final product stored.</p>
              </div>
            </div>
            <div className="form-group" style={{ width: '50%', paddingRight: '8px' }}>
              <label className="erp-label">Scrap Warehouse</label>
              <select className="erp-input" value={form.scrap_warehouse} onChange={e => setForm(f => ({ ...f, scrap_warehouse: e.target.value }))}>
                <option value="">-- Optional Scrap --</option>
                {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
              </select>
              <p className="helper-text">This is a location where scraped materials are stored.</p>
            </div>
          </div>

          {error && (
            <div className="error-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> <span>Error:</span></div>
              {error.split('\n').map((line, idx) => (
                <span key={idx} style={{ fontWeight: line.includes('👉') ? 800 : 500, fontSize: '12px' }}>{line}</span>
              ))}
            </div>
          )}
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Cancel</button>
            <button type="submit" className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailWorkOrderModal({ wo, onClose, onSubmitWO }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(onSubmitWO) await onSubmitWO(wo);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
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
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280"/></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Barang yang Diproduksi</p><p style={{ fontSize: '14px', fontWeight: 800, color: COLOR_PRIMARY }}>{fullData?.production_item}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>BOM No</p><p style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{fullData?.bom_no}</p></div>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}><p style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Qty To Manufacture</p><p style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>{fullData?.qty}</p></div>
            </div>
            
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
               <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0, border: 'none' }}><MapPin size={14}/> Pengaturan Alur Gudang</h3>
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
              {wo.docstatus === 0 && (
                <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>
                  <Send size={16} /> {isSubmitting ? 'Memproses...' : 'Submit (Sahkan & Teruskan ke Operator)'}
                </button>
              )}
              <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup Preview</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. MODAL JOB CARD 
// ==========================================
function CreateJobCardModal({ onClose, workOrders, onSuccess, showToast }: any) {
  const [form, setForm] = useState({ 
    work_order: '', bom_no: '', production_item: '', 
    operation: '', workstation: '', for_quantity: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleWOChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWO = e.target.value;
    const woDetail = (workOrders || []).find((w: any) => w.name === selectedWO);
    if (woDetail) {
      setForm(f => ({ ...f, work_order: selectedWO, bom_no: woDetail.bom_no || '', production_item: woDetail.production_item || '', for_quantity: String(woDetail.qty || '') }));
    } else {
      setForm(f => ({ ...f, work_order: '', bom_no: '', production_item: '', for_quantity: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.work_order) return setError("Pilih Work Order terkait.");
    if (!form.operation || !form.workstation) return setError("Operation dan Workstation wajib diisi sesuai Master Data Frappe.");
    if (Number(form.for_quantity) <= 0) return setError("For Quantity harus lebih dari 0.");
    
    setIsSubmitting(true); setError('');
    try {
      const { apiCreate } = await import('@/lib/api');
      
      // 💡 FITUR MAGIC: AUTO-CREATE OPERATION & WORKSTATION JIKA BELUM ADA DI FRAPPE
      try { await apiCreate('Operation', { operation_name: form.operation, name: form.operation }); } catch(err) { /* Abaikan jika nama sudah ada */ }
      try { await apiCreate('Workstation', { workstation_name: form.workstation }); } catch(err) { /* Abaikan jika nama sudah ada */ }

      const jcData = { 
        work_order: form.work_order, bom_no: form.bom_no, production_item: form.production_item,
        operation: form.operation, workstation: form.workstation, for_quantity: parseFloat(form.for_quantity),
        company: FIXED_COMPANY
      };
      
      await apiCreate('Job Card', jcData);
      showToast('Job Card berhasil dibuat (Draft).', 'success'); 
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { 
      setError(extractFrappeError(err, "Gagal membuat Job Card.")); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '650px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>New Job Card</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Input Tugas Manual ke Frappe Database</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="erp-label">Work Order *</label>
            <select required className="erp-input" value={form.work_order} onChange={handleWOChange}>
              <option value="">-- Select Work Order --</option>
              {/* Hanya tampilkan Work Order yang sudah disubmit */}
              {(workOrders || []).filter((w:any)=>w.docstatus === 1).map((w: any) => <option key={w.name} value={w.name}>{w.name} ({w.production_item})</option>)}
            </select>
          </div>
          
          <div className="responsive-grid">
            <div className="form-group"><label className="erp-label">BOM No</label><input type="text" className="erp-input disabled-input" value={form.bom_no} readOnly /></div>
            <div className="form-group"><label className="erp-label">Item To Manufacture</label><input type="text" className="erp-input disabled-input" value={form.production_item} readOnly /></div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '4px' }}>
            <div className="responsive-grid">
              <div className="form-group">
                <label className="erp-label">Operation *</label>
                <input type="text" required list="laptop-operations" className="erp-input" value={form.operation} onChange={e => setForm(f => ({ ...f, operation: e.target.value }))} placeholder="Pilih atau ketik operasi..." />
                <datalist id="laptop-operations">
                  <option value="Perakitan Motherboard" />
                  <option value="Instalasi Processor & RAM" />
                  <option value="Pemasangan Layar LCD" />
                  <option value="Pemasangan Baterai & Casing" />
                  <option value="Instalasi Software (OS)" />
                  <option value="Quality Control (QC)" />
                  <option value="Packaging" />
                </datalist>
              </div>

              <div className="form-group">
                <label className="erp-label">Workstation *</label>
                <input type="text" required list="laptop-workstations" className="erp-input" value={form.workstation} onChange={e => setForm(f => ({ ...f, workstation: e.target.value }))} placeholder="Pilih atau ketik workstation..." />
                <datalist id="laptop-workstations">
                  <option value="Meja Rakit 1" />
                  <option value="Meja Rakit 2" />
                  <option value="Meja Solder & Instalasi" />
                  <option value="Ruang Quality Control" />
                  <option value="Stasiun Packaging" />
                </datalist>
              </div>
            </div>
            <div className="form-group" style={{ width: '50%', paddingRight: '8px' }}>
              <label className="erp-label">For Quantity *</label>
              <input type="number" required min="0.1" step="any" className="erp-input" value={form.for_quantity} onChange={e => setForm(f => ({ ...f, for_quantity: e.target.value }))} />
            </div>
          </div>

          {error && (
            <div className="error-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> <span>Error:</span></div>
              {error.split('\n').map((line, idx) => <span key={idx} style={{ fontWeight: line.includes('👉') ? 800 : 500, fontSize: '12px' }}>{line}</span>)}
            </div>
          )}
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Cancel</button>
            <button type="submit" className="btn btn-primary mobile-btn" style={{ background: '#f59e0b', borderColor: '#f59e0b' }} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Job Card'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailJobCardModal({ jc, onClose, onSubmitJC }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Job Card/${encodeURIComponent(jc.name)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.data) setFullData(data.data);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetail();
  }, [jc.name]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(onSubmitJC) await onSubmitJC(jc);
    setIsSubmitting(false); onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Job Card: {fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${fullData?.status === 'Completed' || fullData?.docstatus === 1 ? 'badge-success' : fullData?.status === 'Work In Progress' ? 'badge-info' : 'badge-warning'}`}>{fullData?.docstatus === 1 ? 'Submitted' : fullData?.status || jc.status}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Created: {formatDate(fullData?.creation)}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280"/></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Work Order</p><p style={{ fontSize: '14px', fontWeight: 800, color: COLOR_PRIMARY }}>{fullData?.work_order}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Item To Manufacture</p><p style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{fullData?.production_item}</p></div>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}><p style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>For Quantity</p><p style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>{fullData?.for_quantity}</p></div>
            </div>
            
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
               <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0, border: 'none' }}><Wrench size={14}/> Operation Details</h3>
               <div className="responsive-grid" style={{ gap: '10px' }}>
                 <div><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Operation</p><p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{fullData?.operation || '-'}</p></div>
                 <div><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Workstation</p><p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{fullData?.workstation || '-'}</p></div>
               </div>
            </div>

            <div className="modal-footer">
              {jc.docstatus === 0 && <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: '#10b981', borderColor: '#10b981' }}><CheckCircle size={16} /> {isSubmitting ? 'Submitting...' : 'Submit (Sahkan Job Card)'}</button>}
              <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3.5 MODAL TERMINAL JOB CARD (INTERAKTIF)
// ==========================================
function ActiveJobCardModal({ jobCard, elapsedSeconds, onClose, onFinish }: any) {
  const [producedQty, setProducedQty] = useState(jobCard.qty || jobCard.for_quantity || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    await onFinish(jobCard, producedQty);
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', zIndex: 9999 }}>
      <div className="modal-content terminal-modal" style={{ width: '100%', maxWidth: '600px', margin: '0 16px', background: '#0f172a', color: 'white', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div className="job-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}><MonitorPlay size={20} color={COLOR_SECONDARY} /> TERMINAL PRODUKSI</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Mode Operator Mesin / Perakitan | ID: {jobCard.name}</p>
          </div>
          <button onClick={onClose} style={{ background:'#1e293b', border:'none', cursor:'pointer', color: '#94a3b8', padding: '8px', borderRadius: '8px' }} title="Sembunyikan Terminal"><X size={20} /></button>
        </div>
        <div className="job-card-stats" style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sedang Merakit</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: COLOR_SECONDARY }}>{jobCard.production_item}</p>
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Ref: {jobCard.work_order}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Qty</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{jobCard.qty || jobCard.for_quantity} <span style={{fontSize: '14px', color: '#64748b'}}>Unit</span></p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Waktu Berjalan (Time Log)</p>
          <div className="job-card-timer" style={{ fontSize: '56px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace', letterSpacing: '2px', textShadow: '0 0 20px rgba(16, 185, 129, 0.4)', lineHeight: 1 }}>{formatTimer(elapsedSeconds)}</div>
        </div>
        <div style={{ borderTop: '1px solid #334155', paddingTop: '24px' }}>
          <div className="mobile-flex-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Total yang Berhasil Dirakit Tanpa Cacat:</label>
            <input type="number" min="1" className="erp-input" value={producedQty} onChange={e => setProducedQty(Number(e.target.value))} style={{ width: '120px', background: '#1e293b', color: 'white', borderColor: '#475569', fontSize: '18px', fontWeight: 800, textAlign: 'center' }} />
          </div>
          <div className="mobile-btn-group" style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-secondary mobile-btn" style={{ flex: 1, background: '#1e293b', color: '#cbd5e1', borderColor: '#334155', padding: '14px' }}>Sembunyikan</button>
            <button onClick={handleFinish} disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ flex: 1.5, background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY, color: 'white', padding: '14px', fontSize: '14px', display: 'flex', gap: '8px', justifyContent: 'center' }}><CheckSquare size={18} /> {isSubmitting ? 'Menyimpan...' : 'Akhiri & Simpan Stok'}</button>
          </div>
        </div>
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

  // STATE JOB CARDS MURNI DARI API
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [isFetchingJC, setIsFetchingJC] = useState(true);

  const fetchJobCards = async () => {
    setIsFetchingJC(true);
    try {
      const res = await fetch('/api/frappe/resource/Job Card?fields=["name","work_order","bom_no","production_item","operation","workstation","for_quantity","status","docstatus","creation"]', { cache: 'no-store' });
      const data = await res.json();
      if(data.data) setJobCards(data.data);
    } catch (e) { console.warn("Gagal fetch Job Card"); } finally { setIsFetchingJC(false); }
  };

  useEffect(() => { fetchJobCards(); }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateBOM, setShowCreateBOM] = useState(false);
  const [showCreateWO, setShowCreateWO] = useState(false);
  const [showCreateJC, setShowCreateJC] = useState(false);
  
  const [selectedBOM, setSelectedBOM] = useState<any>(null);
  const [selectedWO, setSelectedWO] = useState<any>(null);
  const [selectedJC, setSelectedJC] = useState<any>(null);

  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, desc: string, action: any, confirmText?: string }>({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000); };
  const showConfirm = (title: string, desc: string, action: any, confirmText = 'Ya, Lanjutkan') => setConfirmModal({ show: true, title, desc, action, confirmText });
  const closeConfirm = () => setConfirmModal({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });

  // Terminal Timer State
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [activeJobCard, setActiveJobCard] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const next = { ...prev };
        let hasChanges = false;
        for (const key in next) { next[key] += 1; hasChanges = true; }
        return hasChanges ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const sortedJCs = useMemo(() => sortByNewest(jobCards || []), [jobCards]);

  const filteredBOMs = sortedBOMs.filter((b: any) => !searchQuery || (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.item || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWOs = sortedWOs.filter((w: any) => !searchQuery || (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (w.production_item || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredJCs = sortedJCs.filter((j: any) => !searchQuery || (j.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (j.work_order || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSmartDelete = (doctype: string, docname: string, docstatus: number) => {
    if (!docname) return;
    showConfirm(`Hapus Dokumen ${doctype}?`, `Apakah Anda yakin ingin menghapus data ${docname} secara permanen? Jika data ini sudah terkait pembukuan ERPNext, ERPNext akan menolak penghapusan.`, () => {
        closeConfirm();
        setTimeout(() => {
          import('@/lib/api').then(({ apiUpdate, apiDelete }) => {
            if (docstatus === 1) apiUpdate(doctype, docname, { docstatus: 2 }).then(() => apiDelete(doctype, docname)).catch((err)=> showToast(extractFrappeError(err), 'error'));
            else apiDelete(doctype, docname).catch((err)=> showToast(extractFrappeError(err), 'error'));
          }).catch(()=>{});
        }, 50);
        showToast(`Proses hapus ${doctype} sedang dijalankan...`, 'info');
        setTimeout(() => { refetch(); fetchJobCards(); }, 800);
      }, "Ya, Hapus Saja"
    );
  };

  const handleWOSubmit = (wo: any) => {
    showConfirm("Kunci Work Order (Disahkan)?", "Perintah yang sudah di-Submit akan masuk ke antrean pabrik dan siap dikerjakan oleh Operator.", () => {
        closeConfirm();
        showToast('Selesai! Perintah resmi disahkan dan diteruskan ke Pabrik.', 'success'); 
        setTimeout(() => {
          import('@/lib/api').then(({ apiUpdate }) => { apiUpdate('Work Order', wo.name, { docstatus: 1 }).catch(() => {}); }).catch(()=>{});
        }, 50);
        setTimeout(() => refetch(), 800);
      }, "Sahkan Perintah Kerja"
    );
  };

  // 💡 FUNGSI SIHIR: SUBMIT JC KE FRAPPE + CREATE STOCK ENTRY MANUFACTURE
  const submitJobCardToFrappe = async (jc: any, producedQty: number, elapsedMins: number = 30) => {
    try {
      const now = new Date();
      const mins = Math.max(1, elapsedMins);
      const startTime = new Date(now.getTime() - mins * 60000);
      
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatDT = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      const timeLogs = [{
        from_time: formatDT(startTime),
        to_time: formatDT(now),
        completed_qty: producedQty,
        time_in_mins: mins
      }];

      const { apiUpdate, apiCreate } = await import('@/lib/api');
      
      // 1. Simpan Time Log & Sahkan Job Card
      await apiUpdate('Job Card', jc.name, { time_logs: timeLogs });
      await apiUpdate('Job Card', jc.name, { docstatus: 1 });
      
      // 2. MAGIC: Buat Stock Entry (Manufacture) secara diam-diam untuk potong bahan & tambah laptop
      const woRes = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(jc.work_order)}`, { cache: 'no-store' });
      const woData = (await woRes.json()).data;
      
      const bomRes = await fetch(`/api/frappe/resource/BOM/${encodeURIComponent(jc.bom_no)}`, { cache: 'no-store' });
      const bomData = (await bomRes.json()).data;

      if (woData && bomData) {
        const seItems: any[] = [];
        // Bahan baku (dipotong dari Gudang)
        bomData.items.forEach((rm: any) => {
          seItems.push({
            item_code: rm.item_code,
            s_warehouse: woData.source_warehouse || 'Raw Materials - A', // Gudang Asal
            qty: Number(rm.qty) * Number(producedQty),
            uom: rm.uom
          });
        });
        // Barang Jadi (ditambah ke Gudang)
        seItems.push({
          item_code: jc.production_item,
          t_warehouse: woData.fg_warehouse || 'Finished Goods - A', // Gudang Tujuan
          qty: Number(producedQty),
          is_finished_item: 1, // Penting! Ini penanda barang hasil produksi
          uom: bomData.uom || 'Nos'
        });

        // Lempar ke Frappe sebagai Manufacture Entry
        const seData = {
          stock_entry_type: "Manufacture",
          work_order: jc.work_order,
          company: FIXED_COMPANY,
          items: seItems
        };
        const seDraft = await apiCreate('Stock Entry', seData);
        // Langsung disahkan (Submit) agar stok benar-benar berubah
        await apiUpdate('Stock Entry', seDraft.data?.name || seDraft.name, { docstatus: 1 });
      }

      // Update Status WO
      await apiUpdate('Work Order', jc.work_order, { status: 'Completed', produced_qty: producedQty });

      showToast(`🎉 Sempurna! Waktu kerja disimpan & Barang fisik telah dimutasi ke Gudang!`, 'success');
      fetchJobCards();
      refetch(); // Refresh WO data
    } catch (e: any) {
      showToast(extractFrappeError(e, "Gagal mensubmit Job Card."), 'error');
    }
  };

  const handleJCSubmit = (jc: any) => {
    showConfirm("Sahkan Job Card?", "Sistem akan membuat log waktu otomatis (30 menit) dan otomatis memindahkan stok produksi ke ERPNext.", () => {
        closeConfirm();
        showToast('Memproses Submit ke Database Frappe...', 'info'); 
        submitJobCardToFrappe(jc, jc.for_quantity, 30);
      }, "Submit Job Card"
    );
  };

  const handleJCStartTerminal = (jc: any) => {
    if (activeTimers[jc.name] !== undefined) {
      setActiveJobCard(jc);
      return;
    }
    setActiveTimers(prev => ({ ...prev, [jc.name]: 0 }));
    setActiveJobCard(jc); 
  };

  const handleJCTerminalFinish = async (jc: any, producedQty: number) => {
    const elapsedSecs = activeTimers[jc.name] || 0;
    const elapsedMins = Math.ceil(elapsedSecs / 60);
    
    setActiveTimers(prev => { const next = { ...prev }; delete next[jc.name]; return next; });
    setActiveJobCard(null); 
    
    showToast('Menyimpan hasil terminal dan memutasi stok fisik ke ERPNext...', 'info');
    submitJobCardToFrappe(jc, producedQty, elapsedMins);
  };

  const getPageInfo = () => {
    switch(activeTab) {
      case 'bom': return { title: 'Bill of Materials (BOM)', desc: 'Kelola resep dasar yang mengatur rasio bahan baku ke produk jadi' };
      case 'workorders': return { title: 'Work Orders (WO)', desc: 'Penerbitan surat perintah kerja ke tim pabrik produksi' };
      case 'jobcards': return { title: 'Job Cards', desc: 'Pencatatan tugas harian pabrik untuk perakitan produk' };
      default: return { title: 'Manufacturing', desc: 'Modul Produksi' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.3s ease-out', position: 'relative' }}>
      <Toast show={toast.show} message={toast.msg} type={toast.type} />
      <ConfirmModal show={confirmModal.show} title={confirmModal.title} desc={confirmModal.desc} confirmText={confirmModal.confirmText} onConfirm={confirmModal.action} onCancel={closeConfirm} />

      {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat data dari ERPNext...</div>}
      
      {/* RENDER SEMUA MODALS */}
      {showCreateBOM && <CreateBOMModal items={items} warehouses={warehouses} onClose={() => setShowCreateBOM(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateWO && <CreateWorkOrderModal boms={sortedBOMs.filter((b:any)=>b.docstatus===1 || b.is_active)} warehouses={warehouses} onClose={() => setShowCreateWO(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateJC && <CreateJobCardModal workOrders={sortedWOs.filter((w:any)=>w.docstatus===1)} onClose={() => setShowCreateJC(false)} onSuccess={() => fetchJobCards()} showToast={showToast} />}
      
      {selectedBOM && <DetailBOMModal bom={selectedBOM} workOrders={sortedWOs} onClose={() => setSelectedBOM(null)} />}
      {selectedWO && <DetailWorkOrderModal wo={selectedWO} onClose={() => setSelectedWO(null)} onSubmitWO={handleWOSubmit} />}
      {selectedJC && <DetailJobCardModal jc={selectedJC} onClose={() => setSelectedJC(null)} onSubmitJC={handleJCSubmit} />}

      {activeJobCard && (
        <ActiveJobCardModal 
          jobCard={activeJobCard} 
          elapsedSeconds={activeTimers[activeJobCard.name] || 0} 
          onClose={() => setActiveJobCard(null)} 
          onFinish={handleJCTerminalFinish} 
        />
      )}

      {/* HEADER PAGE */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Produksi &amp; Pabrikasi</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>Atur resep (BOM) hingga pengawasan produksi melalui Work Order.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
          {activeTab === 'bom' && <button className="btn btn-primary btn-sm" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY, whiteSpace: 'nowrap' }} onClick={() => setShowCreateBOM(true)}><Plus size={14} /> Buat Resep Baru (BOM)</button>}
          {activeTab === 'workorders' && <button className="btn btn-primary btn-sm" style={{ background: COLOR_SECONDARY, borderColor: COLOR_SECONDARY, whiteSpace: 'nowrap' }} onClick={() => setShowCreateWO(true)}><Plus size={14} /> Terbitkan Perintah Kerja (WO)</button>}
          {activeTab === 'jobcards' && <button className="btn btn-primary btn-sm" style={{ background: '#f59e0b', borderColor: '#f59e0b', whiteSpace: 'nowrap' }} onClick={() => setShowCreateJC(true)}><Plus size={14} /> Buat Job Card Baru</button>}
        </div>
      </div>

      <div className="chart-container" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafb' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Sub-Menu: {pageInfo.title}</h3>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{pageInfo.desc}</p>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* SEARCH BOX */}
          <div className="mobile-flex-col" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end', marginBottom: '16px', alignItems: 'center' }}>
            <div className="mobile-full-width" style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Cari ID dokumen atau nama item..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', width: '100%', outline: 'none', fontFamily: 'Poppins', transition: 'all 0.2s' }} onFocus={e => e.target.style.borderColor = COLOR_PRIMARY} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          </div>

          {/* TABEL BOM */}
          {activeTab === 'bom' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>ID BOM</th>
                    <th>Status</th>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBOMs.map((bom: any, index: number) => (
                    <tr key={bom.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '13px' }}>{bom.name}</div>
                      </td>
                      <td>
                        <span className={`badge ${bom.is_active ? 'badge-success' : 'badge-gray'}`}>
                          {bom.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#111827' }}>{bom.item}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{bom.quantity}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => setSelectedBOM(bom)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="View BOM"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('BOM', bom.name, bom.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Delete BOM"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBOMs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada Resep Bill of Materials (BOM) yang terdaftar.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TABEL WORK ORDERS */}
          {activeTab === 'workorders' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '900px' }}>
                <thead><tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>ID Work Order</th>
                  <th>Status</th>
                  <th>Item To Manufacture</th>
                  <th>BOM No</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Tindakan</th>
                </tr></thead>
                <tbody>
                  {filteredWOs.map((wo: any, index: number) => (
                    <tr key={wo.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '12px' }}>{wo.name}</div>
                        {wo.creation && <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{formatCreationTime(wo.creation)}</div>}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span className={`badge ${wo.status === 'Completed' ? 'badge-success' : wo.status === 'In Process' ? 'badge-info' : wo.status === 'Draft' ? 'badge-gray' : 'badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          {wo.docstatus === 1 ? wo.status || 'Submitted' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{wo.production_item}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>{wo.bom_no}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px' }}>{wo.qty}</td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                          {wo.docstatus === 0 && <button onClick={() => handleWOSubmit(wo)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', gap: '4px', alignItems: 'center', whiteSpace: 'nowrap' }} title="Sahkan Surat Perintah Ini"><Send size={11}/> Submit</button>}
                          <button onClick={() => setSelectedWO(wo)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'inline-flex' }} title="Lihat Rincian Tugas"><Eye size={13} /></button>
                          {(wo.docstatus === 0 || wo.docstatus === 2) && <button onClick={() => handleSmartDelete('Work Order', wo.name, wo.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'inline-flex' }} title="Hapus"><Trash2 size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWOs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada Work Order yang tercatat.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TABEL JOB CARDS */}
          {activeTab === 'jobcards' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '800px' }}>
                <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>ID Job Card</th><th>Work Order</th><th>Operation</th><th>Status</th><th style={{ textAlign: 'right' }}>For Qty</th><th style={{ width: '170px', textAlign: 'center' }}>Tindakan</th></tr></thead>
                <tbody>
                  {isFetchingJC ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" color={COLOR_PRIMARY} style={{margin:'0 auto'}} /></td></tr>
                  ) : filteredJCs.map((jc: any, index: number) => {
                    const isActive = activeTimers[jc.name] !== undefined;
                    return (
                      <tr key={jc.name} className="table-row-hover" style={{ background: isActive ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '13px' }}>{jc.name}</div>
                          {jc.creation && <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{formatCreationTime(jc.creation)}</div>}
                        </td>
                        <td style={{ fontWeight: 700, color: COLOR_PRIMARY, fontSize: '12px' }}>{jc.work_order}</td>
                        <td style={{ fontWeight: 600, color: '#374151', fontSize: '12px' }}>{jc.operation || '-'}</td>
                        <td>
                          <span className={`badge ${jc.docstatus === 1 ? 'badge-success' : jc.docstatus === 2 ? 'badge-danger' : 'badge-gray'}`}>
                            {jc.docstatus === 1 ? 'Submitted' : jc.docstatus === 2 ? 'Cancelled' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>{jc.for_quantity}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {jc.docstatus === 0 && <button onClick={() => handleJCStartTerminal(jc)} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }} title="Buka Terminal Mesin"><PlayCircle size={12}/> {isActive ? 'Terminal' : 'Start'}</button>}
                            {jc.docstatus === 0 && !isActive && <button onClick={() => handleJCSubmit(jc)} className="badge badge-success" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }} title="Sahkan Langsung"><CheckCircle size={12}/> Submit</button>}
                            
                            <button onClick={() => setSelectedJC(jc)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Detail"><Eye size={14} /></button>
                            {(jc.docstatus === 0 || jc.docstatus === 2) && <button onClick={() => handleSmartDelete('Job Card', jc.name, jc.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!isFetchingJC && filteredJCs.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada data Job Card.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 rgba(16, 185, 129, 0); } 50% { opacity: 0.85; box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); } }
        .erp-label { font-size: 12px; font-weight: 700; color: #1e293b; display: block; margin-bottom: 6px; }
        .helper-text { font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.4; font-weight: 500; }
        .erp-input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; font-family: 'Poppins', sans-serif; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .erp-input:focus { border-color: ${COLOR_PRIMARY}; box-shadow: 0 0 0 3px rgba(5, 76, 199, 0.1); }
        .disabled-input { background-color: #f1f5f9; cursor: not-allowed; color: #64748b; font-weight: 600; }
        .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; color: #b91c1c; font-size: 13px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px; font-weight: 600; }
        .section-title { font-size: 14px; font-weight: 800; color: ${COLOR_PRIMARY}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .form-group { margin-bottom: 16px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .responsive-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .modal-footer { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .table-row-hover:hover { background-color: #f8fafc !important; }
        .action-btn { transition: transform 0.2s, box-shadow 0.2s; }
        .action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(5,76,199,0.2); }
        
        .custom-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          color: white;
          padding: 14px 20px;
          border-radius: 10px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 99999;
          animation: slideInRight 0.3s ease-out forwards;
          max-width: 400px;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @media (max-width: 640px) {
          .responsive-grid, .responsive-grid-3 { grid-template-columns: 1fr; }
          .mobile-flex-col { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .mobile-full-width { width: 100% !important; max-width: none !important; justify-content: center !important; }
          .chart-container { padding: 16px !important; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}

export default function ManufacturingPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  useEffect(() => { if (!canAccess('manufacturing')) router.push('/dashboard'); }, [canAccess, router]);
  return (<Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" /><p>Memuat halaman...</p></div>}><ManufacturingPageContent /></Suspense>);
}