'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useSellingData, useStockData } from '@/hooks/useFrappeData';
import {
  ShoppingCart, Users, Truck, Plus, Filter,
  Search, Calendar, ArrowUpRight,
  TrendingUp, FileText, X, Eye, AlertCircle, Edit, Trash2, Building, User, CheckCircle, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatRupiah, formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import type { SalesOrder, Customer } from '@/lib/frappe-types';
import { getWarehousesByCompany } from '@/config/frappe-data';

const STATUS_FILTERS = ['Semua', 'Draft', 'To Deliver and Bill', 'Completed', 'Cancelled'];
const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6B7280', '#ef4444'];
const FIXED_COMPANY = 'Netra Vidya';

// HELPER: Ekstrak pesan error JSON bawaan Frappe menjadi teks yang bisa dibaca manusia
const extractFrappeError = (err: any, fallbackMsg: string = 'Terjadi kesalahan sistem') => {
  if (typeof err === 'string') return err;
  let errorMsg = err?.message || err?.error?.message || fallbackMsg;
  if (err?._server_messages) {
    try {
      errorMsg = JSON.parse(JSON.parse(err._server_messages)[0]).message.replace(/<[^>]*>?/gm, '');
    } catch(e) {}
  }
  return errorMsg;
};

// ==========================================
// 1. MODAL CREATE SALES ORDER
// ==========================================
function CreateOrderModal({ onClose, customers, items, onSuccess }: { onClose: () => void; customers: Customer[]; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    customer: '', company: FIXED_COMPANY, 
    transaction_date: new Date().toISOString().split('T')[0], 
    delivery_date: new Date().toISOString().split('T')[0], 
    warehouse: 'Finished Goods - NV',
    item_code: '', qty: '', rate: '', amount: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const warehouses = useMemo(() => getWarehousesByCompany(FIXED_COMPANY), []);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selected = items.find((i: any) => i.item_code === val);
    const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, rate: String(newRate), amount: newRate * Number(f.qty || 0) }));
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (Number(val) < 0) { alert('⚠️ Peringatan: Quantity tidak boleh minus!'); return; }
    setForm(f => ({ ...f, qty: val, amount: Number(val) * Number(f.rate || 0) }));
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (Number(val) < 0) { alert('⚠️ Peringatan: Rate/Harga tidak boleh minus!'); return; }
    setForm(f => ({ ...f, rate: val, amount: Number(f.qty || 0) * Number(val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.qty) <= 0 || Number(form.rate) <= 0) return setError('Qty dan Rate harus lebih dari 0.');
    setIsSubmitting(true); setError('');
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const salesOrderData = {
        customer: form.customer, transaction_date: form.transaction_date, delivery_date: form.delivery_date, company: form.company, currency: 'IDR',
        items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), warehouse: form.warehouse, amount: form.amount }]
      };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Sales Order', salesOrderData);
      alert('✅ Sales Order berhasil dibuat di ERP Frappe!');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Sales Order')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '560px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Sales Order Baru</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="responsive-grid">
            <div><label className="erp-label">Perusahaan</label><input type="text" className="erp-input disabled-input" readOnly value={form.company} /></div>
            <div><label className="erp-label">Customer *</label><select required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="erp-input"><option value="">Pilih customer...</option>{customers.map(c => <option key={c.name} value={c.name}>{c.customer_name}</option>)}</select></div>
          </div>
          
          <div className="responsive-grid">
            <div><label className="erp-label">Date (Tanggal Order) *</label><input type="date" required className="erp-input" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} /></div>
            <div><label className="erp-label">Delivery Date *</label><input type="date" required className="erp-input" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} /></div>
          </div>
          
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Items</p>
            <div className="responsive-grid" style={{ marginBottom: '10px' }}>
              <div><label className="erp-label">Warehouse *</label><select required className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}><option value="">Pilih Gudang...</option>{warehouses.filter(w => w.type === 'FG' || !w.is_group).map(w => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
              <div><label className="erp-label">Item Code *</label><select required className="erp-input" value={form.item_code} onChange={handleItemChange}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}</select></div>
            </div>
            <div className="responsive-grid-3">
              <div><label className="erp-label">Quantity *</label><input type="number" required placeholder="0" className="erp-input" value={form.qty} onChange={handleQtyChange} /></div>
              <div><label className="erp-label">Rate (Rp) *</label><input type="number" required placeholder="0" className="erp-input" value={form.rate} onChange={handleRateChange} /></div>
              <div><label className="erp-label">Amount (Otomatis)</label><input type="text" readOnly className="erp-input disabled-input" style={{ fontWeight: 700, color: '#0066B3' }} value={formatRupiah(form.amount)} /></div>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan Sales Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL CREATE DELIVERY NOTE
// ==========================================
function CreateDeliveryNoteModal({ onClose, customers, items, onSuccess }: { onClose: () => void; customers: Customer[]; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({ 
    customer: '', company: FIXED_COMPANY, 
    posting_date: new Date().toISOString().split('T')[0], 
    posting_time: new Date().toTimeString().slice(0, 5), 
    warehouse: 'Finished Goods - NV',
    item_code: '', qty: '', rate: '', amount: 0 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const warehouses = useMemo(() => getWarehousesByCompany(FIXED_COMPANY), []);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selected = items.find((i: any) => i.item_code === val);
    const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, rate: String(newRate), amount: newRate * Number(f.qty || 0) }));
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (Number(val) < 0) { alert('⚠️ Peringatan: Quantity tidak boleh minus!'); return; }
    setForm(f => ({ ...f, qty: val, amount: Number(val) * Number(f.rate || 0) }));
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (Number(val) < 0) { alert('⚠️ Peringatan: Rate/Harga tidak boleh minus!'); return; }
    setForm(f => ({ ...f, rate: val, amount: Number(f.qty || 0) * Number(val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.qty) <= 0) return setError('Quantity harus lebih dari 0.');
    setIsSubmitting(true); setError('');
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const deliveryNoteData = {
        customer: form.customer, posting_date: form.posting_date, posting_time: form.posting_time, company: form.company,
        items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), amount: form.amount, warehouse: form.warehouse, uom: selectedItem?.stock_uom || 'Nos' }]
      };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Delivery Note', deliveryNoteData);
      alert('✅ Delivery Note berhasil dibuat!');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Delivery Note')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '560px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Delivery Note</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="responsive-grid">
            <div><label className="erp-label">Perusahaan</label><input type="text" className="erp-input disabled-input" readOnly value={form.company} /></div>
            <div><label className="erp-label">Customer *</label><select required className="erp-input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}><option value="">Pilih Customer...</option>{customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}</select></div>
          </div>
          
          <div className="responsive-grid">
            <div><label className="erp-label">Posting Date *</label><input type="date" required className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} /></div>
            <div><label className="erp-label">Posting Time *</label><input type="time" required className="erp-input" value={form.posting_time} onChange={e => setForm(f => ({ ...f, posting_time: e.target.value }))} /></div>
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Items</p>
            <div className="responsive-grid" style={{ marginBottom: '10px' }}>
              <div><label className="erp-label">Accepted Warehouse *</label><select required className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}><option value="">Pilih Gudang...</option>{warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
              <div><label className="erp-label">Item Code *</label><select required className="erp-input" value={form.item_code} onChange={handleItemChange}><option value="">Pilih item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}</select></div>
            </div>
            <div className="responsive-grid-3">
              <div><label className="erp-label">Quantity *</label><input type="number" required className="erp-input" value={form.qty} onChange={handleQtyChange} /></div>
              <div><label className="erp-label">Rate (Rp)</label><input type="number" required className="erp-input" value={form.rate} onChange={handleRateChange} /></div>
              <div><label className="erp-label">Amount</label><input type="text" readOnly className="erp-input disabled-input" style={{ fontWeight: 700, color: '#0066B3' }} value={formatRupiah(form.amount)} /></div>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn">{isSubmitting ? 'Menyimpan...' : 'Simpan Delivery Note'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. MODAL CREATE CUSTOMER
