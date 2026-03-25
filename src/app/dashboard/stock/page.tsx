'use client';

import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useStockData } from '@/hooks/useFrappeData';
import {
  Package, Warehouse, AlertTriangle, TrendingUp,
  Plus, Download, Search, X, Edit, Trash2, ArrowRight, AlertCircle, Eye
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils';

const CATEGORY_COLORS = ['#0066B3', '#059669', '#7c3aed', '#d97706', '#0891b2', '#e11d48'];

const getCompanyCode = (companyName: string) => {
  if (!companyName) return 'NV';
  if (companyName.includes('Netra') || companyName === 'NV') return 'NV';
  if (companyName.includes('Solusi')) return 'PSB';
  if (companyName.includes('Maju')) return 'PMS';
  if (companyName.includes('Imaka')) return 'PII';
  if (companyName.includes('Mitra')) return 'PMI';
  return companyName.substring(0, 3).toUpperCase();
};

// ==========================================
// 1. MODAL CREATE ITEM
// ==========================================
function CreateItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ item_code: '', item_name: '', item_group: 'Products', stock_uom: 'Nos', is_stock_item: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Item', { ...form, is_stock_item: form.is_stock_item ? 1 : 0 });
      alert('✅ Item berhasil dibuat!');
      onClose(); if (onSuccess) onSuccess();
    } catch (err) { alert('❌ Gagal membuat item'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Tambah Item Baru</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Item Code *</label><input type="text" required className="erp-input" value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} /></div>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Item Name *</label><input type="text" required className="erp-input" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Group</label><select className="erp-input" value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}><option value="Products">Products</option><option value="Raw Material">Raw Material</option><option value="Consumables">Consumables</option></select></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600 }}>UOM</label><select className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}><option value="Nos">Nos</option><option value="Kg">Kg</option><option value="Pcs">Pcs</option></select></div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button><button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>Simpan Item</button></div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL EDIT ITEM
