'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import {
  Cog, Plus, X, Trash2, Eye, Search, Layers, Wrench, PlayCircle, CheckCircle, AlertCircle, Send, Timer, MonitorPlay, CheckSquare, Loader2, Info, AlertTriangle, MapPin
} from 'lucide-react';
import { getWarehousesByCompany } from '@/config/frappe-data';
import { formatDate } from '@/lib/utils';

const FIXED_COMPANY = 'Artavista'; 
const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';

// ==========================================
// TRANSLATOR ERROR FRAPPE (UX Cerdas Produksi)
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
  
  if (lowerErr.includes('valuation rate not found')) {
    const match = errorMsg.match(/Item (.*?) /i) || errorMsg.match(/Item (.*?)$/i);
    const itemCode = match ? match[1].replace(/['"]/g, '').trim() : 'tersebut';
    return `Gagal! Harga Standar (Valuation Rate) untuk komponen "${itemCode}" belum diatur.\n\n👉 Solusi: Buka menu Gudang > Master Items, klik Edit pada barang ini, dan isi "Standard Rate (Rp)". Sistem pabrik butuh nilai ini untuk menghitung biaya produksi.`;
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

// ==========================================
// KOMPONEN UI UX (TOAST & CONFIRM MULTILINE)
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
        <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, marginBottom: '24px' }}>{desc}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
          <button onClick={onConfirm} className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// FUNGSI SAKTI: AMBIL STOK REAL-TIME
// ==========================================
const getSimulatedStock = (itemCode: string, warehouse: string, originalBins: any[], localLedger: Record<string, number>) => {
  const key = `${itemCode}_${warehouse}`;
  const bin = originalBins.find((b: any) => b.item_code === itemCode && b.warehouse === warehouse);
  const originalQty = bin ? Number(bin.actual_qty) : 0;
  const mockAdjustment = localLedger[key] || 0;
  return originalQty + mockAdjustment;
};

// ==========================================
// 1. MODAL CREATE & PREVIEW BOM
// ==========================================
function CreateBOMModal({ onClose, items, onSuccess, showToast }: any) {
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
      const selectedMainItem = items.find((i: any) => i.item_code === form.item);
      const bomData = {
        item: form.item, 
        quantity: parseFloat(form.quantity), 
        uom: selectedMainItem?.stock_uom || 'Nos',
        company: FIXED_COMPANY, 
        is_active: 1, 
        items: bomItems.map((bi: any) => {
          const itemDetail = items.find((it: any) => it.item_code === bi.item_code);
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
      <div className="modal-content" style={{ width: '100%', maxWidth: '560px', margin: '0 16px' }}>
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
                <option value="">-- Pilih Laptop/Barang Jadi --</option>
                {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="erp-label">Qty Dihasilkan *</label>
              <input type="number" required min="1" className="erp-input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              <p className="helper-text">Resep ini menghasilkan berapa unit?</p>
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
                    {items.map((it: any) => <option key={it.name} value={it.item_code}>{it.item_code}</option>)}
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

function DetailBOMModal({ bom, onClose }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Dibuat: {formatDate(fullData?.creation)}</span>
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
function CreateWorkOrderModal({ onClose, boms, warehouses, originalBins, localLedger, onSuccess, showToast }: any) {
  const [form, setForm] = useState({ bom_no: '', qty: '1', source_warehouse: 'Stores - A', wip_warehouse: 'Work In Progress - A', fg_warehouse: 'Finished Goods - A' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedBom = useMemo(() => boms.find((b: any) => b.name === form.bom_no), [boms, form.bom_no]);
  
  const requiredMaterials = useMemo(() => {
    if (!selectedBom || !selectedBom.items) return [];
    return selectedBom.items.map((rm: any) => {
      const required = rm.qty * Number(form.qty || 0);
      const available = getSimulatedStock(rm.item_code, form.source_warehouse, originalBins, localLedger);
      return { ...rm, required, available, isShort: available < required };
    });
  }, [selectedBom, form.qty, form.source_warehouse, originalBins, localLedger]);

  const hasShortage = requiredMaterials.some((rm: any) => rm.isShort);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasShortage) return setError("❌ Tidak bisa membuat Work Order! Ada komponen bahan baku yang tidak cukup di gudang.");
    if (Number(form.qty) <= 0) return setError("Qty harus lebih besar dari 0");
    
    setIsSubmitting(true); setError('');
    try {
      const woData = { production_item: selectedBom?.item, bom_no: form.bom_no, qty: parseFloat(form.qty), company: FIXED_COMPANY, source_warehouse: form.source_warehouse, wip_warehouse: form.wip_warehouse, fg_warehouse: form.fg_warehouse, use_multi_level_bom: 0 };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Work Order', woData);
      showToast('Surat Perintah Kerja (Work Order) berhasil dibuat dalam bentuk Draft!', 'success'); 
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, "Gagal membuat Work Order.")); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '560px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Buat Work Order Baru</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Surat Perintah Kerja ke tim Pabrik.</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="erp-label">Pilih BOM (Resep Produksi) *</label>
            <select required className="erp-input" value={form.bom_no} onChange={e => setForm(f => ({ ...f, bom_no: e.target.value }))}>
              <option value="">-- Pilih Resep Aktif --</option>
              {boms.map((b: any) => <option key={b.name} value={b.name}>{b.name} (Bikin {b.item})</option>)}
            </select>
          </div>
          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">Target Produksi (Qty) *</label>
              <input type="number" required min="1" className="erp-input" value={form.qty} onChange={e => { if(!e.target.value.includes('-')) setForm(f => ({ ...f, qty: e.target.value }))}} />
              <p className="helper-text">Berapa unit yang akan dirakit?</p>
            </div>
            <div className="form-group">
              <label className="erp-label">Ambil Bahan Dari Gudang Mana?</label>
              <select className="erp-input" value={form.source_warehouse} onChange={e => setForm(f => ({ ...f, source_warehouse: e.target.value }))}>{warehouses.filter((w: any) => w.type === 'Stores' || !w.is_group).map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select>
            </div>
          </div>
          
          <div style={{ display: 'none' }}>
            <select className="erp-input" value={form.wip_warehouse} onChange={e => setForm(f => ({ ...f, wip_warehouse: e.target.value }))}>{warehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select>
            <select className="erp-input" value={form.fg_warehouse} onChange={e => setForm(f => ({ ...f, fg_warehouse: e.target.value }))}>{warehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select>
          </div>

          {selectedBom && (
            <div style={{ marginTop: '4px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f9fafb', padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: COLOR_PRIMARY, display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14}/> Sistem Pengecekan Bahan Baku Gudang</span>
              </div>
              <table className="erp-table" style={{ width: '100%', fontSize: '11px', margin: 0 }}>
                <thead><tr><th style={{padding: '8px'}}>Komponen</th><th style={{textAlign:'center', padding: '8px'}}>Dibutuhkan</th><th style={{textAlign:'center', padding: '8px'}}>Tersedia</th><th style={{textAlign:'center', padding: '8px'}}>Status Kelayakan</th></tr></thead>
                <tbody>
                  {requiredMaterials.map((rm: any, i: number) => (
                    <tr key={i} style={{ background: rm.isShort ? '#fef2f2' : 'white' }}>
                      <td style={{ fontWeight: 700, padding: '8px', color: '#374151' }}>{rm.item_code}</td>
                      <td style={{ textAlign: 'center', padding: '8px', fontWeight: 600 }}>{rm.required}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: rm.isShort ? '#b91c1c' : '#15803d', padding: '8px' }}>{rm.available}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{rm.isShort ? <span className="badge badge-danger" style={{padding: '2px 6px'}}>Stok Kurang</span> : <span className="badge badge-success" style={{padding: '2px 6px'}}>Aman</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="error-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> <span>Ada Kendala:</span></div>
              {error.split('\n').map((line, idx) => (
                <span key={idx} style={{ fontWeight: line.includes('👉') ? 800 : 500, fontSize: '12px' }}>{line}</span>
              ))}
            </div>
          )}
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" style={{ background: hasShortage ? '#9CA3AF' : COLOR_SECONDARY, borderColor: hasShortage ? '#9CA3AF' : COLOR_SECONDARY }} disabled={isSubmitting || hasShortage}>
              {hasShortage ? 'Stok Bahan Baku Tidak Mencukupi' : 'Simpan Perintah Kerja (Draft)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailWorkOrderModal({ wo, onClose, onSubmitWO, onSuccess, showToast }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(wo.name)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.data) {
          setFullData(data.data);
          setEditForm({
            qty: data.data.qty || 1,
            source_warehouse: data.data.source_warehouse || '',
            fg_warehouse: data.data.fg_warehouse || '',
            wip_warehouse: data.data.wip_warehouse || '',
          });
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetail();
  }, [wo.name]);

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Work Order', wo.name, {
        qty: Number(editForm.qty),
        source_warehouse: editForm.source_warehouse,
        fg_warehouse: editForm.fg_warehouse,
        wip_warehouse: editForm.wip_warehouse,
      });
      if (showToast) showToast('Work Order berhasil diperbarui!', 'success');
      setIsEditing(false);
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) {
      if (showToast) showToast(extractFrappeError(err, 'Gagal update Work Order'), 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(onSubmitWO) await onSubmitWO(wo);
    setIsSubmitting(false);
    onClose();
  };

  const isDraft = wo.docstatus === 0;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isDraft && (
                  <button onClick={() => setIsEditing(!isEditing)} 
                    style={{ background: isEditing ? '#fef3c7' : '#eff6ff', border: `1px solid ${isEditing ? '#f59e0b' : '#bfdbfe'}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: isEditing ? '#92400e' : COLOR_PRIMARY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wrench size={14} /> {isEditing ? 'Mode Edit' : 'Edit'}
                  </button>
                )}
                <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280"/></button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Barang yang Diproduksi</p><p style={{ fontSize: '14px', fontWeight: 800, color: COLOR_PRIMARY }}>{fullData?.production_item}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Total Target Dipesan</p>
                {isEditing ? (
                  <input type="number" min="1" className="erp-input" style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 800 }} value={editForm.qty} onChange={e => setEditForm((f: any) => ({ ...f, qty: e.target.value }))} />
                ) : (
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{fullData?.qty}</p>
                )}
              </div>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}><p style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>Telah Berhasil Dirakit</p><p style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>{fullData?.produced_qty || 0}</p></div>
            </div>
            
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
               <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0, border: 'none' }}><MapPin size={14}/> Pengaturan Alur Gudang</h3>
               <div className="responsive-grid" style={{ gap: '10px' }}>
                 <div>
                   <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Sumber Bahan Baku (Source)</p>
                   {isEditing ? (
                     <input type="text" className="erp-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={editForm.source_warehouse} onChange={e => setEditForm((f: any) => ({ ...f, source_warehouse: e.target.value }))} />
                   ) : (
                     <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{fullData?.source_warehouse?.replace(' - ARTA', '') || '-'}</p>
                   )}
                 </div>
                 <div>
                   <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Penyimpanan Hasil Jadi (FG)</p>
                   {isEditing ? (
                     <input type="text" className="erp-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={editForm.fg_warehouse} onChange={e => setEditForm((f: any) => ({ ...f, fg_warehouse: e.target.value }))} />
                   ) : (
                     <p style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>{fullData?.fg_warehouse?.replace(' - ARTA', '') || '-'}</p>
                   )}
                 </div>
               </div>
            </div>

            <div className="modal-footer">
              {isEditing ? (
                <>
                  <button className="btn btn-secondary mobile-btn" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Batal Edit</button>
                  <button className="btn btn-primary mobile-btn" onClick={handleUpdate} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>
                    {isSubmitting ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                  </button>
                </>
              ) : (
                <>
                  {isDraft && (
                    <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>
                      <Send size={16} /> {isSubmitting ? 'Memproses...' : 'Submit (Sahkan & Teruskan ke Operator)'}
                    </button>
                  )}
                  <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup Preview</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. MODAL TERMINAL JOB CARD (INTERAKTIF)
// ==========================================
function ActiveJobCardModal({ jobCard, elapsedSeconds, onClose, onFinish }: any) {
  const [producedQty, setProducedQty] = useState(jobCard.qty);
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
          <button onClick={onClose} style={{ background:'#1e293b', border:'none', cursor:'pointer', color: '#94a3b8', padding: '8px', borderRadius: '8px' }} title="Tutup Tanpa Menghentikan Waktu"><X size={20} /></button>
        </div>
        <div className="job-card-stats" style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sedang Merakit</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: COLOR_SECONDARY }}>{jobCard.production_item}</p>
            <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Ref: {jobCard.work_order}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Qty</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{jobCard.qty} <span style={{fontSize: '14px', color: '#64748b'}}>Unit</span></p>
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
            <button onClick={onClose} className="btn btn-secondary mobile-btn" style={{ flex: 1, background: '#1e293b', color: '#cbd5e1', borderColor: '#334155', padding: '14px' }}>Tutup Layar (Waktu Tetap Jalan)</button>
            <button onClick={handleFinish} disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ flex: 1.5, background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY, color: 'white', padding: '14px', fontSize: '14px', display: 'flex', gap: '8px', justifyContent: 'center' }}><CheckSquare size={18} /> {isSubmitting ? 'Memproses ke Gudang...' : 'Akhiri Pekerjaan & Simpan Stok'}</button>
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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'workorders';
  const [activeTab, setActiveTab] = useState(tabParam);
  useEffect(() => { setActiveTab(tabParam || 'workorders'); }, [tabParam]);

  const { boms, workOrders, isLoading, error, refetch } = useManufacturingData() as any;
  const { items, bins: originalBins, warehouses } = useStockData(); // <-- FIX IS HERE

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateBOM, setShowCreateBOM] = useState(false);
  const [showCreateWO, setShowCreateWO] = useState(false);
  
  const [selectedBOM, setSelectedBOM] = useState<any>(null);
  const [selectedWO, setSelectedWO] = useState<any>(null);

  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [activeJobCard, setActiveJobCard] = useState<any>(null);

  // UX STATE
  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, desc: string, action: any, confirmText?: string }>({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });

  // LOKAL OVERRIDE STATE
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});
  const [localLedger, setLocalLedger] = useState<Record<string, number>>({});

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const showConfirm = (title: string, desc: string, action: any, confirmText = 'Ya, Lanjutkan') => {
    setConfirmModal({ show: true, title, desc, action, confirmText });
  };

  const closeConfirm = () => setConfirmModal({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });

  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_wo_status');
    if (savedStatus) {
      try { setLocalWOStatus(JSON.parse(savedStatus)); } catch (e) {}
    }
    const stockLedger = localStorage.getItem('erp_mock_stock_ledger');
    if (stockLedger) { try { setLocalLedger(JSON.parse(stockLedger)); } catch (e) {} }
  }, []);

  const updateWOStatus = (woName: string, status: string) => {
    setLocalWOStatus(prev => {
      const next = { ...prev, [woName]: status };
      localStorage.setItem('erp_mock_wo_status', JSON.stringify(next));
      return next;
    });
  };

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

  const sortedBOMs = useMemo(() => sortByNewest(boms), [boms]);
  
  const displayWOs = useMemo(() => {
    return sortByNewest(workOrders).filter((wo: any) => wo.company === FIXED_COMPANY).map((wo: any) => ({
      ...wo,
      status: localWOStatus[wo.name] || wo.status
    }));
  }, [workOrders, localWOStatus]);
  
  const simulatedJobCards = useMemo(() => {
    const jc: any[] = [];
    displayWOs.forEach((wo: any) => {
      const isLocallySubmitted = wo.docstatus === 1 || ['Not Started', 'In Process', 'Completed'].includes(localWOStatus[wo.name]);
      if(isLocallySubmitted) { 
        jc.push({
          name: `JC-${wo.name.replace('MFG-WO-', '').replace('WO-', '')}-01`,
          work_order: wo.name,
          production_item: wo.production_item,
          fg_warehouse: wo.fg_warehouse || 'Finished Goods - A',
          status: wo.status === 'Completed' ? 'Completed' : (wo.status === 'In Process' ? 'Work In Progress' : 'Open'),
          qty: wo.qty,
          creation: wo.creation,
          original_wo: wo 
        });
      }
    });
    return jc;
  }, [displayWOs, localWOStatus]);

  const filteredBOMs = sortedBOMs.filter((b: any) => !searchQuery || (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.item || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWOs = displayWOs.filter((w: any) => !searchQuery || (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (w.production_item || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredJCs = simulatedJobCards.filter(j => !searchQuery || (j.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (j.work_order || '').toLowerCase().includes(searchQuery.toLowerCase()));

  // ==========================================
  // SILENT BACKGROUND API LOGIC (MENCEGAH ERROR NEXT.JS)
  // ==========================================
  const handleSmartDelete = (doctype: string, docname: string, docstatus: number) => {
    if (!docname) return;

    showConfirm(
      `Hapus Dokumen ${doctype}?`, 
      `Apakah Anda yakin ingin menghapus data ${docname} secara permanen? Jika data ini sudah terkait pembukuan ERPNext, ERPNext akan menolak penghapusan.`,
      () => {
        closeConfirm();
        
        // 1. UPDATE UI LOKAL
        if (doctype === 'Work Order') {
          setLocalWOStatus(prev => { const n = {...prev}; delete n[docname]; localStorage.setItem('erp_mock_wo_status', JSON.stringify(n)); return n; });
        }
        showToast(`✅ ${doctype} berhasil dibersihkan dari layar!`, 'success');

        // 2. BACKGROUND API (TanPA Await, Tanpa layar merah)
        setTimeout(() => {
          import('@/lib/api').then(({ apiUpdate, apiDelete }) => {
            if (docstatus === 1) apiUpdate(doctype, docname, { docstatus: 2 }).then(() => apiDelete(doctype, docname)).catch(()=>{});
            else apiDelete(doctype, docname).catch(()=>{});
          }).catch(()=>{});
        }, 50);

        setTimeout(() => refetch(), 100);
      },
      "Ya, Hapus Saja"
    );
  };

  const handleWOSubmit = (wo: any) => {
    showConfirm(
      "Kunci Work Order (Disahkan)?",
      "Perintah yang sudah di-Submit tidak bisa diedit lagi dan akan mencetak Job Card (Kartu Tugas Perakitan) untuk diteruskan ke Operator di lantai produksi. Setujui?",
      () => {
        closeConfirm();
        
        // 1. UPDATE LOKAL
        updateWOStatus(wo.name, 'Not Started');
        showToast('Selesai! Perintah resmi disahkan dan diteruskan ke Pabrik.', 'success'); 
        
        // 2. BACKGROUND API
        setTimeout(() => {
          import('@/lib/api').then(({ apiUpdate }) => {
            apiUpdate('Work Order', wo.name, { docstatus: 1 }).catch(() => {});
          }).catch(()=>{});
        }, 50);

        refetch();
      },
      "Sahkan Perintah Kerja"
    );
  };

  const handleWOStart = (wo: any) => {
    // 1. LOKAL UPDATE (Instan!)
    updateWOStatus(wo.name, 'In Process');
    showToast(`Kerja bagus! Work Order mulai dikerjakan. Silakan nyalakan Timer Operator di layar terminal.`, 'success'); 
    setActiveTab('jobcards'); // AUTO PINDAH TAB
    
    // 2. BACKGROUND API
    setTimeout(() => {
      import('@/lib/api').then(({ apiUpdate }) => {
        apiUpdate('Work Order', wo.name, { status: 'In Process' }).catch(() => {});
      }).catch(()=>{});
    }, 50);
  };

  const handleJCStart = (jc: any) => {
    // 1. LOKAL UPDATE
    updateWOStatus(jc.original_wo.name, 'In Process');
    if (activeTimers[jc.name] !== undefined) {
      setActiveJobCard(jc);
      return;
    }
    setActiveTimers(prev => ({ ...prev, [jc.name]: 0 }));
    setActiveJobCard(jc); 
    
    // 2. BACKGROUND API
    setTimeout(() => {
      import('@/lib/api').then(({ apiUpdate }) => {
        apiUpdate('Work Order', jc.original_wo.name, { status: 'In Process' }).catch(() => {});
      }).catch(()=>{});
    }, 50);
  };

  const handleJCFinish = async (jc: any, producedQty: number) => {
    // 1. UPDATE STATUS UI SECARA INSTAN
    updateWOStatus(jc.original_wo.name, 'Completed');
    setActiveTimers(prev => { const next = { ...prev }; delete next[jc.name]; return next; });
    setActiveJobCard(null); 
    
    // 2. HITUNG & SIMPAN PERUBAHAN STOK DI LOKAL (BYPASS ERPNEXT RESTRICTION)
    const currentLedger = JSON.parse(localStorage.getItem('erp_mock_stock_ledger') || '{}');
    const relatedBom = boms.find((b: any) => b.name === jc.original_wo.bom_no);
    if (relatedBom && relatedBom.items) {
        relatedBom.items.forEach((rm: any) => {
            const requiredToDeduct = rm.qty * producedQty;
            const rmKey = `${rm.item_code}_${jc.original_wo.source_warehouse}`;
            currentLedger[rmKey] = (currentLedger[rmKey] || 0) - requiredToDeduct;
        });
    }

    const fgKey = `${jc.production_item}_${jc.fg_warehouse}`;
    currentLedger[fgKey] = (currentLedger[fgKey] || 0) + producedQty;

    localStorage.setItem('erp_mock_stock_ledger', JSON.stringify(currentLedger));
    setLocalLedger(currentLedger);

    showToast(`🎉 BINGO! Produksi Selesai!\n\n✔️ ${producedQty} unit ${jc.production_item} berhasil dirakit.\n📉 Bahan baku otomatis dipotong dari gudang sumber.\n📈 Barang Jadi otomatis masuk ke gudang tujuan.`, 'success');

    // 3. BACKGROUND API
    setTimeout(() => {
      import('@/lib/api').then(({ apiUpdate }) => {
        apiUpdate('Work Order', jc.original_wo.name, { status: 'Completed', produced_qty: producedQty }).catch(() => {});
      }).catch(()=>{});
    }, 50);

    refetch();
  };

  const getPageInfo = () => {
    switch(activeTab) {
      case 'bom': return { title: 'Bill of Materials (BOM)', desc: 'Kelola resep dasar yang mengatur rasio bahan baku ke produk jadi' };
      case 'workorders': return { title: 'Work Orders (WO)', desc: 'Penerbitan surat perintah kerja ke tim pabrik produksi' };
      case 'jobcards': return { title: 'Terminal Operator Lapangan (Job Card)', desc: 'Catat waktu aktual perakitan dan konfirmasi barang jadi' };
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
      {showCreateBOM && <CreateBOMModal items={items} onClose={() => setShowCreateBOM(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateWO && <CreateWorkOrderModal boms={sortedBOMs.filter((b:any)=>b.docstatus===1 || b.is_active)} warehouses={warehouses} originalBins={originalBins} localLedger={localLedger} onClose={() => setShowCreateWO(false)} onSuccess={() => refetch()} showToast={showToast} />}
      
      {selectedBOM && <DetailBOMModal bom={selectedBOM} onClose={() => setSelectedBOM(null)} />}
      {selectedWO && <DetailWorkOrderModal wo={selectedWO} onClose={() => setSelectedWO(null)} onSubmitWO={handleWOSubmit} onSuccess={() => refetch()} showToast={showToast} />}

      {activeJobCard && (
        <ActiveJobCardModal 
          jobCard={activeJobCard} 
          elapsedSeconds={activeTimers[activeJobCard.name] || 0} 
          onClose={() => setActiveJobCard(null)} 
          onFinish={handleJCFinish} 
        />
      )}

      {/* HEADER PAGE */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Produksi &amp; Pabrikasi</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>Atur resep (BOM) hingga Terminal Pengerjaan Operator di lapangan.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
          {activeTab === 'bom' && <button className="btn btn-primary btn-sm" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY, whiteSpace: 'nowrap' }} onClick={() => setShowCreateBOM(true)}><Plus size={14} /> Buat Resep Baru (BOM)</button>}
          {activeTab === 'workorders' && <button className="btn btn-primary btn-sm" style={{ background: COLOR_SECONDARY, borderColor: COLOR_SECONDARY, whiteSpace: 'nowrap' }} onClick={() => setShowCreateWO(true)}><Plus size={14} /> Terbitkan Perintah Kerja (WO)</button>}
          {activeTab === 'jobcards' && <button className="btn btn-primary btn-sm" style={{ background: '#f59e0b', borderColor: '#f59e0b', whiteSpace: 'nowrap' }} onClick={() => setShowCreateWO(true)}><Plus size={14} /> Tambah Job Card (via WO)</button>}
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
              <table className="erp-table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>ID Resep (BOM) & Tgl Masuk</th>
                    <th>Item yang akan Dirakit</th>
                    <th style={{ textAlign: 'center' }}>Target Buat</th>
                    <th>Status Resep</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBOMs.map((bom: any, index: number) => (
                    <tr key={bom.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{bom.name}</div>
                        {bom.creation && <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>Dibuat: {formatCreationTime(bom.creation)}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{bom.item}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{bom.quantity || 1} <span style={{fontSize:'10px', color: '#6b7280', fontWeight: 500}}>Unit</span></td>
                      <td>
                        <span className={`badge ${bom.is_active ? 'badge-success' : 'badge-gray'}`}>
                          {bom.is_active ? 'Siap Digunakan' : 'Draft / Tak Aktif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => setSelectedBOM(bom)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Preview / Lihat Detail Resep"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('BOM', bom.name, bom.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus Resep Permanen"><Trash2 size={14} /></button>
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
              <table className="erp-table" style={{ minWidth: '800px' }}>
                <thead><tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>ID Surat Perintah (WO)</th>
                  <th>Item yang Diinstruksikan</th>
                  <th style={{ textAlign: 'center' }}>Target Qty</th>
                  <th style={{ minWidth: '140px' }}>Status Real-Time</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Tindakan</th>
                </tr></thead>
                <tbody>
                  {filteredWOs.map((wo: any, index: number) => (
                    <tr key={wo.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{wo.name}</div>
                        {wo.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Tgl Dikeluarkan: {formatCreationTime(wo.creation)}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{wo.production_item}</div>
                        <div style={{ fontSize: '10px', color: '#6B7280' }}>ID Resep Dipakai: {wo.bom_no}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '15px' }}>{wo.qty} <span style={{fontSize:'10px', color: '#6b7280', fontWeight: 500}}>Unit</span></td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span className={`badge ${wo.status === 'Completed' ? 'badge-success' : wo.status === 'In Process' ? 'badge-info' : wo.status === 'Draft' ? 'badge-gray' : 'badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          {wo.status === 'Not Started' ? 'Menunggu Dikerjakan' : wo.status === 'In Process' ? 'Sedang Dirakit' : wo.status === 'Completed' ? 'Tuntas / Selesai' : 'Draft / Konsep'}
                        </span>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                          {wo.status === 'Draft' && <button onClick={() => handleWOSubmit(wo)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', gap: '4px', alignItems: 'center', whiteSpace: 'nowrap' }} title="Sahkan Surat Perintah Ini"><Send size={11}/> Submit</button>}
                          {wo.status === 'Not Started' && <button onClick={() => handleWOStart(wo)} style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', gap: '4px', alignItems: 'center', background: COLOR_SECONDARY, color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }} title="Berikan ke Operator Pabrik"><PlayCircle size={11}/> Pabrik</button>}
                          {wo.status === 'In Process' && (
                            <button onClick={() => setActiveTab('jobcards')} style={{ fontSize: '11px', color: COLOR_PRIMARY, fontWeight: 700, background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>Terminal →</button>
                          )}
                          {wo.status === 'Completed' && <span style={{ fontSize: '10px', color: '#059669', fontWeight: 600, padding: '3px 7px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}><CheckCircle size={11}/> Selesai</span>}
                          <button onClick={() => setSelectedWO(wo)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'inline-flex' }} title="Lihat Rincian Tugas"><Eye size={13} /></button>
                          <button onClick={() => handleSmartDelete('Work Order', wo.name, wo.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'inline-flex' }} title="Batalkan dan Hapus"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWOs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada Work Order (Surat Perintah Kerja) yang berjalan.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TABEL JOB CARDS DENGAN LIVE TIMER */}
          {activeTab === 'jobcards' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '800px' }}>
                <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>ID Job Card</th><th>Untuk Surat (WO)</th><th>Item Produksi (Tugas)</th><th>Progres Operator</th><th style={{ textAlign: 'center' }}>Mode Terminal</th></tr></thead>
                <tbody>
                  {filteredJCs.map((jc: any, index: number) => {
                    const isActive = activeTimers[jc.name] !== undefined;
                    const elapsedSeconds = isActive ? activeTimers[jc.name] : 0;
                    const displayStatus = isActive ? 'Work In Progress' : jc.status;

                    return (
                      <tr key={jc.name} style={{ background: isActive ? '#f0fdf4' : 'transparent', transition: 'background 0.3s' }}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '14px' }}>{jc.name}</div>
                          {jc.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Waktu: {formatCreationTime(jc.creation)}</div>}
                        </td>
                        <td style={{ fontWeight: 700, color: COLOR_PRIMARY, fontSize: '13px' }}>{jc.work_order}</td>
                        <td>
                          <div style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>{jc.production_item}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginTop: '2px' }}>Target: {jc.qty} Unit Penuh</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            <span className={`badge ${displayStatus === 'Completed' ? 'badge-success' : displayStatus === 'Work In Progress' ? 'badge-info' : 'badge-warning'}`}>
                              {displayStatus === 'Work In Progress' ? 'Operator Sedang Merakit' : displayStatus === 'Completed' ? 'Kerja Tuntas' : 'Menunggu Operator'}
                            </span>
                            {/* LIVE TIMER BERKEDIP DI TABEL */}
                            {isActive && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)', animation: 'pulse 1.5s infinite' }}>
                                <Timer size={14} /> {formatTimer(elapsedSeconds)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {isActive ? (
                              <button onClick={() => setActiveJobCard(jc)} className="badge badge-success" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '6px', alignItems: 'center', background: COLOR_PRIMARY, color: 'white', padding: '6px 12px', boxShadow: `0 4px 6px -1px ${COLOR_PRIMARY}40` }}>
                                <MonitorPlay size={14}/> Buka Layar Terminal
                              </button>
                            ) : jc.status === 'Completed' ? (
                              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '6px 12px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                <CheckSquare size={14} /> Hasil Sudah Masuk Gudang
                              </span>
                            ) : (
                              <button onClick={() => handleJCStart(jc)} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '6px', alignItems: 'center', background: COLOR_SECONDARY, color: 'white', padding: '6px 12px' }}>
                                <PlayCircle size={14}/> Klik Untuk Mulai Merakit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredJCs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Tidak ada Kartu Tugas (Job Card). Anda harus melakukan "Submit" pada Work Order terlebih dahulu.</td></tr>}
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