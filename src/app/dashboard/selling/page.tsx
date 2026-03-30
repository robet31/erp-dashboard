'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useSellingData, useStockData } from '@/hooks/useFrappeData';
import { getWarehousesByCompany } from '@/config/frappe-data';
import { 
  Users, FileText, FileCheck, DollarSign, Plus, Download, Search, X, 
  Edit, Trash2, Eye, Send, CheckCircle, AlertCircle, Loader2, Building, 
  ArrowUpRight, Filter, Calendar, MapPin, Phone, Mail, Briefcase, User, Link as LinkIcon, Info, AlertTriangle, Package
} from 'lucide-react';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';

const STATUS_FILTERS = ['Semua', 'Draft', 'To Deliver and Bill', 'Completed', 'Cancelled'];
const COLOR_PRIMARY = '#1d4ed8';
const COLOR_SECONDARY = '#3b82f6';

const formatUang = (value: number | string | undefined | any) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
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
  return errorMsg;
};

const getActualStock = (itemCode: string, warehouse: string, bins: any[]) => {
  const bin = bins.find((b: any) => b.item_code === itemCode && b.warehouse === warehouse);
  return bin ? Number(bin.actual_qty) : 0;
};

const getDynamicCompany = (warehouses: any[]) => {
  const validWarehouse = warehouses?.find((w: any) => !w.is_group && w.company);
  return validWarehouse ? validWarehouse.company : 'PT Artavista';
};

const buildMeta = (data: any) => `<div id="erp_dashboard_meta" style="display:none;">${JSON.stringify(data)}</div>`;
const parseMeta = (str: string) => {
  if (!str) return {};
  const match = str.match(/<div id="erp_dashboard_meta"[^>]*>(.*?)<\/div>/);
  if (match && match[1]) {
    try { return JSON.parse(match[1]); } catch(e) { return {}; }
  }
  return {};
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

function ConfirmModal({ show, title, desc, onConfirm, onCancel, confirmText = "Ya, Lanjutkan", isDanger = false }: any) {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ width: '60px', height: '60px', background: isDanger ? '#fee2e2' : '#e0f2fe', color: isDanger ? '#ef4444' : COLOR_PRIMARY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={30} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, marginBottom: '24px' }}>{desc}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
          <button onClick={onConfirm} className="btn btn-primary" style={{ flex: 1, background: isDanger ? '#ef4444' : COLOR_PRIMARY, borderColor: isDanger ? '#ef4444' : COLOR_PRIMARY }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. MODALS FOR CUSTOMER
// ==========================================
function CreateCustomerModal({ onClose, onSuccess, showToast }: { onClose: () => void; onSuccess?: () => void; showToast: any }) {
  const [form, setForm] = useState({ customer_type: 'Company', customer_name: '', map_to_first_name: '', map_to_last_name: '', email_address: '', mobile_number: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'Indonesia' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setError('');
    try {
      const { apiCreate } = await import('@/lib/api');
      const extraDataMeta = buildMeta({
        map_to_first_name: form.map_to_first_name, map_to_last_name: form.map_to_last_name,
        address_line1: form.address_line1, address_line2: form.address_line2,
        city: form.city, state: form.state, pincode: form.pincode, country: form.country
      });

      await apiCreate('Customer', { 
        customer_name: form.customer_name, customer_type: form.customer_type, customer_group: 'Commercial', territory: 'All Territories',
        mobile_no: form.mobile_number, email_id: form.email_address, customer_details: extraDataMeta
      });
      showToast('Data Customer berhasil didaftarkan!', 'success'); 
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Customer')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '800px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Tambah Customer Baru</h2><p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Daftarkan data pembeli atau klien ke dalam sistem.</p></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div className="responsive-grid" style={{ gap: '32px' }}>
            <div>
              <h3 className="section-title"><Briefcase size={14}/> Profil Utama</h3>
              <div className="form-group"><label className="erp-label">Customer Type (Tipe Pelanggan) *</label><select className="erp-input" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}><option value="Company">Company (Perusahaan/B2B)</option><option value="Individual">Individual (Perorangan/B2C)</option></select></div>
              <div className="form-group"><label className="erp-label">Customer Name (Nama Lengkap) *</label><input required type="text" className="erp-input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value.replace(/[^a-zA-Z0-9\s.,]/g, '') }))} placeholder="Cth: PT Distribusi Teknologi" /></div>
              <h3 className="section-title" style={{ marginTop: '24px' }}><User size={14}/> Kontak Perwakilan (PIC)</h3>
              <div className="responsive-grid"><div className="form-group"><label className="erp-label">First Name</label><input type="text" className="erp-input" value={form.map_to_first_name} onChange={e => setForm(f => ({ ...f, map_to_first_name: e.target.value }))} /></div><div className="form-group"><label className="erp-label">Last Name</label><input type="text" className="erp-input" value={form.map_to_last_name} onChange={e => setForm(f => ({ ...f, map_to_last_name: e.target.value }))} /></div></div>
              <div className="form-group"><label className="erp-label">Email Address</label><input type="email" className="erp-input" value={form.email_address} onChange={e => setForm(f => ({ ...f, email_address: e.target.value }))} /></div>
              <div className="form-group"><label className="erp-label">Mobile Number</label><input type="text" className="erp-input" value={form.mobile_number} onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))} /></div>
            </div>
            <div>
              <h3 className="section-title"><MapPin size={14}/> Alamat Pengiriman</h3>
              <div className="form-group"><label className="erp-label">Address Line 1</label><input type="text" className="erp-input" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} style={{ marginBottom: '8px' }} placeholder="Jalan Utama..." /></div>
              <div className="form-group"><label className="erp-label">Address Line 2</label><input type="text" className="erp-input" value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} placeholder="Gedung / Lantai..." /></div>
              <div className="responsive-grid"><div className="form-group"><label className="erp-label">City</label><input type="text" className="erp-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div><div className="form-group"><label className="erp-label">State</label><input type="text" className="erp-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div></div>
              <div className="responsive-grid"><div className="form-group"><label className="erp-label">ZIP Code</label><input type="text" className="erp-input" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} /></div><div className="form-group"><label className="erp-label">Country</label><input type="text" className="erp-input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div></div>
            </div>
          </div>
          {error && <div className="error-box"><AlertCircle size={16}/> {error}</div>}
          <div className="modal-footer"><button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button><button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Customer'}</button></div>
        </form>
      </div>
    </div>
  );
}

