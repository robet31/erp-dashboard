'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import {
  Cog, FileText, CheckCircle, Clock,
  Plus, Download, Search, X, ChevronRight,
  ArrowRight, Package, Layers, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatRupiah, formatDate, getWorkOrderProgress, formatNumber } from '@/lib/utils';
import type { WorkOrder, BOM } from '@/lib/frappe-types';
import { FRAPPE_COMPANIES, FRAPPE_WAREHOUSES, getWarehousesByCompany } from '@/config/frappe-data';

const WO_STATUSES = ['Semua', 'Not Started', 'In Process', 'Completed', 'Stopped'];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Not Started': { bg: '#f3f4f6', color: '#374151' },
  'In Process': { bg: '#dbeafe', color: '#1d4ed8' },
  'Completed': { bg: '#d1fae5', color: '#065f46' },
  'Stopped': { bg: '#fee2e2', color: '#991b1b' },
};

// Create Work Order Modal
function CreateWorkOrderModal({ onClose, items, boms, onSuccess }: { onClose: () => void; items: any[]; boms: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    production_item: '',
    bom_no: '',
    qty: '',
    company: 'Netra Vidya',
    planned_start_date: new Date().toISOString().split('T')[0],
    planned_end_date: '',
    fg_warehouse: 'Finished Goods - NV',
    wip_warehouse: 'Work In Progress - NV',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const warehouses = useMemo(() => getWarehousesByCompany(form.company), [form.company]);

  const handleCompanyChange = (company: string) => {
    const code = company === 'Netra Vidya' ? 'NV' : 
                 company === 'PT Solusi Berdikari' ? 'PSB' :
                 company === 'PT Maju Sejahtera' ? 'PMS' : 'PMJA';
    setForm(f => ({
      ...f,
      company,
      fg_warehouse: `Finished Goods - ${code}`,
      wip_warehouse: `Work In Progress - ${code}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const selectedItem = items.find((i: any) => i.item_code === form.production_item);
      const workOrderData = {
        production_item: form.production_item,
        item_name: selectedItem?.item_name || form.production_item,
        bom_no: form.bom_no,
        qty: parseFloat(form.qty),
        planned_start_date: form.planned_start_date,
        planned_end_date: form.planned_end_date || null,
        fg_warehouse: form.fg_warehouse,
        wip_warehouse: form.wip_warehouse,
        company: form.company,
        status: 'Not Started',
      };

      const { apiCreate } = await import('@/lib/api');
      const result = await apiCreate('Work Order', workOrderData);
      console.log('Work Order created in ERP:', result);
      alert('✅ Work Order berhasil dibuat di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create Work Order:', err);
      setError('Gagal membuat Work Order: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat Work Order</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Perintah produksi untuk barang</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Produksi *</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.production_item} onChange={e => setForm(f => ({ ...f, production_item: e.target.value }))}>
                <option value="">Pilih item...</option>
                {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>BOM *</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.bom_no} onChange={e => setForm(f => ({ ...f, bom_no: e.target.value }))}>
                <option value="">Pilih BOM...</option>
                {boms.map((b: any) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Jumlah Produksi (Qty) *</label>
            <input type="number" required placeholder="0" className="erp-input" style={{ fontSize: '13px' }} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Mulai *</label>
                <input type="date" required className="erp-input" style={{ fontSize: '13px' }} value={form.planned_start_date} onChange={e => setForm(f => ({ ...f, planned_start_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Tanggal Selesai</label>
                <input type="date" className="erp-input" style={{ fontSize: '13px' }} value={form.planned_end_date} onChange={e => setForm(f => ({ ...f, planned_end_date: e.target.value }))} />
              </div>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Perusahaan *</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.company} onChange={e => handleCompanyChange(e.target.value)}>
                {FRAPPE_COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>FG Warehouse</label>
                <select className="erp-input" style={{ fontSize: '13px' }} value={form.fg_warehouse} onChange={e => setForm(f => ({ ...f, fg_warehouse: e.target.value }))}>
                  {warehouses.filter(w => w.type === 'FG').map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>WIP Warehouse</label>
                <select className="erp-input" style={{ fontSize: '13px' }} value={form.wip_warehouse} onChange={e => setForm(f => ({ ...f, wip_warehouse: e.target.value }))}>
                  {warehouses.filter(w => w.type === 'WIP').map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#374151', lineHeight: 1.6, border: '1px solid #dbeafe' }}>
              <strong>API:</strong> POST {`http://34.101.192.135:8080/api/resource/Work%20Order`}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2 }}>
                {isSubmitting ? 'Menyimpan...' : (<><Cog size={14} /> Buat Work Order</>)}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}

// Work Order Detail Modal
function WorkOrderDetailModal({ wo, onClose }: { wo: WorkOrder; onClose: () => void }) {
  const progress = getWorkOrderProgress(wo.produced_qty, wo.qty);
  const statusStyle = STATUS_COLORS[wo.status] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{wo.name}</h2>
            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, marginTop: '4px', display: 'inline-block' }}>
              {wo.status}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Item Produksi', value: `${wo.production_item} - ${wo.item_name}` },
            { label: 'BOM', value: wo.bom_no },
            { label: 'Company', value: wo.company },
            { label: 'Sales Order', value: wo.sales_order || '-' },
            { label: 'Tanggal Mulai', value: formatDate(wo.planned_start_date) },
            { label: 'Tanggal Selesai', value: wo.planned_end_date ? formatDate(wo.planned_end_date) : '-' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8f9fb', padding: '10px 12px', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>{label}</p>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Progress Produksi</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0066B3' }}>{progress}%</span>
          </div>
          <div className="progress-bar" style={{ height: '10px' }}>
            <div className="progress-fill" style={{
              width: `${progress}%`,
              background: progress === 100 ? '#10b981' : '#0066B3',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#6B7280' }}>
            <span>Diproduksi: <strong style={{ color: '#111827' }}>{formatNumber(wo.produced_qty)}</strong></span>
            <span>Target: <strong style={{ color: '#111827' }}>{formatNumber(wo.qty)}</strong></span>
          </div>
        </div>

        <div style={{ background: '#f8f9fb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#6B7280' }}>WIP Warehouse</p>
              <p style={{ fontWeight: 700, color: '#374151', marginTop: '2px' }}>{wo.wip_warehouse || '-'}</p>
            </div>
            <ArrowRight size={16} color="#9CA3AF" />
            <div>
              <p style={{ fontSize: '11px', color: '#6B7280' }}>FG Warehouse</p>
              <p style={{ fontWeight: 700, color: '#374151', marginTop: '2px' }}>{wo.fg_warehouse || '-'}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Tutup</button>
          <a href={`http://34.101.192.135:8080/app/work-order/${encodeURIComponent(wo.name)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 2, textDecoration: 'none' }}>
            Buka di ERPNext
          </a>
        </div>
      </div>
    </div>
  );
}

// Create BOM Modal
function CreateBOMModal({ onClose, items, onSuccess }: { onClose: () => void; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({
    item: '',
    quantity: '1',
    uom: 'Nos',
    is_active: true,
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const selectedItem = items.find((i: any) => i.item_code === form.item);
      const bomData = {
        item: form.item,
        item_name: selectedItem?.item_name || form.item,
        quantity: parseFloat(form.quantity),
        uom: form.uom,
        is_active: form.is_active ? 1 : 0,
        is_default: form.is_default ? 1 : 0,
        company: 'PT Solusi Berdikari',
      };
      
      const { apiCreate } = await import('@/lib/api');
      const result = await apiCreate('BOM', bomData);
      console.log('BOM created in ERP:', result);
      alert('✅ BOM berhasil dibuat di ERP Frappe!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to create BOM:', err);
      setError('Gagal membuat BOM: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>Buat BOM Baru</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Bill of Materials - Daftar material untuk produksi</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Item Produksi *</label>
            <select required className="erp-input" style={{ fontSize: '13px' }} value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}>
              <option value="">Pilih item...</option>
              {items.filter((i: any) => !i.is_stock_item || i.item_group === 'Finished Goods').map((i: any) => (
                <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Quantity *</label>
              <input type="number" required className="erp-input" style={{ fontSize: '13px' }} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>UOM *</label>
              <select required className="erp-input" style={{ fontSize: '13px' }} value={form.uom} onChange={e => setForm(f => ({ ...f, uom: e.target.value }))}>
                <option value="Nos">Nos</option>
                <option value="Kg">Kg</option>
                <option value="Liter">Liter</option>
                <option value="Pcs">Pcs</option>
                <option value="Unit">Unit</option>
              </select>
            </div>
          </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Aktif
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                Default BOM
              </label>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ background: '#f8f9fb', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#6B7280' }}>
            <strong>API:</strong> POST /api/resource/BOM<br/>
            Data akan disimpan di Frappe ERP
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 2, background: '#7c3aed' }}>
              {isSubmitting ? 'Menyimpan...' : 'Buat BOM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManufacturingPage() {
  const router = useRouter();
  const { can, canAccess } = useAuth();
  const { workOrders, boms, isLoading, error, refetch } = useManufacturingData();
  const { items } = useStockData();
  const [activeTab, setActiveTab] = useState('workorders');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateWOModal, setShowCreateWOModal] = useState(false);
  const [showCreateBOMModal, setShowCreateBOMModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  // Redirect if user doesn't have access to manufacturing module
  React.useEffect(() => {
    if (!canAccess('manufacturing')) {
      router.push('/dashboard');
    }
  }, [canAccess, router]);

  const tabsWithCounts = [
    { id: 'workorders', label: 'Work Orders', count: workOrders.length },
    { id: 'bom', label: 'BOM (Bill of Materials)', count: boms.length },
  ];

  // Calculate work order status from actual data
  const workOrderStatus = React.useMemo(() => ({
    total: workOrders.length,
    completed: workOrders.filter((w: any) => w.status === 'Completed').length,
    inProcess: workOrders.filter((w: any) => w.status === 'In Process').length,
    pending: workOrders.filter((w: any) => w.status === 'Not Started' || w.status === 'Pending').length,
    rejected: workOrders.filter((w: any) => w.status === 'Cancelled' || w.status === 'Stopped').length,
  }), [workOrders]);

  const donutData = [
    { name: 'Selesai', value: workOrderStatus.completed },
    { name: 'Dalam Proses', value: workOrderStatus.inProcess },
    { name: 'Menunggu', value: workOrderStatus.pending },
    { name: 'Ditolak', value: workOrderStatus.rejected },
  ];
  const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  // Calculate production trend from work orders
  const productionTrend = React.useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const map: Record<string, { planned: number; produced: number }> = {};
    workOrders.forEach((wo: any) => {
      const d = new Date(wo.planned_start_date);
      const key = months[d.getMonth()];
      if (!map[key]) map[key] = { planned: 0, produced: 0 };
      map[key].planned += wo.qty || 0;
      map[key].produced += wo.produced_qty || 0;
    });
    return Array.from({ length: 6 }, (_, i) => {
      const m = (now.getMonth() - 5 + i + 12) % 12;
      return { month: months[m], planned: map[months[m]]?.planned || 80000, produced: map[months[m]]?.produced || 65000 };
    });
  }, [workOrders]);

  const filteredWOs = workOrders.filter((wo: any) => {
    if (statusFilter !== 'Semua' && wo.status !== statusFilter) return false;
    if (searchQuery && !wo.item_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !wo.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { label: 'Total Work Orders', value: workOrders.length, sub: 'Semua perintah produksi', icon: <Cog size={22} />, color: '#0066B3', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
    { label: 'In Process', value: workOrders.filter((w: any) => w.status === 'In Process').length, sub: 'Sedang berproduksi', icon: <Clock size={22} />, color: '#d97706', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
    { label: 'Completed', value: workOrders.filter((w: any) => w.status === 'Completed').length, sub: 'Produksi selesai', icon: <CheckCircle size={22} />, color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
    { label: 'Total BOMs', value: boms.length, sub: 'Bill of Materials', icon: <Layers size={22} />, color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {/* Loading/Error State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
          Memuat data...
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>Gagal memuat data: {error}</span>
          <button onClick={refetch} style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Coba Lagi</button>
        </div>
      )}

      {showCreateWOModal && <CreateWorkOrderModal onClose={() => setShowCreateWOModal(false)} items={items} boms={boms} onSuccess={() => refetch()} />}
      {showCreateBOMModal && <CreateBOMModal onClose={() => setShowCreateBOMModal(false)} items={items} onSuccess={() => refetch()} />}
      {selectedWO && <WorkOrderDetailModal wo={selectedWO} onClose={() => setSelectedWO(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Modul Manufacturing</h1>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
            BOM, Work Order, Produksi, Stock Entry Manufacture
          </p>
          <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
            ERPNext Doctype: BOM, Work Order, Job Card, Quality Inspection
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Export</button>
          {can('create_work_order') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateWOModal(true)}>
              <Plus size={14} /> Work Order Baru
            </button>
          )}
          {can('create_bom') && activeTab === 'bom' && (
            <button className="btn btn-primary btn-sm" style={{ background: '#7c3aed' }} onClick={() => setShowCreateBOMModal(true)}>
              <Plus size={14} /> BOM Baru
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card card-hover">
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{s.sub}</p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', marginBottom: '16px' }}>
        {/* Production vs Target */}
        <div className="chart-container">
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>Produksi vs Target (6 Bulan)</p>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={productionTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, name) => [`${formatNumber(Number(v))} pcs`, String(name) === 'planned' ? 'Target' : 'Diproduksi']} />
              <Bar dataKey="planned" name="Target" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="produced" name="Diproduksi" fill="#0066B3" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Donut */}
        <div className="chart-container">
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Status Work Order</p>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{workOrderStatus.total}</p>
              <p style={{ fontSize: '10px', color: '#6B7280' }}>Total</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {donutData.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#6B7280' }}>{item.name}</span>
                <strong style={{ color: '#111827' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ERPNext Flow Diagram */}
      <div className="chart-container" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #f8f9fb, #eff6ff)' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '14px' }}>
          🔄 Flow Produksi: Saat Stok Tidak Cukup
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Sales Order', sub: 'Order masuk', color: '#0066B3' },
            { label: 'Cek Stok', sub: 'Bin check', color: '#d97706' },
            { label: 'Work Order', sub: 'Perintah produksi', color: '#7c3aed' },
            { label: 'Produksi', sub: 'Proses manufaktur', color: '#0891b2' },
            { label: 'Stock Entry', sub: 'Barang masuk stok', color: '#059669' },
            { label: 'Delivery Note', sub: 'Kirim ke customer', color: '#374151' },
          ].map((step, i, arr) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'white', borderRadius: '10px', padding: '10px 16px',
                border: `2px solid ${step.color}20`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                textAlign: 'center', minWidth: '110px',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step.color, margin: '0 auto 6px' }} />
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{step.label}</p>
                <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{step.sub}</p>
              </div>
              {i < arr.length - 1 && <ChevronRight size={16} color="#9CA3AF" />}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="chart-container">
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {tabsWithCounts.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} <span style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: activeTab === tab.id ? 'white' : '#6B7280',
                padding: '1px 7px', borderRadius: '10px', fontSize: '11px', marginLeft: '4px',
              }}>{tab.count}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari work order, item..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontFamily: "'Montserrat', sans-serif", outline: 'none', width: '220px' }}
            />
          </div>
        </div>

        {/* Work Orders Table */}
        {activeTab === 'workorders' && (
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {WO_STATUSES.map((f) => (
                <button
                  key={f}
                  className={`filter-pill ${statusFilter === f ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Work Order Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredWOs.map((wo) => {
                const progress = getWorkOrderProgress(wo.produced_qty, wo.qty);
                const statusStyle = STATUS_COLORS[wo.status] || { bg: '#f3f4f6', color: '#374151' };
                return (
                  <div
                    key={wo.name}
                    onClick={() => setSelectedWO(wo)}
                    style={{
                      border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: 'white',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#dbeafe'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ color: '#0066B3', fontWeight: 800, fontSize: '14px' }}>{wo.name}</span>
                          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            {wo.status}
                          </span>
                          {wo.sales_order && (
                            <span style={{ background: '#eff6ff', color: '#0066B3', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600 }}>
                              SO: {wo.sales_order}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{wo.item_name}</p>
                        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Item: {wo.production_item} | BOM: {wo.bom_no}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#6B7280' }}>Mulai</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{formatDate(wo.planned_start_date)}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>Progress Produksi</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: progress === 100 ? '#059669' : '#0066B3' }}>{progress}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: '8px' }}>
                        <div className="progress-fill" style={{
                          width: `${progress}%`,
                          background: progress === 100 ? '#10b981' : progress > 50 ? '#0066B3' : '#f59e0b',
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
                      <span>Target: <strong style={{ color: '#111827' }}>{formatNumber(wo.qty)} pcs</strong></span>
                      <span>Diproduksi: <strong style={{ color: '#059669' }}>{formatNumber(wo.produced_qty)} pcs</strong></span>
                      <span>Sisa: <strong style={{ color: '#ef4444' }}>{formatNumber(wo.qty - wo.produced_qty)} pcs</strong></span>
                    </div>
                  </div>
                );
              })}
              {filteredWOs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block', color: '#9CA3AF' }} />
                  Tidak ada Work Order yang sesuai filter
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOM Table */}
        {activeTab === 'bom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {boms.map((bom: any) => (
              <div key={bom.name} style={{
                border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden',
                background: 'white',
              }}>
                {/* BOM Header */}
                <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={16} color="#7c3aed" />
                    <div>
                      <span style={{ color: '#0066B3', fontWeight: 800, fontSize: '14px', marginRight: '8px' }}>{bom.name}</span>
                      <span style={{ background: bom.is_active ? '#d1fae5' : '#fee2e2', color: bom.is_active ? '#065f46' : '#991b1b', padding: '1px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700 }}>
                        {bom.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                      {bom.is_default ? <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, marginLeft: '4px' }}>Default</span> : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <span style={{ color: '#6B7280' }}>{bom.item} - </span>
                    <strong style={{ color: '#111827' }}>{bom.item_name}</strong>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Qty: {bom.quantity} | {bom.currency}</div>
                  </div>
                </div>

                {/* BOM Items */}
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Bahan Baku</p>
                  <table className="erp-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th>UOM</th>
                        <th style={{ textAlign: 'right' }}>Rate</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bom.items || []).map((item: any, i: number) => (
                        <tr key={i}>
                          <td style={{ color: '#0066B3', fontWeight: 700 }}>{item.item_code}</td>
                          <td style={{ color: '#374151' }}>{item.item_name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.qty}</td>
                          <td style={{ color: '#6B7280' }}>{item.uom}</td>
                          <td style={{ textAlign: 'right' }}>{item.rate ? formatRupiah(item.rate) : '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.amount ? formatRupiah(item.amount) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bom.total_cost ? (
                    <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '13px' }}>
                      Total Cost: <strong style={{ color: '#0066B3' }}>{formatRupiah(bom.total_cost)}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
