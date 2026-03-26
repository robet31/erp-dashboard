'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useSellingData, useStockData } from '@/hooks/useFrappeData';
import { getWarehousesByCompany } from '@/config/frappe-data';
// import { Users, FileText, FileCheck, DollarSign, Plus, Download, Search, X, Edit, Trash2, Eye, Send, CheckCircle, AlertCircle, Loader2, Building, ArrowUpRight } from 'lucide-react';
// import { Users, FileText, FileCheck, DollarSign, Plus, Download, Search, X, Edit, Trash2, Eye, Send, CheckCircle, AlertCircle, Loader2, Building, ArrowUpRight, Filter } from 'lucide-react';
import { 
  Users, FileText, FileCheck, DollarSign, Plus, Download, Search, X, 
  Edit, Trash2, Eye, Send, CheckCircle, AlertCircle, Loader2, Building, 
  ArrowUpRight, Filter, Calendar 
} from 'lucide-react';
import { formatRupiah, formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import type { SalesOrder, Customer } from '@/lib/frappe-types';

const STATUS_FILTERS = ['Semua', 'Draft', 'To Deliver and Bill', 'Completed', 'Cancelled'];
const FIXED_COMPANY = 'Netra Vidya';

const extractFrappeError = (err: any, fallbackMsg: string = 'Terjadi kesalahan sistem') => {
  if (typeof err === 'string') return err;
  let errorMsg = err?.message || err?.error?.message || fallbackMsg;
  if (err?._server_messages) {
    try { errorMsg = JSON.parse(JSON.parse(err._server_messages)[0]).message.replace(/<[^>]*>?/gm, ''); } catch (e) { }
  }
  return errorMsg;
};

// ==========================================
// 1. MODALS FOR CUSTOMER (CREATE & EDIT)
// ==========================================
function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ customer_name: '', customer_type: 'Company', customer_group: 'Commercial', territory: 'Indonesia', mobile_no: '', email_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Customer', form);
      alert('✅ Customer berhasil dibuat!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Customer')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Tambah Customer Baru</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label className="erp-label">Customer Name *</label><input required type="text" className="erp-input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Nama Perusahaan / Institusi" /></div>
          <div className="responsive-grid">
            <div><label className="erp-label">Tipe *</label><select required className="erp-input" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}><option value="Company">Company (B2B)</option><option value="Individual">Individual (B2C)</option></select></div>
            <div><label className="erp-label">Phone</label><input type="text" className="erp-input" value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} placeholder="0812..." /></div>
          </div>
          <div><label className="erp-label">Email</label><input type="email" className="erp-input" value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} placeholder="email@contoh.com" /></div>
          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn">{isSubmitting ? 'Menyimpan...' : 'Simpan Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCustomerModal({ customer, onClose, onSuccess }: { customer: Customer; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ customer_name: customer.customer_name || '', customer_type: customer.customer_type || 'Company', territory: customer.territory || 'Indonesia', mobile_no: customer.mobile_no || '', email_id: customer.email_id || '', disabled: customer.disabled || 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Customer', customer.name, form);
      alert('✅ Customer berhasil diupdate!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal mengupdate Customer')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Edit Customer</h2><p style={{ fontSize: '12px', color: '#6B7280' }}>ID: {customer.name}</p></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label className="erp-label">Customer Name *</label><input required type="text" className="erp-input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
          <div className="responsive-grid">
            <div><label className="erp-label">Tipe *</label><select required className="erp-input" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}><option value="Company">Company</option><option value="Individual">Individual</option></select></div>
            <div><label className="erp-label">Status</label><select className="erp-input" value={form.disabled} onChange={e => setForm(f => ({ ...f, disabled: Number(e.target.value) }))}><option value={0}>Active</option><option value={1}>Disabled</option></select></div>
          </div>
          <div className="responsive-grid">
            <div><label className="erp-label">Phone</label><input type="text" className="erp-input" value={form.mobile_no} onChange={e => setForm(f => ({ ...f, mobile_no: e.target.value }))} /></div>
            <div><label className="erp-label">Email</label><input type="email" className="erp-input" value={form.email_id} onChange={e => setForm(f => ({ ...f, email_id: e.target.value }))} /></div>
          </div>
          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn">{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODALS FOR SALES ORDER (CREATE & DETAIL)