function DetailCustomerModal({ customer, mode, onClose, onSuccess, showToast }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_type: 'Company', map_to_first_name: '', map_to_last_name: '', email_address: '', mobile_number: '',
    address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'Indonesia', disabled: 0
  });

  const isView = mode === 'view';
  const inputClass = isView ? 'erp-input disabled-input' : 'erp-input';

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Customer/${encodeURIComponent(customer.name)}`, { cache: 'no-store' });
        const data = await res.json();
        const fetchedData = data.data || {};
        const parsedMeta = parseMeta(fetchedData.customer_details);
        
        setForm({
          customer_name: fetchedData.customer_name || customer.customer_name || '', customer_type: fetchedData.customer_type || customer.customer_type || 'Company',
          map_to_first_name: parsedMeta.map_to_first_name || '', map_to_last_name: parsedMeta.map_to_last_name || '',
          email_address: fetchedData.email_id || parsedMeta.email_address || '', mobile_number: fetchedData.mobile_no || parsedMeta.mobile_number || '',
          address_line1: parsedMeta.address_line1 || '', address_line2: parsedMeta.address_line2 || '',
          city: parsedMeta.city || '', state: parsedMeta.state || '', pincode: parsedMeta.pincode || '', country: parsedMeta.country || 'Indonesia',
          disabled: fetchedData.disabled || customer.disabled || 0
        });
      } catch (e) { setForm(f => ({ ...f, customer_name: customer.customer_name || '', disabled: customer.disabled || 0 })); } finally { setIsLoading(false); }
    };
    fetchFullData();
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (isView) return;
    setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      const extraDataMeta = buildMeta({
        map_to_first_name: form.map_to_first_name, map_to_last_name: form.map_to_last_name, address_line1: form.address_line1,
        address_line2: form.address_line2, city: form.city, state: form.state, pincode: form.pincode, country: form.country
      });

      await apiUpdate('Customer', customer.name, { 
        customer_name: form.customer_name, customer_type: form.customer_type, mobile_no: form.mobile_number,
        email_id: form.email_address, disabled: form.disabled, customer_details: extraDataMeta
      });
      showToast('Data Customer berhasil diperbarui!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '800px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>{isView ? 'Detail Customer' : 'Edit Customer'}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <span className={`badge ${form.disabled ? 'badge-danger' : 'badge-success'}`}>{form.disabled ? 'Diblokir / Non-Aktif' : 'Aktif Bertransaksi'}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>ID: {customer.name}</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="responsive-grid" style={{ gap: '32px' }}>
                <div>
                  <h3 className="section-title"><User size={14}/> Informasi Kontak Utama</h3>
                  <div className="form-group"><label className="erp-label">Nama Perusahaan / Klien *</label><input required type="text" className={inputClass} value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} readOnly={isView} /></div>
                  <div className="responsive-grid"><div className="form-group"><label className="erp-label">Tipe Pelanggan</label><select className={inputClass} value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))} disabled={isView}><option value="Company">Company</option><option value="Individual">Individual</option></select></div><div className="form-group"><label className="erp-label">Phone / Mobile</label><input type="text" className={inputClass} value={form.mobile_number} onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))} readOnly={isView} /></div></div>
                  <div className="responsive-grid"><div className="form-group"><label className="erp-label">Nama Depan (PIC)</label><input type="text" className={inputClass} value={form.map_to_first_name} onChange={e => setForm(f => ({ ...f, map_to_first_name: e.target.value }))} readOnly={isView} /></div><div className="form-group"><label className="erp-label">Nama Belakang (PIC)</label><input type="text" className={inputClass} value={form.map_to_last_name} onChange={e => setForm(f => ({ ...f, map_to_last_name: e.target.value }))} readOnly={isView} /></div></div>
                  <div className="form-group"><label className="erp-label">Email Address</label><input type="email" className={inputClass} value={form.email_address} onChange={e => setForm(f => ({ ...f, email_address: e.target.value }))} readOnly={isView} /></div>
                </div>
                <div>
                  <h3 className="section-title"><MapPin size={14}/> Alamat Terdaftar</h3>
                  <div className="form-group"><label className="erp-label">Alamat Lengkap</label><input type="text" className={inputClass} value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} style={{ marginBottom: '8px' }} placeholder="Jalan Utama..." readOnly={isView} /><input type="text" className={inputClass} value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} placeholder="Gedung / Lantai..." readOnly={isView} /></div>
                  <div className="responsive-grid"><div className="form-group"><label className="erp-label">Kota / Kabupaten</label><input type="text" className={inputClass} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} readOnly={isView} /></div><div className="form-group"><label className="erp-label">Provinsi</label><input type="text" className={inputClass} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} readOnly={isView} /></div></div>
                  <div className="responsive-grid"><div className="form-group"><label className="erp-label">Kode Pos</label><input type="text" className={inputClass} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} readOnly={isView} /></div><div className="form-group"><label className="erp-label">Negara</label><input type="text" className={inputClass} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} readOnly={isView} /></div></div>
                </div>
              </div>
              <div style={{ background: '#f8f9fb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '16px' }}>
                <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0, border: 'none' }}><Briefcase size={14}/> Manajemen Status</h3>
                <div className="form-group" style={{ margin: 0 }}><label className="erp-label">Ubah Status Pelanggan</label><select className={inputClass} value={form.disabled} onChange={e => setForm(f => ({ ...f, disabled: Number(e.target.value) }))} disabled={isView}><option value={0}>Active (Bisa bertransaksi)</option><option value={1}>Disabled (Diblokir/Tidak aktif)</option></select></div>
              </div>
              <div className="modal-footer" style={{ marginTop: '16px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Tutup</button>
                {!isView && (<button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>)}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL SALES ORDER (BUAT & EDIT DRAFT)
// ==========================================
function OrderModal({ order, mode, onClose, customers, items, warehouses, bins, onSuccess, showToast }: any) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({ 
    customer: order?.customer || '', 
    transaction_date: order?.transaction_date || new Date().toISOString().split('T')[0], 
    delivery_date: order?.delivery_date || new Date().toISOString().split('T')[0], 
    items: [] as any[]
  });
  
  const [itemForm, setItemForm] = useState({ item_code: '', qty: '', rate: '', warehouse: '', amount: 0 });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(isEdit);

  const defaultCompany = useMemo(() => getDynamicCompany(warehouses), [warehouses]);

  useEffect(() => {
    if (isEdit && order) {
      const fetchDetail = async () => {
        try {
          const res = await fetch(`/api/frappe/resource/Sales Order/${encodeURIComponent(order.name)}`, { cache: 'no-store' });
          const data = await res.json();
          if (data.data) {
            setForm(f => ({ ...f, customer: data.data.customer, transaction_date: data.data.transaction_date, delivery_date: data.data.delivery_date, items: data.data.items || [] }));
          }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
      };
      fetchDetail();
    } else {
      setIsLoading(false);
    }
  }, [isEdit, order]);

  const uniqueWarehouses = useMemo(() => Array.from(new Set(bins.map((b: any) => b.warehouse))), [bins]);

  const availableStock = useMemo(() => {
    if (!itemForm.item_code || !itemForm.warehouse) return 0;
    return getActualStock(itemForm.item_code, itemForm.warehouse, bins);
  }, [itemForm.item_code, itemForm.warehouse, bins]);

  const isStockShort = Number(itemForm.qty || 0) > availableStock;
  
  const totalQty = form.items.reduce((sum, it) => sum + Number(it.qty || 0), 0);
  const grandTotal = form.items.reduce((sum, it) => sum + Number(it.amount || 0), 0);

  const handleAddItem = () => {
    if (!itemForm.item_code || !itemForm.warehouse || Number(itemForm.qty) <= 0 || Number(itemForm.rate) <= 0) {
      return setError('Lengkapi data item dengan benar (Qty dan Rate harus > 0)');
    }
    const selectedItem = items.find((i: any) => i.item_code === itemForm.item_code);
    
    const newItemObj = { 
      item_code: itemForm.item_code, item_name: selectedItem?.item_name || itemForm.item_code, 
      qty: parseFloat(itemForm.qty), rate: parseFloat(itemForm.rate), 
      warehouse: itemForm.warehouse, amount: itemForm.amount 
    };

    if (editingItemIndex !== null) {
      const newItems = [...form.items];
      newItems[editingItemIndex] = { ...newItems[editingItemIndex], ...newItemObj };
      setForm(f => ({ ...f, items: newItems }));
      setEditingItemIndex(null);
    } else {
      setForm(f => ({ ...f, items: [...f.items, newItemObj] }));
    }
    
    setItemForm({ item_code: '', qty: '', rate: '', warehouse: '', amount: 0 });
    setError('');
  };

  const handleEditItemClick = (index: number) => {
    const itemToEdit = form.items[index];
    setItemForm({
      item_code: itemToEdit.item_code,
      qty: String(itemToEdit.qty),
      rate: String(itemToEdit.rate),
      warehouse: itemToEdit.warehouse || '',
      amount: itemToEdit.amount
    });
    setEditingItemIndex(index);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== indexToRemove) }));
    if (editingItemIndex === indexToRemove) setEditingItemIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (form.items.length === 0) return setError('Tambahkan minimal 1 item ke dalam pesanan.');
    
    setIsSubmitting(true); setError('');
    try {
      const salesOrderData = { 
        customer: form.customer, transaction_date: form.transaction_date, delivery_date: form.delivery_date, 
        company: defaultCompany, currency: 'IDR', items: form.items 
      };
      const { apiCreate, apiUpdate } = await import('@/lib/api');
      
      if (isEdit) {
        await apiUpdate('Sales Order', order.name, { delivery_date: form.delivery_date, items: form.items });
        showToast('Draft Sales Order berhasil diperbarui!', 'success');
      } else {
        await apiCreate('Sales Order', salesOrderData);
        showToast('Sales Order berhasil dibuat dalam status DRAFT!', 'success'); 
      }
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal memproses Sales Order')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '800px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>{isEdit ? `Edit Draft Order: ${order?.name}` : 'Buat Sales Order Baru'}</h2>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Dokumen pesanan internal. Belum mengurangi stok fisik sebelum proses Delivery.</p>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="erp-label">Customer (Pembeli) *</label>
                <select required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="erp-input" disabled={isEdit}>
                  <option value="">Pilih pelanggan yang sudah terdaftar...</option>{customers.map((c:any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
                </select>
              </div>
              
              <div className="responsive-grid">
                <div className="form-group"><label className="erp-label">Transaction Date (Tgl Pesan) *</label><input type="date" required className="erp-input" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} disabled={isEdit} /></div>
                <div className="form-group"><label className="erp-label">Delivery Date (Tgl Kirim Target) *</label><input type="date" required className="erp-input" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} /></div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px', marginBottom: '16px' }}>
                <h3 className="section-title"><Package size={14}/> {isEdit ? 'Manajemen Item Pesanan' : 'Tambah Item Pesanan'}</h3>
                
                <div style={{ background: editingItemIndex !== null ? '#eff6ff' : '#f8fafc', padding: '16px', borderRadius: '8px', border: `1px solid ${editingItemIndex !== null ? '#bfdbfe' : '#e2e8f0'}`, marginBottom: '16px', transition: 'all 0.2s' }}>
                  {editingItemIndex !== null && <div style={{ fontSize: '12px', fontWeight: 700, color: COLOR_PRIMARY, marginBottom: '12px' }}>✏️ Sedang mengubah Item No. {editingItemIndex + 1}</div>}
                  <div className="responsive-grid" style={{ marginBottom: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="erp-label">Ambil Dari Gudang *</label>
                      <select className="erp-input" value={itemForm.warehouse} onChange={e => setItemForm(f => ({ ...f, warehouse: e.target.value }))}>
                        <option value="">Pilih Gudang...</option>
                        {uniqueWarehouses.length > 0 ? (
                          uniqueWarehouses.map((w: any) => <option key={w} value={w}>{w}</option>)
                        ) : (
                          <option disabled>Gudang tidak ditemukan / Kosong</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="erp-label">Model Barang *</label>
                      <select className="erp-input" value={itemForm.item_code} onChange={e => { const val = e.target.value; const selected = items.find((i: any) => i.item_code === val); setItemForm(f => ({ ...f, item_code: val, rate: String(selected?.standard_rate || 0), amount: (selected?.standard_rate || 0) * Number(f.qty || 0) })); }}>
                        <option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {itemForm.item_code && itemForm.warehouse && (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', background: isStockShort ? '#fffbeb' : '#f0fdf4', color: isStockShort ? '#b45309' : '#166534', fontSize: '12px', fontWeight: 600 }}>
                      Informasi Stok Tersedia di {itemForm.warehouse}: {availableStock} Unit
                      {isStockShort && <span style={{ display: 'block', color: '#d97706', marginTop: '2px' }}>💡 Stok saat ini kosong/tidak mencukupi, namun Anda tetap bisa menyimpannya sebagai Draft.</span>}
                    </div>
                  )}

                  <div className="responsive-grid-3" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="erp-label">Qty</label><input type="number" step="any" min="1" className="erp-input" value={itemForm.qty} onChange={e => setItemForm(f => ({ ...f, qty: e.target.value, amount: Number(e.target.value) * Number(f.rate || 0) }))} placeholder="0" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="erp-label">Rate</label><input type="number" step="any" min="1" className="erp-input" value={itemForm.rate} onChange={e => setItemForm(f => ({ ...f, rate: e.target.value, amount: Number(f.qty || 0) * Number(e.target.value) }))} placeholder="0" /></div>
                    <button type="button" onClick={handleAddItem} className="btn btn-secondary" style={{ background: editingItemIndex !== null ? COLOR_PRIMARY : '#e0f2fe', color: editingItemIndex !== null ? 'white' : COLOR_PRIMARY, border: 'none', height: '42px', fontWeight: 700 }}>
                      {editingItemIndex !== null ? '✓ Update Item' : <><Plus size={16}/> Tambah</>}
                    </button>
                  </div>
                </div>

                {form.items.length > 0 && (
                  <>
                    <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
                      <table className="erp-table" style={{ width: '100%', minWidth: '500px', margin: 0 }}>
                        <thead style={{ background: '#f8fafc' }}><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Item & Gudang</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'center' }}>Aksi</th></tr></thead>
                        <tbody>
                          {form.items.map((item: any, i: number) => (
                            <tr key={i} style={{ background: editingItemIndex === i ? '#eff6ff' : 'transparent' }}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                              <td style={{ fontSize: '12px' }}><div style={{ fontWeight: 700, color: COLOR_PRIMARY }}>{item.item_code}</div><div style={{ color: '#6B7280' }}>{item.warehouse}</div></td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.qty)}</td>
                              <td style={{ textAlign: 'right' }}>{formatUang(item.rate)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatUang(item.amount)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button type="button" onClick={() => handleEditItemClick(i)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><Edit size={14}/></button>
                                  <button type="button" onClick={() => handleRemoveItem(i)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Ringkasan Frappe Style */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
                      <div className="responsive-grid" style={{ gap: '24px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Total Quantity</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{totalQty}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Net Total (IDR)</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{formatUang(grandTotal)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '14px', color: COLOR_PRIMARY, fontWeight: 800 }}>Grand Total</span>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: COLOR_PRIMARY }}>{formatUang(grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {error && <div className="error-box"><AlertCircle size={16}/> {error}</div>}
              <div className="modal-footer">
                <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Draft'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Order View Modal (Read Only)
function OrderDetailModal({ order, onClose, onSubmitOrder }: { order: any; onClose: () => void; onSubmitOrder?: (wo: any) => void; }) {
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
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Rincian Order: {fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>{getStatusLabel(order.status)}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Tgl Dibuat: {formatDate(fullData?.transaction_date)}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Pemesan</p><p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{fullData?.customer_name}</p></div>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Tgl Target Kirim</p><p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatDate(fullData?.delivery_date)}</p></div>
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}><p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Total Nominal</p><p style={{ fontSize: '16px', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(fullData?.grand_total)}</p></div>
            </div>
            
            <p className="section-title">Item yang Dipesan</p>
            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1px' }}>
              <table className="erp-table" style={{ width: '100%', minWidth: '500px' }}>
                <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Kode Produk</th><th>Nama Produk</th><th style={{ textAlign: 'right' }}>Jumlah (Qty)</th><th style={{ textAlign: 'right' }}>Harga Satuan</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
                <tbody>
                  {(fullData?.items || []).map((item: any, i: number) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                      <td><span style={{ color: COLOR_SECONDARY, fontWeight: 700 }}>{item.item_code}</span></td>
                      <td style={{ whiteSpace: 'normal', fontSize: '12px' }}>{item.item_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.qty)} <span style={{fontSize: '10px', color: '#6B7280'}}>{item.uom}</span></td>
                      <td style={{ textAlign: 'right', color: '#4B5563' }}>{formatUang(item.rate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              {order.docstatus === 0 && (
                <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>
                  <Send size={16} /> {isSubmitting ? 'Memproses...' : 'Submit (Kunci Order)'}
                </button>
              )}
              <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. MODALS FOR SALES INVOICE (CREATE & EDIT DRAFT)
// ==========================================
function InvoiceModal({ invoice, mode, onClose, customers, items, orders, warehouses, bins, onSuccess, showToast }: any) {
  const isEdit = mode === 'edit';
  const defaultCompany = useMemo(() => getDynamicCompany(warehouses), [warehouses]);
  const [form, setForm] = useState({ 
    customer: invoice?.customer || '', 
    company: defaultCompany, 
    posting_date: invoice?.posting_date || new Date().toISOString().split('T')[0], 
    due_date: invoice?.due_date || new Date().toISOString().split('T')[0], 
    items: [] as any[], 
    linked_so: '' 
  });
  
  const [itemForm, setItemForm] = useState({ item_code: '', qty: '', rate: '', amount: 0 });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && invoice) {
      const fetchDetail = async () => {
        try {
          const res = await fetch(`/api/frappe/resource/Sales Invoice/${encodeURIComponent(invoice.name)}`, { cache: 'no-store' });
          const data = await res.json();
          if (data.data) {
            setForm(f => ({ 
              ...f, 
              customer: data.data.customer, 
              posting_date: data.data.posting_date, 
              due_date: data.data.due_date || data.data.posting_date, 
              items: data.data.items || [] 
            }));
          }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
      };
      fetchDetail();
    } else {
      setIsLoading(false);
    }
  }, [isEdit, invoice]);

  const totalQty = form.items.reduce((sum, it) => sum + Number(it.qty || 0), 0);
  const grandTotal = form.items.reduce((sum, it) => sum + Number(it.amount || 0), 0);

  const handleSOChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const soName = e.target.value;
    setForm(f => ({ ...f, linked_so: soName }));
    if (!soName) return;

    try {
      const res = await fetch(`/api/frappe/resource/Sales Order/${encodeURIComponent(soName)}`);
      const data = await res.json();
      if (data.data) {
        const soData = data.data;
        setForm(f => ({
          ...f, 
          customer: soData.customer,
          items: soData.items.map((i:any) => ({ item_code: i.item_code, item_name: i.item_name, qty: i.qty, rate: i.rate, amount: i.amount }))
        }));
        showToast('Data otomatis ditarik dari Sales Order!', 'info');
      }
    } catch (err) {}
  };

  const handleAddItem = () => {
    if (!itemForm.item_code || Number(itemForm.qty) <= 0 || Number(itemForm.rate) <= 0) {
      return setError('Lengkapi data item dengan benar (Qty dan Rate harus > 0)');
    }
    const selectedItem = items.find((i: any) => i.item_code === itemForm.item_code);
    
    const newItemObj = { 
      item_code: itemForm.item_code, item_name: selectedItem?.item_name || itemForm.item_code, 
      qty: parseFloat(itemForm.qty), rate: parseFloat(itemForm.rate), amount: itemForm.amount 
    };

    if (editingItemIndex !== null) {
      const newItems = [...form.items];
      newItems[editingItemIndex] = { ...newItems[editingItemIndex], ...newItemObj };
      setForm(f => ({ ...f, items: newItems }));
      setEditingItemIndex(null);
    } else {
      setForm(f => ({ ...f, items: [...f.items, newItemObj] }));
    }
    
    setItemForm({ item_code: '', qty: '', rate: '', amount: 0 });
    setError('');
  };

  const handleEditItemClick = (index: number) => {
    const itemToEdit = form.items[index];
    setItemForm({
      item_code: itemToEdit.item_code,
      qty: String(itemToEdit.qty),
      rate: String(itemToEdit.rate),
      amount: itemToEdit.amount
    });
    setEditingItemIndex(index);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== indexToRemove) }));
    if (editingItemIndex === indexToRemove) setEditingItemIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (form.items.length === 0) return setError('Tambahkan minimal 1 item ke dalam faktur.');
    
    setIsSubmitting(true); setError('');
    try {
      const invoiceData = { 
        customer: form.customer, posting_date: form.posting_date, due_date: form.due_date, 
        company: defaultCompany, currency: 'IDR', items: form.items 
      };
      const { apiCreate, apiUpdate } = await import('@/lib/api');
      
      if (isEdit) {
        await apiUpdate('Sales Invoice', invoice.name, { posting_date: form.posting_date, due_date: form.due_date, items: form.items });
        showToast('Faktur Tagihan (Draft) berhasil diperbarui.', 'success'); 
      } else {
        await apiCreate('Sales Invoice', invoiceData);
        showToast('Faktur Tagihan berhasil dibuat dalam status Draft.', 'success'); 
      }
      
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal memproses Sales Invoice')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '800px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>{isEdit ? `Edit Draft Faktur: ${invoice?.name}` : 'Buat Faktur Penagihan Baru'}</h2>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Faktur digunakan untuk menagih pembayaran ke customer.</p>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {!isEdit && (
                <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '10px', border: '1px dashed #bfdbfe', marginBottom: '16px' }}>
                  <label className="erp-label" style={{ color: COLOR_PRIMARY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={14}/> Tarik Cepat Data dari Sales Order
                  </label>
                  <select className="erp-input" value={form.linked_so} onChange={handleSOChange}>
                    <option value="">-- Pilih Sales Order yang mau ditagih --</option>
                    {orders.map((o: any) => <option key={o.name} value={o.name}>{o.name} - {o.customer_name}</option>)}
                  </select>
                  <p className="helper-text" style={{ color: '#1e40af', marginTop: '6px' }}>Otomatis mengisi daftar barang dan harga sesuai pesanan.</p>
                </div>
              )}

              <div className="form-group">
                <label className="erp-label">Customer Tujuan Tagihan *</label>
                <select required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="erp-input" disabled={isEdit}>
                  <option value="">Pilih customer...</option>{customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
                </select>
              </div>

              <div className="responsive-grid">
                <div className="form-group">
                  <label className="erp-label">Date (Tgl Terbit) *</label>
                  <input type="date" required className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="erp-label">Payment Due Date (Jatuh Tempo) *</label>
                  <input type="date" required className="erp-input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px', marginBottom: '16px' }}>
                <h3 className="section-title"><FileText size={14}/> Rincian Barang yang Ditagih</h3>
                
                <div style={{ background: editingItemIndex !== null ? '#eff6ff' : '#f8fafc', padding: '16px', borderRadius: '8px', border: `1px solid ${editingItemIndex !== null ? '#bfdbfe' : '#e2e8f0'}`, marginBottom: '16px', transition: 'all 0.2s' }}>
                  {editingItemIndex !== null && <div style={{ fontSize: '12px', fontWeight: 700, color: COLOR_PRIMARY, marginBottom: '12px' }}>✏️ Sedang mengubah Item No. {editingItemIndex + 1}</div>}
                  <div className="form-group">
                    <label className="erp-label">Produk / Jasa *</label>
                    <select className="erp-input" value={itemForm.item_code} onChange={e => { const val = e.target.value; const selected = items.find((i: any) => i.item_code === val); setItemForm(f => ({ ...f, item_code: val, rate: String(selected?.standard_rate || 0), amount: (selected?.standard_rate || 0) * Number(f.qty || 0) })); }}>
                      <option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
                    </select>
                  </div>
                  
                  <div className="responsive-grid-3" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="erp-label">Qty</label><input type="number" step="any" min="1" className="erp-input" value={itemForm.qty} onChange={e => setItemForm(f => ({ ...f, qty: e.target.value, amount: Number(e.target.value) * Number(f.rate || 0) }))} placeholder="0" /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="erp-label">Rate</label><input type="number" step="any" min="1" className="erp-input" value={itemForm.rate} onChange={e => setItemForm(f => ({ ...f, rate: e.target.value, amount: Number(f.qty || 0) * Number(e.target.value) }))} placeholder="0" /></div>
                    <button type="button" onClick={handleAddItem} className="btn btn-secondary" style={{ background: editingItemIndex !== null ? COLOR_PRIMARY : '#e0f2fe', color: editingItemIndex !== null ? 'white' : COLOR_PRIMARY, border: 'none', height: '42px', fontWeight: 700 }}>
                      {editingItemIndex !== null ? '✓ Update Item' : <><Plus size={16}/> Tambah</>}
                    </button>
                  </div>
                </div>

                {form.items.length > 0 && (
                  <>
                    <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
                      <table className="erp-table" style={{ width: '100%', minWidth: '500px', margin: 0 }}>
                        <thead style={{ background: '#f8fafc' }}><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Item Code</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'center' }}>Aksi</th></tr></thead>
                        <tbody>
                          {form.items.map((item: any, i: number) => (
                            <tr key={i} style={{ background: editingItemIndex === i ? '#eff6ff' : 'transparent' }}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                              <td style={{ fontSize: '12px' }}><div style={{ fontWeight: 700, color: COLOR_PRIMARY }}>{item.item_code}</div><div style={{ color: '#6B7280' }}>{item.item_name}</div></td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.qty)}</td>
                              <td style={{ textAlign: 'right' }}>{formatUang(item.rate)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatUang(item.amount)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button type="button" onClick={() => handleEditItemClick(i)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><Edit size={14}/></button>
                                  <button type="button" onClick={() => handleRemoveItem(i)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb' }}>
                      <div className="responsive-grid" style={{ gap: '24px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Total Quantity</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{totalQty}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Net Total (IDR)</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{formatUang(grandTotal)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '14px', color: COLOR_PRIMARY, fontWeight: 800 }}>Grand Total</span>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: COLOR_PRIMARY }}>{formatUang(grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {error && <div className="error-box"><AlertCircle size={16}/> {error}</div>}
              <div className="modal-footer">
                <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Draft Faktur'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function InvoiceDetailModal({ invoice, onClose, onSubmitInvoice }: any) {
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
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={24} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Faktur: {fullData?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${invoice.status === 'Paid' ? 'badge-success' : invoice.status === 'Unpaid' ? 'badge-warning' : 'badge-gray'}`}>{invoice.status || 'Draft'}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Diterbitkan: {formatDate(fullData?.posting_date)}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#f8f9fb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}><p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Ditagihkan Kepada</p><p style={{ fontSize: '13px', fontWeight: 700 }}>{fullData?.customer_name}</p></div>
              <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}><p style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>Jatuh Tempo (Due Date)</p><p style={{ fontSize: '13px', fontWeight: 700, color: '#7f1d1d' }}>{formatDate(fullData?.due_date || fullData?.posting_date)}</p></div>
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}><p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Total Harus Dibayar</p><p style={{ fontSize: '16px', fontWeight: 900, color: COLOR_PRIMARY }}>{formatUang(fullData?.grand_total)}</p></div>
            </div>
            
            <p className="section-title">Rincian Tagihan</p>
            <div style={{ overflowX: 'auto', border: '1px solid #f3f4f6', borderRadius: '8px', padding: '1px' }}>
              <table className="erp-table" style={{ width: '100%', minWidth: '400px' }}>
                <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Kode/Item</th><th>Nama Item</th><th style={{ textAlign: 'right' }}>Jumlah</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
                <tbody>
                  {(fullData?.items || []).map((item: any, i: number) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                      <td><span style={{ color: COLOR_SECONDARY, fontWeight: 700 }}>{item.item_code}</span></td>
                      <td style={{ whiteSpace: 'normal', fontSize: '12px' }}>{item.item_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(item.qty)} <span style={{fontSize: '10px', color: '#6B7280'}}>{item.uom}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              {invoice.docstatus === 0 && <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}><Send size={16} /> {isSubmitting ? 'Memproses...' : 'Submit (Sahkan Faktur)'}</button>}
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
  const { items: allItems, bins: originalBins, warehouses } = useStockData();
  const [invoices, setInvoices] = useState<any[]>([]);

  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, desc: string, action: any, confirmText?: string, isDanger?: boolean }>({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan', isDanger: false });

  const [customerModalMode, setCustomerModalMode] = useState<'view'|'edit'>('view');
  const [orderModalMode, setOrderModalMode] = useState<'view'|'edit'>('view');
  const [invoiceModalMode, setInvoiceModalMode] = useState<'view'|'edit'>('view');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const showConfirm = (title: string, desc: string, action: any, confirmText = 'Ya, Lanjutkan', isDanger = false) => {
    setConfirmModal({ show: true, title, desc, action, confirmText, isDanger });
  };

  const closeConfirm = () => setConfirmModal({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan', isDanger: false });

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/frappe/resource/Sales Invoice?fields=["name","customer","customer_name","posting_date","due_date","grand_total","status","docstatus","creation"]', { cache: 'no-store' });
      const data = await res.json();
      if(data.data) setInvoices(data.data);
    } catch (e) { console.warn("Gagal fetch Sales Invoice"); }
  };

  useEffect(() => { 
    fetchInvoices(); 
  }, []);
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'customers');

  useEffect(() => { if (tabParam) setActiveTab(tabParam); }, [tabParam]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [customerSortField, setCustomerSortField] = useState('creation');
  const [customerSortOrder, setCustomerSortOrder] = useState<'asc' | 'desc'>('desc');
  const [orderSortField, setOrderSortField] = useState('creation');
  const [orderSortOrder, setOrderSortOrder] = useState<'asc' | 'desc'>('desc');
  const [invoiceSortField, setInvoiceSortField] = useState('posting_date');
  const [invoiceSortOrder, setInvoiceSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const handleSmartDelete = (doctype: string, docname: string, docstatus: number) => {
    if (!docname) return;
    showConfirm(`Hapus ${doctype}?`, `Apakah Anda yakin ingin menghapus data ${docname} secara permanen?`, async () => {
        closeConfirm();
        try {
          const { apiDelete } = await import('@/lib/api');
          await apiDelete(doctype, docname);
          showToast(`Data ${doctype} berhasil dihapus dari database!`, 'success');
          refetch(); fetchInvoices();
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      }, "Ya, Hapus Permanen", true
    );
  };

  const handleCancelOrder = (so: any) => {
    showConfirm("Batalkan (Cancel) Pesanan?", "Pesanan yang dibatalkan tidak akan diproses lebih lanjut dan akan mengubah status menjadi Cancelled. Lanjutkan?", async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Sales Order', so.name, { docstatus: 2 });
          showToast(`Pesanan ${so.name} berhasil dibatalkan.`, 'success');
          refetch();
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      }, "Ya, Batalkan Pesanan", true
    );
  };

  const handleCancelInvoice = (inv: any) => {
    showConfirm("Batalkan (Cancel) Faktur?", "Faktur yang dibatalkan akan merubah statusnya menjadi Cancelled dan menghapus piutang pelanggan ini. Lanjutkan?", async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Sales Invoice', inv.name, { docstatus: 2 });
          showToast(`Faktur ${inv.name} berhasil dibatalkan.`, 'success');
          fetchInvoices();
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      }, "Ya, Batalkan Faktur", true
    );
  };

  const handleSOSubmit = (so: any) => {
    showConfirm("Kunci Dokumen Sales Order?", "Mengesahkan (Submit) pesanan berarti pesanan ini sudah final dan disetujui. PENTING: Langkah ini BELUM memotong stok gudang. Stok baru akan terpotong jika Anda membuat Surat Jalan (Delivery Note). Lanjutkan?", async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Sales Order', so.name, { docstatus: 1 });
          showToast(`Berhasil! Sales Order resmi dikunci. Waktunya membuat Surat Jalan di modul Gudang.`, 'success'); 
          refetch(); 
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      }, "Ya, Kunci Pesanan"
    );
  };

  const handleInvoiceSubmit = (inv: any) => {
    showConfirm("Terbitkan Faktur Tagihan?", "Faktur yang sudah diterbitkan (Submit) akan merubah statusnya menjadi Unpaid dan akan dicatat ke dalam piutang perusahaan. Tindakan ini tidak bisa dibatalkan.", async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Sales Invoice', inv.name, { docstatus: 1 });
          showToast(`Faktur berhasil diterbitkan dan siap dikirim ke Klien!`, 'success'); 
          fetchInvoices(); 
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      }, "Terbitkan Faktur"
    );
  };

  const sortedAndFilteredOrders = useMemo(() => {
    let result = [...(salesOrders || [])].map((so: any) => {
      let finalStatus = so.status;
      if (so.docstatus === 1 && so.per_delivered >= 100 && (so.per_billed || 0) >= 100) finalStatus = 'Completed';
      if (so.docstatus === 2) finalStatus = 'Cancelled';
      if (so.docstatus === 0) finalStatus = 'Draft';
      if (so.docstatus === 1 && finalStatus === 'Siap Kirim') finalStatus = 'To Deliver and Bill';
      return { ...so, status: finalStatus };
    });

    if (statusFilter !== 'Semua') result = result.filter(o => o.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => o.customer_name?.toLowerCase().includes(q) || o.name?.toLowerCase().includes(q));
    }

    result.sort((a: any, b: any) => {
      let valA = a[orderSortField] || ''; let valB = b[orderSortField] || '';
      if (orderSortField === 'creation') {
        valA = new Date(a.creation || a.modified || 0).getTime(); valB = new Date(b.creation || b.modified || 0).getTime();
      } else if (orderSortField === 'grand_total') {
        valA = Number(a.grand_total) || 0; valB = Number(b.grand_total) || 0;
      } else { valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); }
      if (valA < valB) return orderSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return orderSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [salesOrders, searchQuery, statusFilter, orderSortField, orderSortOrder]);

  const activeSalesOrders = useMemo(() => sortedAndFilteredOrders.filter((o: any) => o.docstatus === 1 && o.status !== 'Completed'), [sortedAndFilteredOrders]);
  
  const sortedAndFilteredCustomers = useMemo(() => {
    let result = [...(customers || [])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c: any) => c.customer_name?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q));
    }
    result.sort((a: any, b: any) => {
      let valA = a[customerSortField] || ''; let valB = b[customerSortField] || '';
      if (customerSortField === 'creation') {
        valA = new Date(a.creation || a.modified || 0).getTime(); valB = new Date(b.creation || b.modified || 0).getTime();
      } else { valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); }
      if (valA < valB) return customerSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return customerSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [customers, searchQuery, customerSortField, customerSortOrder]);
  
  const sortedAndFilteredInvoices = useMemo(() => {
    let result = [...(invoices || [])].map((inv: any) => {
      let finalStatus = inv.status;
      if (inv.docstatus === 0) finalStatus = 'Draft';
      if (inv.docstatus === 2) finalStatus = 'Cancelled';
      return { ...inv, status: finalStatus };
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((inv: any) => inv.customer_name?.toLowerCase().includes(q) || inv.name?.toLowerCase().includes(q));
    }

    result.sort((a: any, b: any) => {
      let valA = a[invoiceSortField] || ''; let valB = b[invoiceSortField] || '';
      if (invoiceSortField === 'posting_date' || invoiceSortField === 'due_date' || invoiceSortField === 'creation') {
        valA = new Date(valA).getTime(); valB = new Date(valB).getTime();
      } else if (invoiceSortField === 'grand_total') {
        valA = Number(valA) || 0; valB = Number(valB) || 0;
      } else { valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); }
      
      if (valA < valB) return invoiceSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return invoiceSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, searchQuery, invoiceSortField, invoiceSortOrder]);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.4s ease-out', position: 'relative' }}>
      <Toast show={toast.show} message={toast.msg} type={toast.type} />
      <ConfirmModal show={confirmModal.show} title={confirmModal.title} desc={confirmModal.desc} confirmText={confirmModal.confirmText} onConfirm={confirmModal.action} onCancel={closeConfirm} isDanger={confirmModal.isDanger} />

      {showCreateModal && <OrderModal mode="create" onClose={() => setShowCreateModal(false)} customers={customers} items={allItems} warehouses={warehouses} bins={originalBins} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateCustomerModal && <CreateCustomerModal onClose={() => setShowCreateCustomerModal(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateInvoiceModal && <InvoiceModal mode="create" onClose={() => setShowCreateInvoiceModal(false)} customers={customers} items={allItems} orders={activeSalesOrders} warehouses={warehouses} onSuccess={() => fetchInvoices()} showToast={showToast} />}
      
      {selectedCustomer && <DetailCustomerModal customer={selectedCustomer} mode={customerModalMode} onClose={() => setSelectedCustomer(null)} onSuccess={() => refetch()} showToast={showToast} />}
      {selectedOrder && orderModalMode === 'edit' && <OrderModal order={selectedOrder} mode={orderModalMode} onClose={() => setSelectedOrder(null)} customers={customers} items={allItems} warehouses={warehouses} bins={originalBins} onSuccess={() => refetch()} showToast={showToast} />}
      {selectedOrder && orderModalMode === 'view' && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onSubmitOrder={handleSOSubmit} />}
      
      {selectedInvoice && invoiceModalMode === 'edit' && <InvoiceModal invoice={selectedInvoice} mode={invoiceModalMode} onClose={() => setSelectedInvoice(null)} customers={customers} items={allItems} orders={activeSalesOrders} warehouses={warehouses} onSuccess={() => fetchInvoices()} showToast={showToast} />}
      {selectedInvoice && invoiceModalMode === 'view' && <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onSubmitInvoice={handleInvoiceSubmit} />}

      <div className="mobile-flex-col" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Penjualan</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>Kelola Transaksi & Database Pelanggan Anda</p>
        </div>
        <div className="mobile-full-width" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'customers' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" onClick={() => setShowCreateCustomerModal(true)} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}><Plus size={14} /> Daftar Customer Baru</button>}
          {activeTab === 'orders' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" onClick={() => setShowCreateModal(true)} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}><Plus size={14} /> Buat Sales Order (Pesanan)</button>}
          {activeTab === 'invoices' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" onClick={() => setShowCreateInvoiceModal(true)} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}><Plus size={14} /> Buat Faktur Tagihan</button>}
        </div>
      </div>

      <div className="chart-container" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px' }}>
          <div className="mobile-flex-col" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center', gap: '12px' }}>
            <div className="mobile-full-width" style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder={`Cari data berdasarkan nama/ID...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', width: '100%', outline: 'none', transition: 'all 0.2s' }} onFocus={e => e.target.style.borderColor = COLOR_PRIMARY} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>

            {activeTab === 'orders' && (
              <div className="mobile-full-width" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
                {STATUS_FILTERS.map((f) => (
                  <button key={f} className={`filter-pill ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)} style={{ whiteSpace: 'nowrap' }}>
                    {f === 'Semua' ? 'Semua' : getStatusLabel(f)}
                  </button>
                ))}
                <div style={{ borderLeft: '1px solid #e5e7eb', height: '24px', margin: '0 8px' }} />
                <Filter size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <select value={orderSortField} onChange={e => setOrderSortField(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', outline: 'none', color: '#4B5563', fontWeight: 600, background: '#f9fafb' }}>
                  <option value="creation">Paling Baru</option>
                  <option value="customer_name">Customer Name</option>
                  <option value="grand_total">Grand Total</option>
                  <option value="delivery_date">Delivery Date</option>
                </select>
                <select value={orderSortOrder} onChange={e => setOrderSortOrder(e.target.value as any)} style={{ border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', outline: 'none', color: '#4B5563', fontWeight: 600, background: '#f9fafb' }}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            )}
            
            {activeTab === 'customers' && (
              <div className="mobile-full-width" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
                <Filter size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select value={customerSortField} onChange={e => setCustomerSortField(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', outline: 'none', color: '#4B5563', fontWeight: 600, background: '#f9fafb' }}>
                    <option value="creation">Paling Baru</option>
                    <option value="name">ID / Name</option>
                    <option value="customer_name">Customer Name</option>
                    <option value="customer_group">Customer Group</option>
                    <option value="territory">Territory</option>
                  </select>
                  <select value={customerSortOrder} onChange={e => setCustomerSortOrder(e.target.value as any)} style={{ border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', outline: 'none', color: '#4B5563', fontWeight: 600, background: '#f9fafb' }}>
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="mobile-full-width" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
                <Filter size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select value={invoiceSortField} onChange={e => setInvoiceSortField(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', outline: 'none', color: '#4B5563', fontWeight: 600, background: '#f9fafb' }}>
                    <option value="creation">Paling Baru</option>
                    <option value="posting_date">Date (Posting Date)</option>
                    <option value="due_date">Payment Due Date</option>
                    <option value="customer_name">Customer Name</option>
                    <option value="grand_total">Grand Total</option>
                    <option value="name">ID Faktur</option>
                  </select>
                  <select value={invoiceSortOrder} onChange={e => setInvoiceSortOrder(e.target.value as any)} style={{ border: '1px solid #e5e7eb', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', outline: 'none', color: '#4B5563', fontWeight: 600, background: '#f9fafb' }}>
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'orders' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Customer Name</th>
                    <th>Status</th>
                    <th>Delivery Date</th>
                    <th style={{ textAlign: 'right' }}>Grand Total</th>
                    <th style={{ textAlign: 'center' }}>% Delivered</th>
                    <th style={{ textAlign: 'center' }}>% Amount Billed</th>
                    <th>ID</th>
                    <th style={{ width: '150px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredOrders.map((order: any, index: number) => {
                     const status = order.status;
                     return (
                    <tr key={order.name} style={{ cursor: 'pointer' }} onClick={() => { setSelectedOrder(order); setOrderModalMode('view'); }}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                      <td style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{order.customer_name}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>{formatDate(order.delivery_date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{formatUang(order.grand_total)}</td>
                      <td style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>{Math.round(order.per_delivered || 0)}%</td>
                      <td style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>{Math.round(order.per_billed || 0)}%</td>
                      <td>
                        <div style={{ color: '#6B7280', fontSize: '12px' }}>{order.name}</div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {/* JIKA DRAFT */}
                          {order.docstatus === 0 && <button onClick={() => handleSOSubmit(order)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none' }} title="Setujui Pesanan Ini"><Send size={12}/> Submit</button>}
                          {order.docstatus === 0 && <button onClick={() => { setSelectedOrder(order); setOrderModalMode('edit'); }} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Edit Draft"><Edit size={14} /></button>}
                          {order.docstatus === 0 && <button onClick={() => handleSmartDelete('Sales Order', order.name, order.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus Permanen"><Trash2 size={14} /></button>}
                          
                          {/* JIKA SUBMITTED (To Deliver) */}
                          {order.docstatus === 1 && order.status !== 'Completed' && <button onClick={() => { setSelectedOrder(order); setOrderModalMode('view'); }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Detail"><Eye size={14} /></button>}
                          {order.docstatus === 1 && order.status !== 'Completed' && <button onClick={() => handleCancelOrder(order)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Batalkan Pesanan (Cancel)"><X size={14} /></button>}
                          
                          {/* JIKA COMPLETED */}
                          {order.docstatus === 1 && order.status === 'Completed' && <button onClick={() => { setSelectedOrder(order); setOrderModalMode('view'); }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Detail"><Eye size={14} /></button>}
                          
                          {/* JIKA CANCELLED */}
                          {order.docstatus === 2 && <button onClick={() => { setSelectedOrder(order); setOrderModalMode('view'); }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Detail"><Eye size={14} /></button>}
                          {order.docstatus === 2 && <button onClick={() => handleSmartDelete('Sales Order', order.name, order.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus Permanen"><Trash2 size={14} /></button>}
                        </div>
                      </td>
                    </tr>
                  )})}
                  {sortedAndFilteredOrders.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Tidak ada data Sales Order yang ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'customers' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>Customer Name</th>
                    <th>Status</th>
                    <th>Customer Group</th>
                    <th>Territory</th>
                    <th>Billing Currency</th>
                    <th>ID</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredCustomers.map((c: any, index) => {
                    const parsedMeta = parseMeta(c.customer_details);
                    return (
                    <tr key={c.name} style={{ cursor: 'pointer' }} onClick={() => { setSelectedCustomer(c); setCustomerModalMode('view'); }}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '13px' }}>{c.customer_name}</div>
                      </td>
                      <td><span className={`badge ${c.disabled ? 'badge-danger' : 'badge-success'}`}>{c.disabled ? 'Disabled' : 'Active'}</span></td>
                      <td><div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 500 }}>{c.customer_group || '-'}</div></td>
                      <td><div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 500 }}>{c.territory || '-'}</div></td>
                      <td><div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 500 }}>{c.default_currency || 'IDR'}</div></td>
                      <td><div style={{ fontSize: '12px', color: '#6B7280' }}>{c.name}</div></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => { setSelectedCustomer(c); setCustomerModalMode('view'); }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Detail"><Eye size={14} /></button>
                          <button onClick={() => { setSelectedCustomer(c); setCustomerModalMode('edit'); }} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Edit"><Edit size={14} /></button>
                          <button onClick={() => handleSmartDelete('Customer', c.name, 0)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {sortedAndFilteredCustomers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada data Customer yang terdaftar.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '800px' }}>
                <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Customer Name</th><th>Status</th><th>Date</th><th>Payment Due Date</th><th style={{ textAlign: 'right' }}>Grand Total</th><th>ID</th><th style={{ width: '150px', textAlign: 'center' }}>Tindakan</th></tr></thead>
                <tbody>
                  {sortedAndFilteredInvoices.map((inv: any, index) => {
                     const status = inv.status || 'Draft';
                     return (
                    <tr key={inv.name} style={{ cursor: 'pointer' }} onClick={() => { setSelectedInvoice(inv); setInvoiceModalMode('view'); }}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                      <td><div style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>{inv.customer_name}</div></td>
                      <td><span className={`badge ${status === 'Paid' ? 'badge-success' : status === 'Unpaid' ? 'badge-warning' : status === 'Cancelled' ? 'badge-danger' : 'badge-gray'}`}>{status}</span></td>
                      <td><div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>{formatDate(inv.posting_date)}</div></td>
                      <td><div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>{formatDate(inv.due_date || inv.posting_date)}</div></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{formatUang(inv.grand_total)}</td>
                      <td><div style={{ color: '#6B7280', fontSize: '12px', fontWeight: 600 }}>{inv.name}</div></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {inv.docstatus === 0 && <button onClick={() => handleInvoiceSubmit(inv)} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }} title="Terbitkan Faktur"><Send size={12}/> Submit</button>}
                          <button onClick={() => { setSelectedInvoice(inv); setInvoiceModalMode('view'); }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Detail"><Eye size={14} /></button>
                          {inv.docstatus === 0 && <button onClick={() => { setSelectedInvoice(inv); setInvoiceModalMode('edit'); }} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Edit Draft"><Edit size={14} /></button>}
                          {inv.docstatus === 0 && <button onClick={() => handleSmartDelete('Sales Invoice', inv.name, inv.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>}
                          {inv.docstatus === 1 && <button onClick={() => handleCancelInvoice(inv)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Batalkan Faktur (Cancel)"><X size={14} /></button>}
                          {inv.docstatus === 2 && <button onClick={() => handleSmartDelete('Sales Invoice', inv.name, inv.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus Permanen"><Trash2 size={14} /></button>}
                        </div>
                      </td>
                    </tr>
                  )})}
                  {sortedAndFilteredInvoices.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada data Faktur (Invoice).</td></tr>}
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
        
        .filter-pill { background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .filter-pill:hover { background: #e2e8f0; color: #334155; }
        .filter-pill.active { background: #e0f2fe; border-color: ${COLOR_PRIMARY}; color: ${COLOR_PRIMARY}; }
        
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

export default function SellingPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  useEffect(() => { if (!canAccess('selling' as any)) router.push('/dashboard'); }, [canAccess, router]);
  return (<Suspense fallback={<div>Loading...</div>}><SellingPageContent /></Suspense>);
}