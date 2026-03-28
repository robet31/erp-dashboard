'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useStockData, useSellingData } from '@/hooks/useFrappeData';
import {
  Package, Warehouse, AlertTriangle, TrendingUp,
  Plus, Download, Search, X, Edit, Trash2, ArrowRight, AlertCircle, Eye, Truck, Send, Link as LinkIcon, Calendar, Loader2, Info, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatNumber, formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import { EmptyState, TableSkeleton } from '@/components/EmptyState';

// Tema Warna Premium
const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';
const CATEGORY_COLORS = [COLOR_PRIMARY, COLOR_SECONDARY, '#7c3aed', '#d97706', '#0891b2', '#e11d48'];
const FIXED_COMPANY = 'PT Artavista';

const formatCreationTime = (dateStr?: string) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
};

const formatUang = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

const getCurrentTimeForInput = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

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
    return `Gagal! Harga Standar (Valuation Rate) untuk barang "${itemCode}" belum diatur.\n\n👉 Solusi: Pergi ke tab "Master Items" (Gudang), cari barang ini, klik Edit, lalu isi "Standard Rate (Rp)". Sistem akuntansi butuh nilai ini.`;
  }
  
  if (lowerErr.includes('negative stock')) {
    return `Gagal! Stok Tidak Cukup. Transaksi ditolak karena akan menyebabkan sisa fisik di gudang menjadi minus (di bawah 0).\n\n👉 Solusi: Lakukan Penerimaan Gudang (Stock Entry) / Produksi terlebih dahulu.`;
  }

  if (lowerErr.includes('linked with') || lowerErr.includes('cannot delete')) {
    return `Gagal Dihapus!\n\n👉 Dokumen ini tidak bisa dihapus karena sudah saling terhubung/digunakan di transaksi lain yang sudah berjalan.`;
  }

  return errorMsg;
};

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

const getActualStock = (itemCode: string, warehouse: string, bins: any[]) => {
  const bin = bins.find((b: any) => b.item_code === itemCode && b.warehouse === warehouse);
  return bin ? Number(bin.actual_qty) : 0;
};

