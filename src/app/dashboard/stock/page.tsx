'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useStockData, useSellingData } from '@/hooks/useFrappeData';
import {
  Package, Warehouse, AlertTriangle, TrendingUp,
  Plus, Download, Search, X, Edit, Trash2, ArrowRight, AlertCircle, Eye, Truck, Send, Link as LinkIcon, Barcode, Calendar, Loader2, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatNumber, formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';

// Tema Warna Premium
const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';
const CATEGORY_COLORS = [COLOR_PRIMARY, COLOR_SECONDARY, '#7c3aed', '#d97706', '#0891b2', '#e11d48'];
const FIXED_COMPANY = 'Netra Vidya';

// HELPER: Format Waktu & Uang
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

const extractFrappeError = (err: any, fallbackMsg: string = 'Terjadi kesalahan sistem') => {
  if (typeof err === 'string') return err;
  let errorMsg = err?.message || err?.error?.message || fallbackMsg;
  if (err?._server_messages) {
    try { errorMsg = JSON.parse(JSON.parse(err._server_messages)[0]).message.replace(/<[^>]*>?/gm, ''); } catch(e) {}
  }
  return errorMsg;
};

// ==========================================
// 1. MODAL CREATE ITEM & EDIT ITEM
// ==========================================
function CreateItemModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({ item_code: '', item_name: '', item_group: 'Products', stock_uom: 'Nos', is_stock_item: true, is_fixed_asset: false, standard_rate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true); setError('');
    try {
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Item', { item_code: form.item_code, item_name: form.item_name, item_group: form.item_group, stock_uom: form.stock_uom, is_stock_item: form.is_stock_item ? 1 : 0, is_fixed_asset: form.is_fixed_asset ? 1 : 0, standard_rate: parseFloat(String(form.standard_rate)) || 0 });
      alert('✅ Item berhasil dibuat!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Item')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Item Baru</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="responsive-grid">
            <div><label className="erp-label">Item Code *</label><input type="text" required className="erp-input" value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} placeholder="Contoh: FG-NB-PRO15" /></div>
            <div><label className="erp-label">Item Name *</label><input type="text" required className="erp-input" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="Contoh: NetraBook Pro 15" /></div>
          </div>
          <div className="responsive-grid">
            <div><label className="erp-label">Kategori (Item Group)</label><select className="erp-input" value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}><option value="Products">Products (Barang Jadi)</option><option value="Raw Material">Raw Material (Bahan Baku)</option><option value="Consumables">Consumables (Bahan Habis Pakai)</option><option value="Services">Services (Jasa)</option></select></div>
            <div><label className="erp-label">Satuan Dasar (UoM)</label><select className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}><option value="Nos">Nos (Pcs)</option><option value="Unit">Unit</option><option value="Kg">Kg</option></select></div>
          </div>
          <div><label className="erp-label">Harga Standar / Standard Rate (Rp)</label><input type="number" min="0" className="erp-input" value={form.standard_rate} onChange={e => setForm(f => ({ ...f, standard_rate: e.target.value }))} placeholder="0" /></div>
          
          {/* HELPER BOXES UNTUK CHECKBOX */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }} className="mobile-flex-col">
            <div style={{ flex: 1, background: form.is_stock_item ? '#eff6ff' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_stock_item ? COLOR_PRIMARY : '#e5e7eb'}`, transition: 'all 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_stock_item ? COLOR_PRIMARY : '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_stock_item} onChange={e => setForm(f => ({ ...f, is_stock_item: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: COLOR_PRIMARY }} /> 
                Maintain Stock
              </label>
              <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>Centang untuk melacak fisik barang di gudang. Hapus centang jika ini adalah <b>Jasa/Service</b>.</p>
            </div>
            
            <div style={{ flex: 1, background: form.is_fixed_asset ? '#fef3c7' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_fixed_asset ? '#d97706' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_fixed_asset ? '#d97706' : '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_fixed_asset} onChange={e => setForm(f => ({ ...f, is_fixed_asset: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#d97706' }} /> 
                Is Fixed Asset
              </label>
              <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>Centang jika barang ini adalah <b>Aset Perusahaan</b> yang menyusut (misal: Mesin, Komputer Kantor).</p>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditItemModal({ item, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ item_name: item.item_name || '', item_group: item.item_group || 'Products', stock_uom: item.stock_uom || 'Nos', is_stock_item: item.is_stock_item === 1 || item.is_stock_item === true, is_fixed_asset: item.is_fixed_asset === 1 || item.is_fixed_asset === true, standard_rate: item.standard_rate || 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Item', item.name, { ...form, is_stock_item: form.is_stock_item ? 1 : 0, is_fixed_asset: form.is_fixed_asset ? 1 : 0, standard_rate: parseFloat(String(form.standard_rate)) || 0 });
      alert('✅ Item berhasil diupdate!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(extractFrappeError(err, 'Gagal mengupdate item')); } finally { setIsSubmitting(false); }
  };
  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;
    setIsSubmitting(true);
    try {
      const { apiDelete } = await import('@/lib/api');
      await apiDelete('Item', item.name);
      alert('✅ Item berhasil dihapus!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(extractFrappeError(err, 'Gagal menghapus item')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Item</h2><p style={{ fontSize: '12px', color: '#6B7280' }}>ID: {item.name}</p></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label className="erp-label">Item Name *</label><input required type="text" className="erp-input" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} /></div>
          <div className="responsive-grid">
            <div><label className="erp-label">Item Group</label><select required className="erp-input" value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}><option value="Products">Products</option><option value="Raw Material">Raw Material</option><option value="Services">Services (Jasa)</option></select></div>
            <div><label className="erp-label">Default Unit of Measure</label><select required className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}><option value="Nos">Nos</option><option value="Unit">Unit</option></select></div>
          </div>
          <div><label className="erp-label">Standard Rate (Rp)</label><input type="number" min="0" className="erp-input" value={form.standard_rate} onChange={e => setForm(f => ({ ...f, standard_rate: e.target.value }))} /></div>
          
          {/* HELPER BOXES UNTUK CHECKBOX */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }} className="mobile-flex-col">
            <div style={{ flex: 1, background: form.is_stock_item ? '#eff6ff' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_stock_item ? COLOR_PRIMARY : '#e5e7eb'}`, transition: 'all 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_stock_item ? COLOR_PRIMARY : '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_stock_item} onChange={e => setForm(f => ({ ...f, is_stock_item: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: COLOR_PRIMARY }} /> 
                Maintain Stock
              </label>
              <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>Centang untuk melacak fisik barang di gudang. Hapus centang jika ini adalah <b>Jasa/Service</b>.</p>
            </div>
            
            <div style={{ flex: 1, background: form.is_fixed_asset ? '#fef3c7' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_fixed_asset ? '#d97706' : '#e5e7eb'}`, transition: 'all 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_fixed_asset ? '#d97706' : '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_fixed_asset} onChange={e => setForm(f => ({ ...f, is_fixed_asset: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#d97706' }} /> 
                Is Fixed Asset
              </label>
              <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>Centang jika barang ini adalah <b>Aset Perusahaan</b> yang menyusut (misal: Mesin, Komputer Kantor).</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button type="button" onClick={handleDelete} className="btn btn-secondary mobile-btn" style={{ color: '#dc2626' }}><Trash2 size={15} /> Hapus</button>
            <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL CREATE STOCK ENTRY 
// ==========================================
function CreateStockEntryModal({ onClose, warehouses, items, onSuccess }: any) {
  const ALLOWED_ENTRY_TYPES = [
    { value: 'Material Receipt', label: 'Material Receipt (Penerimaan Barang)' }, 
    { value: 'Material Issue', label: 'Material Issue (Pengeluaran Barang)' },
    { value: 'Material Transfer', label: 'Material Transfer (Pindah Gudang)' },
    { value: 'Manufacture', label: 'Manufacture (Hasil Produksi)' }
  ];

  const [form, setForm] = useState({ 
    company: FIXED_COMPANY, 
    stock_entry_type: 'Material Receipt', 
    set_posting_time: true,
    posting_date: new Date().toISOString().split('T')[0],
    posting_time: new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
    from_warehouse: '', 
    to_warehouse: '', 
    item_code: '', 
    qty: '', 
    basic_rate: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group), [warehouses]);
  
  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; 
    const selected = items.find((i: any) => i.item_code === val); 
    const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, basic_rate: newRate }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      const isReceipt = form.stock_entry_type === 'Material Receipt' || form.stock_entry_type === 'Manufacture';
      const isIssue = form.stock_entry_type === 'Material Issue';
      const isTransfer = form.stock_entry_type === 'Material Transfer';

      if (isReceipt && !form.to_warehouse) throw new Error("Pilih Default Target Warehouse");
      if (isIssue && !form.from_warehouse) throw new Error("Pilih Default Source Warehouse");
      if (isTransfer && (!form.from_warehouse || !form.to_warehouse)) throw new Error("Pilih Source dan Target Warehouse");
      if (!form.item_code) throw new Error("Pilih Item di tabel");
      if (Number(form.qty) <= 0) throw new Error("Quantity harus lebih dari 0");
      
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const selectedWh = activeWarehouses.find((w: any) => w.name === form.to_warehouse || w.name === form.from_warehouse);
      const actualCompany = selectedWh?.company || FIXED_COMPANY;

      const detailItem: any = { item_code: form.item_code, qty: parseFloat(form.qty), uom: selectedItem?.stock_uom || 'Nos' };
      if (isReceipt || isTransfer) { detailItem.t_warehouse = form.to_warehouse; detailItem.basic_rate = form.basic_rate || 100; }
      if (isIssue || isTransfer) { detailItem.s_warehouse = form.from_warehouse; }

      const stockEntryData: any = { 
        stock_entry_type: form.stock_entry_type, 
        posting_date: form.posting_date, 
        posting_time: form.posting_time,
        company: actualCompany, 
        set_posting_time: form.set_posting_time ? 1 : 0, 
        items: [detailItem] 
      };
      
      if (isReceipt || isTransfer) stockEntryData.to_warehouse = form.to_warehouse;
      if (isIssue || isTransfer) stockEntryData.from_warehouse = form.from_warehouse;

      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Stock Entry', stockEntryData);
      alert('✅ Stock Entry berhasil dibuat (Draft)!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Stock Entry. Pastikan stok cukup.')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '750px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>New Stock Entry</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div className="responsive-grid" style={{ marginBottom: '16px' }}>
            <div><label className="erp-label">Company</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
            <div><label className="erp-label">Series</label><input type="text" readOnly className="erp-input disabled-input" value="MAT-STE-.YYYY.-" /></div>
          </div>
          <div className="responsive-grid" style={{ marginBottom: '16px' }}>
            <div><label className="erp-label">Tujuan Transaksi (Type) *</label>
              <select required value={form.stock_entry_type} onChange={e => setForm(f => ({ ...f, stock_entry_type: e.target.value, from_warehouse: '', to_warehouse: '' }))} className="erp-input">
                {ALLOWED_ENTRY_TYPES.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                <input type="checkbox" checked={form.set_posting_time} onChange={e => setForm(f => ({ ...f, set_posting_time: e.target.checked }))} /> Edit Posting Date and Time
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="date" required disabled={!form.set_posting_time} className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
                <input type="time" required disabled={!form.set_posting_time} step="1" className="erp-input" value={form.posting_time} onChange={e => setForm(f => ({ ...f, posting_time: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
              </div>
            </div>
          </div>

          <div style={{ background: '#f8f9fb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: COLOR_PRIMARY, borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>Default Warehouse</h3>
            <div className="responsive-grid">
              <div><label className="erp-label" style={{ color: '#dc2626' }}>Default Source Warehouse (Gudang Asal)</label>
                <select className="erp-input" value={form.from_warehouse} onChange={e => setForm(f => ({ ...f, from_warehouse: e.target.value }))} disabled={form.stock_entry_type === 'Material Receipt'}>
                  <option value="">Pilih Gudang Sumber...</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
              </div>
              <div><label className="erp-label" style={{ color: '#059669' }}>Default Target Warehouse (Gudang Tujuan)</label>
                <select className="erp-input" value={form.to_warehouse} onChange={e => setForm(f => ({ ...f, to_warehouse: e.target.value }))} disabled={form.stock_entry_type === 'Material Issue'}>
                  <option value="">Pilih Gudang Tujuan...</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>Items to Transact</h3>

          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <table className="erp-table" style={{ width: '100%', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Item Code</th>
                  <th style={{ width: '100px' }}>Qty</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Basic Rate</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>1</td>
                  <td><select required className="erp-input" value={form.item_code} onChange={handleItemChange} style={{ padding: '6px', fontSize: '12px' }}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code}</option>)}</select></td>
                  <td><input type="number" step="any" required min="0.1" className="erp-input" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} style={{ padding: '6px', fontSize: '12px', textAlign: 'center' }} placeholder="0" /></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#374151' }}>{formatUang(form.basic_rate)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: COLOR_PRIMARY }}>{formatUang(form.basic_rate * Number(form.qty || 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {error && <div className="error-box" style={{ marginTop: '16px' }}><AlertCircle size={16} />{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Batal</button>
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
        const data = await res.json();
        if (data.data) setFullData(data.data);
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
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>{fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${entry.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{entry.docstatus === 1 ? 'Submitted' : 'Draft'}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>{fullData?.stock_entry_type}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}><p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Posting Date</p><p style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>{formatDate(fullData?.posting_date)} {fullData?.posting_time}</p></div>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}><p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Source WH</p><p style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>{fullData?.from_warehouse || '-'}</p></div>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}><p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Target WH</p><p style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>{fullData?.to_warehouse || '-'}</p></div>
              </div>

              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>Items Transferred</h3>
              <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table className="erp-table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead><tr><th>Item Code</th><th>Source WH</th><th>Target WH</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Basic Rate</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                  <tbody>
                    {(fullData?.items || []).map((item: any, i: number) => (
                      <tr key={i}>
                        <td><span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>{item.item_code}</span></td>
                        <td style={{ fontSize: '11px' }}>{item.s_warehouse || '-'}</td>
                        <td style={{ fontSize: '11px' }}>{item.t_warehouse || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(item.qty)} {item.uom}</td>
                        <td style={{ textAlign: 'right', color: '#4B5563' }}>{formatUang(item.basic_rate)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: COLOR_PRIMARY }}>{formatUang(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '10px' }} className="mobile-btn-group">
                {entry.docstatus === 0 && <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}><Send size={16} /> Submit Transaksi</button>}
                <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. MODAL CREATE WAREHOUSE
// ==========================================
function CreateWarehouseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ warehouse_name: '', company: FIXED_COMPANY, is_group: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const warehouseName = `${form.warehouse_name} - NV`;
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Warehouse', { name: warehouseName, warehouse_name: form.warehouse_name, company: form.company, is_group: form.is_group ? 1 : 0, parent_warehouse: form.is_group ? '' : `All Warehouses - NV` });
      alert('✅ Warehouse berhasil dibuat!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(extractFrappeError(err, 'Gagal membuat Warehouse')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Warehouse</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label className="erp-label">Nama Warehouse *</label><input required type="text" className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} placeholder="cth: Gudang Utama" /></div>
          <div><label className="erp-label">Perusahaan</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
          
          <div style={{ background: form.is_group ? '#f5f3ff' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_group ? '#8b5cf6' : '#e5e7eb'}`, transition: 'all 0.2s', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_group ? '#7c3aed' : '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }} /> 
              Set as Group Warehouse
            </label>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>
              Centang jika ini adalah <b>Gudang Folder</b> (induk) yang hanya digunakan untuk mengelompokkan gudang-gudang kecil di bawahnya. Gudang Grup tidak bisa menerima stok fisik langsung.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Batal</button><button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button></div>
        </form>
      </div>
    </div>
  );
}

function EditWarehouseModal({ warehouse, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ warehouse_name: warehouse.warehouse_name || '', company: warehouse.company || FIXED_COMPANY, is_group: warehouse.is_group === 1 || warehouse.is_group === true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Warehouse', warehouse.name, { warehouse_name: form.warehouse_name, company: form.company, is_group: form.is_group ? 1 : 0 });
      alert('✅ Warehouse berhasil diupdate!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(extractFrappeError(err, 'Gagal mengupdate Warehouse')); } finally { setIsSubmitting(false); }
  };
  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus warehouse ini?')) return;
    setIsSubmitting(true);
    try {
      const { apiDelete } = await import('@/lib/api');
      await apiDelete('Warehouse', warehouse.name);
      alert('✅ Warehouse berhasil dihapus!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert(extractFrappeError(err, 'Gagal menghapus Warehouse')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Warehouse</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label className="erp-label">Nama Warehouse *</label><input required type="text" className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} /></div>
          <div><label className="erp-label">Perusahaan</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
          
          <div style={{ background: form.is_group ? '#f5f3ff' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${form.is_group ? '#8b5cf6' : '#e5e7eb'}`, transition: 'all 0.2s', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: form.is_group ? '#7c3aed' : '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }} /> 
              Set as Group Warehouse
            </label>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>
              Centang jika ini adalah <b>Gudang Folder</b> (induk) yang hanya digunakan untuk mengelompokkan gudang-gudang kecil di bawahnya. Gudang Grup tidak bisa menerima stok fisik langsung.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={handleDelete} className="btn btn-secondary mobile-btn" style={{ color: '#dc2626' }}><Trash2 size={15} /> Hapus</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 4. MODAL CREATE DELIVERY NOTE (VALIDASI STOK REALISTIS)
// ==========================================
function CreateDeliveryNoteModal({ onClose, customers, items, warehouses, orders, bins, onSuccess, onLink }: any) {
  const [form, setForm] = useState({ 
    customer: '', company: FIXED_COMPANY, 
    posting_date: new Date().toISOString().split('T')[0], 
    posting_time: new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
    set_posting_time: true,
    is_return: false,
    item_code: '', qty: '', rate: '', amount: 0,
    warehouse: '', linked_so: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group), [warehouses]);

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
          amount: firstItem.amount || 0, warehouse: firstItem.warehouse || 'Finished Goods - NV',
        }));
      }
    } catch (err) { console.error("Gagal menarik detail SO", err); }
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
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      // VALIDASI STOK (BINS PINTAR)
      if (!form.is_return) {
        const selectedBin = bins.find((b: any) => b.item_code === form.item_code && b.warehouse === form.warehouse);
        const availableQty = selectedBin ? selectedBin.actual_qty : 0;
        
        if (Number(form.qty) > availableQty) {
          throw new Error(`Stok Tidak Cukup! Sisa stok item ini di gudang ${form.warehouse} hanya ${availableQty}. Lakukan Produksi (Manufacture) atau Stock Entry terlebih dahulu.`);
        }
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
      const res = await apiCreate('Delivery Note', dnData);
      
      const newDnName = res?.data?.name || res?.name;
      if (form.linked_so && newDnName && !form.is_return) {
        onLink(newDnName, form.linked_so);
      }

      alert('✅ Surat Jalan (Delivery Note) berhasil dibuat sebagai Draft!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Surat Jalan.')); } finally { setIsSubmitting(false); }
  };

  const seriesPrefix = form.is_return ? 'MAT-DN-RET-.YYYY.-' : 'MAT-DN-.YYYY.-';

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Buat Delivery Note</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: `1px solid ${COLOR_SECONDARY}50`, marginBottom: '16px' }}>
            <label className="erp-label" style={{ color: COLOR_PRIMARY, display: 'flex', alignItems: 'center', gap: '6px' }}><LinkIcon size={14}/> Tarik Data dari Sales Order (Opsional)</label>
            <select className="erp-input" value={form.linked_so} onChange={handleSOChange} disabled={form.is_return}>
              <option value="">-- Pilih Sales Order yang Siap Dikirim --</option>
              {orders.map((o: any) => <option key={o.name} value={o.name}>{o.name} - {o.customer_name}</option>)}
            </select>
          </div>

          <div className="responsive-grid" style={{ marginBottom: '14px' }}>
            <div><label className="erp-label">Series</label><input type="text" readOnly className="erp-input disabled-input" value={seriesPrefix} /></div>
            <div><label className="erp-label">Customer *</label><select required className="erp-input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}><option value="">Pilih Customer...</option>{customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}</select></div>
          </div>
          
          <div className="responsive-grid" style={{ marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                <input type="checkbox" checked={form.set_posting_time} onChange={e => setForm(f => ({ ...f, set_posting_time: e.target.checked }))} /> Edit Posting Date and Time
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="date" required disabled={!form.set_posting_time} className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
                <input type="time" required disabled={!form.set_posting_time} step="1" className="erp-input" value={form.posting_time} onChange={e => setForm(f => ({ ...f, posting_time: e.target.value }))} style={{ background: !form.set_posting_time ? '#f3f4f6' : 'white' }} />
              </div>
            </div>
            <div>
              <label className="erp-label">Company</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} />
              
              {/* HELPER BOX UNTUK IS RETURN */}
              <div style={{ background: form.is_return ? '#fee2e2' : '#f8fafc', padding: '10px', borderRadius: '8px', border: `1px solid ${form.is_return ? '#ef4444' : '#e5e7eb'}`, transition: 'all 0.2s', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: form.is_return ? '#b91c1c' : '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_return} onChange={e => setForm(f => ({ ...f, is_return: e.target.checked, linked_so: '' }))} style={{ accentColor: '#ef4444' }} /> 
                  Tandai sebagai Barang Retur (Is Return)
                </label>
                <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px', lineHeight: 1.3 }}>
                  Gunakan ini jika pelanggan mengembalikan barang yang rusak. Alih-alih keluar, stok akan <b>masuk kembali</b> ke gudangmu.
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8f9fb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>Items</h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <Barcode size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Scan Barcode" className="erp-input" style={{ paddingLeft: '32px', background: '#f9fafb' }} readOnly />
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}><label className="erp-label" style={{ color: COLOR_PRIMARY }}>Set Source Warehouse *</label><select required className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}><option value="">Pilih Gudang...</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>

            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <table className="erp-table" style={{ width: '100%', minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Item Code</th>
                    <th style={{ width: '80px' }}>Qty</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Rate</th>
                    <th style={{ width: '140px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>1</td>
                    <td><select required className="erp-input" value={form.item_code} onChange={handleItemChange} style={{ padding: '6px', fontSize: '12px' }}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code}</option>)}</select></td>
                    <td><input type="number" step="any" required min="0.1" className="erp-input" value={form.qty} onChange={handleQtyChange} style={{ padding: '6px', fontSize: '12px', textAlign: 'center' }} placeholder="0" /></td>
                    <td><input type="number" step="any" required min="0" className="erp-input" value={form.rate} onChange={handleRateChange} style={{ padding: '6px', fontSize: '12px', textAlign: 'right' }} placeholder="0" /></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: COLOR_PRIMARY }}>{formatUang(form.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Total Quantity</p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{form.qty || 0}</p>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Grand Total (IDR)</p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(form.amount)}</p>
              </div>
            </div>
          </div>

          {error && <div className="error-box" style={{ marginTop: '16px' }}><AlertCircle size={16}/> {error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Memproses...' : 'Simpan Draft'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN PAGE CONTENT (DENGAN SMART STOCK LEDGER)
// ==========================================
function StockPageContent() {
  const { items, warehouses, bins: originalBins, stockEntries, isLoading, refetch } = useStockData();
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

  // MOCKUP LOCAL OVERRIDES
  const [localDNStatus, setLocalDNStatus] = useState<Record<string, number>>({});
  const [dnLinks, setDnLinks] = useState<Record<string, string>>({});
  const [localEntryStatus, setLocalEntryStatus] = useState<Record<string, number>>({});
  const [localStockLedger, setLocalStockLedger] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedDN = localStorage.getItem('erp_mock_dn_status');
    if (savedDN) { try { setLocalDNStatus(JSON.parse(savedDN)); } catch (e) {} }

    const savedLinks = localStorage.getItem('erp_mock_dn_links');
    if (savedLinks) { try { setDnLinks(JSON.parse(savedLinks)); } catch (e) {} }

    const entryStatus = localStorage.getItem('erp_mock_stock_entry_status');
    if (entryStatus) { try { setLocalEntryStatus(JSON.parse(entryStatus)); } catch (e) {} }

    const stockLedger = localStorage.getItem('erp_mock_stock_ledger');
    if (stockLedger) { try { setLocalStockLedger(JSON.parse(stockLedger)); } catch (e) {} }
  }, []);

  const updateDNStatus = (dnName: string, status: number) => {
    setLocalDNStatus(prev => { const next = { ...prev, [dnName]: status }; localStorage.setItem('erp_mock_dn_status', JSON.stringify(next)); return next; });
  };
  const updateEntryStatus = (entryName: string, status: number) => {
    setLocalEntryStatus(prev => { const next = { ...prev, [entryName]: status }; localStorage.setItem('erp_mock_stock_entry_status', JSON.stringify(next)); return next; });
  };
  const handleLinkDN = (dnName: string, soName: string) => {
    setDnLinks(prev => { const next = { ...prev, [dnName]: soName }; localStorage.setItem('erp_mock_dn_links', JSON.stringify(next)); return next; });
  };

  // SMART BYPASS: Menggabungkan Stok ERPNext dengan Stok Simulasi Lokal
  const simulatedBins = useMemo(() => {
    const binMap: Record<string, any> = {};
    
    originalBins.forEach(b => {
         const key = `${b.item_code}_${b.warehouse}`;
         binMap[key] = { ...b, actual_qty: Number(b.actual_qty) || 0 };
    });

    Object.entries(localStockLedger).forEach(([key, qty]) => {
         if (binMap[key]) {
              binMap[key].actual_qty += Number(qty);
         } else {
              const [item_code, warehouse] = key.split('_');
              binMap[key] = { name: `VIRTUAL-${key}`, item_code, warehouse, actual_qty: qty, projected_qty: qty, stock_value: 0 };
         }
    });

    return Object.values(binMap);
  }, [originalBins, localStockLedger]);

  // HELPER UNTUK MENDAPATKAN TOTAL STOK PER ITEM (Digunakan di Tabel Item)
  const getItemStock = (itemCode: string) => {
    return simulatedBins
      .filter((b: any) => b.item_code === itemCode)
      .reduce((sum: number, b: any) => sum + (Number(b.actual_qty) || 0), 0);
  };

  const applyToLedger = async (docType: string, docName: string, multiplier: 1 | -1) => {
    try {
       const res = await fetch(`/api/frappe/resource/${docType}/${encodeURIComponent(docName)}`);
       const data = await res.json();
       if (data.data && data.data.items) {
          const currentLedger = JSON.parse(localStorage.getItem('erp_mock_stock_ledger') || '{}');
          data.data.items.forEach((item: any) => {
              let wh = ''; let adj = 0;
              if (docType === 'Stock Entry') {
                  if (data.data.stock_entry_type === 'Material Receipt' || data.data.stock_entry_type === 'Manufacture') {
                      wh = data.data.to_warehouse; adj = item.qty * multiplier;
                  } else if (data.data.stock_entry_type === 'Material Issue') {
                      wh = data.data.from_warehouse; adj = -item.qty * multiplier;
                  } else if (data.data.stock_entry_type === 'Material Transfer') {
                      const whFrom = data.data.from_warehouse; const whTo = data.data.to_warehouse;
                      currentLedger[`${item.item_code}_${whFrom}`] = (currentLedger[`${item.item_code}_${whFrom}`] || 0) - (item.qty * multiplier);
                      currentLedger[`${item.item_code}_${whTo}`] = (currentLedger[`${item.item_code}_${whTo}`] || 0) + (item.qty * multiplier);
                      return; 
                  }
              } else if (docType === 'Delivery Note') {
                  wh = item.warehouse; adj = -item.qty * multiplier; 
              }

              if (wh) {
                  const key = `${item.item_code}_${wh}`;
                  currentLedger[key] = (currentLedger[key] || 0) + adj;
              }
          });
          localStorage.setItem('erp_mock_stock_ledger', JSON.stringify(currentLedger));
          setLocalStockLedger(currentLedger);
       }
    } catch (e) { console.error("Failed to update mock ledger", e); }
  };

  const sortByNewest = (a: any, b: any, fallbackDateField: string = 'creation') => {
    let timeA = new Date(a.creation || a.modified || a[fallbackDateField] || 0).getTime();
    let timeB = new Date(b.creation || b.modified || b[fallbackDateField] || 0).getTime();
    timeA = isNaN(timeA) ? 0 : timeA; timeB = isNaN(timeB) ? 0 : timeB;
    if (timeA !== timeB) return timeB - timeA;
    return String(b.name).localeCompare(String(a.name));
  };

  const sortedItems = useMemo(() => [...items].sort((a, b) => sortByNewest(a, b)), [items]);
  const sortedWarehouses = useMemo(() => [...warehouses].sort((a, b) => sortByNewest(a, b)), [warehouses]);
  const sortedBins = useMemo(() => [...simulatedBins].sort((a, b) => sortByNewest(a, b, 'modified')), [simulatedBins]);
  
  const sortedStockEntries = useMemo(() => {
    const raw = [...stockEntries].sort((a, b) => sortByNewest(a, b, 'posting_date'));
    return raw.map(se => ({ ...se, docstatus: localEntryStatus[se.name] !== undefined ? localEntryStatus[se.name] : se.docstatus }));
  }, [stockEntries, localEntryStatus]);
  
  const sortedDeliveryNotes = useMemo(() => {
    const rawDNs = [...deliveryNotes].sort((a, b) => sortByNewest(a, b, 'posting_date'));
    return rawDNs.map(dn => ({ ...dn, docstatus: localDNStatus[dn.name] !== undefined ? localDNStatus[dn.name] : dn.docstatus }));
  }, [deliveryNotes, localDNStatus]);

  const activeSalesOrders = useMemo(() => {
    const localSOStatus = JSON.parse(localStorage.getItem('erp_mock_selling_status') || '{}');
    return salesOrders.filter(o => {
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
  const totalStockValue = sortedBins.reduce((s: number, b: any) => s + (b.stock_value || 0), 0);

  const stockByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    sortedBins.forEach((bin: any) => {
      const item = sortedItems.find((i: any) => i.item_code === bin.item_code);
      const cat = item?.item_group || 'Other';
      map[cat] = (map[cat] || 0) + (bin.actual_qty || 0);
    });
    return Object.entries(map).map(([category, qty]) => ({ category, qty }));
  }, [sortedBins, sortedItems]);

  const handleSmartDelete = async (doctype: string, docname: string, docstatus: number) => {
    if (!confirm(`Yakin ingin menghapus ${doctype} ${docname}?`)) return;
    try {
      const { apiUpdate, apiDelete } = await import('@/lib/api');
      if (docstatus === 1) await apiUpdate(doctype, docname, { docstatus: 2 });
      
      // Kurangi stok kembali jika dokumen yg dihapus sudah tersubmit
      if (docstatus === 1) {
         if (doctype === 'Delivery Note') await applyToLedger('Delivery Note', docname, -1);
         if (doctype === 'Stock Entry') await applyToLedger('Stock Entry', docname, -1);
      }

      await apiDelete(doctype, docname);
      
      if (doctype === 'Delivery Note') {
        setLocalDNStatus(prev => { const next = { ...prev }; delete next[docname]; localStorage.setItem('erp_mock_dn_status', JSON.stringify(next)); return next; });
      } else if (doctype === 'Stock Entry') {
        setLocalEntryStatus(prev => { const next = { ...prev }; delete next[docname]; localStorage.setItem('erp_mock_stock_entry_status', JSON.stringify(next)); return next; });
      }

      alert(`✅ ${doctype} berhasil dihapus!`);
      refetch(); if (doctype === 'Delivery Note') refetchSelling();
    } catch (err: any) { alert(`❌ Gagal menghapus: ${extractFrappeError(err)}`); }
  };

  const handleSubmitDN = async (dn: any) => {
    if (!confirm('TENTANG SUBMIT:\n\nSubmit berarti dokumen akan "DIKUNCI PERMANEN" dan memotong stok di gudang.\n\nYakin ingin Submit Surat Jalan ini?')) return;
    
    updateDNStatus(dn.name, 1);
    await applyToLedger('Delivery Note', dn.name, 1); // Memotong stok lokal

    // AUTO-UPDATE % DELIVERED DI SALES ORDER TERKAIT
    const linkedSOName = dnLinks[dn.name];
    if (linkedSOName) {
      const currentProgress = JSON.parse(localStorage.getItem('erp_mock_so_progress') || '{}');
      const soProg = currentProgress[linkedSOName] || { delivered: 0, billed: 0 };
      currentProgress[linkedSOName] = { ...soProg, delivered: 100 };
      localStorage.setItem('erp_mock_so_progress', JSON.stringify(currentProgress));
    }

    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Delivery Note', dn.name, { docstatus: 1 });
      alert('✅ Surat Jalan resmi di-Submit! Stok Gudang otomatis terpotong.');
      refetchSelling(); refetch(); 
    } catch (err: any) { 
      alert(`⚠️ PEMBERITAHUAN SIMULASI:\n\nSistem menganggap Surat Jalan ✅ BERHASIL DI-SUBMIT.\nPersentase % Delivered pada SO terkait naik menjadi 100%, dan Stok Simulasi di Gudang telah terpotong!`); 
      refetchSelling(); refetch();
    }
  };

  const handleSubmitStockEntry = async (entry: any) => {
    if (!confirm('Yakin ingin Submit Stock Entry ini?\nIni akan menambah/memotong stok fisik di Gudang.')) return;
    
    updateEntryStatus(entry.name, 1);
    await applyToLedger('Stock Entry', entry.name, 1); // Menambah/memotong stok lokal sesuai tipe
    
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Stock Entry', entry.name, { docstatus: 1 });
      alert('✅ Stock Entry berhasil disubmit! Stok fisik bertambah.'); refetch();
    } catch (err: any) {
      alert(`⚠️ SIMULASI: Dokumen berhasil disubmit di UI. Stok Virtual berhasil ditambahkan di Tab Stock Level (Bin)!`); refetch();
    }
  };

  const getPageInfo = () => {
    switch(activeTab) {
      case 'items': return { title: 'Master Items', desc: 'Kelola katalog barang / produk', stats: [{ label: 'Total Items', value: items.length, sub: 'Semua item', icon: <Package size={22} />, color: COLOR_PRIMARY, bg: '#eff6ff' }] };
      case 'warehouse': return { title: 'Warehouses', desc: 'Lokasi gudang penyimpanan', stats: [{ label: 'Total Gudang', value: sortedWarehouses.length, sub: 'Semua gudang terdaftar', icon: <Warehouse size={22} />, color: '#7c3aed', bg: '#f5f3ff' }] };
      case 'bin': return { title: 'Stock Level (Bin)', desc: 'Monitoring jumlah fisik stok (Real + Virtual)', stats: [{ label: 'Low Stock', value: lowStockCount, sub: 'Perlu restock', icon: <AlertTriangle size={22} />, color: '#d97706', bg: '#fffbeb' }, { label: 'Stock Value', value: formatUang(totalStockValue), sub: 'Nilai evaluasi', icon: <TrendingUp size={22} />, color: '#059669', bg: '#ecfdf5' }] };
      case 'stockentry': return { title: 'Stock Entry', desc: 'Mutasi barang masuk/keluar', stats: [{ label: 'Total Mutasi', value: sortedStockEntries.length, sub: 'Catatan entry', icon: <ArrowRight size={22} />, color: COLOR_PRIMARY, bg: '#eff6ff' }] };
      case 'delivery': return { title: 'Delivery Note', desc: 'Surat Jalan Pengiriman ke Customer', stats: [{ label: 'Total Surat Jalan', value: sortedDeliveryNotes.length, sub: 'Catatan pengiriman', icon: <Truck size={22} />, color: COLOR_SECONDARY, bg: '#e0f2fe' }] };
      default: return { title: 'Inventory', desc: 'Modul Gudang', stats: [] };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {(isLoading || isSellingLoading) && <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat data dari ERPNext...</div>}

      {/* RENDER MODAL */}
      {showCreateModal && <CreateStockEntryModal onClose={() => setShowCreateModal(false)} warehouses={sortedWarehouses} items={sortedItems} onSuccess={() => refetch()} />}
      {showCreateItemModal && <CreateItemModal onClose={() => setShowCreateItemModal(false)} onSuccess={() => refetch()} />}
      {showCreateWarehouseModal && <CreateWarehouseModal onClose={() => setShowCreateWarehouseModal(false)} onSuccess={() => refetch()} />}
      
      {/* UPDATE CREATE DN MODAL: Pass Bins agar bisa validasi stok */}
      {showCreateDNModal && <CreateDeliveryNoteModal onClose={() => setShowCreateDNModal(false)} customers={customers} items={sortedItems} warehouses={sortedWarehouses} orders={activeSalesOrders} bins={simulatedBins} onSuccess={() => refetchSelling()} onLink={handleLinkDN} />}
      
      {selectedItem && <EditItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={() => refetch()} />}
      {selectedWarehouse && <EditWarehouseModal warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} onSuccess={() => refetch()} />}
      {selectedEntry && <DetailStockEntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} onSubmitEntry={handleSubmitStockEntry} />}

      <div className="mobile-flex-col" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{pageInfo.title}</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>{pageInfo.desc}</p>
        </div>
        <div className="mobile-full-width" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'items' && <button className="btn btn-primary btn-sm mobile-full-width" style={{ background: '#059669', borderColor: '#059669' }} onClick={() => setShowCreateItemModal(true)}><Plus size={14} /> Item Baru</button>}
          {activeTab === 'warehouse' && <button className="btn btn-primary btn-sm mobile-full-width" style={{ background: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setShowCreateWarehouseModal(true)}><Plus size={14} /> Warehouse Baru</button>}
          {activeTab === 'stockentry' && <button className="btn btn-primary btn-sm mobile-full-width" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }} onClick={() => setShowCreateModal(true)}><Plus size={14} /> Stock Entry Baru</button>}
          {activeTab === 'delivery' && <button className="btn btn-primary btn-sm mobile-full-width" style={{ background: COLOR_SECONDARY, borderColor: COLOR_SECONDARY }} onClick={() => setShowCreateDNModal(true)}><Plus size={14} /> Surat Jalan Baru</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {pageInfo.stats.map((s, idx) => (
          <div key={idx} className="stat-card card-hover" style={{ flex: 1, minWidth: '200px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: s.color, fontWeight: 600 }}>{s.sub}</p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {activeTab === 'bin' && (
        <div className="chart-container" style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>Stock Quantity per Kategori</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stockByCategory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [formatNumber(Number(v)) + ' pcs', 'Qty']} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
              <Bar dataKey="qty" radius={[4, 4, 0, 0]}>{stockByCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="chart-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#374151' }}>Daftar {pageInfo.title}</h3>
          <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder={`Cari data...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '8px 12px 8px 34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontFamily: "'Poppins', sans-serif", outline: 'none', width: '100%' }} />
          </div>
        </div>

        {/* --- TABEL ITEMS --- */}
        {activeTab === 'items' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Item Name</th>
                  <th>Status</th>
                  <th>Item Group</th>
                  <th>Default UoM</th>
                  <th style={{ textAlign: 'center' }}>Current Stock</th>
                  <th>Maintain Stock</th>
                  <th>ID</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item: any, i) => {
                  const stockTotal = getItemStock(item.item_code);
                  return (
                    <tr key={item.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{item.item_name || item.item_code}</td>
                      <td><span className={`badge ${item.disabled ? 'badge-danger' : 'badge-success'}`}>{item.disabled ? 'Disabled' : 'Active'}</span></td>
                      <td><span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>{item.item_group}</span></td>
                      <td style={{ color: '#4B5563', fontWeight: 600, fontSize: '12px' }}>{item.stock_uom}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: stockTotal > 0 ? COLOR_PRIMARY : '#ef4444' }}>
                        {stockTotal} <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 500 }}>{item.stock_uom}</span>
                      </td>
                      <td><span style={{ fontSize: '12px', fontWeight: 600, color: item.is_stock_item ? '#059669' : '#6B7280' }}>{item.is_stock_item ? 'Yes' : 'No'}</span></td>
                      <td><span style={{ color: COLOR_PRIMARY, fontWeight: 700, fontSize: '12px' }}>{item.item_code}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => setSelectedItem(item)} style={{ background: '#e0f2fe', border: `1px solid ${COLOR_SECONDARY}50`, color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Detail / Edit"><Edit size={14} /></button>
                          <button onClick={() => handleSmartDelete('Item', item.name, 0)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Tidak ada data Item.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TABEL WAREHOUSE --- */}
        {activeTab === 'warehouse' && (
          <div style={{ overflowX: 'auto' }}><table className="erp-table"><thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Warehouse ID</th><th>Warehouse Name</th><th>Company</th><th>Type</th><th>Actions</th></tr></thead><tbody>
            {filteredWarehouses.map((w: any, i) => (
              <tr key={w.name}><td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td><td><div style={{ fontWeight: 700, color: COLOR_PRIMARY, fontSize: '13px' }}>{w.name}</div></td><td><div style={{ fontSize: '13px', fontWeight: 600 }}>{w.warehouse_name}</div></td><td style={{ fontSize: '13px' }}>{w.company}</td><td><span className={`badge ${w.is_group ? 'badge-purple' : 'badge-info'}`}>{w.is_group ? 'Group' : 'Leaf'}</span></td><td>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => setSelectedWarehouse(w)} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer' }}><Edit size={16} /></button>
                </div>
              </td></tr>
            ))}
          </tbody></table></div>
        )}

        {/* --- TABEL BIN (MENAMPILKAN STOK VIRTUAL + ASLI) --- */}
        {activeTab === 'bin' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Item Code</th>
                  <th>Warehouse</th>
                  <th style={{ textAlign: 'right' }}>Actual Qty</th>
                  <th style={{ textAlign: 'right' }}>Projected Qty</th>
                  <th style={{ textAlign: 'right' }}>Stock Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBins.map((bin: any, i) => (
                  <tr key={bin.name} className="table-row-hover">
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                    <td><div style={{ color: COLOR_PRIMARY, fontWeight: 700, fontSize: '13px' }}>{bin.item_code}</div></td>
                    <td style={{ fontSize: '12px' }}>{bin.warehouse}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '14px', color: bin.name.startsWith('VIRTUAL') ? '#059669' : '#111827' }}>
                      {formatNumber(bin.actual_qty)}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{formatNumber(bin.projected_qty)}</td>
                    <td style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{formatUang(bin.stock_value)}</td>
                    <td>{bin.actual_qty < 10 ? <span className="badge badge-warning">Low Stock</span> : <span className="badge badge-success">Normal</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TABEL STOCK ENTRY (Sesuai Permintaan ERPNext) --- */}
        {activeTab === 'stockentry' && (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="erp-table" style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Stock Entry Type</th>
                  <th>Status</th>
                  <th>Purpose</th>
                  <th>Default Source Warehouse</th>
                  <th>Default Target Warehouse</th>
                  <th style={{ textAlign: 'center' }}>% Transferred</th>
                  <th style={{ textAlign: 'center' }}>Is Return</th>
                  <th>ID</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockEntries.map((se: any, i) => (
                  <tr key={se.name} className="table-row-hover">
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                    <td><div style={{ fontWeight: 700, color: '#111827', fontSize: '13px' }}>{se.stock_entry_type}</div></td>
                    <td><span className={`badge ${se.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{se.docstatus === 1 ? 'Submitted' : 'Draft'}</span></td>
                    <td style={{ fontSize: '12px', color: '#4B5563', fontWeight: 500 }}>{se.purpose || se.stock_entry_type}</td>
                    <td style={{ fontSize: '12px', color: '#dc2626' }}>{se.from_warehouse || '-'}</td>
                    <td style={{ fontSize: '12px', color: '#059669' }}>{se.to_warehouse || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#4B5563' }}>{se.docstatus === 1 ? '100%' : '0%'}</td>
                    <td style={{ textAlign: 'center', color: '#6B7280' }}>{se.is_return === 1 ? 'Yes' : 'No'}</td>
                    <td>
                      <div style={{ color: COLOR_PRIMARY, fontWeight: 700, fontSize: '12px' }}>{se.name}</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{formatDate(se.posting_date)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {se.docstatus === 0 && <button onClick={() => handleSubmitStockEntry(se)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}><Send size={12}/> Submit</button>}
                        <button onClick={() => setSelectedEntry(se)} style={{ background: '#e0f2fe', border: `1px solid ${COLOR_SECONDARY}50`, color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Detail"><Eye size={14} /></button>
                        <button onClick={() => handleSmartDelete('Stock Entry', se.name, se.docstatus)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStockEntries.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Belum ada data Stock Entry.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TABEL DELIVERY NOTE (Sesuai Permintaan ERPNext) --- */}
        {activeTab === 'delivery' && (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="erp-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Customer Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Grand Total</th>
                  <th style={{ textAlign: 'center' }}>% Amount Billed</th>
                  <th style={{ textAlign: 'center' }}>% Returned</th>
                  <th>ID</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveryNotes.map((dn: any, index) => (
                  <tr key={dn.name} className="table-row-hover">
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td><div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{dn.customer_name || dn.customer}</div></td>
                    <td><span className={`badge ${dn.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{dn.docstatus === 1 ? 'Submitted' : 'Draft'}</span></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151' }}><Calendar size={12} color="#9CA3AF" /> {formatDate(dn.posting_date)}</div></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: COLOR_PRIMARY }}>
                      {formatUang(dn.grand_total || 0)}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#4B5563' }}>{dn.docstatus === 1 ? '100%' : '0%'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#4B5563' }}>0%</td>
                    <td>
                      <div style={{ color: COLOR_SECONDARY, fontWeight: 700, fontSize: '12px' }}>{dn.name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {dn.docstatus === 0 && <button onClick={() => handleSubmitDN(dn)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}><Send size={12}/> Submit</button>}
                        <a href={`http://34.101.192.135:8080/app/delivery-note/${encodeURIComponent(dn.name)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#e0f2fe', border: `1px solid ${COLOR_SECONDARY}50`, color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }} title="Buka di ERPNext"><Eye size={14} /></a>
                        <button onClick={() => handleSmartDelete('Delivery Note', dn.name, dn.docstatus)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }} title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDeliveryNotes.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Belum ada Surat Jalan (Delivery Note).</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .erp-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
        .erp-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111827; outline: none; transition: border-color 0.2s; font-family: 'Poppins', sans-serif; }
        .erp-input:focus { border-color: ${COLOR_PRIMARY}; box-shadow: 0 0 0 2px ${COLOR_PRIMARY}15; }
        .disabled-input { background-color: #f3f4f6; cursor: not-allowed; color: #6B7280; }
        .error-box { background: #fee2e2; border-radius: 6px; padding: 10px; color: #991b1b; font-size: 12px; margin-top: 10px; display: flex; align-items: center; gap: 8px; }
        .table-row-hover:hover { background-color: #f8fafc !important; }
        
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { 
          .responsive-grid { grid-template-columns: 1fr; } 
          .mobile-btn { width: 100%; justify-content: center; margin-bottom: 8px; }
          .mobile-flex-col { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .mobile-full-width { width: 100% !important; max-width: none !important; justify-content: center !important; }
          .erp-table th, .erp-table td { padding: 10px 8px; font-size: 11px; }
        }
        
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      `}</style>
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat halaman...</div>}>
      <StockPageContent />
    </Suspense>
  );
}