// ==========================================
function EditItemModal({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState({ item_name: item.item_name || '', item_group: item.item_group || 'Products', stock_uom: item.stock_uom || 'Nos', is_stock_item: item.is_stock_item === 1 || item.is_stock_item === true, standard_rate: item.standard_rate || 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Item', item.name, { ...form, is_stock_item: form.is_stock_item ? 1 : 0 });
      alert('✅ Item berhasil diupdate!'); onClose(); if (onSuccess) onSuccess();
    } catch (err) { alert('Gagal mengupdate item'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;
    setIsSubmitting(true);
    try {
      const { apiDelete } = await import('@/lib/api');
      await apiDelete('Item', item.name);
      alert('✅ Item berhasil dihapus!'); onClose(); if (onSuccess) onSuccess();
    } catch (err) { alert('Gagal menghapus item'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800 }}>Edit Item</h2><p style={{ fontSize: '12px', color: '#6B7280' }}>{item.name}</p></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Item Name *</label><input required type="text" className="erp-input" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Group</label><select required className="erp-input" value={form.item_group} onChange={e => setForm(f => ({ ...f, item_group: e.target.value }))}><option value="Products">Products</option><option value="Raw Material">Raw Material</option></select></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Stock UOM</label><select required className="erp-input" value={form.stock_uom} onChange={e => setForm(f => ({ ...f, stock_uom: e.target.value }))}><option value="Nos">Nos</option><option value="Kg">Kg</option></select></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}><button type="button" onClick={handleDelete} className="btn btn-secondary" style={{ flex: 1, color: '#dc2626' }}><Trash2 size={15} /> Hapus</button><button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Simpan Perubahan</button></div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. MODAL CREATE WAREHOUSE
// ==========================================
function CreateWarehouseModal({ onClose, onSuccess, userCompany }: { onClose: () => void; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({ warehouse_name: '', company: userCompany, is_group: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const companyCode = getCompanyCode(form.company);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Warehouse', { name: `${form.warehouse_name} - ${companyCode}`, warehouse_name: form.warehouse_name, company: form.company, is_group: form.is_group ? 1 : 0 });
      alert('✅ Warehouse berhasil dibuat!'); onClose(); if (onSuccess) onSuccess();
    } catch (err) { alert('Gagal membuat Warehouse'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Tambah Warehouse</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Nama Warehouse *</label><input required type="text" className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} placeholder="cth: Gudang Utama" /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><input type="checkbox" checked={form.is_group} onChange={e => setForm(f => ({ ...f, is_group: e.target.checked }))} /> Ini adalah parent warehouse (group)</label>
          <div style={{ display: 'flex', gap: '10px' }}><button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button><button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>Simpan Warehouse</button></div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 4. MODAL EDIT WAREHOUSE
// ==========================================
function EditWarehouseModal({ warehouse, onClose, onSuccess, userCompany }: { warehouse: any; onClose: () => void; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({ warehouse_name: warehouse.warehouse_name || '', company: warehouse.company || userCompany, is_group: warehouse.is_group === 1 || warehouse.is_group === true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Warehouse', warehouse.name, { warehouse_name: form.warehouse_name, is_group: form.is_group ? 1 : 0 });
      alert('✅ Warehouse berhasil diupdate!'); onClose(); if (onSuccess) onSuccess();
    } catch (err) { alert('Gagal mengupdate Warehouse'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Edit Warehouse</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Nama Warehouse *</label><input required type="text" className="erp-input" value={form.warehouse_name} onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: '10px' }}><button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button><button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>Simpan</button></div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. MODAL CREATE STOCK ENTRY
// ==========================================
function CreateStockEntryModal({ onClose, warehouses, items, onSuccess, userCompany }: { onClose: () => void; warehouses: any[]; items: any[]; onSuccess?: () => void; userCompany: string }) {
  const [form, setForm] = useState({ stock_entry_type: 'Material Receipt', company: userCompany, item_code: '', qty: '', warehouse: '', posting_date: new Date().toISOString().split('T')[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeWarehouses = useMemo(() => warehouses.filter((w: any) => !w.is_group), [warehouses]);

  useEffect(() => { if (activeWarehouses.length > 0 && !form.warehouse) setForm(f => ({ ...f, warehouse: activeWarehouses[0].name })); }, [activeWarehouses, form.warehouse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item_code);
      const isIssue = form.stock_entry_type === 'Material Issue';
      const detailItem: any = { item_code: form.item_code, qty: parseFloat(form.qty), uom: selectedItem?.stock_uom || 'Nos' };
      if (isIssue) detailItem.s_warehouse = form.warehouse; else detailItem.t_warehouse = form.warehouse;
      const stockEntryData: any = { stock_entry_type: form.stock_entry_type, posting_date: form.posting_date, company: form.company, items: [detailItem] };
      if (isIssue) stockEntryData.from_warehouse = form.warehouse; else stockEntryData.to_warehouse = form.warehouse;

      const response = await fetch('/api/frappe/resource/Stock Entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stockEntryData) });
      const resData = await response.json();
      if (!response.ok) throw new Error("Gagal simpan Draft");
      await fetch(`/api/frappe/resource/Stock%20Entry/${encodeURIComponent(resData.data.name)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docstatus: 1 }) });
      alert('✅ Stok berhasil diupdate!'); onClose(); if (onSuccess) onSuccess();
    } catch (err) { alert('Gagal memproses stok. Pastikan akun gudang & stok cukup.'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '480px', margin: '0 16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Buat Stock Entry</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Tipe *</label><select className="erp-input" value={form.stock_entry_type} onChange={e => setForm(f => ({ ...f, stock_entry_type: e.target.value }))}><option value="Material Receipt">Masuk (Receipt)</option><option value="Material Issue">Keluar (Issue)</option></select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Tanggal *</label><input type="date" required className="erp-input" value={form.posting_date} onChange={e => setForm(f => ({ ...f, posting_date: e.target.value }))} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Gudang *</label><select className="erp-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}>{activeWarehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
          </div>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Item *</label><select className="erp-input" value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))}><option value="">Pilih item...</option>{items.map(i => <option key={i.name} value={i.item_code}>{i.item_code}</option>)}</select></div>
          <div><label style={{ fontSize: '12px', fontWeight: 600 }}>Qty *</label><input type="number" required step="0.01" className="erp-input" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: '10px' }}><button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button><button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>Proses Stok</button></div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 6. MAIN PAGE CONTENT
// ==========================================
function StockPageContent() {
  const { can, user } = useAuth();
  const userCompany = (user as any)?.company || 'Netra Vidya';
  const { items, warehouses, bins, stockEntries, isLoading, error, refetch } = useStockData();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'items');
  useEffect(() => { if (tabParam) setActiveTab(tabParam); }, [tabParam]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateWarehouseModal, setShowCreateWarehouseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  // Murni menampilkan data tanpa filter ketat Company
  const sortedWarehouses = useMemo(() => {
    if (!warehouses) return [];
    return [...warehouses].sort((a, b) => (b?.name || '').localeCompare(a?.name || ''));
  }, [warehouses]);

  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => (b?.name || '').localeCompare(a?.name || ''));
  }, [items]);

  const sortedBins = useMemo(() => {
    if (!bins) return [];
    return [...bins].sort((a, b) => (b?.actual_qty || 0) - (a?.actual_qty || 0));
  }, [bins]);

  // SORTING AMAN (Kebal Error)
  const sortedStockEntries = useMemo(() => {
    if (!stockEntries || !Array.isArray(stockEntries)) return [];
    return [...stockEntries].sort((a, b) => {
      const timeA = new Date(a.posting_date || a.creation || 0).getTime();
      const timeB = new Date(b.posting_date || b.creation || 0).getTime();
      return timeB - timeA;
    });
  }, [stockEntries]);

  // FILTERING AMAN (Kebal Error)
  const filteredItems = sortedItems.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (i.item_name && i.item_name.toLowerCase().includes(q)) ||
      (i.item_code && i.item_code.toLowerCase().includes(q));
  });

  const filteredWarehouses = sortedWarehouses.filter(w => {
    if (!searchQuery) return true;
    return w.name && w.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredBins = sortedBins.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (b.item_code && b.item_code.toLowerCase().includes(q)) ||
      (b.warehouse && b.warehouse.toLowerCase().includes(q));
  });

  const filteredEntries = sortedStockEntries.filter(se => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (se.name && se.name.toLowerCase().includes(q)) ||
      (se.stock_entry_type && se.stock_entry_type.toLowerCase().includes(q));
  });

  const lowStockCount = sortedBins.filter((b: any) => b.actual_qty < 10).length;
  const totalStockValue = sortedBins.reduce((s: number, b: any) => s + (b.stock_value || 0), 0);

  const getPageInfo = () => {
    switch (activeTab) {
      case 'items': return { title: 'Master Items', desc: 'Katalog barang dan produk', stats: [{ label: 'Total Items', value: items?.length || 0, sub: 'Items Global', icon: <Package size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }] };
      case 'warehouse': return { title: 'Warehouses', desc: 'Lokasi gudang penyimpanan', stats: [{ label: 'Total Gudang', value: warehouses?.length || 0, sub: 'Gudang Terdaftar', icon: <Warehouse size={22} />, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }] };
      case 'bin': return { title: 'Stock Level (Bin)', desc: 'Monitoring jumlah stok aktual', stats: [{ label: 'Low Stock', value: lowStockCount, sub: 'Perlu restock', icon: <AlertTriangle size={22} />, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }, { label: 'Nilai Stok', value: formatRupiah(totalStockValue), sub: 'Valuasi', icon: <TrendingUp size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }] };
      case 'stockentry': return { title: 'Stock Entry', desc: 'Riwayat mutasi barang', stats: [{ label: 'Total Mutasi', value: stockEntries?.length || 0, sub: 'Riwayat Stok', icon: <ArrowRight size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }] };
      default: return { title: 'Inventory', desc: 'Modul Gudang', stats: [] };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {isLoading && <div style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</div>}

      {showCreateModal && <CreateStockEntryModal userCompany={userCompany} onClose={() => setShowCreateModal(false)} warehouses={sortedWarehouses} items={items} onSuccess={() => refetch()} />}
      {showCreateItemModal && <CreateItemModal onClose={() => setShowCreateItemModal(false)} onSuccess={() => refetch()} />}
      {selectedItem && <EditItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onSuccess={() => refetch()} />}
      {showCreateWarehouseModal && <CreateWarehouseModal userCompany={userCompany} onClose={() => setShowCreateWarehouseModal(false)} onSuccess={() => refetch()} />}
      {selectedWarehouse && <EditWarehouseModal userCompany={userCompany} warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} onSuccess={() => refetch()} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div><h1 style={{ fontSize: '22px', fontWeight: 800 }}>{pageInfo.title}</h1><p style={{ fontSize: '12px', color: '#6B7280' }}>{pageInfo.desc}</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {can('create_item') && activeTab === 'items' && <button className="btn btn-primary btn-sm" onClick={() => setShowCreateItemModal(true)}><Plus size={14} /> Item Baru</button>}
          {can('create_warehouse') && activeTab === 'warehouse' && <button className="btn btn-primary btn-sm" style={{ background: '#7c3aed' }} onClick={() => setShowCreateWarehouseModal(true)}><Plus size={14} /> Warehouse Baru</button>}
          {can('create_stock_entry') && activeTab === 'stockentry' && <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}><Plus size={14} /> Stock Entry</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {pageInfo.stats.map((s, idx) => (
          <div key={idx} className="stat-card card-hover">
            <div><p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p><p style={{ fontSize: '22px', fontWeight: 800 }}>{s.value}</p><p style={{ fontSize: '11px', color: s.color, fontWeight: 600 }}>{s.sub}</p></div>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Daftar {pageInfo.title}</h3>
          <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Cari data..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '100%' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="erp-table">
            <thead>
              {activeTab === 'items' && <tr><th style={{ width: '40px' }}>No.</th><th>Item Code</th><th>Item Name</th><th>Group</th><th>UOM</th><th style={{ textAlign: 'right' }}>Std Rate</th><th>Status</th><th>Actions</th></tr>}
              {activeTab === 'warehouse' && <tr><th style={{ width: '40px' }}>No.</th><th>Name</th><th>Company</th><th>Type</th><th>Status</th><th>Actions</th></tr>}
              {activeTab === 'bin' && <tr><th style={{ width: '40px' }}>No.</th><th>Item Code</th><th>Warehouse</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Valuation</th><th>Status</th></tr>}
              {activeTab === 'stockentry' && <tr><th style={{ width: '40px' }}>No.</th><th>ID Entry</th><th>Tipe</th><th>Tanggal & Waktu</th><th>From / To</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>}
            </thead>
            <tbody>
              {activeTab === 'items' && filteredItems.map((item, i) => (
                <tr key={item.name}><td>{i + 1}</td><td style={{ color: '#0066B3', fontWeight: 700 }}>{item.item_code}</td><td style={{ fontWeight: 600 }}>{item.item_name}</td><td>{item.item_group}</td><td>{item.stock_uom}</td><td style={{ textAlign: 'right' }}>{formatRupiah(item.standard_rate)}</td><td><span className={`badge ${item.disabled ? 'badge-danger' : 'badge-success'}`}>{item.disabled ? 'Inactive' : 'Active'}</span></td><td><button onClick={() => setSelectedItem(item)} className="btn-secondary" style={{ padding: '4px' }}><Edit size={14} /></button></td></tr>
              ))}
              {activeTab === 'warehouse' && filteredWarehouses.map((w, i) => (
                <tr key={w.name}><td>{i + 1}</td><td style={{ fontWeight: 700 }}>{w.name}</td><td>{w.company}</td><td>{w.is_group ? 'Group' : 'Physical'}</td><td><span className={`badge ${w.disabled ? 'badge-danger' : 'badge-success'}`}>{w.disabled ? 'Disabled' : 'Active'}</span></td><td><button onClick={() => setSelectedWarehouse(w)} className="btn-secondary" style={{ padding: '4px' }}><Edit size={14} /></button></td></tr>
              ))}
              {activeTab === 'bin' && filteredBins.map((b, i) => (
                <tr key={b.name}><td>{i + 1}</td><td style={{ color: '#0066B3', fontWeight: 700 }}>{b.item_code}</td><td>{b.warehouse}</td><td style={{ textAlign: 'right', fontWeight: 800 }}>{formatNumber(b.actual_qty)} {b.stock_uom}</td><td style={{ textAlign: 'right' }}>{formatRupiah(b.stock_value)}</td><td><span className={`badge ${b.actual_qty < 10 ? 'badge-warning' : 'badge-success'}`}>{b.actual_qty < 10 ? 'Low Stock' : 'Available'}</span></td></tr>
              ))}
              {activeTab === 'stockentry' && filteredEntries.map((se, i) => (
                <tr key={se.name}>
                  <td>{i + 1}</td>
                  <td style={{ color: '#0066B3', fontWeight: 700 }}>{se.name}</td>
                  <td><span className="badge badge-info">{se.stock_entry_type}</span></td>
                  <td><div style={{ fontSize: '12px', fontWeight: 600 }}>{formatDate(se.posting_date)}</div><div style={{ fontSize: '10px', color: '#9CA3AF' }}>Waktu: {se.posting_time || '--:--'}</div></td>
                  <td style={{ fontSize: '11px' }}>{se.from_warehouse && <div><span style={{ color: '#ef4444' }}>Out:</span> {se.from_warehouse}</div>}{se.to_warehouse && <div><span style={{ color: '#059669' }}>In:</span> {se.to_warehouse}</div>}</td>
                  <td><span className={`badge ${se.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{se.docstatus === 1 ? 'Submitted' : 'Draft'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <a href={`http://34.101.192.135:8080/app/stock-entry/${encodeURIComponent(se.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3' }}><Eye size={16} /></a>
                      {can('delete_stock_entry') && <button onClick={async () => {
                        if (!confirm('Hapus & Batalkan Stok ini?')) return;
                        try {
                          const { apiUpdate, apiDelete } = await import('@/lib/api');
                          if (se.docstatus === 1) await apiUpdate('Stock Entry', se.name, { docstatus: 2 });
                          await apiDelete('Stock Entry', se.name);
                          alert('✅ Stok Entry dibatalkan dan dihapus!'); refetch();
                        } catch (err) { alert('❌ Gagal hapus. Cek icon mata untuk melihat dokumen aslinya.'); }
                      }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

export default function StockPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  useEffect(() => { if (!canAccess('stock')) router.push('/dashboard'); }, [canAccess, router]);
  return (<Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Memuat...</div>}><StockPageContent /></Suspense>);
}