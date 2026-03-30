'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useStockData, useSellingData } from '@/hooks/useFrappeData';
import {
  Package, Warehouse, AlertTriangle, TrendingUp, Filter,
  Plus, Search, X, Edit, Trash2, ArrowRight, AlertCircle, Eye, Truck, Send, Link as LinkIcon, Calendar, Loader2, Info, CheckCircle
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { EmptyState, TableSkeleton } from '@/components/EmptyState';

const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';
const FIXED_COMPANY = 'Artavista'; 

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

const getDynamicCompany = (warehouses: any[]) => {
  const validWarehouse = (warehouses || []).find((w: any) => !w.is_group && w.company);
  return validWarehouse ? validWarehouse.company : FIXED_COMPANY;
};

// ── LOGIKA PENERJEMAH ERROR ──
const extractFrappeError = (err: any, fallbackMsg: string = 'Terjadi kesalahan sistem') => {
  let errorMsg = typeof err === 'string' ? err : (err?.message || err?.error?.message || fallbackMsg);
  
  if (err?._server_messages) {
    try { 
      const parsed = JSON.parse(err._server_messages);
      errorMsg = JSON.parse(parsed[0]).message.replace(/<[^>]*>?/gm, ''); 
    } catch(e) {}
  }

  const neededMatch = errorMsg.match(/([0-9.]+)\s*units of Item\s*(.*?)\s*needed in Warehouse\s*(.*?)\s*to complete/i);
  if (neededMatch) {
      return `❌ Gagal! Stok Fisik Tidak Cukup.\n\n👉 Sistem membutuhkan ${neededMatch[1]} unit barang "${neededMatch[2]}" di Gudang "${neededMatch[3]}", tetapi sisa fisiknya kurang atau kosong. Silakan restock terlebih dahulu.`;
  }

  const lowerErr = errorMsg.toLowerCase();
  
  if (lowerErr.includes('417') || lowerErr.includes('expectation failed') || err?.status === 417) {
    return `Gagal (Error 417)! Tindakan Ditolak.\n\n👉 Dokumen ini kemungkinan besar sudah diproses secara fisik di Gudang (Stock Ledger) atau sedang terikat dengan proses transaksi lain. Anda tidak bisa menghapusnya begitu saja.`;
  }
  
  if (lowerErr.includes('valuation rate not found')) {
    const match = errorMsg.match(/Item (.*?) /i) || errorMsg.match(/Item (.*?)$/i);
    const itemCode = match ? match[1].replace(/['"]/g, '').trim() : 'tersebut';
    return `Gagal! Harga Standar (Valuation Rate) untuk barang "${itemCode}" belum diatur.\n\n👉 Solusi: Pergi ke tab "Master Items", cari barang ini, klik Edit, lalu isi "Standard Rate (Rp)". Sistem akuntansi butuh nilai ini.`;
  }
  
  if (lowerErr.includes('negative stock') || lowerErr.includes('insufficient stock')) {
    return `❌ Stok Fisik Tidak Cukup!\n\n👉 Transaksi ditolak karena akan menyebabkan stok fisik menjadi minus. Lakukan Penerimaan Gudang (Stock Entry - Material Receipt) terlebih dahulu.`;
  }

  if (lowerErr.includes('linked with') || lowerErr.includes('cannot delete')) {
    return `Gagal Dihapus!\n\n👉 Dokumen ini tidak bisa dihapus karena sudah saling terhubung/digunakan di transaksi lain yang sudah berjalan.`;
  }

  if (lowerErr.includes('could not find company')) {
    return `Gagal! Perusahaan tidak ditemukan. \n\n👉 Pastikan Data Company Anda sudah terdaftar dengan benar di ERPNext Frappe.`;
  }

  return errorMsg;
};

function Toast({ show, message, type }: { show: boolean, message: string, type: 'success' | 'error' | 'info' }) {
  if (!show) return null;
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  return (
    <div className="custom-toast" style={{ background: bg, alignItems: 'flex-start', maxWidth: '450px' }}>
      <div style={{ marginTop: '2px' }}>{type === 'success' ? <CheckCircle size={18} /> : type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{message.split('\n').map((line, i) => (<span key={i} style={{ lineHeight: 1.4, fontWeight: line.includes('👉') ? 800 : 500 }}>{line}</span>))}</div>
    </div>
  );
}

function ConfirmModal({ show, title, desc, onConfirm, onCancel, confirmText = "Ya, Lanjutkan" }: any) {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ width: '60px', height: '60px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><AlertTriangle size={30} /></div>
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

const getActualStock = (itemCode: string, warehouse: string, bins: any[]) => {
  const bin = bins.find((b: any) => b.item_code === itemCode && b.warehouse === warehouse);
  return bin ? Number(bin.actual_qty) : 0;
};

// ── 1. MODALS ITEM ──
function CreateItemModal({ onClose, onSuccess, showToast }: any) {
  const [form, setForm] = useState({ item_code: '', item_name: '', item_group: 'Products', stock_uom: 'Nos', is_stock_item: true, is_fixed_asset: false, standard_rate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Item', { ...form, is_stock_item: form.is_stock_item ? 1 : 0, is_fixed_asset: form.is_fixed_asset ? 1 : 0, standard_rate: parseFloat(String(form.standard_rate)) || 0 });
      showToast('Master Item berhasil ditambahkan!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Registrasi Master Item</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="responsive-grid">
            <div className="form-group"><label className="erp-label">Item Code *</label><input required className="erp-input" value={form.item_code} onChange={e => setForm(f => ({...f, item_code: e.target.value}))} /></div>
            <div className="form-group"><label className="erp-label">Item Name *</label><input required className="erp-input" value={form.item_name} onChange={e => setForm(f => ({...f, item_name: e.target.value}))} /></div>
          </div>
          <div className="responsive-grid">
            <div className="form-group"><label className="erp-label">Item Group</label><select className="erp-input" value={form.item_group} onChange={e => setForm(f => ({...f, item_group: e.target.value}))}><option value="Products">Products (Barang Jadi)</option><option value="Raw Material">Raw Material (Bahan Mentah)</option></select></div>
            <div className="form-group"><label className="erp-label">UoM</label><select className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({...f, stock_uom: e.target.value}))}><option value="Nos">Nos</option><option value="Unit">Unit</option></select></div>
          </div>
          <div className="form-group"><label className="erp-label">Standard Rate (Rp)</label><input type="number" className="erp-input" value={form.standard_rate} onChange={e => setForm(f => ({...f, standard_rate: e.target.value}))} /></div>
          <div className="modal-footer"><button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{background: COLOR_PRIMARY}}>Simpan Item</button></div>
        </form>
      </div>
    </div>
  );
}

function EditItemModal({ item, onClose, onSuccess, showConfirm, showToast }: any) {
  const [form, setForm] = useState({ item_name: item.item_name || '', item_group: item.item_group || 'Products', stock_uom: item.stock_uom || 'Nos', standard_rate: item.standard_rate || 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Item', item.name, { ...form, standard_rate: parseFloat(String(form.standard_rate)) || 0 });
      showToast('Perubahan Item disimpan.', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    showConfirm("Hapus Item?", `Yakin menghapus ${item.item_code}?`, "Ya, Hapus", async () => {
      try { const { apiDelete } = await import('@/lib/api'); await apiDelete('Item', item.name); showToast('Terhapus!', 'success'); onClose(); if(onSuccess) onSuccess(); } 
      catch (e: any) { showToast(extractFrappeError(e), 'error'); }
    });
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800 }}>Detail Item: {item.item_code}</h2></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group"><label className="erp-label">Item Name *</label><input required className="erp-input" value={form.item_name} onChange={e => setForm(f => ({...f, item_name: e.target.value}))} /></div>
          <div className="responsive-grid">
            <div className="form-group"><label className="erp-label">Item Group</label><select className="erp-input" value={form.item_group} onChange={e => setForm(f => ({...f, item_group: e.target.value}))}><option value="Products">Products (Barang Jadi)</option><option value="Raw Material">Raw Material (Bahan Mentah)</option></select></div>
            <div className="form-group"><label className="erp-label">UoM</label><select className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({...f, stock_uom: e.target.value}))}><option value="Nos">Nos</option><option value="Unit">Unit</option></select></div>
          </div>
          <div className="form-group"><label className="erp-label">Standard Rate (Rp)</label><input type="number" className="erp-input" value={form.standard_rate} onChange={e => setForm(f => ({...f, standard_rate: e.target.value}))} /></div>
          <div className="modal-footer">
            <button type="button" onClick={handleDelete} className="btn btn-secondary" style={{color: '#dc2626'}}><Trash2 size={15}/> Hapus</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{background: COLOR_PRIMARY}}>Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 2. MODALS WAREHOUSE ──
function CreateWarehouseModal({ onClose, onSuccess, showToast }: any) {
  const [form, setForm] = useState({ warehouse_name: '', company: FIXED_COMPANY, is_group: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const warehouseName = `${form.warehouse_name} - ARTA`;
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Warehouse', { name: warehouseName, warehouse_name: form.warehouse_name, company: form.company, is_group: form.is_group ? 1 : 0, parent_warehouse: form.is_group ? '' : `All Warehouses - ARTA` });
      showToast('Gudang didaftarkan!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Registrasi Gudang</h2><button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20} color="#6B7280" /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group"><label className="erp-label">Nama Gudang *</label><input required className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({...f, warehouse_name: e.target.value}))} /></div>
          <div className="form-group"><label className="erp-label">Company</label><input readOnly className="erp-input disabled-input" value={form.company} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}><input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({...f, is_group: e.target.checked}))} /> Jadikan Induk Gudang</label>
          <div className="modal-footer"><button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{background: COLOR_PRIMARY}}>Simpan</button></div>
        </form>
      </div>
    </div>
  );
}

function EditWarehouseModal({ warehouse, onClose, onSuccess, showConfirm, showToast }: any) {
  const [form, setForm] = useState({ warehouse_name: warehouse.warehouse_name || '', company: warehouse.company || FIXED_COMPANY, is_group: warehouse.is_group === 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Warehouse', warehouse.name, { warehouse_name: form.warehouse_name, is_group: form.is_group ? 1 : 0 });
      showToast('Gudang diupdate!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = () => showConfirm("Hapus Gudang?", `Hapus ${warehouse.name}?`, "Ya", async () => {
    try { const { apiDelete } = await import('@/lib/api'); await apiDelete('Warehouse', warehouse.name); showToast('Terhapus!', 'success'); onClose(); if(onSuccess) onSuccess(); } 
    catch (e: any) { showToast(extractFrappeError(e), 'error'); }
  });

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Edit Gudang</h2><button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20} color="#6B7280" /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group"><label className="erp-label">Nama Warehouse *</label><input required className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({...f, warehouse_name: e.target.value}))} /></div>
          <div className="form-group"><label className="erp-label">Perusahaan</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
          <div className="modal-footer">
            <button type="button" onClick={handleDelete} className="btn btn-secondary" style={{color: '#dc2626'}}><Trash2 size={15}/> Hapus</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{background: COLOR_PRIMARY}}>Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 3. MODALS STOCK ENTRY ──
function StockEntryFormModal({ entry, mode, onClose, warehouses, items, bins, onSuccess, showToast }: any) {
  const isEdit = mode === 'edit';
  const defaultCompany = useMemo(() => getDynamicCompany(warehouses), [warehouses]);
  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group), [warehouses]);

  const [form, setForm] = useState({ 
    company: defaultCompany, 
    stock_entry_type: 'Material Receipt', 
    set_posting_time: true,
    posting_date: new Date().toISOString().split('T')[0],
    posting_time: getCurrentTimeForInput(),
    s_warehouse: '', 
    t_warehouse: '', 
    items: [] as any[]
  });

  const [itemForm, setItemForm] = useState({ item_code: '', qty: '', basic_rate: '', amount: 0 });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && entry) {
      const fetchDetail = async () => {
        try {
          const res = await fetch(`/api/frappe/resource/Stock Entry/${encodeURIComponent(entry.name)}`, { cache: 'no-store' });
          const data = await res.json();
          if (data.data) {
            const d = data.data;
            setForm({
              company: d.company || defaultCompany,
              stock_entry_type: d.stock_entry_type || 'Material Receipt',
              set_posting_time: d.set_posting_time === 1,
              posting_date: d.posting_date,
              posting_time: d.posting_time || getCurrentTimeForInput(),
              s_warehouse: d.from_warehouse || '',
              t_warehouse: d.to_warehouse || '',
              items: d.items || []
            });
          }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
      };
      fetchDetail();
    } else {
      setIsLoading(false);
    }
  }, [isEdit, entry, defaultCompany]);

  const getStockInfo = (itemCode: string) => {
    const checkWarehouse = ['Material Issue', 'Material Transfer'].includes(form.stock_entry_type) ? form.s_warehouse : form.t_warehouse;
    if (!itemCode || !checkWarehouse) return null;
    const bin = bins.find((b: any) => b.item_code === itemCode && b.warehouse === checkWarehouse);
    return { warehouse: checkWarehouse, qty: bin ? Number(bin.actual_qty) : 0 };
  };

  const handleAddItem = () => {
    if (!itemForm.item_code || Number(itemForm.qty) <= 0) return showToast("Pilih Item dan isi Qty > 0", 'error');
    
    if (['Material Issue', 'Material Transfer'].includes(form.stock_entry_type)) {
      const stockAvailable = getStockInfo(itemForm.item_code)?.qty || 0;
      if (Number(itemForm.qty) > stockAvailable) {
        return showToast(`Gagal! Stok ${itemForm.item_code} di gudang asal tidak cukup. Hanya tersisa ${stockAvailable} unit.`, 'error');
      }
    }

    const selectedItem = items.find((i: any) => i.item_code === itemForm.item_code);
    const basicRate = Number(itemForm.basic_rate) || selectedItem?.standard_rate || 0;
    
    const newItemObj = { 
      item_code: itemForm.item_code, item_name: selectedItem?.item_name || itemForm.item_code, 
      qty: parseFloat(itemForm.qty), uom: selectedItem?.stock_uom || 'Nos',
      basic_rate: basicRate, amount: basicRate * parseFloat(itemForm.qty)
    };

    if (editingItemIndex !== null) {
      const newItems = [...form.items];
      newItems[editingItemIndex] = { ...newItems[editingItemIndex], ...newItemObj };
      setForm(f => ({ ...f, items: newItems }));
      setEditingItemIndex(null);
    } else {
      setForm(f => ({ ...f, items: [...f.items, newItemObj] }));
    }
    setItemForm({ item_code: '', qty: '', basic_rate: '', amount: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== index) }));
    if (editingItemIndex === index) setEditingItemIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (form.stock_entry_type === 'Material Receipt' && !form.t_warehouse) return showToast("Pilih Default Target Warehouse.", 'error');
    if (form.stock_entry_type === 'Material Issue' && !form.s_warehouse) return showToast("Pilih Default Source Warehouse.", 'error');
    if (form.stock_entry_type === 'Material Transfer' && (!form.t_warehouse || !form.s_warehouse)) return showToast("Pilih Source & Target.", 'error');
    if (form.items.length === 0) return showToast("Tambahkan minimal 1 Item.", 'error');
    
    setIsSubmitting(true);
    try {
      const formattedItems = form.items.map((item: any) => {
        const detail: any = { item_code: item.item_code, qty: Number(item.qty), uom: item.uom, basic_rate: Number(item.basic_rate) || 0 };
        if (['Material Receipt', 'Material Transfer'].includes(form.stock_entry_type)) detail.t_warehouse = form.t_warehouse;
        if (['Material Issue', 'Material Transfer'].includes(form.stock_entry_type)) detail.s_warehouse = form.s_warehouse;
        return detail;
      });

      const stockEntryData: any = { 
        stock_entry_type: form.stock_entry_type, posting_date: form.posting_date, posting_time: form.posting_time,
        company: form.company, set_posting_time: form.set_posting_time ? 1 : 0, 
        to_warehouse: form.stock_entry_type !== 'Material Issue' ? form.t_warehouse : '',
        from_warehouse: form.stock_entry_type !== 'Material Receipt' ? form.s_warehouse : '',
        items: formattedItems 
      };

      const { apiCreate, apiUpdate } = await import('@/lib/api');
      if (isEdit) { await apiUpdate('Stock Entry', entry.name, stockEntryData); showToast('Diperbarui!', 'success'); } 
      else { await apiCreate('Stock Entry', stockEntryData); showToast('Draft dibuat!', 'success'); }
      
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  const currentStockInfo = getStockInfo(itemForm.item_code);
  const activeWarehouseToCheck = ['Material Issue', 'Material Transfer'].includes(form.stock_entry_type) ? form.s_warehouse : form.t_warehouse;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '800px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} /></div> : (
          <>
            <div style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{isEdit ? `Edit Stock Entry` : 'Create Stock Entry'}</h2></div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="responsive-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group"><label className="erp-label">Company</label><input type="text" readOnly className="erp-input disabled-input" value={form.company} /></div>
                <div className="form-group"><label className="erp-label">Purpose (Type) *</label>
                  <select required value={form.stock_entry_type} onChange={e => setForm(f => ({ ...f, stock_entry_type: e.target.value, s_warehouse: '', t_warehouse: '', items: [] }))} className="erp-input disabled-input" disabled={!isEdit && form.stock_entry_type === 'Material Receipt'}>
                    <option value="Material Receipt">Material Receipt (Penerimaan / Masuk Gudang)</option>
                    <option value="Material Issue">Material Issue (Pengeluaran / Buang)</option>
                    <option value="Material Transfer">Material Transfer (Pindah Gudang)</option>
                  </select>
                </div>
              </div>

              <div className="responsive-grid" style={{ marginBottom: '20px' }}>
                {['Material Issue', 'Material Transfer'].includes(form.stock_entry_type) && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="erp-label" style={{ color: '#dc2626' }}>Default Source Warehouse *</label>
                    <select required className="erp-input" value={form.s_warehouse} onChange={e => setForm(f => ({ ...f, s_warehouse: e.target.value }))}>
                      <option value="">-- Pilih Gudang Sumber (Asal) --</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                    </select>
                  </div>
                )}
                {['Material Receipt', 'Material Transfer'].includes(form.stock_entry_type) && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="erp-label" style={{ color: '#059669' }}>Default Target Warehouse *</label>
                    <select required className="erp-input" value={form.t_warehouse} onChange={e => setForm(f => ({ ...f, t_warehouse: e.target.value }))}>
                      <option value="">-- Pilih Gudang Tujuan --</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <h3 className="section-title"><Package size={14}/> Items (Barang yang dimutasi)</h3>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: `1px solid #e2e8f0`, marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="erp-label">Pilih Item *</label>
                    <select className="erp-input" value={itemForm.item_code} onChange={e => { const val = e.target.value; const sel = items.find((i: any) => i.item_code === val); setItemForm(f => ({ ...f, item_code: val, basic_rate: String(sel?.standard_rate || 0) })); }}>
                      <option value="">-- Cari Barang --</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
                    </select>
                    
                    {itemForm.item_code && activeWarehouseToCheck && (
                      <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: currentStockInfo && currentStockInfo.qty > 0 ? '#059669' : '#dc2626', background: currentStockInfo && currentStockInfo.qty > 0 ? '#d1fae5' : '#fee2e2', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
                        Info: Stok di {activeWarehouseToCheck} tersisa {currentStockInfo ? currentStockInfo.qty : 0} Unit.
                      </div>
                    )}
                  </div>
                  <div className="responsive-grid-3" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="erp-label">Qty</label><input type="number" step="any" min="0.1" className="erp-input" value={itemForm.qty} onChange={e => setItemForm(f => ({ ...f, qty: e.target.value }))} /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label className="erp-label">Basic Rate</label><input type="number" step="any" min="0" className="erp-input" value={itemForm.basic_rate} onChange={e => setItemForm(f => ({ ...f, basic_rate: e.target.value }))} /></div>
                    <button type="button" onClick={handleAddItem} className="btn btn-secondary" style={{ background: editingItemIndex !== null ? COLOR_PRIMARY : '#e0f2fe', color: editingItemIndex !== null ? 'white' : COLOR_PRIMARY, border: 'none', height: '42px', fontWeight: 700 }}>
                      {editingItemIndex !== null ? 'Update Item' : 'Tambah Row'}
                    </button>
                  </div>
                </div>

                {form.items.length > 0 && (
                  <table className="erp-table" style={{ width: '100%' }}>
                    <thead style={{ background: '#f1f5f9' }}><tr><th>Item Code</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'center' }}>Aksi</th></tr></thead>
                    <tbody>
                      {form.items.map((item: any, i: number) => (
                        <tr key={i}>
                          <td><div style={{ fontWeight: 700, color: COLOR_PRIMARY, fontSize: '12px' }}>{item.item_code}</div></td>
                          <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>{Number(item.qty)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '12px' }}>{formatUang(Number(item.qty) * Number(item.basic_rate))}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button type="button" onClick={() => { setItemForm({ item_code: item.item_code, qty: String(item.qty), basic_rate: String(item.basic_rate), amount: 0 }); setEditingItemIndex(i); }} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><Edit size={12}/></button>
                              <button type="button" onClick={() => handleRemoveItem(i)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={12}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-footer"><button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>Batal</button><button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ background: COLOR_PRIMARY }}>Simpan Draft</button></div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── DETAIL STOCK ENTRY VIEW ──
function DetailStockEntryModal({ entry, bins, items, onClose, onSubmitEntry }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getActualStockInModal = (itemCode: string, warehouse: string) => {
    if (!bins) return 0;
    const bin = bins.find((b: any) => b.item_code === itemCode && b.warehouse === warehouse);
    return bin ? Number(bin.actual_qty) : 0;
  };

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
      <div className="modal-content" style={{ width: '100%', maxWidth: '850px', margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /></div> : (
          <>
            <div style={{ background: '#f8f9fb', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>{fullData?.name || entry.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${entry.docstatus === 1 ? 'badge-success' : entry.docstatus === 2 ? 'badge-danger' : 'badge-warning'}`}>{entry.docstatus === 1 ? 'Submitted' : entry.docstatus === 2 ? 'Cancelled' : 'Draft'}</span>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>{fullData?.stock_entry_type}</span>
                </div>
              </div>
              <button onClick={onClose} disabled={isSubmitting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <p style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Tgl Pencatatan</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>{formatDate(fullData?.posting_date || new Date().toISOString())} {fullData?.posting_time || ''}</p>
                </div>
                {['Material Issue', 'Material Transfer'].includes(fullData?.stock_entry_type) && fullData?.from_warehouse && (
                  <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <p style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>Source WH</p>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#7f1d1d' }}>{fullData.from_warehouse}</p>
                  </div>
                )}
                {['Material Receipt', 'Material Transfer', 'Manufacture'].includes(fullData?.stock_entry_type) && fullData?.to_warehouse && (
                  <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <p style={{ fontSize: '11px', color: '#065f46', fontWeight: 600 }}>Target WH</p>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#064e3b' }}>{fullData.to_warehouse}</p>
                  </div>
                )}
              </div>

              <h3 className="section-title">Rincian Pergerakan Barang</h3>
              <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table className="erp-table" style={{ width: '100%', minWidth: '700px' }}>
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                      <th>Item Code</th>
                      <th>Jenis Barang</th>
                      {['Material Receipt', 'Material Transfer', 'Manufacture'].includes(fullData?.stock_entry_type) && <th>Target WH</th>}
                      <th style={{ textAlign: 'center' }}>Sisa Stok Real (Gudang)</th>
                      <th style={{ textAlign: 'right' }}>Qty Mutasi (+ / -)</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fullData?.items || []).map((item: any, i: number) => {
                      const checkWh = item.s_warehouse || item.t_warehouse || fullData?.from_warehouse || fullData?.to_warehouse;
                      const currentStock = getActualStockInModal(item.item_code, checkWh);
                      const masterItem = (items || []).find((mi:any) => mi.item_code === item.item_code);
                      const itemGroup = masterItem?.item_group || 'Unknown';
                      const isRaw = itemGroup.toLowerCase().includes('raw');
                      
                      let mutasiSign = '';
                      let mutasiColor = '#4b5563';
                      if (fullData?.stock_entry_type === 'Material Receipt' || fullData?.stock_entry_type === 'Manufacture') { mutasiSign = '+'; mutasiColor = '#059669'; }
                      else if (fullData?.stock_entry_type === 'Material Issue') { mutasiSign = '-'; mutasiColor = '#dc2626'; }

                      return (
                        <tr key={i}>
                          <td><span style={{ color: COLOR_PRIMARY, fontWeight: 700, fontSize: '12px' }}>{item.item_code}</span></td>
                          <td><span className={`badge ${isRaw ? 'badge-warning' : 'badge-info'}`} style={{fontSize: '10px'}}>{itemGroup}</span></td>
                          {['Material Receipt', 'Material Transfer', 'Manufacture'].includes(fullData?.stock_entry_type) && (
                            <td style={{ fontSize: '11px', color: '#059669' }}>{item.t_warehouse || fullData?.to_warehouse || '-'}</td>
                          )}
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#4b5563', fontSize: '12px' }}>
                            {currentStock} <span style={{fontSize: '10px'}}>{item.uom}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: mutasiColor, fontSize: '12px' }}>
                            {mutasiSign} {Number(item.qty)} {item.uom}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY, fontSize: '12px' }}>{formatUang(item.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer">
                {entry.docstatus === 0 && <button className="btn btn-primary mobile-btn" onClick={handleSubmit} disabled={isSubmitting} style={{ background: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}><Send size={16} /> Sahkan (Submit)</button>}
                <button className="btn btn-secondary mobile-btn" onClick={onClose} disabled={isSubmitting}>Tutup</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateDeliveryNoteModal({ onClose, customers, items, warehouses, bins, onSuccess, showToast }: any) {
  const defaultCompany = useMemo(() => getDynamicCompany(warehouses), [warehouses]);
  const [form, setForm] = useState({ customer: '', company: defaultCompany, posting_date: new Date().toISOString().split('T')[0], is_return: false, item_code: '', qty: '', rate: '', amount: 0, warehouse: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group), [warehouses]);

  // Fitur Cek Stok Real-Time di Form
  const availableStock = useMemo(() => {
    if (!form.item_code || !form.warehouse) return 0;
    return getActualStock(form.item_code, form.warehouse, bins);
  }, [form.item_code, form.warehouse, bins]);
  const isStockShort = !form.is_return && (Number(form.qty || 0) > availableStock);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (isStockShort) return showToast(`Stok tidak cukup! Sisa fisik hanya ${availableStock}.`, 'error');
    setIsSubmitting(true);
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const dnData = { 
        customer: form.customer, posting_date: form.posting_date, is_return: form.is_return ? 1 : 0, company: defaultCompany, 
        items: [{ item_code: form.item_code, item_name: selectedItem?.item_name || form.item_code, qty: parseFloat(form.qty), rate: parseFloat(form.rate), amount: form.amount, warehouse: form.warehouse }] 
      };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Delivery Note', dnData);
      showToast('Surat Jalan Draft dibuat!', 'success'); onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { showToast(extractFrappeError(err), 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '700px', margin: '0 16px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Buat Surat Jalan Keluar/Retur</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="erp-label">Customer *</label><select required className="erp-input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}><option value="">Pilih...</option>{customers.map((c: any) => <option key={c.name} value={c.name}>{c.customer_name}</option>)}</select></div>
          <div className="form-group"><label className="erp-label">Item *</label><select required className="erp-input" value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}><option value="">Pilih...</option>{items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code}</option>)}</select></div>
          <div className="form-group"><label className="erp-label">Gudang *</label><select required className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}><option value="">Pilih...</option>{activeWarehouses.map((w: any) => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
          
          {form.item_code && form.warehouse && !form.is_return && (
            <div style={{ background: isStockShort ? '#fee2e2' : '#f0fdf4', border: `1px solid ${isStockShort ? '#ef4444' : '#22c55e'}`, padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isStockShort ? '#b91c1c' : '#166534', display: 'block' }}>Sisa Fisik di Gudang Terpilih:</span>
                {isStockShort && <span style={{ fontSize: '10px', color: '#ef4444' }}>Stok tidak cukup untuk dikirim!</span>}
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: isStockShort ? '#ef4444' : '#16a34a' }}>{availableStock} Unit</span>
            </div>
          )}

          <div className="responsive-grid">
            <div className="form-group"><label className="erp-label">Qty</label><input required type="number" min="0.1" step="any" className="erp-input" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value, amount: Number(e.target.value)*Number(f.rate) }))} /></div>
            <div className="form-group"><label className="erp-label">Rate</label><input required type="number" min="0" step="any" className="erp-input" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value, amount: Number(e.target.value)*Number(f.qty) }))} /></div>
          </div>
          <div className="modal-footer"><button type="submit" disabled={isSubmitting || isStockShort} className="btn btn-primary" style={{ background: isStockShort ? '#9CA3AF' : COLOR_PRIMARY }}>{isStockShort ? 'Stok Kurang' : 'Simpan Draft'}</button></div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN PAGE CONTENT
// ==========================================
function StockPageContent() {
  const router = useRouter();
  const { items, warehouses, bins, stockEntries, isLoading, refetch } = useStockData();
  const { customers, deliveryNotes, isLoading: isSellingLoading, refetch: refetchSelling } = useSellingData();
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'stockentry');

  useEffect(() => { if (tabParam) setActiveTab(tabParam); }, [tabParam]);

  const [searchQuery, setSearchQuery] = useState('');
  const [seTypeFilter, setSeTypeFilter] = useState('Semua');
  const [seStatusFilter, setSeStatusFilter] = useState('Semua');
  const [sortOrder, setSortOrder] = useState<'desc'|'asc'>('desc');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateDNModal, setShowCreateDNModal] = useState(false);
  const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [toast, setToast] = useState<{ show: boolean, msg: string, type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, desc: string, confirmText: string, action: any }>({ show: false, title: '', desc: '', confirmText: 'Ya', action: null });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000); };
  const showConfirm = (title: string, desc: string, confirmText: string, action: any) => setConfirmModal({ show: true, title, desc, confirmText, action });
  const closeConfirm = () => setConfirmModal({ show: false, title: '', desc: '', confirmText: '', action: null });

  const sortByNewest = (a: any, b: any, fallbackDateField: string = 'creation') => {
    let timeA = new Date(a.creation || a.modified || a[fallbackDateField] || 0).getTime();
    let timeB = new Date(b.creation || b.modified || b[fallbackDateField] || 0).getTime();
    timeA = isNaN(timeA) ? 0 : timeA; timeB = isNaN(timeB) ? 0 : timeB;
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  };

  const sortedItems = useMemo(() => [...items].sort((a, b) => sortByNewest(a, b)), [items, sortOrder]);
  const sortedWarehouses = useMemo(() => [...warehouses].sort((a, b) => sortByNewest(a, b)), [warehouses, sortOrder]);
  const sortedBins = useMemo(() => [...bins].sort((a, b) => sortByNewest(a, b, 'modified')), [bins, sortOrder]);
  const sortedDeliveryNotes = useMemo(() => [...deliveryNotes].sort((a, b) => sortByNewest(a, b, 'posting_date')), [deliveryNotes, sortOrder]);

  const filteredItems = sortedItems.filter((i: any) => !searchQuery || i.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) || i.item_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWarehouses = sortedWarehouses.filter((w: any) => !searchQuery || w.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBins = sortedBins.filter((b: any) => !searchQuery || b.item_code?.toLowerCase().includes(searchQuery.toLowerCase()) || b.warehouse?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDeliveryNotes = sortedDeliveryNotes.filter((dn: any) => !searchQuery || dn.name?.toLowerCase().includes(searchQuery.toLowerCase()) || dn.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredStockEntries = useMemo(() => {
    let result = [...stockEntries].map((se: any) => ({
      ...se, 
      virtualStatus: se.docstatus === 1 ? 'Submitted' : se.docstatus === 2 ? 'Cancelled' : 'Draft'
    }));
    if (searchQuery) result = result.filter(se => se.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (seTypeFilter !== 'Semua') result = result.filter(se => se.stock_entry_type === seTypeFilter);
    if (seStatusFilter !== 'Semua') result = result.filter(se => se.virtualStatus === seStatusFilter);
    result.sort((a, b) => sortOrder === 'desc' ? new Date(b.creation || 0).getTime() - new Date(a.creation || 0).getTime() : new Date(a.creation || 0).getTime() - new Date(b.creation || 0).getTime());
    return result;
  }, [stockEntries, searchQuery, seTypeFilter, seStatusFilter, sortOrder]);

  const getItemStockDetails = (itemCode: string) => bins.filter((b: any) => b.item_code === itemCode && Number(b.actual_qty) !== 0).map((b: any) => ({ warehouse: b.warehouse, qty: Number(b.actual_qty) }));

  // 💡 JEDA WAKTU DITAMBAHKAN PADA SEMUA AKSI HAPUS / SUBMIT / CANCEL
  const handleSmartDelete = (doctype: string, docname: string, docstatus: number) => {
    showConfirm("Hapus Dokumen?", `Yakin menghapus permanen data ${docname}? (Error jika sudah di proses)`, "Hapus", async () => {
        closeConfirm();
        try {
          const { apiUpdate, apiDelete } = await import('@/lib/api');
          if (docstatus === 1) await apiUpdate(doctype, docname, { docstatus: 2 });
          await apiDelete(doctype, docname);
          showToast(`✅ ${doctype} dihapus! Memperbarui data...`, 'info'); 
          setTimeout(() => { 
            refetch(); 
            if (doctype === 'Delivery Note') refetchSelling(); 
          }, 1500);
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      }
    );
  };

  // 💡 SUBMIT STOCK ENTRY PURE API
  const handleSubmitStockEntry = (entry: any) => {
    showConfirm("Sahkan Mutasi Stok?", "Data stok gudang fisik akan langsung ter-update (Terpotong/Bertambah) sesuai rincian.", "Sahkan", async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Stock Entry', entry.name, { docstatus: 1 });
          showToast('✅ Berhasil disahkan! Sedang sinkronisasi data ke Frappe...', 'success'); 
          setTimeout(() => refetch(), 1500); // Tarik data ori dari Frappe
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      });
  };

  // 💡 CANCEL STOCK ENTRY PURE API
  const handleCancelStockEntry = (entry: any) => {
    showConfirm("Cancel Mutasi?", "Dokumen ini akan dibatalkan secara permanen, dan kuantitas barang yang termutasi sebelumnya akan dikembalikan.", "Cancel", async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Stock Entry', entry.name, { docstatus: 2 });
          showToast('✅ Berhasil dibatalkan! Mengembalikan stok...', 'info'); 
          setTimeout(() => refetch(), 1500);
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      });
  };

  // 💡 SUBMIT DELIVERY NOTE PURE API
  const handleSubmitDN = (dn: any) => {
    showConfirm("Sahkan Surat Jalan?", "Stok akan terpotong secara riil.", "Sahkan", async () => {
        closeConfirm();
        try {
          const { apiUpdate } = await import('@/lib/api');
          await apiUpdate('Delivery Note', dn.name, { docstatus: 1 });
          showToast('✅ Surat jalan disahkan. Sedang sinkronisasi...', 'success'); 
          setTimeout(() => { 
            refetchSelling(); 
            refetch(); 
          }, 1500); 
        } catch (err: any) { showToast(extractFrappeError(err), 'error'); }
      });
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      <Toast show={toast.show} message={toast.msg} type={toast.type} />
      <ConfirmModal show={confirmModal.show} title={confirmModal.title} desc={confirmModal.desc} confirmText={confirmModal.confirmText} onConfirm={confirmModal.action} onCancel={closeConfirm} />

      {(isLoading || isSellingLoading) && <div style={{ background: 'white', borderRadius: '16px', padding: '12px', marginBottom: '20px' }}><TableSkeleton rows={6} cols={5} /></div>}

      {/* RENDER MODAL CRUD */}
      {showCreateModal && <StockEntryFormModal mode="create" onClose={() => setShowCreateModal(false)} warehouses={warehouses} items={items} bins={bins} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateItemModal && <CreateItemModal onClose={() => setShowCreateItemModal(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateWarehouseModal && <CreateWarehouseModal onClose={() => setShowCreateWarehouseModal(false)} onSuccess={() => refetch()} showToast={showToast} />}
      {showCreateDNModal && <CreateDeliveryNoteModal onClose={() => setShowCreateDNModal(false)} customers={customers} items={sortedItems} warehouses={warehouses} bins={bins} onSuccess={() => refetchSelling()} showToast={showToast} />}
      
      {selectedItem && <EditItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={() => refetch()} showToast={showToast} showConfirm={showConfirm} />}
      {selectedWarehouse && <EditWarehouseModal warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} onSuccess={() => refetch()} showToast={showToast} showConfirm={showConfirm} />}
      
      {selectedEntry?.mode === 'view' && <DetailStockEntryModal entry={selectedEntry.data} bins={bins} items={items} onClose={() => setSelectedEntry(null)} onSubmitEntry={handleSubmitStockEntry} />}
      {selectedEntry?.mode === 'edit' && <StockEntryFormModal entry={selectedEntry.data} mode="edit" onClose={() => setSelectedEntry(null)} warehouses={warehouses} items={items} bins={bins} onSuccess={() => refetch()} showToast={showToast} />}

      <div className="mobile-flex-col" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Manajemen Gudang</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>Kelola arus keluar masuk stok dan identitas barang.</p>
        </div>
        <div className="mobile-full-width" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'items' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: '#059669', borderColor: '#059669' }} onClick={() => setShowCreateItemModal(true)}><Plus size={14} /> Item Baru</button>}
          {activeTab === 'warehouse' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setShowCreateWarehouseModal(true)}><Plus size={14} /> Gudang Baru</button>}
          {activeTab === 'stockentry' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: COLOR_PRIMARY }} onClick={() => setShowCreateModal(true)}><Plus size={14} /> Stock Entry</button>}
          {activeTab === 'delivery' && <button className="btn btn-primary btn-sm mobile-full-width action-btn" style={{ background: COLOR_SECONDARY }} onClick={() => setShowCreateDNModal(true)}><Plus size={14} /> Surat Jalan</button>}
        </div>
      </div>

      <div className="chart-container" style={{ padding: '0', overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', background: '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder={`Cari Data...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '8px 10px 8px 30px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', outline: 'none', width: '100%' }} />
            </div>
            {activeTab === 'stockentry' && (
              <>
                <select value={seTypeFilter} onChange={e => setSeTypeFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', outline: 'none', background: 'white' }}>
                  <option value="Semua">All Entry Types</option>
                  <option value="Material Receipt">Material Receipt</option>
                  <option value="Material Issue">Material Issue</option>
                  <option value="Material Transfer">Material Transfer</option>
                  <option value="Manufacture">Manufacture (Produksi)</option>
                </select>
                <select value={seStatusFilter} onChange={e => setSeStatusFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', outline: 'none', background: 'white' }}>
                  <option value="Semua">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </>
            )}
          </div>
          <div>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', outline: 'none', background: 'white' }}>
              <option value="desc">Last Created (Desc)</option>
              <option value="asc">Oldest First (Asc)</option>
            </select>
          </div>
        </div>

        {/* --- TABEL STOCK ENTRY --- */}
        {activeTab === 'stockentry' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table" style={{ minWidth: '1000px', borderTop: 'none' }}>
              <thead style={{ background: '#f1f5f9' }}>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Purpose (Type)</th>
                  <th>Default Target Warehouse</th>
                  <th style={{ textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredStockEntries.map((se: any, i: number) => (
                  <tr key={se.name} className="table-row-hover">
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                    <td>
                      <div style={{ color: '#111827', fontWeight: 700, fontSize: '13px' }}>{se.name}</div>
                      <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{formatDate(se.posting_date)}</div>
                    </td>
                    <td>
                      <span className={`badge ${se.virtualStatus === 'Submitted' ? 'badge-success' : se.virtualStatus === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {se.virtualStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#4b5563', fontWeight: 600 }}>{se.stock_entry_type}</td>
                    <td style={{ fontSize: '12px', color: '#059669' }}>{se.to_warehouse || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {se.docstatus === 0 && <button onClick={() => handleSubmitStockEntry(se)} className="badge badge-success" style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center' }} title="Sahkan agar stok berubah"><Send size={12}/> Sahkan (Submit)</button>}
                        
                        <button onClick={() => setSelectedEntry({ data: se, mode: 'view' })} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Lihat Rincian"><Eye size={14} /></button>
                        
                        {se.docstatus === 0 && <button onClick={() => setSelectedEntry({ data: se, mode: 'edit' })} style={{ background: '#f3f4f6', border: 'none', color: '#4b5563', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit Draft"><Edit size={14} /></button>}
                        {se.docstatus === 1 && <button onClick={() => handleCancelStockEntry(se)} className="badge badge-danger" style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center' }} title="Batalkan Entry"><X size={12}/> Cancel</button>}
                        {(se.docstatus === 0 || se.docstatus === 2) && <button onClick={() => handleSmartDelete('Stock Entry', se.name, se.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Hapus"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredStockEntries.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Data Stock Entry tidak ditemukan.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TABEL ITEMS PURE FRAPPE SYNC --- */}
        {activeTab === 'items' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Item Name</th>
                  <th>Status</th>
                  <th>Item Group</th>
                  <th>UoM</th>
                  <th style={{ textAlign: 'center' }}>Total Stok Fisik</th>
                  <th>ID</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item: any, i) => {
                  const isRaw = (item.item_group || '').toLowerCase().includes('raw');
                  
                  // Hanya menarik data ori 100% dari Bins Frappe (Sangat Akurat, tidak akan pernah error out-of-sync)
                  const totalQty = bins.filter((b: any) => b.item_code === item.item_code).reduce((sum, b) => sum + Number(b.actual_qty), 0);

                  return (
                    <tr key={item.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                      <td><div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{item.item_name || item.item_code}</div></td>
                      <td><span className={`badge ${item.disabled ? 'badge-danger' : 'badge-success'}`}>{item.disabled ? 'Disabled' : 'Active'}</span></td>
                      <td><span className={`badge ${isRaw ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '11px', fontWeight: 700 }}>{item.item_group}</span></td>
                      <td style={{ color: '#4B5563', fontWeight: 600, fontSize: '13px' }}>{item.stock_uom}</td>
                      
                      <td style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: totalQty > 0 ? COLOR_PRIMARY : '#ef4444' }}>
                          {totalQty} <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>{item.stock_uom}</span>
                        </div>
                      </td>

                      <td><span style={{ color: COLOR_SECONDARY, fontWeight: 700, fontSize: '12px' }}>{item.name}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => setSelectedItem(item)} style={{ background: '#e0f2fe', border: 'none', color: COLOR_PRIMARY, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}><Edit size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TABEL WAREHOUSE --- */}
        {activeTab === 'warehouse' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Nama Lokasi Gudang</th><th>Perusahaan</th><th>Sifat Gudang</th><th style={{ textAlign: 'center', width: '90px' }}>Tindakan</th></tr></thead>
              <tbody>
              {filteredWarehouses.map((w: any, i) => (
                <tr key={w.name} className="table-row-hover">
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                  <td><div style={{ fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{w.warehouse_name}</div><div style={{ fontSize: '11px', color: '#9CA3AF' }}>ID: {w.name}</div></td>
                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>{w.company || '-'}</td>
                  <td><span className={`badge ${w.is_group ? 'badge-purple' : 'badge-info'}`}>{w.is_group ? 'Gudang Induk' : 'Gudang Fisik'}</span></td>
                  <td><div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}><button onClick={() => setSelectedWarehouse(w)} style={{ background: '#ecfdf5', border: 'none', color: '#059669', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}><Edit size={16} /></button></div></td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TABEL BIN (STOK LEVEL) --- */}
        {activeTab === 'bin' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Item Code</th>
                  <th>Jenis Barang</th>
                  <th>Warehouse</th>
                  <th style={{ textAlign: 'right' }}>Sisa Fisik (Actual Qty)</th>
                </tr>
              </thead>
              <tbody>
                {filteredBins.map((bin: any, i) => {
                  const itemObj = items.find((it:any) => it.item_code === bin.item_code);
                  const itemGroup = itemObj?.item_group || 'Unknown';
                  const isRaw = itemGroup.toLowerCase().includes('raw');
                  
                  // 💡 Hitung stok dari Frappe langsung
                  const finalQty = Number(bin.actual_qty);

                  return (
                    <tr key={bin.name} className="table-row-hover">
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                      <td><div style={{ color: COLOR_PRIMARY, fontWeight: 800, fontSize: '14px' }}>{bin.item_code}</div></td>
                      <td><span className={`badge ${isRaw ? 'badge-warning' : 'badge-info'}`}>{itemGroup}</span></td>
                      <td><span style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>{bin.warehouse}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '18px', color: '#111827' }}>{formatNumber(finalQty)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TABEL DELIVERY NOTE --- */}
        {activeTab === 'delivery' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>Customer Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Grand Total</th>
                  <th style={{ textAlign: 'center' }}>% Amount Billed</th>
                  <th>ID</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveryNotes.map((dn: any, index) => (
                  <tr key={dn.name} className="table-row-hover">
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td><div style={{ fontWeight: 800, fontSize: '13px', color: '#111827' }}>{dn.customer_name || dn.customer}</div></td>
                    <td><span className={`badge ${dn.docstatus === 1 ? 'badge-success' : dn.docstatus === 2 ? 'badge-danger' : 'badge-warning'}`}>{dn.docstatus === 1 ? 'Submitted' : dn.docstatus === 2 ? 'Cancelled' : 'Draft'}</span></td>
                    <td><div style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(dn.posting_date)}</div></td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: COLOR_PRIMARY, fontSize: '14px' }}>{formatUang(dn.grand_total || 0)}</td>
                    <td style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>{Math.round(dn.per_billed || 0)}%</td>
                    <td><div style={{ color: COLOR_SECONDARY, fontWeight: 700, fontSize: '12px' }}>{dn.name}</div></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {dn.docstatus === 0 && <button onClick={() => handleSubmitDN(dn)} className="badge badge-warning" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }} title="Sahkan"><Send size={12}/> Sahkan</button>}
                        {(dn.docstatus === 0 || dn.docstatus === 2) && <button onClick={() => handleSmartDelete('Delivery Note', dn.name, dn.docstatus)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }} title="Hapus"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredDeliveryNotes.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Belum ada histori Surat Jalan pengiriman keluar.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

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
          .chart-container { padding: 16px !important; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}

export default function StockPage() {
  const router = useRouter();
  // const { canAccess } = useAuth();
  // useEffect(() => { if (!canAccess('stock' as any)) router.push('/dashboard'); }, [canAccess, router]);
  return (<Suspense fallback={<div>Loading...</div>}><StockPageContent /></Suspense>);
}