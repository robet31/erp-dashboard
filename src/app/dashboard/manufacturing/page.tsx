'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import {
  Cog, Plus, X, Trash2, Eye, Search, Layers, Wrench, PlayCircle, CheckCircle, AlertCircle
} from 'lucide-react';
import { getWarehousesByCompany } from '@/config/frappe-data';

const FIXED_COMPANY = 'Netra Vidya';

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
// 1. MODAL CREATE BOM
// ==========================================
function CreateBOMModal({ onClose, items, onSuccess }: { onClose: () => void; items: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({ item: '', quantity: '1' });
  const [bomItems, setBomItems] = useState([{ item_code: '', qty: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item) return setError("Pilih Produk Akhir.");
    if (bomItems.some(bi => !bi.item_code)) return setError("Pilih semua bahan baku.");
    
    setIsSubmitting(true); setError('');
    try {
      const selectedMainItem = items.find(i => i.item_code === form.item);
      const bomData = {
        item: form.item,
        quantity: parseFloat(form.quantity),
        uom: selectedMainItem?.stock_uom || 'Nos',
        company: FIXED_COMPANY,
        is_active: 1,
        is_default: 1,
        items: bomItems.map(bi => {
          const itemDetail = items.find(it => it.item_code === bi.item_code);
          return { item_code: bi.item_code, qty: parseFloat(String(bi.qty)), uom: itemDetail?.stock_uom || 'Nos', rate: itemDetail?.standard_rate || 0 };
        })
      };

      const { apiCreate, apiUpdate } = await import('@/lib/api');
      const res: any = await apiCreate('BOM', bomData);
      
      const docName = res.data?.name || res.name;
      if(docName) await apiUpdate('BOM', docName, { docstatus: 1 });

      alert('✅ BOM Berhasil dibuat dan diaktifkan!');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, "Gagal membuat BOM.")); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Buat BOM Baru</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="erp-label">Produk Akhir (Item Jadi) *</label>
            <select required className="erp-input" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}>
              <option value="">-- Pilih Item --</option>
              {items.map((i: any) => <option key={i.name} value={i.item_code}>{i.item_code} - {i.item_name}</option>)}
            </select>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>Daftar Bahan Baku:</p>
            {bomItems.map((bi, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select style={{ flex: 3 }} className="erp-input" value={bi.item_code} onChange={e => { const n = [...bomItems]; n[i].item_code = e.target.value; setBomItems(n); }}>
                  <option value="">Pilih Bahan...</option>
                  {items.map((it: any) => <option key={it.name} value={it.item_code}>{it.item_code}</option>)}
                </select>
                <input style={{ flex: 1 }} type="number" min="0.1" step="0.1" placeholder="Qty" className="erp-input" value={bi.qty} onChange={e => { const n = [...bomItems]; n[i].qty = Number(e.target.value); setBomItems(n); }} />
                {bomItems.length > 1 && <button type="button" onClick={() => setBomItems(bomItems.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border:'none', background:'none' }}><Trash2 size={16} /></button>}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBomItems([...bomItems, { item_code: '', qty: 1 }])}>+ Tambah Bahan</button>
          </div>
          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" style={{ flex: 2, background: '#8b5cf6' }} disabled={isSubmitting}>{isSubmitting ? 'Memproses...' : 'Simpan & Aktifkan BOM'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL CREATE WORK ORDER
// ==========================================
function CreateWorkOrderModal({ onClose, boms, onSuccess }: { onClose: () => void; boms: any[]; onSuccess?: () => void }) {
  const [form, setForm] = useState({ bom_no: '', qty: '1', source_warehouse: 'Stores - NV', wip_warehouse: 'Work In Progress - NV', fg_warehouse: 'Finished Goods - NV' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const warehouses = getWarehousesByCompany(FIXED_COMPANY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bom_no) return setError("Pilih BOM terlebih dahulu.");
    setIsSubmitting(true); setError('');
    try {
      const selectedBom = boms.find(b => b.name === form.bom_no);
      const woData = {
        production_item: selectedBom?.item,
        bom_no: form.bom_no,
        qty: parseFloat(form.qty),
        company: FIXED_COMPANY,
        source_warehouse: form.source_warehouse,
        wip_warehouse: form.wip_warehouse,
        fg_warehouse: form.fg_warehouse,
        use_multi_level_bom: 0
      };

      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Work Order', woData);

      alert('✅ Work Order Berhasil dibuat!');
      onClose(); if (onSuccess) onSuccess();
    } catch (err: any) { setError(extractFrappeError(err, "Gagal membuat Work Order.")); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '520px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Buat Work Order Baru</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="erp-label">Pilih BOM (Resep) *</label>
            <select required className="erp-input" value={form.bom_no} onChange={e => setForm(f => ({ ...f, bom_no: e.target.value }))}>
              <option value="">-- Pilih BOM Aktif --</option>
              {boms.map((b: any) => <option key={b.name} value={b.name}>{b.name} ({b.item})</option>)}
            </select>
          </div>
          <div><label className="erp-label">Qty untuk Diproduksi *</label><input type="number" required min="1" className="erp-input" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></div>
          
          <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontWeight: 700, fontSize: '13px' }}>Pengaturan Gudang</p>
            <div><label className="erp-label">Gudang Bahan Baku (Source)</label><select className="erp-input" value={form.source_warehouse} onChange={e => setForm(f => ({ ...f, source_warehouse: e.target.value }))}>{warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
            <div><label className="erp-label">Gudang Produksi (WIP)</label><select className="erp-input" value={form.wip_warehouse} onChange={e => setForm(f => ({ ...f, wip_warehouse: e.target.value }))}>{warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
            <div><label className="erp-label">Gudang Barang Jadi (FG)</label><select className="erp-input" value={form.fg_warehouse} onChange={e => setForm(f => ({ ...f, fg_warehouse: e.target.value }))}>{warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
          </div>

          {error && <div className="error-box">{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-btn" style={{ flex: 1 }}>Batal</button>
            <button type="submit" className="btn btn-primary mobile-btn" style={{ flex: 2, background: '#8b5cf6' }} disabled={isSubmitting}>{isSubmitting ? 'Memproses...' : 'Buat Work Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN PAGE CONTENT
// ==========================================
function ManufacturingPageContent() {
  const { can } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'bom';
  const [activeTab, setActiveTab] = useState(tabParam);
  
  useEffect(() => { setActiveTab(tabParam || 'bom'); }, [tabParam]);

  const { boms, workOrders, isLoading, error, refetch } = useManufacturingData() as any;
  const { items } = useStockData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateBOM, setShowCreateBOM] = useState(false);
  const [showCreateWO, setShowCreateWO] = useState(false);

  // Sorting Mutlak: Waktu Terbaru di Atas (Dengan proteksi NaN)
  const sortByNewest = (data: any[]) => {
    return [...(data || [])].sort((a, b) => {
      let timeA = new Date(a.creation || 0).getTime();
      let timeB = new Date(b.creation || 0).getTime();
      timeA = isNaN(timeA) ? 0 : timeA;
      timeB = isNaN(timeB) ? 0 : timeB;
      
      if (timeA !== timeB) return timeB - timeA;
      return String(b.name).localeCompare(String(a.name));
    });
  };

  const sortedBOMs = useMemo(() => sortByNewest(boms), [boms]);
  const sortedWOs = useMemo(() => sortByNewest(workOrders), [workOrders]);
  
  // Simulasi Job Cards berdasarkan Work Order
  const simulatedJobCards = useMemo(() => {
    const jc: any[] = [];
    sortedWOs.forEach((wo: any) => {
      if(wo.docstatus === 1) { // Hanya WO yang di-submit punya job card
        jc.push({
          name: `JC-${wo.name.replace('WO-', '')}-01`,
          work_order: wo.name,
          production_item: wo.production_item,
          status: wo.status === 'Completed' ? 'Completed' : (wo.status === 'In Process' ? 'Work In Progress' : 'Open'),
          qty: wo.qty,
          creation: wo.creation
        });
      }
    });
    return jc;
  }, [sortedWOs]);

  const filteredBOMs = sortedBOMs.filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.item.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWOs = sortedWOs.filter(w => !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.production_item.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredJCs = simulatedJobCards.filter(j => !searchQuery || j.name.toLowerCase().includes(searchQuery.toLowerCase()) || j.work_order.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatCreationTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getWOStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return 'badge-success';
      case 'In Process': return 'badge-info';
      case 'Draft': return 'badge-gray';
      case 'Stopped': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  const handleSmartDelete = async (doctype: string, docname: string, docstatus: number) => {
    if (!confirm(`Yakin ingin membatalkan & menghapus ${doctype} ${docname}?`)) return;
    try {
      const { apiUpdate, apiDelete } = await import('@/lib/api');
      if (docstatus === 1) await apiUpdate(doctype, docname, { docstatus: 2 });
      await apiDelete(doctype, docname);
      alert(`✅ ${doctype} berhasil dihapus!`);
      refetch();
    } catch (err: any) { alert(`❌ Gagal menghapus!\n\nAlasan: ${extractFrappeError(err)}`); }
  };

  // Aksi Work Order: Submit, Start, Finish
  const handleWOAction = async (wo: any, action: 'submit' | 'start' | 'finish') => {
    try {
      const { apiUpdate } = await import('@/lib/api');
      
      if (action === 'submit') {
        if(!confirm('Yakin ingin Submit Work Order ini?')) return;
        await apiUpdate('Work Order', wo.name, { docstatus: 1 });
        alert('✅ Work Order disubmit!');
      } 
      else if (action === 'start') {
        const qtyToStart = prompt('Masukkan Qty bahan baku yang akan ditarik ke pabrik:', wo.qty);
        if(!qtyToStart) return;
        // Simulasi hit API Start
        await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(wo.name)}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'In Process' }) });
        alert(`✅ Produksi dimulai untuk ${qtyToStart} unit. Bahan baku telah dipindahkan ke WIP.`);
      }
      else if (action === 'finish') {
        const qtyToFinish = prompt('Masukkan Qty barang jadi yang sudah selesai dirakit:', wo.qty);
        if(!qtyToFinish) return;
        // Simulasi hit API Finish
        await fetch(`/api/frappe/resource/Work Order/${encodeURIComponent(wo.name)}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'Completed' }) });
        alert(`✅ Produksi selesai! ${qtyToFinish} unit barang ditambahkan ke Gudang Jadi.`);
      }
      refetch();
    } catch (err: any) { alert(`❌ Gagal melakukan aksi: ${extractFrappeError(err)}`); }
  };

  const getPageInfo = () => {
    switch(activeTab) {
      case 'bom': return { title: 'Bill of Materials', desc: 'Kelola resep dan daftar bahan baku produksi' };
      case 'workorders': return { title: 'Work Orders', desc: 'Daftar Surat Perintah Kerja produksi' };
      case 'jobcards': return { title: 'Job Cards', desc: 'Kartu tugas lapangan untuk operator' };
      default: return { title: 'Manufacturing', desc: 'Modul Produksi' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat data...</div>}
      {error && <div className="error-box"><AlertCircle size={16} />{error}</div>}

      {showCreateBOM && <CreateBOMModal items={items} onClose={() => setShowCreateBOM(false)} onSuccess={() => refetch()} />}
      {showCreateWO && <CreateWorkOrderModal boms={sortedBOMs.filter(b=>b.docstatus===1)} onClose={() => setShowCreateWO(false)} onSuccess={() => refetch()} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{pageInfo.title}</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>{pageInfo.desc}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {can('create_bom') && activeTab === 'bom' && <button className="btn btn-primary btn-sm mobile-btn" style={{ background: '#0ea5e9' }} onClick={() => setShowCreateBOM(true)}><Plus size={14} /> BOM Baru</button>}
          {can('create_work_order') && activeTab === 'workorders' && <button className="btn btn-primary btn-sm mobile-btn" style={{ background: '#8b5cf6' }} onClick={() => setShowCreateWO(true)}><Plus size={14} /> Work Order Baru</button>}
        </div>
      </div>

      <div className="chart-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Daftar {pageInfo.title}</h3>
          <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Cari data..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '6px 10px 6px 30px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', width: '100%', outline: 'none' }} />
          </div>
        </div>

        {activeTab === 'bom' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>BOM ID & Waktu Dibuat</th><th>Item Produksi</th><th>Status</th>{can('edit_bom') && <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>}</tr></thead>
              <tbody>
                {filteredBOMs.map((bom, index) => (
                  <tr key={bom.name}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0066B3', fontSize: '13px' }}>{bom.name}</div>
                      {bom.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Dibuat: {formatCreationTime(bom.creation)}</div>}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{bom.item}</td>
                    <td><span className={`badge ${bom.docstatus === 1 ? 'badge-success' : 'badge-gray'}`}>{bom.docstatus === 1 ? 'Aktif' : 'Draft'}</span></td>
                    {can('edit_bom') && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <a href={`http://34.101.192.135:8080/app/bom/${encodeURIComponent(bom.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', padding: '4px', display: 'flex' }} title="Buka di ERPNext"><Eye size={16} /></a>
                          <button onClick={() => handleSmartDelete('BOM', bom.name, bom.docstatus)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', display: 'flex' }} title="Hapus"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredBOMs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Belum ada Resep BOM.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'workorders' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>WO Number & Tanggal</th><th>Item Produksi</th><th style={{ textAlign: 'center' }}>Qty</th><th>Status</th>{can('edit_work_order') && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead>
              <tbody>
                {filteredWOs.map((wo, index) => (
                  <tr key={wo.name}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '13px' }}>{wo.name}</div>
                      {wo.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Dibuat: {formatCreationTime(wo.creation)}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{wo.production_item}</div>
                      <div style={{ fontSize: '10px', color: '#6B7280' }}>BOM: {wo.bom_no}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{wo.qty}</td>
                    <td><span className={`badge ${getWOStatusBadge(wo.status)}`}>{wo.status}</span></td>
                    {can('edit_work_order') && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {wo.status === 'Draft' && <button onClick={() => handleWOAction(wo, 'submit')} className="badge badge-info" style={{ cursor: 'pointer', border: 'none' }}>Submit</button>}
                          {wo.status === 'Not Started' && <button onClick={() => handleWOAction(wo, 'start')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}><PlayCircle size={12}/> Start</button>}
                          {wo.status === 'In Process' && <button onClick={() => handleWOAction(wo, 'finish')} className="badge badge-success" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}><CheckCircle size={12}/> Finish</button>}
                          <a href={`http://34.101.192.135:8080/app/work-order/${encodeURIComponent(wo.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', padding: '4px' }}><Eye size={16} /></a>
                          <button onClick={() => handleSmartDelete('Work Order', wo.name, wo.docstatus)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredWOs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Belum ada Work Order.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'jobcards' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Job Card ID</th><th>Work Order Ref</th><th>Item Produksi</th><th>Status</th></tr></thead>
              <tbody>
                {filteredJCs.map((jc, index) => (
                  <tr key={jc.name}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '13px' }}>{jc.name}</div>
                      {jc.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Dibuat: {formatCreationTime(jc.creation)}</div>}
                    </td>
                    <td style={{ fontWeight: 600, color: '#8b5cf6', fontSize: '12px' }}>{jc.work_order}</td>
                    <td style={{ fontSize: '13px' }}>{jc.production_item} (Qty: {jc.qty})</td>
                    <td><span className={`badge ${jc.status === 'Completed' ? 'badge-success' : jc.status === 'Work In Progress' ? 'badge-info' : 'badge-warning'}`}>{jc.status}</span></td>
                  </tr>
                ))}
                {filteredJCs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Belum ada Job Card. (Submit Work Order untuk memunculkan Job Card).</td></tr>}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .erp-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
        .erp-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111827; outline: none; transition: border-color 0.2s; }
        .erp-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.1); }
        .error-box { background: #fee2e2; border-radius: 6px; padding: 10px; color: #991b1b; font-size: 12px; margin-top: 10px; display: flex; align-items: center; gap: 8px; }
        .badge-purple { background: #ede9fe; color: #6d28d9; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        
        /* Mobile Specific Adjustments */
        @media (max-width: 640px) {
          .responsive-grid { grid-template-columns: 1fr; }
          .mobile-btn { width: 100%; justify-content: center; margin-bottom: 8px; }
        }
      `}</style>
    </div>
  );
}

export default function ManufacturingPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px' }}>Memuat halaman...</div>}>
      <ManufacturingPageContent />
    </Suspense>
  );
}