function CreateItemModal({ onClose, onSuccess, showToast }: any) {
  const [form, setForm] = useState({ item_code: '', item_name: '', item_group: 'Products', stock_uom: 'Nos', is_stock_item: true, is_fixed_asset: false, standard_rate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try {
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Item', { item_code: form.item_code, item_name: form.item_name, item_group: form.item_group, stock_uom: form.stock_uom, is_stock_item: form.is_stock_item ? 1 : 0, is_fixed_asset: form.is_fixed_asset ? 1 : 0, standard_rate: parseFloat(String(form.standard_rate)) || 0 });
      showToast('Master Item berhasil ditambahkan ke katalog!', 'success');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { 
      showToast(extractFrappeError(err, 'Gagal membuat Item'), 'error'); 
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Registrasi Master Item</h2>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Tambahkan produk atau material ke katalog sistem.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">Item Code (Kode Barang) *</label>
              <input type="text" required className="erp-input" value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} placeholder="Contoh: FG-NB-PRO15" />
            </div>
            <div className="form-group">
              <label className="erp-label">Item Name (Nama Lengkap) *</label>
              <input type="text" required className="erp-input" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="Contoh: NetraBook Pro 15" />
            </div>
          </div>
          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">Item Group (Kategori)</label>
              <select className="erp-input" value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}>
                <option value="Products">Products (Barang Jadi)</option>
                <option value="Raw Material">Raw Material (Bahan Baku)</option>
                <option value="Consumables">Consumables (Bahan Habis Pakai)</option>
                <option value="Services">Services (Jasa)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="erp-label">UoM (Satuan Dasar)</label>
              <select className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}>
                <option value="Nos">Nos (Pcs)</option>
                <option value="Unit">Unit</option>
                <option value="Kg">Kg</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="erp-label">Standard Rate (Harga Standar) Rp</label>
            <input type="number" min="0" className="erp-input" value={form.standard_rate} onChange={e => setForm(f => ({ ...f, standard_rate: e.target.value }))} placeholder="0" />
            <p className="helper-text">Digunakan untuk evaluasi nilai aset gudang.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }} className="mobile-flex-col">
            <div style={{ flex: 1, background: form.is_stock_item ? '#eff6ff' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_stock_item ? COLOR_PRIMARY : '#e5e7eb'}`, transition: 'all 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_stock_item ? COLOR_PRIMARY : '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_stock_item} onChange={e => setForm(f => ({ ...f, is_stock_item: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: COLOR_PRIMARY }} /> 
                Maintain Stock (Lacak Fisik)
              </label>
            </div>
            <div style={{ flex: 1, background: form.is_fixed_asset ? '#fef3c7' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_fixed_asset ? '#d97706' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_fixed_asset ? '#d97706' : '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_fixed_asset} onChange={e => setForm(f => ({ ...f, is_fixed_asset: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#d97706' }} /> 
                Is Fixed Asset
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditItemModal({ item, onClose, onSuccess, showConfirm, showToast }: any) {
  const [form, setForm] = useState({ item_name: item.item_name || '', item_group: item.item_group || 'Products', stock_uom: item.stock_uom || 'Nos', is_stock_item: item.is_stock_item === 1 || item.is_stock_item === true, is_fixed_asset: item.is_fixed_asset === 1 || item.is_fixed_asset === true, standard_rate: item.standard_rate || 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Item', item.name, { ...form, is_stock_item: form.is_stock_item ? 1 : 0, is_fixed_asset: form.is_fixed_asset ? 1 : 0, standard_rate: parseFloat(String(form.standard_rate)) || 0 });
      showToast('Perubahan Master Item berhasil disimpan.', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err, 'Gagal mengupdate item'), 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    showConfirm(
      "Hapus Master Item?", 
      `Apakah Anda yakin ingin menghapus Item ${item.item_code} dari sistem secara permanen? Note: Gagal jika item sudah punya riwayat mutasi.`,
      "Ya, Hapus Permanen",
      async () => {
        setIsSubmitting(true);
        try {
          const { apiDelete } = await import('@/lib/api');
          await apiDelete('Item', item.name);
          showToast('Item berhasil dihapus dari sistem ERPNext!', 'success'); 
          onClose(); if (onSuccess) onSuccess();
        } catch (e: any) {
          showToast(extractFrappeError(e), 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Detail Item: {item.item_code}</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group"><label className="erp-label">Item Name *</label><input required type="text" className="erp-input" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} /></div>
          <div className="responsive-grid">
            <div className="form-group"><label className="erp-label">Item Group</label><select required className="erp-input" value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}><option value="Products">Products</option><option value="Raw Material">Raw Material</option><option value="Services">Services (Jasa)</option></select></div>
            <div className="form-group"><label className="erp-label">Default Unit of Measure</label><select required className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}><option value="Nos">Nos</option><option value="Unit">Unit</option></select></div>
          </div>
          <div className="form-group"><label className="erp-label">Standard Rate (Rp)</label><input type="number" min="0" className="erp-input" value={form.standard_rate} onChange={e => setForm(f => ({ ...f, standard_rate: e.target.value }))} /></div>
          
          <div className="modal-footer">
            <button type="button" onClick={handleDelete} disabled={isSubmitting} className="btn btn-secondary mobile-btn" style={{ color: '#dc2626' }}><Trash2 size={15} /> Hapus Item</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateStockEntryModal({ onClose, warehouses, items, onSuccess, showToast }: any) {
  const ALLOWED_ENTRY_TYPES = [
    { value: 'Material Receipt', label: 'Material Receipt (Penerimaan Barang)' }
  ];

  const [form, setForm] = useState({ 
    company: FIXED_COMPANY, 
    stock_entry_type: 'Material Receipt', 
    set_posting_time: true,
    posting_date: new Date().toISOString().split('T')[0],
    posting_time: getCurrentTimeForInput(),
    to_warehouse: '', 
    item_code: '', 
    qty: '', 
    basic_rate: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group), [warehouses]);
  
  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; 
    const selected = items.find((i: any) => i.item_code === val); 
    const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, basic_rate: newRate }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!form.to_warehouse) { showToast("Pilih Gudang Tujuan terlebih dahulu.", 'error'); return; }
    if (!form.item_code) { showToast("Pilih Item yang akan dimasukkan.", 'error'); return; }
    if (Number(form.qty) <= 0) { showToast("Jumlah Qty harus lebih besar dari 0.", 'error'); return; }
    
    setIsSubmitting(true);
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const actualCompany = FIXED_COMPANY;

      const detailItem: any = { 
        item_code: form.item_code, qty: parseFloat(form.qty), uom: selectedItem?.stock_uom || 'Nos',
        t_warehouse: form.to_warehouse, basic_rate: form.basic_rate || 100
      };

      const stockEntryData: any = { 
        stock_entry_type: form.stock_entry_type, posting_date: form.posting_date, posting_time: form.posting_time,
        company: actualCompany, set_posting_time: form.set_posting_time ? 1 : 0, to_warehouse: form.to_warehouse,
        items: [detailItem] 
      };

      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Stock Entry', stockEntryData);
      showToast('Penerimaan Barang berhasil dicatat sebagai Draft!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { 
      showToast(extractFrappeError(err), 'error'); 
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '750px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Catat Penerimaan Barang</h2>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Gunakan form ini untuk memasukkan barang baru ke dalam gudang.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div className="responsive-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group"><label className="erp-label">Company</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
            <div className="form-group"><label className="erp-label">Jenis Transaksi (Type) *</label>
              <select required value={form.stock_entry_type} onChange={e => setForm(f => ({ ...f, stock_entry_type: e.target.value }))} className="erp-input disabled-input" disabled>
                {ALLOWED_ENTRY_TYPES.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              <input type="checkbox" checked={form.set_posting_time} onChange={e => setForm(f => ({ ...f, set_posting_time: e.target.checked }))} /> Custom Waktu & Tanggal
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '400px' }}>
              <input type="date" required disabled={!form.set_posting_time} className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
              <input type="time" required disabled={!form.set_posting_time} step="1" className="erp-input" value={form.posting_time} onChange={e => setForm(f => ({ ...f, posting_time: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
            </div>
          </div>

          <div style={{ background: '#f8f9fb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ border: 'none', marginBottom: '12px' }}>Pilih Gudang Penerima</h3>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="erp-label" style={{ color: '#059669' }}>Target Warehouse (Barang masuk ke gudang ini) *</label>
              <select required className="erp-input" value={form.to_warehouse} onChange={e => setForm(f => ({ ...f, to_warehouse: e.target.value }))}>
                <option value="">-- Pilih Gudang --</option>
                {activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <p className="section-title">Daftar Barang yang Masuk</p>

          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <table className="erp-table" style={{ width: '100%', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Item Code</th>
                  <th style={{ width: '100px' }}>Qty Masuk</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Nilai per Unit</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>1</td>
                  <td><select required className="erp-input" value={form.item_code} onChange={handleItemChange} style={{ padding: '6px', fontSize: '12px' }}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code}</option>)}</select></td>
                  <td><input type="number" step="any" required min="0.1" className="erp-input" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} style={{ padding: '6px', fontSize: '12px', textAlign: 'center', border: '2px solid #3b82f6' }} placeholder="0" /></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#374151' }}>{formatUang(form.basic_rate)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(form.basic_rate * Number(form.qty || 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Memproses...' : 'Simpan Draft'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailStockEntryModal({ entry, onClose, onSubmitEntry }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Stock Entry/${encodeURIComponent(entry.name)}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.data) setFullData(data.data);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetail();
  }, [entry.name]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(onSubmitEntry) await onSubmitEntry(entry);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '750px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /></div> : (
          <>
            <div style={{ background: '#f8f9fb', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>{fullData?.name || entry.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${entry.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{entry.docstatus === 1 ? 'Submitted (Disahkan)' : 'Draft (Sementara)'}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>{fullData?.stock_entry_type || 'Material Receipt'}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}><p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Tgl Pencatatan</p><p style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>{formatDate(fullData?.posting_date || new Date().toISOString())} {fullData?.posting_time || ''}</p></div>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}><p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Gudang Tujuan (Target WH)</p><p style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>{fullData?.to_warehouse || '-'}</p></div>
              </div>

              <h3 className="section-title">Barang yang Masuk / Dimutasi</h3>
              <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table className="erp-table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead><tr><th>Item Code</th><th>Target WH</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Nilai Unit</th><th style={{ textAlign: 'right' }}>Subtotal Amount</th></tr></thead>
                  <tbody>
                    {(fullData?.items || []).map((item: any, i: number) => (
                      <tr key={i}>
                        <td><span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>{item.item_code}</span></td>
                        <td style={{ fontSize: '11px' }}>{item.t_warehouse || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(item.qty)} {item.uom}</td>
                        <td style={{ textAlign: 'right', color: '#4B5563' }}>{formatUang(item.basic_rate)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer">
                {entry.docstatus === 0 && <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}><Send size={16} /> Submit (Sahkan Mutasi)</button>}
                <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateWarehouseModal({ onClose, onSuccess, showToast }: any) {
  const [form, setForm] = useState({ warehouse_name: '', company: FIXED_COMPANY, is_group: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const warehouseName = `${form.warehouse_name} - ARTA`;
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Warehouse', { name: warehouseName, warehouse_name: form.warehouse_name, company: form.company, is_group: form.is_group ? 1 : 0, parent_warehouse: form.is_group ? '' : `All Warehouses - ARTA` });
      showToast('Gudang berhasil didaftarkan!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err, 'Gagal membuat Warehouse'), 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Registrasi Gudang Baru</h2>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Daftarkan area/lokasi penyimpanan baru.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group"><label className="erp-label">Nama Gudang (Warehouse Name) *</label><input required type="text" className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} placeholder="cth: Gudang Cadangan" /></div>
          <div className="form-group"><label className="erp-label">Perusahaan (Company)</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
          
          <div style={{ background: form.is_group ? '#f5f3ff' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_group ? '#8b5cf6' : '#e5e7eb'}`, transition: 'all 0.2s', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_group ? '#7c3aed' : '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }} /> 
              Jadikan Induk Gudang (Group)
            </label>
            <p className="helper-text" style={{ marginLeft: '24px' }}>Gudang Grup tidak bisa menyimpan barang fisik, hanya untuk menaungi gudang kecil di bawahnya.</p>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Gudang'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditWarehouseModal({ warehouse, onClose, onSuccess, showConfirm, showToast }: any) {
  const [form, setForm] = useState({ warehouse_name: warehouse.warehouse_name || '', company: warehouse.company || FIXED_COMPANY, is_group: warehouse.is_group === 1 || warehouse.is_group === true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Warehouse', warehouse.name, { warehouse_name: form.warehouse_name, company: form.company, is_group: form.is_group ? 1 : 0 });
      showToast('Detail Gudang berhasil diupdate!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err, 'Gagal mengupdate'), 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    showConfirm(
      "Hapus Gudang?", 
      `Yakin ingin menghapus Gudang ${warehouse.name}? Tindakan ini ditolak oleh sistem jika gudang tersebut masih memiliki sisa stok barang di dalamnya.`,
      "Ya, Hapus Gudang",
      async () => {
        setIsSubmitting(true);
        try {
          const { apiDelete } = await import('@/lib/api');
          await apiDelete('Warehouse', warehouse.name);
          showToast('Gudang berhasil dihapus secara permanen!', 'success'); 
          onClose(); if (onSuccess) onSuccess();
        } catch (e: any) {
          showToast(`Gagal menghapus! Alasan: ${extractFrappeError(e)}`, 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Gudang: {warehouse.name}</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group"><label className="erp-label">Nama Warehouse *</label><input required type="text" className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} /></div>
          <div className="form-group"><label className="erp-label">Perusahaan</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
          
          <div style={{ background: form.is_group ? '#f5f3ff' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_group ? '#8b5cf6' : '#e5e7eb'}`, transition: 'all 0.2s', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_group ? '#7c3aed' : '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }} /> 
              Set as Group Warehouse
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleDelete} disabled={isSubmitting} className="btn btn-secondary mobile-btn" style={{ color: '#dc2626' }}><Trash2 size={15} /> Hapus Gudang</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateDeliveryNoteModal({ onClose, customers, items, warehouses, orders, bins, onSuccess, onLink, showToast }: any) {
  const [form, setForm] = useState({ 
    customer: '', company: FIXED_COMPANY, 
    posting_date: new Date().toISOString().split('T')[0], 
    posting_time: getCurrentTimeForInput(),
    set_posting_time: true,
    is_return: false,
    item_code: '', qty: '', rate: '', amount: 0,
    warehouse: '', linked_so: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group && (w.company === FIXED_COMPANY || w.name.includes('ARTA'))), [warehouses]);

  const availableStock = useMemo(() => {
    if (!form.item_code || !form.warehouse) return 0;
    return getActualStock(form.item_code, form.warehouse, bins);
  }, [form.item_code, form.warehouse, bins]);

  const isStockShort = !form.is_return && (Number(form.qty || 0) > availableStock);

  const handleSOChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const soName = e.target.value;
    setForm(f => ({ ...f, linked_so: soName }));
    if (!soName) return;
    try {
      const res = await fetch(`/api/frappe/resource/Sales Order/${encodeURIComponent(soName)}`);
      const data = await res.json();
      if (data.data) {
        const soData = data.data;
        const firstItem = soData.items?.[0] || {};
        setForm(f => ({
          ...f, customer: soData.customer, item_code: firstItem.item_code || '',
          qty: firstItem.qty ? String(firstItem.qty) : '1', rate: firstItem.rate ? String(firstItem.rate) : '0',
          amount: firstItem.amount || 0, warehouse: firstItem.warehouse || 'Finished Goods - ARTA',
        }));
        showToast('Data otomatis ditarik dari pesanan!', 'info');
      }
    } catch (err) {}
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; 
    const selected = items.find((i: any) => i.item_code === val); 
    const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, rate: String(newRate), amount: newRate * Number(f.qty || 0) }));
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    setForm(f => ({ ...f, qty: val, amount: Number(val) * Number(f.rate || 0) })); 
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    setForm(f => ({ ...f, rate: val, amount: Number(f.qty || 0) * Number(val) })); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      if (isStockShort) {
        showToast(`Stok Tidak Cukup! Sisa fisik di ${form.warehouse} hanya ${availableStock}.`, 'error');
        return;
      }

      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const selectedWh = activeWarehouses.find((w: any) => w.name === form.warehouse);
      const actualCompany = selectedWh?.company || FIXED_COMPANY;

      const dnData = { 
        customer: form.customer, posting_date: form.posting_date, posting_time: form.posting_time,
        set_posting_time: form.set_posting_time ? 1 : 0, is_return: form.is_return ? 1 : 0, company: actualCompany, 
        items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), amount: form.amount, warehouse: form.warehouse }] 
      };
      
      const { apiCreate } = await import('@/lib/api');
      const res: any = await apiCreate('Delivery Note', dnData);
      
      const newDnName = res?.data?.name || res?.name;
      if (form.linked_so && newDnName && !form.is_return) {
        onLink(newDnName, form.linked_so);
      }

      showToast('Surat Jalan (Delivery Note) Draft berhasil dibuat!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err, 'Gagal membuat Surat Jalan.'), 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Buat Surat Jalan Pengiriman</h2>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Dokumen resmi untuk memotong stok dan mengirim barang keluar.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '10px', border: `1px dashed #bfdbfe`, marginBottom: '20px' }}>
            <label className="erp-label" style={{ color: COLOR_PRIMARY, display: 'flex', alignItems: 'center', gap: '6px' }}><LinkIcon size={14}/> Tarik Cepat Data dari Sales Order</label>
            <select className="erp-input" value={form.linked_so} onChange={handleSOChange} disabled={form.is_return}>
              <option value="">-- Hubungkan dengan Pesanan (SO) --</option>
              {orders.map((o: any) => <option key={o.name} value={o.name}>{o.name} - {o.customer_name}</option>)}
            </select>
            <p className="helper-text" style={{ color: '#1e40af' }}>Jika Surat Jalan ini dibuat untuk memenuhi pesanan klien, pilih dari daftar di atas agar data terisi otomatis.</p>
          </div>

          <div className="form-group">
            <label className="erp-label">Kirim Kepada (Customer) *</label>
            <select required className="erp-input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}>
              <option value="">Pilih Customer penerima...</option>{customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
            </select>
          </div>
          
          <div className="responsive-grid" style={{ marginBottom: '14px' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                <input type="checkbox" checked={form.set_posting_time} onChange={e => setForm(f => ({ ...f, set_posting_time: e.target.checked }))} /> Custom Tgl & Waktu
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="date" required disabled={!form.set_posting_time} className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
                <input type="time" required disabled={!form.set_posting_time} step="1" className="erp-input" value={form.posting_time} onChange={e => setForm(f => ({ ...f, posting_time: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
              </div>
            </div>
            <div>
              <div style={{ background: form.is_return ? '#fee2e2' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_return ? '#ef4444' : '#e5e7eb'}`, transition: 'all 0.2s', marginTop: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: form.is_return ? '#b91c1c' : '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_return} onChange={e => setForm(f => ({ ...f, is_return: e.target.checked, linked_so: '' }))} style={{ accentColor: '#ef4444' }} /> 
                  Ini adalah Retur Masuk!
                </label>
                <p className="helper-text" style={{ marginLeft: '22px', color: form.is_return ? '#7f1d1d' : '#6B7280' }}>Centang jika barang ini adalah pengembalian/retur (akan Menambah stok gudang, bukan memotongnya).</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8f9fb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3 className="section-title">Pemotongan Stok Barang</h3>
            
            <div className="form-group">
              <label className="erp-label" style={{ color: form.is_return ? '#059669' : COLOR_PRIMARY }}>
                {form.is_return ? 'Retur akan dimasukkan ke Gudang mana? *' : 'Keluarkan Barang dari Gudang mana? *'}
              </label>
              <select required className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}>
                <option value="">Pilih Gudang...</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
              </select>
            </div>

            {form.item_code && form.warehouse && !form.is_return && (
              <div style={{ background: isStockShort ? '#fee2e2' : '#f0fdf4', border: `1px solid ${isStockShort ? '#ef4444' : '#22c55e'}`, padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isStockShort ? '#b91c1c' : '#166534', display: 'block' }}>Sisa Fisik di Gudang Terpilih:</span>
                  {isStockShort && <span style={{ fontSize: '10px', color: '#ef4444' }}>Stok tidak cukup untuk dikirim!</span>}
                </div>
                <span style={{ fontSize: '20px', fontWeight: 800, color: isStockShort ? '#ef4444' : '#16a34a' }}>{availableStock} Unit</span>
              </div>
            )}

            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <table className="erp-table" style={{ width: '100%', minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Barang (Item Code)</th>
                    <th style={{ width: '100px' }}>Jml (Qty)</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Nilai Unit</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>1</td>
                    <td><select required className="erp-input" value={form.item_code} onChange={handleItemChange} style={{ padding: '6px', fontSize: '12px' }}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code}</option>)}</select></td>
                    <td><input type="number" step="any" required min="0.1" className="erp-input" value={form.qty} onChange={handleQtyChange} style={{ padding: '6px', fontSize: '12px', textAlign: 'center' }} placeholder="0" /></td>
                    <td><input type="number" step="any" required min="0" className="erp-input" value={form.rate} onChange={handleRateChange} style={{ padding: '6px', fontSize: '12px', textAlign: 'right' }} placeholder="0" /></td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(form.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Total Unit Dikirim</p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{form.qty || 0}</p>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Total Nilai Pengiriman (Rp)</p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(form.amount)}</p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting || isStockShort} className="btn btn-primary mobile-btn" style={{ background: isStockShort ? '#9CA3AF' : COLOR_PRIMARY, borderColor: isStockShort ? '#9CA3AF' : COLOR_PRIMARY }}>
              {isStockShort ? 'Stok Gudang Kurang' : isSubmitting ? 'Memproses...' : 'Simpan Surat Jalan (Draft)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN PAGE CONTENT
// ==========================================
function StockPageContent() {
  const { items, warehouses, bins, stockEntries, isLoading, refetch } = useStockData();
  const { customers, salesOrders, deliveryNotes, isLoading: isSellingLoading, refetch: refetchSelling } = useSellingData();
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'items');

  useEffect(() => { if (tabParam) setActiveTab(tabParam); }, [tabParam]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateDNModal, setShowCreateDNModal] = useState(false);
  const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, desc: string, confirmText: string, action: any }>({ show: false, title: '', desc: '', confirmText: 'Ya, Lanjutkan', action: null });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const showConfirm = (title: string, desc: string, confirmText: string, action: any) => {
    setConfirmModal({ show: true, title, desc, confirmText, action });
  };

  const closeConfirm = () => setConfirmModal({ show: false, title: '', desc: '', confirmText: '', action: null });

  const [dnLinks, setDnLinks] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const savedLinks = localStorage.getItem('erp_mock_dn_links');
    if (savedLinks) { try { setDnLinks(JSON.parse(savedLinks)); } catch (e) {} }
  }, []);

  const handleLinkDN = (dnName: string, soName: string) => {
    setDnLinks(prev => { const next = { ...prev, [dnName]: soName }; localStorage.setItem('erp_mock_dn_links', JSON.stringify(next)); return next; });
  };

  const getItemStockDetails = (itemCode: string) => {
    return bins
      .filter((b: any) => b.item_code === itemCode && Number(b.actual_qty) !== 0)
      .map((b: any) => ({ warehouse: b.warehouse, qty: Number(b.actual_qty) }));
  };

  const sortByNewest = (a: any, b: any, fallbackDateField: string = 'creation') => {
    let timeA = new Date(a.creation || a.modified || a[fallbackDateField] || 0).getTime();
    let timeB = new Date(b.creation || b.modified || b[fallbackDateField] || 0).getTime();
    timeA = isNaN(timeA) ? 0 : timeA; timeB = isNaN(timeB) ? 0 : timeB;
    if (timeA !== timeB) return timeB - timeA;
    return String(b.name).localeCompare(String(a.name));
  };

  const sortedItems = useMemo(() => { return [...items].sort((a, b) => sortByNewest(a, b)); }, [items]);
  const sortedWarehouses = useMemo(() => {
    const nvWarehouses = warehouses.filter((w: any) => w.company === 'PT Artavista' || w.name.includes('- ARTA') || w.name.toLowerCase().includes('pt artavista'));
    return [...nvWarehouses].sort((a, b) => sortByNewest(a, b));
  }, [warehouses]);
  const sortedBins = useMemo(() => {
    const nvBins = bins.filter((b: any) => b.warehouse.includes(FIXED_COMPANY) || b.warehouse.includes('- ARTA'));
    return [...nvBins].sort((a, b) => sortByNewest(a, b, 'modified'));
  }, [bins]);
  const sortedStockEntries = useMemo(() => {
    return [...stockEntries].filter((se: any) => se.company === FIXED_COMPANY).sort((a, b) => sortByNewest(a, b, 'posting_date'));
  }, [stockEntries]);
  const sortedDeliveryNotes = useMemo(() => {
    return [...deliveryNotes].filter((dn: any) => dn.company === FIXED_COMPANY).sort((a, b) => sortByNewest(a, b, 'posting_date'));
  }, [deliveryNotes]);

  const activeSalesOrders = useMemo(() => {
    const localSOStatus = JSON.parse(localStorage.getItem('erp_mock_selling_status') || '{}');
    return salesOrders.filter((o: any) => {
      const isDocstatus1 = (localSOStatus[o.name] !== undefined) ? localSOStatus[o.name] === 1 : o.docstatus === 1;
      return isDocstatus1 && o.status !== 'Completed';
    });
  }, [salesOrders]);

  const filteredItems = sortedItems.filter((i: any) => !searchQuery || i.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) || i.item_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWarehouses = sortedWarehouses.filter((w: any) => !searchQuery || w.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBins = sortedBins.filter((b: any) => !searchQuery || b.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) || b.warehouse?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredStockEntries = sortedStockEntries.filter((se: any) => !searchQuery || se.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDeliveryNotes = sortedDeliveryNotes.filter((dn: any) => !searchQuery || dn.name?.toLowerCase().includes(searchQuery.toLowerCase()) || dn.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const lowStockCount = sortedBins.filter((b: any) => b.actual_qty < 10).length;
  const totalStockValue = sortedBins.reduce((s: number, b: any) => s + (Number(b.stock_value) || 0), 0);

  const stockByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    sortedBins.forEach((bin: any) => {
      const item = sortedItems.find((i: any) => i.item_code === bin.item_code);
      const cat = item?.item_group || 'Other';
      map[cat] = (map[cat] || 0) + (Number(bin.actual_qty) || 0);
    });
    return Object.entries(map).map(([category, qty]) => ({ category, qty }));
  }, [sortedBins, sortedItems]);

  const handleSmartDelete = (doctype: string, docname: string, docstatus: number) => {
    if (!docname) return;
    showConfirm(
      `Hapus Dokumen ${doctype}?`,
      `Apakah Anda yakin ingin menghapus ${docname} dari server ERPNext? Jika data ini sudah terkait dengan transaksi pembukuan, ERPNext akan menolak penghapusan.`,
      "Ya, Hapus Permanen",
      async () => {
        closeConfirm();
        try {
          const { apiUpdate, apiDelete } = await import('@/lib/api');
          if (docstatus === 1) { await apiUpdate(doctype, docname, { docstatus: 2 }); }
          await apiDelete(doctype, docname);
          showToast(`✅ ${doctype} berhasil dihapus dari database!`, 'success');
          refetch(); if (doctype === 'Delivery Note') refetchSelling();
        } catch (err: any) {
          showToast(`Ditolak oleh Server! ${extractFrappeError(err)}`, 'error');
        }
      }
    );
  };

  const handleSubmitDN = (dn: any) => {
    const isRet = dn.is_return === 1;
    showConfirm(
      "Sahkan Surat Jalan (Delivery Note)?",
      `Dokumen yang disahkan akan mengurangi fisik stok dari Gudang. Jika ini Retur, stok akan bertambah. Tindakan ini memengaruhi laporan aset. Lanjutkan?`,
      "Sahkan Pengiriman",
      async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Delivery Note', dn.name, { docstatus: 1 });
          
          const linkedSOName = dnLinks[dn.name];
          if (linkedSOName && !isRet) {
            const currentProgress = JSON.parse(localStorage.getItem('erp_mock_so_progress') || '{}');
            const soProg = currentProgress[linkedSOName] || { delivered: 0, billed: 0 };
            currentProgress[linkedSOName] = { ...soProg, delivered: 100 };
            localStorage.setItem('erp_mock_so_progress', JSON.stringify(currentProgress));
          }

          showToast(isRet ? '✅ Surat Jalan Retur berhasil disahkan. Stok masuk.' : '✅ Pengiriman sukses. Stok gudang terpotong di ERPNext.', 'success');
          refetchSelling(); refetch(); 
        } catch (err: any) { 
          showToast(extractFrappeError(err), 'error');
        }
      }
    );
  };

  const handleSubmitStockEntry = (entry: any) => {
    showConfirm(
      "Sahkan Mutasi Stok Masuk?",
      "Catatan: Hanya dokumen yang disahkan (Submitted) yang akan benar-benar merubah jumlah fisik barang di Gudang Tujuan.",
      "Ya, Masukkan Barang",
      async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Stock Entry', entry.name, { docstatus: 1 });
          showToast('✅ Penerimaan barang berhasil! Stok Gudang ERPNext terupdate.', 'success'); 
          refetch();
        } catch (err: any) {
          showToast(extractFrappeError(err), 'error');
        }
      }
    );
  };

  const getPageInfo = () => {
    switch(activeTab) {
      case 'items': return { title: 'Master Produk (Katalog)', desc: 'Daftar resmi seluruh produk dan bahan yang dikelola ERP', stats: [{ label: 'Total Item Terdaftar', value: sortedItems.length, sub: 'Global', icon: <Package size={22} />, color: COLOR_PRIMARY, bg: '#eff6ff' }] };
      case 'warehouse': return { title: 'Lokasi Gudang', desc: 'Pengaturan tempat penyimpanan fisik barang', stats: [{ label: 'Total Gudang', value: sortedWarehouses.length, sub: 'Cabang & Pusat', icon: <Warehouse size={22} />, color: '#7c3aed', bg: '#f5f3ff' }] };
      case 'bin': return { title: 'Stock Level (Sisa Fisik)', desc: 'Laporan ketersediaan barang murni dari Server (Real-time)', stats: [{ label: 'Peringatan Stok Tipis', value: lowStockCount, sub: '< 15 unit (Butuh Restock)', icon: <AlertTriangle size={22} />, color: '#d97706', bg: '#fffbeb' }, { label: 'Estimasi Nilai Aset Gudang', value: formatUang(totalStockValue), sub: 'Rupiah', icon: <TrendingUp size={22} />, color: '#059669', bg: '#ecfdf5' }] };
      case 'stockentry': return { title: 'Penerimaan Gudang', desc: 'Mutasi barang masuk dari Supplier atau Pabrik', stats: [{ label: 'Total Transaksi Masuk', value: sortedStockEntries.length, sub: 'Dokumen mutasi', icon: <ArrowRight size={22} />, color: COLOR_PRIMARY, bg: '#eff6ff' }] };
      case 'delivery': return { title: 'Surat Jalan (Kirim Keluar)', desc: 'Pengiriman ke customer atau pengembalian (Retur)', stats: [{ label: 'Total Surat Jalan Dibuat', value: sortedDeliveryNotes.length, sub: 'Dokumen kirim', icon: <Truck size={22} />, color: COLOR_SECONDARY, bg: '#e0f2fe' }] };
      default: return { title: 'Inventory', desc: 'Modul Gudang', stats: [] };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      <Toast show={toast.show} message={toast.msg} type={toast.type} />
      <ConfirmModal show={confirmModal.show} title={confirmModal.title} desc={confirmModal.desc} confirmText={confirmModal.confirmText} onConfirm={confirmModal.action} onCancel={closeConfirm} />

      {(isLoading || isSellingLoading) && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <TableSkeleton rows={6} cols={5} />
        </div>
      )}

      {showCreateModal && <CreateStockEntryModal onClose={() => setShowCreateModal(false)} warehouses={sortedWarehouses} items={sortedItems} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateItemModal && <CreateItemModal onClose={() => setShowCreateItemModal(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateWarehouseModal && <CreateWarehouseModal onClose={() => setShowCreateWarehouseModal(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateDNModal && <CreateDeliveryNoteModal onClose={() => setShowCreateDNModal(false)} customers={customers} items={sortedItems} warehouses={sortedWarehouses} orders={activeSalesOrders} bins={sortedBins} onSuccess={() => refetchSelling()} onLink={handleLinkDN} showToast={showToast} />}
      
      {selectedItem && <EditItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={() => refetch()} showToast={showToast} showConfirm={showConfirm} />}
      {selectedWarehouse && <EditWarehouseModal warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} onSuccess={() => refetch()} showToast={showToast} showConfirm={showConfirm} />}
      {selectedEntry && <DetailStockEntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} onSubmitEntry={handleSubmitStockEntry} />}

      <div className="mobile-flex-col" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Manajemen Gudang</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>Kelola arus keluar masuk stok dan identitas barang.</p>
        </div>
        <div className="mobile-full-width" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'items' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: '#059669', borderColor: '#059669' }} onClick={() => setShowCreateItemModal(true)}><Plus size={14} /> Registrasi Item Baru</button>}
          {activeTab === 'warehouse' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setShowCreateWarehouseModal(true)}><Plus size={14} /> Daftar Lokasi Gudang Baru</button>}
          {activeTab === 'stockentry' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }} onClick={() => setShowCreateModal(true)}><Plus size={14} /> Catat Barang Masuk</button>}
          {activeTab === 'delivery' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: COLOR_SECONDARY, borderColor: COLOR_SECONDARY }} onClick={() => setShowCreateDNModal(true)}><Plus size={14} /> Buat Surat Jalan (Kirim/Retur)</button>}
        </div>
      </div>

      <div className="chart-container" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafb' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Sub-Modul: {pageInfo.title}</h3>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{pageInfo.desc}</p>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {pageInfo.stats.map((s, idx) => (
              <div key={idx} className="stat-card" style={{ flex: 1, minWidth: '200px', border: '1px solid #f3f4f6', boxShadow: 'none' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: s.color, fontWeight: 600 }}>{s.sub}</p>
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="mobile-flex-col" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder={`Cari data berdasarkan ID / Nama...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontFamily: "'Poppins', sans-serif", outline: 'none', width: '100%', transition: 'all 0.2s' }} onFocus={e => e.target.style.borderColor = COLOR_PRIMARY} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>
          </div>

          {/* --- TABEL ITEMS --- */}
          {activeTab === 'items' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Kode / Nama Produk</th>
                    <th>Kelompok Barang</th>
                    <th>Satuan (UoM)</th>
                    <th style={{ textAlign: 'center' }}>Total Stok Fisik</th>
                    <th>ID Barcode (Sistem)</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: any, i) => {
                    const stockDetails = getItemStockDetails(item.item_code);
                    const totalQty = stockDetails.reduce((sum, d) => sum + d.qty, 0);

                    return (
                      <tr key={item.name} className="table-row-hover">
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{item.item_name || item.item_code}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <span className={`badge ${item.disabled ? 'badge-danger' : 'badge-success'}`}>{item.disabled ? 'Non-Aktif' : 'Aktif'}</span>
                            {item.is_stock_item === 1 && <span className="badge badge-info">Bisa di-Stok</span>}
                          </div>
                        </td>
                        <td><span style={{ background: '#f3f4f6', color: '#374151', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{item.item_group}</span></td>
                        <td style={{ color: '#4B5563', fontWeight: 600, fontSize: '13px' }}>{item.stock_uom}</td>
                        
                        <td style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
                          <div style={{ fontWeight: 800, fontSize: '16px', color: totalQty > 0 ? COLOR_PRIMARY : '#ef4444' }}>
                            {totalQty} <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>{item.stock_uom}</span>
                          </div>
                          {stockDetails.map((sd, idx) => (
                             <div key={idx} style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px', fontWeight: 500 }}>{sd.qty} berada di {sd.warehouse.replace(' - ARTA', '')}</div>
                          ))}
                        </td>

                        <td><span style={{ color: COLOR_SECONDARY, fontWeight: 700, fontSize: '12px' }}>{item.item_code}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => setSelectedItem(item)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '8px', cursor: 'pointer' }} title="Detail & Edit Data"><Edit size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && filteredItems.length === 0 && (
                    <tr><td colSpan={7}>
                      <EmptyState
                        icon="📦"
                        title="Belum ada Item di katalog"
                        description="Klik tombol 'Registrasi Item Baru' di atas untuk menambahkan produk atau bahan baku pertama ke sistem."
                        action={{ label: 'Tambah Item Pertama', onClick: () => setShowCreateItemModal(true) }}
                        size="md"
                      />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* --- TABEL WAREHOUSE --- */}
          {activeTab === 'warehouse' && (
            <div style={{ overflowX: 'auto' }}><table className="erp-table"><thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Nama Lokasi Gudang</th><th>Atas Nama Perusahaan</th><th>Sifat Gudang</th><th style={{ textAlign: 'center', width: '90px' }}>Tindakan</th></tr></thead><tbody>
              {filteredWarehouses.map((w: any, i) => (
                <tr key={w.name} className="table-row-hover"><td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                <td>
                  <div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{w.warehouse_name}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', fontFamily: 'monospace' }}>ID: {w.name}</div>
                </td>
                <td style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>{w.company}</td>
                <td><span className={`badge ${w.is_group ? 'badge-purple' : 'badge-info'}`}>{w.is_group ? 'Gudang Induk (Group)' : 'Gudang Fisik (Penyimpanan)'}</span></td><td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={() => setSelectedWarehouse(w)} style={{ background: '#ecfdf5', border: 'none', color: '#059669', cursor: 'pointer', padding: '8px', borderRadius: '6px' }} title="Edit"><Edit size={16} /></button>
                  </div>
                </td></tr>
              ))}
            </tbody></table></div>
          )}

          {/* --- TABEL BIN (MENAMPILKAN STOK AKTUAL DARI SERVER) --- */}
          {activeTab === 'bin' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Nama Barang Terdeteksi</th>
                    <th>Lokasi Penyimpanan Rak</th>
                    <th style={{ textAlign: 'right' }}>Sisa Fisik Asli (Actual)</th>
                    <th style={{ textAlign: 'right' }}>Nilai Valuasi (Aset)</th>
                    <th style={{ textAlign: 'center' }}>Status Kesehatan Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBins.map((bin: any, i) => (
                    <tr key={bin.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                      <td>
                        <div style={{ color: COLOR_PRIMARY, fontWeight: 800, fontSize: '14px' }}>{bin.item_code}</div>
                        <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace', marginTop: '2px' }}>ID: {bin.name}</div>
                      </td>
                      <td>
                        <span style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>{bin.warehouse.replace(' - NV', '')}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '18px', color: '#111827' }}>
                        {formatNumber(bin.actual_qty)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: 700, color: '#059669' }}>{formatUang(bin.stock_value)}</td>
                      <td style={{ textAlign: 'center' }}>{bin.actual_qty <= 15 ? <span className="badge badge-warning" style={{ fontSize: '11px', padding: '4px 10px' }}><AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> Waspada Habis</span> : <span className="badge badge-success" style={{ fontSize: '11px', padding: '4px 10px' }}>Aman</span>}</td>
                    </tr>
                  ))}
                  {filteredBins.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Tidak ada barang terdeteksi di rak gudang. Lakukan Stock Entry / Produksi untuk memasukkan barang.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* --- TABEL STOCK ENTRY --- */}
          {activeTab === 'stockentry' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>ID Dokumen Masuk</th>
                    <th>Tujuan Rak Penyimpanan</th>
                    <th>Sifat Dokumen</th>
                    <th style={{ textAlign: 'center' }}>Status Pengesahan</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockEntries.map((se: any, i) => (
                    <tr key={se.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                      <td>
                        <div style={{ color: COLOR_PRIMARY, fontWeight: 800, fontSize: '14px' }}>{se.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Dicatat: {formatDate(se.posting_date)}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Warehouse size={14} color="#059669"/>
                          <span style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{se.to_warehouse ? se.to_warehouse.replace(' - NV', '') : '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#4B5563', fontSize: '12px' }}>{se.stock_entry_type === 'Material Receipt' ? 'Barang Datang Baru' : se.stock_entry_type}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}><span className={`badge ${se.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{se.docstatus === 1 ? 'Sah (Masuk Rak)' : 'Draft Sementara'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {se.docstatus === 0 && <button onClick={() => handleSubmitStockEntry(se)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }} title="Sahkan agar stok nambah di gudang"><Send size={12}/> Sahkan</button>}
                          <button onClick={() => setSelectedEntry(se)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Rincian Barang"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('Stock Entry', se.name, se.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus Dokumen"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStockEntries.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada histori Penerimaan Barang (Stock Entry).</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* --- TABEL DELIVERY NOTE --- */}
          {activeTab === 'delivery' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Surat Jalan ID</th>
                    <th>Dikirim Kepada (Penerima)</th>
                    <th>Jenis</th>
                    <th>Status Pengiriman</th>
                    <th style={{ textAlign: 'right' }}>Total Nilai Barang (Rp)</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveryNotes.map((dn: any, index) => (
                    <tr key={dn.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ color: COLOR_SECONDARY, fontWeight: 800, fontSize: '13px' }}>{dn.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6B7280', marginTop: '4px' }}><Calendar size={10} /> {formatDate(dn.posting_date)}</div>
                      </td>
                      <td><div style={{ fontWeight: 800, fontSize: '13px', color: '#111827' }}>{dn.customer_name || dn.customer}</div></td>
                      <td>
                        {dn.is_return === 1 ? <span className="badge badge-danger" style={{ fontWeight: 700 }}>Retur (Masuk Kembali)</span> : <span className="badge badge-info">Pengiriman Normal Keluar</span>}
                      </td>
                      <td><span className={`badge ${dn.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{dn.docstatus === 1 ? 'Terkirim & Stok Terpotong' : 'Draft Penyiapan'}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>
                        {formatUang(dn.grand_total || 0)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {dn.docstatus === 0 && <button onClick={() => handleSubmitDN(dn)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }} title="Sahkan Pengiriman"><Send size={12}/> Sahkan</button>}
                          <button onClick={() => handleSmartDelete('Delivery Note', dn.name, dn.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }} title="Batalkan & Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDeliveryNotes.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada histori Surat Jalan pengiriman keluar.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
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
        }
      `}</style>
    </div>
  );
}

export default function StockPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  useEffect(() => { if (!canAccess('stock' as any)) router.push('/dashboard'); }, [canAccess, router]);
  return (<Suspense fallback={<div>Loading...</div>}><StockPageContent /></Suspense>);
}