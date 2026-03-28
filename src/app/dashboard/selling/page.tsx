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
import type { SalesOrder, Customer } from '@/lib/frappe-types';

const STATUS_FILTERS = ['Semua', 'Draft', 'To Deliver and Bill', 'Completed', 'Cancelled'];
const FIXED_COMPANY = 'PT Artavista';
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

const getSimulatedStock = (itemCode: string, warehouse: string, originalBins: any[], localLedger: Record<string, number>) => {
  const key = `${itemCode}_${warehouse}`;
  const bin = originalBins.find((b: any) => b.item_code === itemCode && b.warehouse === warehouse);
  const originalQty = bin ? Number(bin.actual_qty) : 0;
  const mockAdjustment = localLedger[key] || 0;
  return originalQty + mockAdjustment;
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
      await apiCreate('Customer', { customer_name: form.customer_name, customer_type: form.customer_type });
      const savedDetails = JSON.parse(localStorage.getItem('erp_mock_customer_details') || '{}');
      savedDetails[form.customer_name] = { ...form };
      localStorage.setItem('erp_mock_customer_details', JSON.stringify(savedDetails));
      showToast('Data Customer berhasil didaftarkan!', 'success'); 
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Customer')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '800px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Tambah Customer Baru</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Daftarkan data pembeli atau klien ke dalam sistem.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div className="responsive-grid" style={{ gap: '32px' }}>
            <div>
              <h3 className="section-title"><Briefcase size={14}/> Profil Utama</h3>
              <div className="form-group">
                <label className="erp-label">Customer Type (Tipe Pelanggan) *</label>
                <select className="erp-input" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
                  <option value="Company">Company (Perusahaan/B2B)</option>
                  <option value="Individual">Individual (Perorangan/B2C)</option>
                </select>
                <p className="helper-text">Pilih Company jika pelanggan berupa entitas PT/CV.</p>
              </div>
              <div className="form-group">
                <label className="erp-label">Customer Name (Nama Lengkap) *</label>
                <input required type="text" className="erp-input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value.replace(/[^a-zA-Z0-9\s.,]/g, '') }))} placeholder="Cth: PT Distribusi Teknologi" />
              </div>
              <h3 className="section-title" style={{ marginTop: '24px' }}><User size={14}/> Kontak Perwakilan (PIC)</h3>
              <div className="responsive-grid">
                <div className="form-group"><label className="erp-label">First Name (Nama Depan)</label><input type="text" className="erp-input" value={form.map_to_first_name} onChange={e => setForm(f => ({ ...f, map_to_first_name: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))} placeholder="Cth: Budi" /></div>
                <div className="form-group"><label className="erp-label">Last Name (Nama Belakang)</label><input type="text" className="erp-input" value={form.map_to_last_name} onChange={e => setForm(f => ({ ...f, map_to_last_name: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))} placeholder="Cth: Santoso" /></div>
              </div>
              <div className="form-group"><label className="erp-label">Email Address</label><input type="email" className="erp-input" value={form.email_address} onChange={e => setForm(f => ({ ...f, email_address: e.target.value }))} placeholder="budi@email.com" /></div>
              <div className="form-group"><label className="erp-label">Mobile Number (No. HP/WA)</label><input type="text" className="erp-input" value={form.mobile_number} onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="081234567890" /></div>
            </div>
            <div>
              <h3 className="section-title"><MapPin size={14}/> Alamat Pengiriman/Tagihan</h3>
              <div className="form-group"><label className="erp-label">Address Line 1 (Jalan Utama)</label><input type="text" className="erp-input" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} placeholder="Jl. Sudirman No. 123" /></div>
              <div className="form-group"><label className="erp-label">Address Line 2 (Gedung/Lantai)</label><input type="text" className="erp-input" value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))} placeholder="Gedung Cyber Lantai 5" /></div>
              <div className="responsive-grid">
                <div className="form-group"><label className="erp-label">City (Kota)</label><input type="text" className="erp-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))} placeholder="Jakarta Selatan" /></div>
                <div className="form-group"><label className="erp-label">State (Provinsi)</label><input type="text" className="erp-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))} placeholder="DKI Jakarta" /></div>
              </div>
              <div className="responsive-grid">
                <div className="form-group"><label className="erp-label">ZIP Code (Kode Pos)</label><input type="text" className="erp-input" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="12345" /></div>
                <div className="form-group"><label className="erp-label">Country (Negara)</label><input type="text" className="erp-input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))} /></div>
              </div>
            </div>
          </div>
          {error && <div className="error-box"><AlertCircle size={16}/> {error}</div>}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary mobile-btn" style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailCustomerModal({ customer, onClose, onSuccess, showToast }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [form, setForm] = useState({ disabled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        const res = await fetch(`/api/frappe/resource/Customer/${encodeURIComponent(customer.name)}`, { cache: 'no-store' });
        const data = await res.json();
        
        // Merge with local storage details (karena kita mock creation address & contact di local)
        const localDetailsMap = JSON.parse(localStorage.getItem('erp_mock_customer_details') || '{}');
        const localData = localDetailsMap[customer.customer_name] || {};
        
        const merged = { ...localData, ...data.data, disabled: data.data?.disabled || customer.disabled || 0 };
        setFullData(merged);
        setForm({ disabled: merged.disabled });
      } catch (e) {
        setFullData({ customer_type: customer.customer_type || 'Company', customer_name: customer.customer_name || '', disabled: customer.disabled || 0 });
        setForm({ disabled: customer.disabled || 0 });
      } finally { setIsLoading(false); }
    };
    fetchFullData();
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Customer', customer.name, { disabled: form.disabled });
      showToast('Status Customer berhasil diperbarui!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ background: '#f8f9fb', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>{fullData?.customer_name}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge ${fullData?.disabled ? 'badge-danger' : 'badge-success'}`}>{fullData?.disabled ? 'Diblokir / Non-Aktif' : 'Aktif Bertransaksi'}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>ID: {fullData?.name || customer.name}</span>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="responsive-grid" style={{ gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                  <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0 }}><User size={14}/> Informasi Kontak</h3>
                  <div className="responsive-grid" style={{ marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Tipe Pelanggan</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{fullData?.customer_type || 'Company'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Phone / Mobile</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{fullData?.mobile_number || fullData?.mobile_no || '-'}</p>
                    </div>
                  </div>
                  <div className="responsive-grid" style={{ marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Nama Depan (PIC)</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{fullData?.map_to_first_name || '-'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Nama Belakang (PIC)</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{fullData?.map_to_last_name || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Email Address</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: COLOR_PRIMARY }}>{fullData?.email_address || '-'}</p>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                  <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0 }}><MapPin size={14}/> Alamat Terdaftar</h3>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Alamat Lengkap</p>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#374151', lineHeight: 1.5 }}>
                      {fullData?.address_line1 ? (
                        <>{fullData.address_line1}<br/>{fullData.address_line2}</>
                      ) : '-'}
                    </p>
                  </div>
                  <div className="responsive-grid">
                    <div>
                      <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Kota / Provinsi</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{fullData?.city || '-'}, {fullData?.state || '-'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>Negara / Kode Pos</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{fullData?.country || 'Indonesia'} {fullData?.pincode || ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ background: '#f8f9fb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 className="section-title" style={{ fontSize: '13px', marginTop: 0, border: 'none' }}><Briefcase size={14}/> Manajemen Status</h3>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="erp-label">Ubah Status Pelanggan</label>
                  <select className="erp-input" value={form.disabled} onChange={e => setForm({ disabled: Number(e.target.value) })}>
                    <option value={0}>Active (Bisa bertransaksi)</option>
                    <option value={1}>Disabled (Diblokir/Tidak aktif)</option>
                  </select>
                  <p className="helper-text">Ubah ke Disabled jika customer bermasalah atau tidak aktif lagi.</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ background: COLOR_PRIMARY }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL SALES ORDER
// ==========================================
function CreateOrderModal({ onClose, customers, items, warehouses, originalBins, localLedger, onSuccess, showToast }: any) {
  const [form, setForm] = useState({ customer: '', transaction_date: new Date().toISOString().split('T')[0], delivery_date: new Date().toISOString().split('T')[0], warehouse: 'Finished Goods - NV', item_code: '', qty: '', rate: '', amount: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group && (w.company === FIXED_COMPANY || w.name.includes('NV'))), [warehouses]);

  const availableStock = useMemo(() => {
    if (!form.item_code || !form.warehouse) return 0;
    return getSimulatedStock(form.item_code, form.warehouse, originalBins, localLedger);
  }, [form.item_code, form.warehouse, originalBins, localLedger]);

  const isStockShort = Number(form.qty || 0) > availableStock;

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; const selected = items.find((i: any) => i.item_code === val);
    setForm(f => ({ ...f, item_code: val, rate: String(selected?.standard_rate || 0), amount: (selected?.standard_rate || 0) * Number(f.qty || 0) }));
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    if (val.includes('-') || Number(val) < 0) return setError('❌ Ditolak: Quantity tidak boleh minus!');
    setError(''); setForm(f => ({ ...f, qty: val, amount: Number(val) * Number(f.rate || 0) })); 
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    if (val.includes('-') || Number(val) < 0) return setError('❌ Ditolak: Harga (Rate) tidak boleh bernilai minus!');
    setError(''); setForm(f => ({ ...f, rate: val, amount: Number(f.qty || 0) * Number(val) })); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (isStockShort) return setError(`❌ Stok Kurang! Sisa stok di gudang hanya ${availableStock}.`);
    if (Number(form.qty) <= 0 || Number(form.rate) <= 0) return setError('Nilai Qty dan Harga harus lebih dari 0.');
    
    setIsSubmitting(true); setError('');
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const salesOrderData = { 
        customer: form.customer, transaction_date: form.transaction_date, delivery_date: form.delivery_date, company: FIXED_COMPANY, currency: 'IDR', 
        items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), warehouse: form.warehouse, amount: form.amount }] 
      };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Sales Order', salesOrderData);
      showToast('Sales Order berhasil dibuat dalam status DRAFT!', 'success'); 
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Sales Order')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Sales Order Baru</h2>
            <p style={{ fontSize: '11px', color: '#6B7280' }}>Sales Order (SO) adalah dokumen pesanan internal. Belum mengurangi stok fisik.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} color="#6B7280"/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div className="form-group">
            <label className="erp-label">Customer (Pembeli) *</label>
            <select required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="erp-input">
              <option value="">Pilih pelanggan yang sudah terdaftar...</option>{customers.map((c:any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
            </select>
          </div>
          
          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">Transaction Date (Tgl Pesan) *</label>
              <input type="date" required className="erp-input" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="erp-label">Delivery Date (Tgl Kirim Target) *</label>
              <input type="date" required className="erp-input" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} />
              <p className="helper-text">Kapan barang ini harus sampai ke customer?</p>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Package size={16} color={COLOR_PRIMARY} />
              <p className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Item Pesanan & Pengecekan Stok</p>
            </div>
            
            <div className="responsive-grid" style={{ marginBottom: '10px' }}>
              <div className="form-group">
                <label className="erp-label">Ambil Dari Gudang Mana? *</label>
                <select required className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}>
                  <option value="">Pilih Gudang...</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="erp-label">Model Barang *</label>
                <select required className="erp-input" value={form.item_code} onChange={handleItemChange}>
                  <option value="">Pilih Item dari Katalog...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
                </select>
              </div>
            </div>
            
            {form.item_code && (
              <div style={{ background: isStockShort ? '#fee2e2' : '#f0fdf4', border: `1px solid ${isStockShort ? '#ef4444' : '#22c55e'}`, padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isStockShort ? '#b91c1c' : '#166534', display: 'block' }}>Stok Fisik di Gudang:</span>
                  {isStockShort && <span style={{ fontSize: '10px', color: '#ef4444' }}>Stok tidak cukup untuk pesanan ini!</span>}
                </div>
                <span style={{ fontSize: '20px', fontWeight: 800, color: isStockShort ? '#ef4444' : '#16a34a' }}>{availableStock} Unit</span>
              </div>
            )}

            <div className="responsive-grid-3">
              <div className="form-group">
                <label className="erp-label">Qty (Jumlah) *</label>
                <input type="number" step="any" min="1" required className="erp-input" value={form.qty} onChange={handleQtyChange} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="erp-label">Rate (Harga Satuan) *</label>
                <input type="number" step="any" min="1" required className="erp-input" value={form.rate} onChange={handleRateChange} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="erp-label">Total Amount</label>
                <input type="text" readOnly className="erp-input disabled-input" style={{ fontWeight: 800, color: COLOR_PRIMARY, background: '#eff6ff' }} value={formatUang(form.amount)} />
              </div>
            </div>
          </div>

          {error && <div className="error-box"><AlertCircle size={16}/> {error}</div>}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting || isStockShort} style={{ background: isStockShort ? '#9CA3AF' : COLOR_PRIMARY, borderColor: isStockShort ? '#9CA3AF' : COLOR_PRIMARY }}>
              {isStockShort ? 'Stok Tidak Cukup' : isSubmitting ? 'Memproses...' : 'Simpan Sebagai Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
                <thead><tr><th>Kode Produk</th><th>Nama Produk</th><th style={{ textAlign: 'right' }}>Jumlah (Qty)</th><th style={{ textAlign: 'right' }}>Harga Satuan</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
                <tbody>
                  {(fullData?.items || []).map((item: any, i: number) => (
                    <tr key={i}>
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
// 3. MODALS FOR SALES INVOICE
// ==========================================
function CreateInvoiceModal({ onClose, customers, items, orders, onSuccess, onLink, showToast }: any) {
  const [form, setForm] = useState({ 
    customer: '', company: FIXED_COMPANY, 
    posting_date: new Date().toISOString().split('T')[0], 
    posting_time: getCurrentTimeForInput(),
    item_code: '', qty: '1', rate: '', amount: 0, linked_so: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          ...f, customer: soData.customer, item_code: firstItem.item_code || '', qty: firstItem.qty ? String(firstItem.qty) : '1', rate: firstItem.rate ? String(firstItem.rate) : '', amount: firstItem.amount || 0,
        }));
        showToast('Data otomatis ditarik dari Sales Order!', 'info');
      }
    } catch (err) {}
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; const selected = items.find((i: any) => i.item_code === val); const newRate = selected?.standard_rate || 0;
    setForm(f => ({ ...f, item_code: val, rate: String(newRate), amount: newRate * Number(f.qty || 0) }));
  };
  
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    if (val.includes('-') || Number(val) < 0) return setError('❌ Ditolak: Quantity tidak boleh bernilai minus!');
    setError(''); setForm(f => ({ ...f, qty: val, amount: Number(val) * Number(f.rate || 0) })); 
  };
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const val = e.target.value; 
    if (val.includes('-') || Number(val) < 0) return setError('❌ Ditolak: Harga (Rate) tidak boleh bernilai minus!');
    setError(''); setForm(f => ({ ...f, rate: val, amount: Number(f.qty || 0) * Number(val) })); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (Number(form.qty) <= 0) return setError('Quantity harus lebih dari 0.');
    if (Number(form.rate) <= 0) return setError('Harga (Rate) harus lebih dari 0.');
    
    setIsSubmitting(true); setError('');
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const invoiceData = { 
        customer: form.customer, posting_date: form.posting_date, posting_time: form.posting_time, company: form.company, currency: 'IDR', 
        items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), amount: form.amount }] 
      };
      const { apiCreate } = await import('@/lib/api');
      const res: any = await apiCreate('Sales Invoice', invoiceData);
      
      const newInvName = res?.data?.name || res?.name;
      if (form.linked_so && newInvName) onLink(newInvName, form.linked_so);

      showToast('Faktur Tagihan (Sales Invoice) berhasil dibuat dalam status Draft.', 'success'); 
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, 'Gagal membuat Sales Invoice')); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '540px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Faktur Penagihan (Invoice)</h2>
            <p style={{ fontSize: '11px', color: '#6B7280' }}>Faktur digunakan untuk menagih pembayaran ke customer.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280"/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '10px', border: '1px dashed #bfdbfe' }}>
            <label className="erp-label" style={{ color: COLOR_PRIMARY, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LinkIcon size={14}/> Tarik Cepat Data dari Sales Order
            </label>
            <select className="erp-input" value={form.linked_so} onChange={handleSOChange}>
              <option value="">-- Pilih Sales Order yang mau ditagih --</option>
              {orders.map((o: any) => <option key={o.name} value={o.name}>{o.name} - {o.customer_name}</option>)}
            </select>
            <p className="helper-text" style={{ color: '#1e40af', marginTop: '6px' }}>Lebih mudah! Data barang dan harga akan otomatis terisi mengikuti order aslinya.</p>
          </div>

          <div className="form-group">
            <label className="erp-label">Customer Tujuan Tagihan *</label>
            <select required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className="erp-input">
              <option value="">Pilih customer...</option>{customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
            </select>
          </div>

          <div className="responsive-grid">
            <div className="form-group">
              <label className="erp-label">Tanggal Terbit *</label>
              <input type="date" required className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="erp-label">Waktu Terbit *</label>
              <input type="time" step="1" required className="erp-input" value={form.posting_time} onChange={e => setForm(f => ({ ...f, posting_time: e.target.value }))} />
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            <p className="section-title">Detail Barang yang Ditagih</p>
            <div className="form-group"><label className="erp-label">Produk / Jasa *</label><select required className="erp-input" value={form.item_code} onChange={handleItemChange}><option value="">Pilih Item...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}</select></div>
            <div className="responsive-grid-3">
              <div className="form-group">
                <label className="erp-label">Jumlah (Qty)</label>
                <input type="number" required placeholder="0" min="1" step="any" className="erp-input" value={form.qty} onChange={handleQtyChange} />
              </div>
              <div className="form-group">
                <label className="erp-label">Harga per Unit</label>
                <input type="number" required placeholder="0" min="1" step="any" className="erp-input" value={form.rate} onChange={handleRateChange} />
              </div>
              <div className="form-group">
                <label className="erp-label">Total Tagihan</label>
                <input type="text" readOnly className="erp-input disabled-input" style={{ fontWeight: 800, color: COLOR_PRIMARY, background: '#eff6ff' }} value={formatUang(form.amount)} />
              </div>
            </div>
          </div>
          {error && <div className="error-box"><AlertCircle size={16}/> {error}</div>}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" disabled={isSubmitting}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}>{isSubmitting ? 'Memproses...' : 'Simpan Draft Faktur'}</button>
          </div>
        </form>
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
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
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
                <thead><tr><th>Kode/Item</th><th>Nama Item</th><th style={{ textAlign: 'right' }}>Jumlah</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
                <tbody>
                  {(fullData?.items || []).map((item: any, i: number) => (
                    <tr key={i}>
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
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, desc: string, action: any, confirmText?: string }>({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const showConfirm = (title: string, desc: string, action: any, confirmText = 'Ya, Lanjutkan') => {
    setConfirmModal({ show: true, title, desc, action, confirmText });
  };

  const closeConfirm = () => setConfirmModal({ show: false, title: '', desc: '', action: null, confirmText: 'Ya, Lanjutkan' });

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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const [localDocStatus, setLocalDocStatus] = useState<Record<string, number>>({});
  const [localSOProgress, setLocalSOProgress] = useState<Record<string, { delivered: number, billed: number }>>({});
  const [invoiceLinks, setInvoiceLinks] = useState<Record<string, string>>({});
  const [localLedger, setLocalLedger] = useState<Record<string, number>>({});
  const [hiddenDocs, setHiddenDocs] = useState<string[]>([]);

  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_selling_status');
    if (savedStatus) { try { setLocalDocStatus(JSON.parse(savedStatus)); } catch (e) {} }
    const savedProgress = localStorage.getItem('erp_mock_so_progress');
    if (savedProgress) { try { setLocalSOProgress(JSON.parse(savedProgress)); } catch (e) {} }
    const savedLinks = localStorage.getItem('erp_mock_invoice_links');
    if (savedLinks) { try { setInvoiceLinks(JSON.parse(savedLinks)); } catch (e) {} }
    const stockLedger = localStorage.getItem('erp_mock_stock_ledger');
    if (stockLedger) { try { setLocalLedger(JSON.parse(stockLedger)); } catch (e) {} }
    const hDocs = localStorage.getItem('erp_mock_hidden_docs');
    if (hDocs) { try { setHiddenDocs(JSON.parse(hDocs)); } catch (e) {} }
  }, []);

  const addHiddenDoc = (docname: string) => {
    setHiddenDocs(prev => {
      if (prev.includes(docname)) return prev;
      const next = [...prev, docname];
      localStorage.setItem('erp_mock_hidden_docs', JSON.stringify(next));
      return next;
    });
  };

  const handleSmartDelete = (doctype: string, docname: string, docstatus: number) => {
    if (!docname) return;

    showConfirm(
      `Hapus ${doctype}?`, 
      `Apakah Anda yakin ingin menghapus data ${docname} dari server secara permanen? Peringatan: Dokumen yang sudah terhubung dengan transaksi lain akan ditolak oleh sistem.`,
      async () => {
        closeConfirm();
        try {
          const { apiUpdate, apiDelete } = await import('@/lib/api');
          if (docstatus === 1) {
             await apiUpdate(doctype, docname, { docstatus: 2 }); 
          }
          await apiDelete(doctype, docname);
          showToast(`Data ${doctype} berhasil dihapus dari database!`, 'success');
          addHiddenDoc(docname);
          refetch(); fetchInvoices();
        } catch (err: any) { 
          showToast(extractFrappeError(err), 'error');
        }
      },
      "Ya, Hapus Permanen"
    );
  };

  const handleSOSubmit = (so: any) => {
    showConfirm(
      "Kunci Dokumen Sales Order?",
      "Mengesahkan (Submit) pesanan berarti pesanan ini sudah final dan disetujui. PENTING: Langkah ini BELUM memotong stok gudang. Stok baru akan terpotong jika Anda membuat Surat Jalan (Delivery Note). Lanjutkan?",
      async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Sales Order', so.name, { docstatus: 1 });
          setLocalDocStatus(prev => { const next = { ...prev, [so.name]: 1 }; localStorage.setItem('erp_mock_selling_status', JSON.stringify(next)); return next; });
          showToast(`Berhasil! Sales Order resmi dikunci. Waktunya membuat Surat Jalan di modul Gudang.`, 'success'); 
          refetch(); 
        } catch (err: any) { 
          showToast(extractFrappeError(err), 'error');
        }
      },
      "Ya, Kunci Pesanan"
    );
  };

  const handleInvoiceSubmit = (inv: any) => {
    showConfirm(
      "Terbitkan Faktur Tagihan?",
      "Faktur yang sudah diterbitkan (Submit) akan merubah statusnya menjadi Unpaid dan akan dicatat ke dalam piutang perusahaan. Tindakan ini tidak bisa dibatalkan.",
      async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Sales Invoice', inv.name, { docstatus: 1 });
          
          setLocalDocStatus(prev => { const next = { ...prev, [inv.name]: 1 }; localStorage.setItem('erp_mock_selling_status', JSON.stringify(next)); return next; });
          
          const linkedSOName = invoiceLinks[inv.name];
          if (linkedSOName) {
            setLocalSOProgress(prev => {
              const current = prev[linkedSOName] || { delivered: 0, billed: 0 };
              const next = { ...prev, [linkedSOName]: { ...current, billed: 100 } };
              localStorage.setItem('erp_mock_so_progress', JSON.stringify(next)); return next;
            });
          }

          showToast(`Faktur berhasil diterbitkan dan siap dikirim ke Klien!`, 'success'); 
          fetchInvoices(); 
        } catch (err: any) { 
          showToast(extractFrappeError(err), 'error');
        }
      },
      "Terbitkan Faktur"
    );
  };

  const sortedSalesOrders = useMemo(() => {
    return [...(salesOrders as any[])]
      .filter((so: any) => !hiddenDocs.includes(so.name))
      .sort((a: any, b: any) => new Date(b.creation || 0).getTime() - new Date(a.creation || 0).getTime())
      .map((so: any) => {
      const localStatus = localDocStatus[so.name];
      const progress = localSOProgress[so.name] || { delivered: 0, billed: 0 };
      let finalDelivered = progress.delivered > 0 ? progress.delivered : (so.per_delivered || 0);
      let finalBilled = progress.billed > 0 ? progress.billed : (so.per_billed || 0);
      let finalStatus = so.status;
      let finalDocstatus = so.docstatus;

      if (localStatus !== undefined) {
         finalDocstatus = localStatus;
         if (localStatus === 1) finalStatus = 'To Deliver and Bill'; 
         if (localStatus === 2) finalStatus = 'Cancelled';
      }
      if (finalDocstatus === 1 && finalDelivered >= 100 && finalBilled >= 100) finalStatus = 'Completed';
      
      return { ...so, docstatus: finalDocstatus, status: finalStatus, per_delivered: finalDelivered, per_billed: finalBilled };
    });
  }, [salesOrders, localDocStatus, localSOProgress, hiddenDocs]);

  const activeSalesOrders = useMemo(() => sortedSalesOrders.filter((o: any) => o.docstatus === 1 && o.status !== 'Completed'), [sortedSalesOrders]);
  
  const filteredCustomers = customers.filter((c: any) => !hiddenDocs.includes(c.name) && (!searchQuery || c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())));
  
  const filteredOrders = sortedSalesOrders.filter((o: any) => {
    if (statusFilter !== 'Semua' && o.status !== statusFilter) return false;
    if (searchQuery && !o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !o.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  const filteredInvoices = invoices.filter((inv: any) => !hiddenDocs.includes(inv.name) && (!searchQuery || inv.name.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.4s ease-out', position: 'relative' }}>
      <Toast show={toast.show} message={toast.msg} type={toast.type} />
      <ConfirmModal show={confirmModal.show} title={confirmModal.title} desc={confirmModal.desc} confirmText={confirmModal.confirmText} onConfirm={confirmModal.action} onCancel={closeConfirm} />

      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} customers={customers} items={allItems} warehouses={warehouses} originalBins={originalBins} localLedger={localLedger} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateCustomerModal && <CreateCustomerModal onClose={() => setShowCreateCustomerModal(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateInvoiceModal && <CreateInvoiceModal onClose={() => setShowCreateInvoiceModal(false)} customers={customers} items={allItems} orders={activeSalesOrders} onSuccess={() => fetchInvoices()} onLink={(inv: any, so: any) => setInvoiceLinks(prev => { const next = {...prev, [inv]: so}; localStorage.setItem('erp_mock_invoice_links', JSON.stringify(next)); return next; })} showToast={showToast} />}
      
      {selectedCustomer && <DetailCustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSuccess={() => refetch()} showToast={showToast} />}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onSubmitOrder={handleSOSubmit} />}
      {selectedInvoice && <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onSubmitInvoice={handleInvoiceSubmit} />}

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
                <Filter size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                {STATUS_FILTERS.map((f) => (
                  <button key={f} className={`filter-pill ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)} style={{ whiteSpace: 'nowrap' }}>
                    {f === 'Semua' ? 'Semua' : getStatusLabel(f)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'orders' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                    <th>ID & Tgl Pesan</th>
                    <th>Customer Pembeli</th>
                    <th>Status Pesanan</th>
                    <th>Target Kirim</th>
                    <th style={{ textAlign: 'right' }}>Total Transaksi</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any, index: number) => {
                     const status = order.status;
                     return (
                    <tr key={order.name}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div style={{ color: COLOR_SECONDARY, fontWeight: 800, fontSize: '13px' }}>{order.name}</div>
                        {order.creation && <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>Dibuat: {formatDate(order.creation)}</div>}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{order.customer_name}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(status)}`}>{getStatusLabel(status)}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} color="#9CA3AF" /> {formatDate(order.delivery_date)}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{formatUang(order.grand_total)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {order.docstatus === 0 && <button onClick={() => handleSOSubmit(order)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none' }} title="Setujui Pesanan Ini"><Send size={12}/> Submit</button>}
                          <button onClick={() => setSelectedOrder(order)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Detail"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('Sales Order', order.name, order.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {filteredOrders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Tidak ada data Sales Order yang ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'customers' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '700px' }}>
                <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Nama Perusahaan / Klien</th><th>Status Akun</th><th>Kontak Darurat</th><th style={{ width: '100px', textAlign: 'center' }}>Tindakan</th></tr></thead>
                <tbody>
                  {filteredCustomers.map((c: any, index) => {
                    const localData = JSON.parse(localStorage.getItem('erp_mock_customer_details') || '{}')[c.customer_name] || {};
                    return (
                    <tr key={c.name} style={{ cursor: 'pointer' }} onClick={() => setSelectedCustomer(c)}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{c.customer_name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>ID: {c.name}</div>
                      </td>
                      <td><span className={`badge ${c.disabled ? 'badge-danger' : 'badge-success'}`}>{c.disabled ? 'Diblokir' : 'Aktif Bertransaksi'}</span></td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>{localData.mobile_number || c.mobile_no || '-'}</div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => setSelectedCustomer(c)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Lihat Detail & Edit"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('Customer', c.name, 0)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada data Customer yang terdaftar.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ minWidth: '800px' }}>
                <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>ID Faktur</th><th>Ditagihkan Kepada</th><th style={{ textAlign: 'right' }}>Total Tagihan</th><th>Status Bayar</th><th style={{ width: '130px', textAlign: 'center' }}>Tindakan</th></tr></thead>
                <tbody>
                  {filteredInvoices.map((inv: any, index) => {
                     const status = inv.status || 'Draft';
                     return (
                    <tr key={inv.name}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div style={{ color: COLOR_SECONDARY, fontWeight: 800, fontSize: '13px' }}>{inv.name}</div>
                        {inv.posting_date && <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>Tgl: {formatDate(inv.posting_date)}</div>}
                      </td>
                      <td><div style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>{inv.customer_name}</div></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{formatUang(inv.grand_total)}</td>
                      <td><span className={`badge ${status === 'Paid' ? 'badge-success' : status === 'Unpaid' ? 'badge-warning' : 'badge-gray'}`}>{status === 'Unpaid' ? 'Belum Dibayar' : status === 'Paid' ? 'Lunas' : 'Draft'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {inv.docstatus === 0 && <button onClick={() => handleInvoiceSubmit(inv)} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }} title="Terbitkan Faktur"><Send size={12}/> Submit</button>}
                          <button onClick={() => setSelectedInvoice(inv)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Detail"><Eye size={14} /></button>
                          <button onClick={() => handleSmartDelete('Sales Invoice', inv.name, inv.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )})}
                  {filteredInvoices.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada data Faktur (Invoice).</td></tr>}
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

export default function SellingPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  useEffect(() => { if (!canAccess('selling' as any)) router.push('/dashboard'); }, [canAccess, router]);
  return (<Suspense fallback={<div>Loading...</div>}><SellingPageContent /></Suspense>);
}