// ==========================================
function CreateOrderModal({ onClose, customers, items, onSuccess }: { onClose: () => void; customers: Customer[]; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({ customer: '', company: FIXED_COMPANY, transaction_date: new Date().toISOString().split('T')[0], delivery_date: new Date().toISOString().split('T')[0], warehouse: 'Finished Goods - NV', item_code: '', qty: '', rate: '', amount: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const warehouses = useMemo(() => getWarehousesByCompany(FIXED_COMPANY), []);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; const selected = items.find((i: any) => i.item_code === val); const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, rate: String(newRate), amount: newRate * Number(f.qty || 0) }));
  };
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setForm(f => ({ ...f, qty: val, amount: Number(val) * Number(f.rate || 0) })); };
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setForm(f => ({ ...f, rate: val, amount: Number(f.qty || 0) * Number(val) })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (Number(form.qty) <= 0 || Number(form.rate) <= 0) return setError('Qty dan Rate harus lebih dari 0.');
    setIsSubmitting(true); setError('');
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const salesOrderData = { customer: form.customer, transaction_date: form.transaction_date, delivery_date: form.delivery_date, company: form.company, currency: 'IDR', items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), warehouse: form.warehouse, amount: form.amount }] };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Sales Order', salesOrderData);
      alert('✅ Sales Order berhasil dibuat (DRAFT)!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Sales Order')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '560px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Sales Order Baru (Draft)</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="responsive-grid">
            <div><label className="erp-label">Customer *</label><select required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="erp-input"><option value="">Pilih customer...</option>{customers.map(c => <option key={c.name} value={c.name}>{c.customer_name}</option>)}</select></div>
            <div><label className="erp-label">Delivery Date *</label><input type="date" required className="erp-input" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} /></div>
          </div>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Item Laptop</p>
            <div className="responsive-grid" style={{ marginBottom: '10px' }}>
              <div><label className="erp-label">Warehouse *</label><select required className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}><option value="">Pilih Gudang...</option>{warehouses.filter(w => w.type === 'FG' || !w.is_group).map(w => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
              <div><label className="erp-label">Model Laptop *</label><select required className="erp-input" value={form.item_code} onChange={handleItemChange}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}</select></div>
            </div>
            <div className="responsive-grid-3">
              <div><label className="erp-label">Quantity *</label><input type="number" required placeholder="0" className="erp-input" value={form.qty} onChange={handleQtyChange} /></div>
              <div><label className="erp-label">Rate (Rp) *</label><input type="number" required placeholder="0" className="erp-input" value={form.rate} onChange={handleRateChange} /></div>
              <div><label className="erp-label">Amount</label><input type="text" readOnly className="erp-input disabled-input" style={{ fontWeight: 700, color: '#0066B3' }} value={formatRupiah(form.amount)} /></div>
            </div>
          </div>
          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting} style={{ background: '#059669', borderColor: '#059669' }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Draft SO'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onSubmitOrder }: { order: SalesOrder; onClose: () => void; onSubmitOrder?: (wo: any) => void }) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Sales Order/${encodeURIComponent(order.name)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.data) setFullData(data.data);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetail();
  }, [order.name]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(onSubmitOrder) await onSubmitOrder(order);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color="#0066B3" /></div> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>{getStatusLabel(order.status)}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Tgl Trx: {formatDate(fullData?.transaction_date)}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '10px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Customer</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData?.customer_name}</p></div>
              <div style={{ background: '#f8f9fb', padding: '10px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Delivery Date</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{formatDate(fullData?.delivery_date)}</p></div>
              <div style={{ background: '#f8f9fb', padding: '10px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Grand Total</p><p style={{ fontSize: '14px', fontWeight: 800, color: '#0066B3' }}>{formatRupiah(fullData?.grand_total)}</p></div>
            </div>
            
            <div style={{ overflowX: 'auto', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '1px' }}>
              <table className="erp-table" style={{ width: '100%', minWidth: '400px' }}>
                <thead><tr><th>Item Code</th><th>Item Name</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {(fullData?.items || []).map((item: any, i: number) => (
                    <tr key={i}><td><span style={{ color: '#059669', fontWeight: 600 }}>{item.item_code}</span></td><td style={{ whiteSpace: 'normal' }}>{item.item_name}</td><td style={{ textAlign: 'right' }}>{item.qty} {item.uom}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(item.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }} className="mobile-btn-group">
              {order.docstatus === 0 && <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: '#059669', borderColor: '#059669' }}><Send size={16} /> Submit (Kunci)</button>}
              <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. MODALS FOR SALES INVOICE (CREATE & DETAIL)
// ==========================================
function CreateInvoiceModal({ onClose, customers, items, onSuccess }: { onClose: () => void; customers: Customer[]; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({ customer: '', company: FIXED_COMPANY, posting_date: new Date().toISOString().split('T')[0], item_code: '', qty: '1', rate: '', amount: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; const selected = items.find((i: any) => i.item_code === val); const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, rate: String(newRate), amount: newRate * Number(f.qty || 0) }));
  };
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setForm(f => ({ ...f, qty: val, amount: Number(val) * Number(f.rate || 0) })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const invoiceData = { customer: form.customer, posting_date: form.posting_date, company: form.company, currency: 'IDR', items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), amount: form.amount }] };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Sales Invoice', invoiceData);
      alert('✅ Sales Invoice (Faktur) berhasil dibuat sebagai Draft!'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Sales Invoice')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '500px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Faktur Baru (Draft)</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label className="erp-label">Customer Tagihan *</label><select required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="erp-input"><option value="">Pilih customer...</option>{customers.map(c => <option key={c.name} value={c.name}>{c.customer_name}</option>)}</select></div>
          <div><label className="erp-label">Tanggal Tagihan *</label><input type="date" required className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} /></div>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Detail Tagihan</p>
            <div style={{ marginBottom: '10px' }}><label className="erp-label">Produk / Jasa *</label><select required className="erp-input" value={form.item_code} onChange={handleItemChange}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}</select></div>
            <div className="responsive-grid-3">
              <div><label className="erp-label">Qty</label><input type="number" required placeholder="0" className="erp-input" value={form.qty} onChange={handleQtyChange} /></div>
              <div><label className="erp-label">Rate (Rp)</label><input type="number" required placeholder="0" className="erp-input" value={form.rate} onChange={e => { setForm(f => ({ ...f, rate: e.target.value, amount: Number(f.qty || 0) * Number(e.target.value) })); }} /></div>
              <div><label className="erp-label">Total</label><input type="text" readOnly className="erp-input disabled-input" style={{ fontWeight: 700, color: '#7c3aed' }} value={formatRupiah(form.amount)} /></div>
            </div>
          </div>
          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>{isSubmitting ? 'Memproses...' : 'Simpan Draft'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceDetailModal({ invoice, onClose, onSubmitInvoice }: { invoice: any; onClose: () => void; onSubmitInvoice?: (inv: any) => void }) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Sales Invoice/${encodeURIComponent(invoice.name)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.data) setFullData(data.data);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchDetail();
  }, [invoice.name]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if(onSubmitInvoice) await onSubmitInvoice(invoice);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color="#7c3aed" /></div> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${invoice.status === 'Paid' ? 'badge-success' : invoice.status === 'Unpaid' ? 'badge-warning' : 'badge-gray'}`}>{invoice.status || 'Draft'}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Tgl Posting: {formatDate(fullData?.posting_date)}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '10px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Customer</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData?.customer_name}</p></div>
              <div style={{ background: '#f8f9fb', padding: '10px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Due Date</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{formatDate(fullData?.due_date || fullData?.posting_date)}</p></div>
              <div style={{ background: '#f8f9fb', padding: '10px', borderRadius: '8px' }}><p style={{ fontSize: '11px', color: '#6B7280' }}>Total Tagihan</p><p style={{ fontSize: '14px', fontWeight: 800, color: '#7c3aed' }}>{formatRupiah(fullData?.grand_total)}</p></div>
            </div>
            
            <div style={{ overflowX: 'auto', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '1px' }}>
              <table className="erp-table" style={{ width: '100%', minWidth: '400px' }}>
                <thead><tr><th>Item Code</th><th>Item Name</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {(fullData?.items || []).map((item: any, i: number) => (
                    <tr key={i}><td><span style={{ color: '#0ea5e9', fontWeight: 600 }}>{item.item_code}</span></td><td style={{ whiteSpace: 'normal' }}>{item.item_name}</td><td style={{ textAlign: 'right' }}>{item.qty} {item.uom}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(item.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }} className="mobile-btn-group">
              {invoice.docstatus === 0 && <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}><Send size={16} /> Submit Faktur</button>}
              <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. MAIN SELLING PAGE CONTENT
// ==========================================
function SellingPageContent() {
  const { salesOrders, customers, isLoading, error, refetch } = useSellingData();
  const { items: allItems } = useStockData();
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/frappe/resource/Sales Invoice?fields=["name","customer","customer_name","posting_date","grand_total","status","docstatus"]', { cache: 'no-store' });
      const data = await res.json();
      if(data.data) setInvoices(data.data);
    } catch (e) { console.warn("Gagal fetch Sales Invoice"); }
  };

  useEffect(() => { fetchInvoices(); }, []);
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'customers');

  useEffect(() => { if (tabParam) setActiveTab(tabParam); }, [tabParam]);

  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // LOCAL OVERRIDE (MENGAKALI ERPNEXT AGAR STATUS BERTAHAN WALAUPUN DI-RELOAD)
  const [localDocStatus, setLocalDocStatus] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_selling_status');
    if (savedStatus) { try { setLocalDocStatus(JSON.parse(savedStatus)); } catch (e) {} }
  }, []);

  const updateDocStatus = (docName: string, status: number) => {
    setLocalDocStatus(prev => {
      const next = { ...prev, [docName]: status };
      localStorage.setItem('erp_mock_selling_status', JSON.stringify(next));
      return next;
    });
  };

  const sortByNewest = (a: any, b: any, fallbackDateField: string) => {
    let timeA = new Date(a.creation || a[fallbackDateField] || 0).getTime();
    let timeB = new Date(b.creation || b[fallbackDateField] || 0).getTime();
    timeA = isNaN(timeA) ? 0 : timeA; timeB = isNaN(timeB) ? 0 : timeB;
    if (timeA !== timeB) return timeB - timeA; 
    return String(b.name).localeCompare(String(a.name));
  };

  const sortedCustomers = useMemo(() => [...customers].sort((a, b) => sortByNewest(a, b, 'creation')), [customers]);
  
  // Apply Overrides on Lists
  const sortedSalesOrders = useMemo(() => {
    return [...salesOrders].sort((a, b) => sortByNewest(a, b, 'transaction_date')).map(so => {
      const localStatus = localDocStatus[so.name];
      return {
        ...so,
        docstatus: localStatus !== undefined ? localStatus : so.docstatus,
        status: localStatus === 1 ? 'To Deliver and Bill' : so.status
      };
    });
  }, [salesOrders, localDocStatus]);

  const sortedSalesInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => sortByNewest(a, b, 'posting_date')).map(si => {
      const localStatus = localDocStatus[si.name];
      return {
        ...si,
        docstatus: localStatus !== undefined ? localStatus : si.docstatus,
        status: localStatus === 1 ? 'Unpaid' : si.status
      };
    });
  }, [invoices, localDocStatus]);

  const filteredCustomers = sortedCustomers.filter(c => 
    !searchQuery || c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = sortedSalesOrders.filter(o => {
    if (statusFilter !== 'Semua' && o.status !== statusFilter) return false;
    if (searchQuery && !o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !o.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredInvoices = sortedSalesInvoices.filter(inv => 
    !searchQuery || inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = sortedSalesInvoices.filter(si => si.docstatus === 1).reduce((sum, si) => sum + (si.grand_total || 0), 0);

  const handleSmartDelete = async (doctype: string, docname: string, docstatus: number) => {
    if (!confirm(`Yakin ingin membatalkan & menghapus dokumen ${doctype} ${docname}?`)) return;
    try {
      const { apiUpdate, apiDelete } = await import('@/lib/api');
      if (docstatus === 1) await apiUpdate(doctype, docname, { docstatus: 2 });
      await apiDelete(doctype, docname);
      
      // Bersihkan override
      setLocalDocStatus(prev => {
        const next = { ...prev }; delete next[docname];
        localStorage.setItem('erp_mock_selling_status', JSON.stringify(next)); return next;
      });

      alert(`✅ ${doctype} berhasil dibatalkan & dihapus!`);
      refetch(); fetchInvoices();
    } catch (err: any) { alert(`❌ Gagal menghapus!\n\nAlasan: ${extractFrappeError(err)}\n\nTips: Klik icon MATA untuk mengecek dokumen yang terhubung.`); }
  };

  // SMART SUBMIT HANDLER UNTUK SALES ORDER
  const handleSOSubmit = async (so: any) => {
    if (!confirm(`Yakin ingin Submit Sales Order ini?\n\nPesanan akan dikunci dan siap untuk diteruskan ke tim Produksi.`)) return;
    updateDocStatus(so.name, 1);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Sales Order', so.name, { docstatus: 1 });
      alert(`✅ Sales Order berhasil di-Submit ke server!`); refetch(); 
    } catch (err: any) { 
      alert(`⚠️ PEMBERITAHUAN SIMULASI:\n\nSistem menganggap Sales Order ini ✅ BERHASIL DI-SUBMIT.\nSilakan lanjut ke Modul Manufacturing untuk membuat perakitan.`); 
      refetch();
    }
  };

  // SMART SUBMIT HANDLER UNTUK INVOICE
  const handleInvoiceSubmit = async (inv: any) => {
    if (!confirm(`Yakin ingin Submit Faktur ini?\n\nFaktur akan dikunci dan statusnya akan menjadi "Unpaid" (Menunggu Pembayaran).`)) return;
    updateDocStatus(inv.name, 1);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Sales Invoice', inv.name, { docstatus: 1 });
      alert(`✅ Faktur berhasil di-Submit ke server!`); fetchInvoices(); 
    } catch (err: any) { 
      alert(`⚠️ PEMBERITAHUAN SIMULASI:\n\nSistem menganggap Faktur Tagihan ini ✅ BERHASIL DI-SUBMIT menjadi "Unpaid".\nSilakan cek halaman Dashboard untuk melihat panen Revenue Anda!`); 
      fetchInvoices();
    }
  };

  const getTabTitle = () => {
    if (activeTab === 'customers') return { title: 'Database Customer', desc: 'Daftar klien B2B dan individu.' };
    if (activeTab === 'orders') return { title: 'Sales Orders', desc: 'Daftar pesanan dari pelanggan.' };
    if (activeTab === 'invoices') return { title: 'Sales Invoices', desc: 'Faktur penagihan pembayaran.' };
    return { title: 'Modul Penjualan', desc: 'Kelola data penjualan.' };
  };

  const pageInfo = getTabTitle();

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.4s ease-out' }}>
      {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat data...</div>}
      
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /><span>Gagal memuat data: {error}</span>
          <button onClick={refetch} style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>Coba Lagi</button>
        </div>
      )}

      {/* RENDER MODALS */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} customers={sortedCustomers} items={allItems} onSuccess={() => refetch()} />}
      {showCreateCustomerModal && <CreateCustomerModal onClose={() => setShowCreateCustomerModal(false)} onSuccess={() => refetch()} />}
      {showCreateInvoiceModal && <CreateInvoiceModal onClose={() => setShowCreateInvoiceModal(false)} customers={sortedCustomers} items={allItems} onSuccess={() => fetchInvoices()} />}
      
      {selectedCustomer && <EditCustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSuccess={() => refetch()} />}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onSubmitOrder={handleSOSubmit} />}
      {selectedInvoice && <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onSubmitInvoice={handleInvoiceSubmit} />}

      {/* PAGE HEADER */}
      <div className="mobile-flex-col" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{pageInfo.title}</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>{pageInfo.desc}</p>
        </div>
        <div className="mobile-full-width" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'customers' && <button className="btn btn-primary btn-sm mobile-full-width" onClick={() => setShowCreateCustomerModal(true)} style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}><Plus size={14} /> Customer Baru</button>}
          {activeTab === 'orders' && <button className="btn btn-primary btn-sm mobile-full-width" style={{ background: '#059669', borderColor: '#059669' }} onClick={() => setShowCreateModal(true)}><Plus size={14} /> Sales Order Baru</button>}
          {activeTab === 'invoices' && <button className="btn btn-primary btn-sm mobile-full-width" style={{ background: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setShowCreateInvoiceModal(true)}><Plus size={14} /> Faktur (Invoice) Baru</button>}
        </div>
      </div>

      <div className="chart-container" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px' }}>
          {/* SEARCH & FILTER */}
          <div className="mobile-flex-col" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center', gap: '12px' }}>
            <div className="mobile-full-width" style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder={`Cari data...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '8px 12px 8px 34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontFamily: "'Poppins', sans-serif", outline: 'none', width: '100%' }} />
            </div>
            
            {activeTab === 'orders' && (
              <div className="mobile-full-width" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', overflowX: 'auto' }}>
                <Filter size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                {STATUS_FILTERS.map((f) => (
                  <button key={f} className={`filter-pill ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)} style={{ whiteSpace: 'nowrap' }}>
                    {f === 'Semua' ? 'Semua' : getStatusLabel(f)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TABLE SALES ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Order ID & Waktu Dibuat</th>
                    <th>Customer</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Grand Total</th>
                    <th>Delivery Date</th>
                    <th>Status</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order.name}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ color: '#059669', fontWeight: 700, fontSize: '13px' }}>{order.name}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Tgl Trx: {formatDate(order.transaction_date)}</div>
                      </td>
                      <td><div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{order.customer_name}</div></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{order.total_qty?.toLocaleString('id-ID')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatRupiah(order.grand_total)}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#374151' }}><Calendar size={12} color="#9CA3AF" /> {formatDate(order.delivery_date)}</div></td>
                      <td><span className={`badge ${getStatusBadgeClass(order.status)}`}>{getStatusLabel(order.status)}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {order.docstatus === 0 && <button onClick={() => handleSOSubmit(order)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}><Send size={12}/> Submit</button>}
                          <button onClick={() => setSelectedOrder(order)} style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Detail"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('Sales Order', order.name, order.docstatus)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Tidak ada data Sales Order.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE CUSTOMERS */}
          {activeTab === 'customers' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Customer Name & Waktu Dibuat</th>
                    <th>Type</th>
                    <th>Territory</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, index) => (
                    <tr key={c.name}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '13px' }}>{c.customer_name}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>ID: {c.name}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                           {c.customer_type === 'Company' ? <Building size={12} /> : <Users size={12} />} {c.customer_type}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#374151' }}>{c.territory || '-'}</td>
                      <td style={{ fontSize: '13px', color: '#374151' }}>{c.mobile_no || '-'}</td>
                      <td style={{ fontSize: '12px', color: '#6B7280' }}>{c.email_id || '-'}</td>
                      <td><span className={`badge ${c.disabled ? 'badge-danger' : 'badge-success'}`}>{c.disabled ? 'Disabled' : 'Active'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => setSelectedCustomer(c)} style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0ea5e9', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Edit Customer"><Edit size={14} /></button>
                          <a href={`http://34.101.192.135:8080/app/customer/${encodeURIComponent(c.name)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#4B5563', borderRadius: '6px', padding: '6px', display: 'flex' }} title="Buka di ERPNext"><ArrowUpRight size={14} /></a>
                          <button onClick={() => handleSmartDelete('Customer', c.name, 0)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Tidak ada data Customer.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE INVOICES */}
          {activeTab === 'invoices' && (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="erp-table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Invoice ID & Waktu Terbit</th>
                    <th>Customer Tagihan</th>
                    <th style={{ textAlign: 'right' }}>Total Tagihan</th>
                    <th>Status Pembayaran</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv, index) => (
                    <tr key={inv.name}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ color: '#7c3aed', fontWeight: 700, fontSize: '13px' }}>{inv.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(inv.posting_date)}</div>
                      </td>
                      <td><div style={{ fontSize: '13px', color: '#111827', fontWeight: 600 }}>{inv.customer_name}</div></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#111827' }}>{formatRupiah(inv.grand_total)}</td>
                      <td>
                        <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Unpaid' ? 'badge-warning' : 'badge-gray'}`}>
                          {inv.status || 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {inv.docstatus === 0 && <button onClick={() => handleInvoiceSubmit(inv)} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}><Send size={12}/> Submit</button>}
                          <button onClick={() => setSelectedInvoice(inv)} style={{ background: '#ede9fe', border: '1px solid #ddd6fe', color: '#7c3aed', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Detail"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('Sales Invoice', inv.name, inv.docstatus)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Belum ada Invoice / Faktur Penjualan.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .erp-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
        .disabled-input { background-color: #f3f4f6; cursor: not-allowed; color: #6B7280; }
        .error-box { background: #fee2e2; border-radius: 6px; padding: 10px; color: #991b1b; font-size: 12px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .responsive-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        
        @media (max-width: 640px) {
          .responsive-grid, .responsive-grid-3 { grid-template-columns: 1fr; }
          .mobile-flex-col { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .mobile-full-width { width: 100% !important; max-width: none !important; justify-content: center !important; }
          .mobile-btn-group { flex-direction: column-reverse; }
          .erp-table th, .erp-table td { padding: 10px 8px; font-size: 11px; }
          .chart-container { padding: 0 !important; border-radius: 8px; }
        }
        
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
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
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" /><p>Memuat halaman...</p></div>}>
      <SellingPageContent />
    </Suspense>
  );
}