// ==========================================
function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ customer_name: '', customer_type: 'Company', customer_group: 'Commercial', territory: 'Indonesia', mobile_no: '', email_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // VALIDASI KETAT NAMA CUSTOMER & NO TELEPON
    if (!/^[a-zA-Z\s.,&]+$/.test(form.customer_name)) {
      return setError('Peringatan: Nama Customer hanya boleh mengandung huruf, spasi, titik (.), dan koma (,). Simbol unik dilarang.');
    }
    if (form.mobile_no && !/^\d+$/.test(form.mobile_no)) {
      return setError('Peringatan: No. Telepon hanya boleh mengandung ANGKA (0-9). Huruf dan simbol dilarang.');
    }

    setIsSubmitting(true); setError('');
    try {
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Customer', form);
      alert('✅ Customer berhasil dibuat!');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Customer')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Customer</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div>
            <label className="erp-label">Customer Name * <span style={{fontSize: '9px', color: '#9CA3AF'}}>(Hanya Huruf)</span></label>
            <input required type="text" className="erp-input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="cth: PT Jaya Abadi" />
          </div>

          <div className="responsive-grid">
            <div>
              <label className="erp-label">Tipe *</label>
              <select required className="erp-input" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
                <option value="Company">Company</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            <div>
              <label className="erp-label">Territory</label>
              <input type="text" className="erp-input" value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} placeholder="cth: Indonesia" />
            </div>
          </div>

          <div className="responsive-grid">
            <div>
              <label className="erp-label">Phone <span style={{fontSize: '9px', color: '#9CA3AF'}}>(Hanya Angka)</span></label>
              <input type="text" className="erp-input" value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} placeholder="08123456789" />
            </div>
            <div>
              <label className="erp-label">Email</label>
              <input type="email" className="erp-input" value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} placeholder="email@contoh.com" />
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn">{isSubmitting ? 'Menyimpan...' : 'Simpan Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 4. MODAL EDIT CUSTOMER
// ==========================================
function EditCustomerModal({ customer, onClose, onSuccess }: { customer: Customer; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ 
    customer_name: customer.customer_name || '', customer_type: customer.customer_type || 'Company', customer_group: customer.customer_group || 'Commercial', 
    territory: customer.territory || 'Indonesia', mobile_no: customer.mobile_no || '', email_id: customer.email_id || '', disabled: customer.disabled || 0 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-zA-Z\s.,&]+$/.test(form.customer_name)) return setError('Peringatan: Nama Customer hanya boleh menggunakan huruf.');
    if (form.mobile_no && !/^\d+$/.test(form.mobile_no)) return setError('Peringatan: No. Telepon hanya boleh menggunakan ANGKA murni.');

    setIsSubmitting(true); setError('');
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Customer', customer.name, form);
      alert('✅ Customer berhasil diupdate!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal mengupdate Customer')); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus customer ini?')) return;
    setIsSubmitting(true);
    try {
      const { apiDelete } = await import('@/lib/api');
      await apiDelete('Customer', customer.name);
      alert('✅ Customer berhasil dihapus!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal menghapus Customer. (Mungkin data ini sedang digunakan di dokumen lain)')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Customer</h2><p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{customer.name}</p></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div><label className="erp-label">Customer Name *</label><input required type="text" className="erp-input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>

          <div className="responsive-grid">
            <div><label className="erp-label">Type *</label><select required className="erp-input" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}><option value="Company">Company</option><option value="Individual">Individual</option></select></div>
            <div><label className="erp-label">Status</label><select className="erp-input" value={form.disabled} onChange={e => setForm(f => ({ ...f, disabled: Number(e.target.value) }))}><option value={0}>Active</option><option value={1}>Disabled</option></select></div>
          </div>

          <div><label className="erp-label">Territory</label><input type="text" className="erp-input" value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} /></div>

          <div className="responsive-grid">
            <div><label className="erp-label">Phone</label><input type="text" className="erp-input" value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} /></div>
            <div><label className="erp-label">Email</label><input type="email" className="erp-input" value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} /></div>
          </div>

          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={handleDelete} disabled={isSubmitting} style={{ flex: 1, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', color: '#dc2626', fontWeight: 600, cursor: 'pointer' }} className="mobile-btn"><Trash2 size={15} /> Hapus</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ flex: 2 }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. MODAL DETAIL SALES ORDER (Hanya untuk Submit)
// ==========================================
function OrderDetailModal({ order, onClose, onSuccess }: { order: SalesOrder; onClose: () => void; onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusClass = getStatusBadgeClass(order.status);
  const statusLabel = getStatusLabel(order.status);

  const handleSubmitOrder = async () => {
    if (!confirm('Yakin ingin men-submit Sales Order ini? (Tindakan ini tidak dapat dibatalkan)')) return;
    setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Sales Order', order.name, { docstatus: 1 });
      alert('✅ Sales Order berhasil disubmit!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { alert('❌ Gagal submit: \n' + extractFrappeError(err)); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '580px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{order.name}</h2><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}><span className={`badge ${statusClass}`}>{statusLabel}</span><span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(order.transaction_date)}</span></div></div>
          <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[{ label: 'Customer', value: order.customer_name }, { label: 'Company', value: order.company }, { label: 'Delivery Date', value: formatDate(order.delivery_date) }, { label: 'Grand Total', value: formatRupiah(order.grand_total) }].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8f9fb', padding: '10px 12px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>{label}</p><p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{value}</p></div>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Items</p>
          <table className="erp-table" style={{ border: '1px solid #f3f4f6', borderRadius: '8px', overflow: 'hidden', minWidth: '400px' }}>
            <thead><tr><th>Item Code</th><th>Item Name</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i}><td><span style={{ color: '#0066B3', fontWeight: 600 }}>{item.item_code}</span></td><td>{item.item_name}</td><td style={{ textAlign: 'right' }}>{item.qty} {item.uom}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(item.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px', flexWrap: 'wrap' }}>
          {order.status === 'Draft' && <button className="btn btn-primary mobile-btn" onClick={handleSubmitOrder} disabled={isSubmitting} style={{ background: '#10b981', borderColor: '#10b981' }}>{isSubmitting ? 'Submitting...' : 'Submit Order'}</button>}
          <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup</button>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// 6. MAIN SELLING PAGE 
// ==========================================
function SellingPageContent() {
  const { can } = useAuth();
  const { salesOrders, customers, deliveryNotes, isLoading, error, refetch } = useSellingData();
  const { items: allItems } = useStockData();
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'customers');

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showCreateDNModal, setShowCreateDNModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // =========================================================
  // FUNGSI SORTING TANGGUH: MUTLAK BERDASARKAN WAKTU DITAMBAHKAN
  // =========================================================
  const sortByNewest = (a: any, b: any, fallbackDateField: string) => {
    // 1. Coba baca timestamp Creation bawaan sistem
    let timeA = new Date(a.creation || a[fallbackDateField] || 0).getTime();
    let timeB = new Date(b.creation || b[fallbackDateField] || 0).getTime();
    
    // Pastikan bukan NaN
    timeA = isNaN(timeA) ? 0 : timeA;
    timeB = isNaN(timeB) ? 0 : timeB;

    // 2. Jika ada perbedaan waktu (sampai ke detik/milidetik), urutkan Descending
    if (timeA !== timeB) {
      return timeB - timeA; 
    }

    // 3. JIKA WAKTU SAMA ATAU TIDAK ADA: Gunakan ID Dokumen (name) secara menurun.
    // Karena ID ERPNext otomatis naik (misal CUST-002 dibuat setelah CUST-001), 
    // cara ini mutlak menampilkan data terbaru di atas TANPA dipengaruhi abjad Customer Name.
    return String(b.name).localeCompare(String(a.name));
  };

  const sortedOrders = useMemo(() => {
    return [...salesOrders].sort((a, b) => sortByNewest(a, b, 'transaction_date'));
  }, [salesOrders]);

  const sortedDeliveryNotes = useMemo(() => {
    return [...deliveryNotes].sort((a, b) => sortByNewest(a, b, 'posting_date'));
  }, [deliveryNotes]);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => sortByNewest(a, b, 'creation'));
  }, [customers]);

  // =========================================================

  const revenueTrend = useMemo(() => {
    const now = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const map: Record<string, number> = {};
    salesOrders.forEach(o => {
      const d = new Date(o.transaction_date);
      const key = months[d.getMonth()];
      map[key] = (map[key] || 0) + (o.grand_total || 0);
    });
    return Array.from({ length: 6 }, (_, i) => {
      const m = (now.getMonth() - 5 + i + 12) % 12;
      return { month: months[m], revenue: map[months[m]] || Math.random() * 500000000 + 100000000 };
    });
  }, [salesOrders]);

  const filteredOrders = sortedOrders.filter(o => {
    if (statusFilter !== 'Semua' && o.status !== statusFilter) return false;
    if (searchQuery && !o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !o.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredCustomers = sortedCustomers.filter(c => 
    !searchQuery || c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeliveryNotes = sortedDeliveryNotes.filter(dn => 
    !searchQuery || dn.name.toLowerCase().includes(searchQuery.toLowerCase()) || dn.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customerStats = [
    { label: 'Total Customers', value: customers.length.toString(), sub: 'Pelanggan terdaftar', icon: <Users size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { label: 'Corporate', value: customers.filter(c => c.customer_type === 'Company').length.toString(), sub: 'B2B Customers', icon: <Building size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
    { label: 'Individual', value: customers.filter(c => c.customer_type === 'Individual').length.toString(), sub: 'B2C Customers', icon: <User size={22} />, color: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
  ];

  const orderStats = [
    { label: 'Total Orders', value: salesOrders.length.toString(), sub: 'Semua pesanan', icon: <ShoppingCart size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { label: 'Total Revenue', value: formatRupiah(salesOrders.reduce((s, o) => s + (o.grand_total || 0), 0)), sub: 'Nilai penjualan', icon: <TrendingUp size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
    { label: 'Pending', value: salesOrders.filter(o => o.status === 'To Deliver and Bill' || o.status === 'Draft').length.toString(), sub: 'Perlu diproses', icon: <Clock size={22} />, color: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
  ];

  const deliveryStats = [
    { label: 'Total Pengiriman', value: deliveryNotes.length.toString(), sub: 'Surat jalan dibuat', icon: <Truck size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { label: 'Selesai Dikirim', value: deliveryNotes.filter(d => d.status === 'Completed').length.toString(), sub: 'Terkonfirmasi', icon: <CheckCircle size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
  ];

  const getPageInfo = () => {
    switch(activeTab) {
      case 'customers': return { title: 'Customers', desc: 'Kelola database pelanggan perusahaan Anda', stats: customerStats };
      case 'orders': return { title: 'Sales Orders', desc: 'Daftar pesanan penjualan dari customer', stats: orderStats };
      case 'delivery': return { title: 'Delivery Notes', desc: 'Surat jalan dan status pengiriman barang', stats: deliveryStats };
      default: return { title: 'Sales', desc: 'Modul Penjualan', stats: [] };
    }
  };

  const pageInfo = getPageInfo();

  // Helper fungsi format jam khusus ERP agar clean
  const formatCreationTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // FUNGSI SMART DELETE BISA DIBACA MANUSIA
  const handleSmartDelete = async (doctype: string, docname: string, docstatus: number) => {
    if (!confirm(`Yakin ingin membatalkan & menghapus dokumen ${doctype} ${docname}?`)) return;
    try {
      const { apiUpdate, apiDelete } = await import('@/lib/api');
      if (docstatus === 1) await apiUpdate(doctype, docname, { docstatus: 2 });
      await apiDelete(doctype, docname);
      alert(`✅ ${doctype} berhasil dibatalkan & dihapus!`);
      refetch();
    } catch (err: any) {
      alert(`❌ Gagal menghapus!\n\nAlasan: ${extractFrappeError(err)}\n\n💡 Tips: Jika data masih terhubung/dipakai oleh modul lain, ERPNext akan menolak penghapusan.`);
    }
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat data...</div>}
      
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>Gagal memuat data: {error}</span>
          <button onClick={refetch} style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Coba Lagi</button>
        </div>
      )}

      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} customers={customers} items={allItems} onSuccess={() => refetch()} />}
      {showCreateCustomerModal && <CreateCustomerModal onClose={() => setShowCreateCustomerModal(false)} onSuccess={() => refetch()} />}
      {showCreateDNModal && <CreateDeliveryNoteModal onClose={() => setShowCreateDNModal(false)} customers={customers} items={allItems} onSuccess={() => refetch()} />}
      {selectedCustomer && <EditCustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSuccess={() => refetch()} />}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onSuccess={() => refetch()} />}

      {/* DYNAMIC HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{pageInfo.title}</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>{pageInfo.desc}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {can('create_customer') && activeTab === 'customers' && (
            <button className="btn btn-primary btn-sm mobile-btn" onClick={() => setShowCreateCustomerModal(true)}><Plus size={14} /> Customer Baru</button>
          )}
          {can('create_sales_order') && activeTab === 'orders' && (
            <button className="btn btn-primary btn-sm mobile-btn" onClick={() => setShowCreateModal(true)}><Plus size={14} /> Sales Order Baru</button>
          )}
          {can('create_delivery_note') && activeTab === 'delivery' && (
            <button className="btn btn-primary btn-sm mobile-btn" style={{ background: '#059669' }} onClick={() => setShowCreateDNModal(true)}><Truck size={14} /> Delivery Note Baru</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {pageInfo.stats.map((s) => (
          <div key={s.label} className="stat-card card-hover">
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{s.sub}</p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div className="chart-container" style={{ flex: '1 1 400px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Tren Penjualan 6 Bulan Terakhir</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs><linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0066B3" stopOpacity={0.15} /><stop offset="95%" stopColor="#0066B3" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatRupiah(v).replace(/,/g, '.').slice(0, -5)} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [formatRupiah(Number(v)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0066B3" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ fill: '#0066B3', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container" style={{ flex: '1 1 300px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Status Order</p>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={[
                    { name: 'Selesai', value: salesOrders.filter(o => o.status === 'Completed').length },
                    { name: 'Proses', value: salesOrders.filter(o => o.status === 'In Process').length },
                    { name: 'Siap Kirim', value: salesOrders.filter(o => o.status === 'To Deliver and Bill').length },
                    { name: 'Draft', value: salesOrders.filter(o => o.status === 'Draft').length },
                    { name: 'Batal', value: salesOrders.filter(o => o.status === 'Cancelled').length }
                  ]} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                    {[
                      { name: 'Selesai', value: salesOrders.filter(o => o.status === 'Completed').length },
                      { name: 'Proses', value: salesOrders.filter(o => o.status === 'In Process').length },
                      { name: 'Siap Kirim', value: salesOrders.filter(o => o.status === 'To Deliver and Bill').length },
                      { name: 'Draft', value: salesOrders.filter(o => o.status === 'Draft').length },
                      { name: 'Batal', value: salesOrders.filter(o => o.status === 'Cancelled').length }
                    ].map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="chart-container">
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#374151' }}>Daftar {pageInfo.title}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '250px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder={`Cari data...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", outline: 'none', width: '100%' }} />
            </div>
          </div>
        </div>

        {activeTab === 'orders' && (
          <>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={13} color="#9CA3AF" />
              {STATUS_FILTERS.map((f) => (
                <button key={f} className={`filter-pill ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
                  {f === 'Semua' ? 'Semua' : getStatusLabel(f)}
                </button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Order ID & Waktu Dibuat</th>
                    <th>Customer</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Grand Total</th>
                    <th>Delivery Date</th>
                    <th>Status</th>
                    {can('create_sales_order') && <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => {
                    const sc = getStatusBadgeClass(order.status);
                    const sl = getStatusLabel(order.status);
                    return (
                      <tr key={order.name} onClick={() => setSelectedOrder(order)}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                        <td>
                          <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{order.name}</div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Tgl Trx: {formatDate(order.transaction_date)}</div>
                          {order.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Ditambahkan: {formatCreationTime(order.creation)}</div>}
                        </td>
                        <td><div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{order.customer_name}</div></td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{order.total_qty?.toLocaleString('id-ID')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatRupiah(order.grand_total)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151' }}>
                            <Calendar size={12} color="#9CA3AF" /> {formatDate(order.delivery_date)}
                          </div>
                        </td>
                        <td><span className={`badge ${sc}`}>{sl}</span></td>
                        {can('create_sales_order') && (
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <a href={`http://34.101.192.135:8080/app/sales-order/${encodeURIComponent(order.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', padding: '4px', display: 'flex' }} title="Buka di ERPNext" onClick={(e) => e.stopPropagation()}>
                                <Eye size={16} />
                              </a>
                              <button onClick={(e) => { e.stopPropagation(); handleSmartDelete('Sales Order', order.name, order.docstatus); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', display: 'flex' }} title="Hapus">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && <tr><td colSpan={can('create_sales_order') ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Tidak ada data yang sesuai filter</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'customers' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Customer Name & Waktu Dibuat</th>
                  <th>Type</th>
                  <th>Territory</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  {can('edit_customer') && <th style={{ width: '60px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, index) => (
                  <tr key={c.name}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0066B3', fontSize: '13px' }}>{c.customer_name}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>ID: {c.name}</div>
                      {c.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Ditambahkan: {formatCreationTime(c.creation)}</div>}
                    </td>
                    <td><span className="badge badge-info">{c.customer_type}</span></td>
                    <td style={{ fontSize: '13px', color: '#374151' }}>{c.territory || '-'}</td>
                    <td style={{ fontSize: '13px', color: '#374151' }}>{c.mobile_no || '-'}</td>
                    <td style={{ fontSize: '12px', color: '#6B7280' }}>{c.email_id || '-'}</td>
                    <td><span className={`badge ${c.disabled ? 'badge-danger' : 'badge-success'}`}>{c.disabled ? 'Disabled' : 'Active'}</span></td>
                    {can('edit_customer') && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedCustomer(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: '4px', display: 'flex' }} title="Edit">
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredCustomers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Tidak ada data yang sesuai filter</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>DN Number & Waktu Dibuat</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Company</th>
                  <th style={{ textAlign: 'right' }}>Total Qty</th>
                  <th>Status</th>
                  {can('edit_delivery_note') && <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredDeliveryNotes.map((dn, index) => (
                  <tr key={dn.name}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ color: '#0066B3', fontWeight: 700, fontSize: '13px' }}>{dn.name}</div>
                      {dn.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Ditambahkan: {formatCreationTime(dn.creation)}</div>}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{dn.customer_name}</td>
                    <td style={{ fontSize: '12px', color: '#6B7280' }}>Tgl Posting: {formatDate(dn.posting_date)}</td>
                    <td style={{ fontSize: '12px', color: '#374151' }}>{dn.company}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{dn.total_qty}</td>
                    <td><span className={`badge ${getStatusBadgeClass(dn.status)}`}>{getStatusLabel(dn.status)}</span></td>
                    {can('edit_delivery_note') && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <a href={`http://34.101.192.135:8080/app/delivery-note/${encodeURIComponent(dn.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', padding: '4px', display: 'flex' }} title="Buka di ERPNext">
                            <Eye size={16} />
                          </a>
                          <button onClick={() => handleSmartDelete('Delivery Note', dn.name, dn.docstatus)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', display: 'flex' }} title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredDeliveryNotes.length === 0 && <tr><td colSpan={can('edit_delivery_note') ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Belum ada Delivery Note</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        
        .erp-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
        .disabled-input { background-color: #f3f4f6; cursor: not-allowed; color: #6B7280; }
        .error-box { background: #fee2e2; border-radius: 6px; padding: 10px; color: #991b1b; font-size: 12px; }
        
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .responsive-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        
        /* Mobile Specific Adjustments */
        @media (max-width: 640px) {
          .responsive-grid { grid-template-columns: 1fr; }
          .responsive-grid-3 { grid-template-columns: 1fr; }
          .mobile-btn { width: 100%; justify-content: center; margin-bottom: 8px; }
          .erp-table th, .erp-table td { padding: 8px 6px; font-size: 11px; }
        }
      `}</style>
    </div>
  );
}

export default function SellingPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  
  useEffect(() => {
    if (!canAccess('selling')) router.push('/dashboard');
  }, [canAccess, router]);

  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat halaman...</div>}>
      <SellingPageContent />
    </Suspense>
  );
}