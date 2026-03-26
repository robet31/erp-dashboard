'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import {
  Cog, Plus, X, Trash2, Eye, Search, Layers, Wrench, PlayCircle, CheckCircle, AlertCircle, Send, Timer, Clock, MonitorPlay, CheckSquare
} from 'lucide-react';
import { getWarehousesByCompany } from '@/config/frappe-data';

const FIXED_COMPANY = 'Netra Vidya';

const extractFrappeError = (err: any, fallbackMsg: string = 'Terjadi kesalahan sistem') => {
  if (typeof err === 'string') return err;
  let errorMsg = err?.message || err?.error?.message || fallbackMsg;
  if (err?._server_messages) {
    try { errorMsg = JSON.parse(JSON.parse(err._server_messages)[0]).message.replace(/<[^>]*>?/gm, ''); } catch(e) {}
  }
  return errorMsg;
};

const formatTimer = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// ==========================================
// 1. MODAL CREATE BOM
// ==========================================
function CreateBOMModal({ onClose, items, onSuccess }: any) {
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
      const selectedMainItem = items.find((i: any) => i.item_code === form.item);
      const bomData = {
        item: form.item, quantity: parseFloat(form.quantity), uom: selectedMainItem?.stock_uom || 'Nos',
        company: FIXED_COMPANY, is_active: 1, is_default: 1,
        items: bomItems.map(bi => {
          const itemDetail = items.find((it: any) => it.item_code === bi.item_code);
          return { item_code: bi.item_code, qty: parseFloat(String(bi.qty)), uom: itemDetail?.stock_uom || 'Nos', rate: itemDetail?.standard_rate || 0 };
        })
      };
      const { apiCreate, apiUpdate } = await import('@/lib/api');
      const res: any = await apiCreate('BOM', bomData);
      const docName = res.data?.name || res.name;
      if(docName) await apiUpdate('BOM', docName, { docstatus: 1 });
      alert('✅ BOM Berhasil dibuat dan diaktifkan!'); onClose(); if (onSuccess) onSuccess();
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
            <button type="submit" className="btn btn-primary mobile-btn" style={{ flex: 2, background: '#0ea5e9', borderColor: '#0ea5e9' }} disabled={isSubmitting}>{isSubmitting ? 'Memproses...' : 'Simpan & Aktifkan BOM'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL CREATE WORK ORDER
// ==========================================
function CreateWorkOrderModal({ onClose, boms, onSuccess }: any) {
  const [form, setForm] = useState({ bom_no: '', qty: '1', source_warehouse: 'Stores - NV', wip_warehouse: 'Work In Progress - NV', fg_warehouse: 'Finished Goods - NV' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const warehouses = getWarehousesByCompany(FIXED_COMPANY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bom_no) return setError("Pilih BOM terlebih dahulu.");
    setIsSubmitting(true); setError('');
    try {
      const selectedBom = boms.find((b: any) => b.name === form.bom_no);
      const woData = { production_item: selectedBom?.item, bom_no: form.bom_no, qty: parseFloat(form.qty), company: FIXED_COMPANY, source_warehouse: form.source_warehouse, wip_warehouse: form.wip_warehouse, fg_warehouse: form.fg_warehouse, use_multi_level_bom: 0 };
      const { apiCreate } = await import('@/lib/api');
      await apiCreate('Work Order', woData);
      alert('✅ Work Order Berhasil dibuat (Draft)!'); onClose(); if (onSuccess) onSuccess();
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
          <div><label className="erp-label">Pilih BOM (Resep) *</label><select required className="erp-input" value={form.bom_no} onChange={e => setForm(f => ({ ...f, bom_no: e.target.value }))}><option value="">-- Pilih BOM Aktif --</option>{boms.map((b: any) => <option key={b.name} value={b.name}>{b.name} ({b.item})</option>)}</select></div>
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
            <button type="submit" className="btn btn-primary mobile-btn" style={{ flex: 2, background: '#8b5cf6', borderColor: '#8b5cf6' }} disabled={isSubmitting}>{isSubmitting ? 'Memproses...' : 'Buat Work Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. MODAL TERMINAL JOB CARD
// ==========================================
function ActiveJobCardModal({ jobCard, elapsedSeconds, onClose, onFinish }: any) {
  const [producedQty, setProducedQty] = useState(jobCard.qty);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    await onFinish(jobCard, producedQty);
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', zIndex: 9999 }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', margin: '0 16px', background: '#0f172a', color: 'white', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}><MonitorPlay size={24} color="#38bdf8" /> TERMINAL PRODUKSI</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Job Card ID: {jobCard.name}</p>
          </div>
          <button onClick={onClose} style={{ background:'#1e293b', border:'none', cursor:'pointer', color: '#94a3b8', padding: '8px', borderRadius: '8px' }}><X size={20} /></button>
        </div>
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sedang Merakit</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>{jobCard.production_item}</p>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>Ref: {jobCard.work_order}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Qty</p>
            <p style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc' }}>{jobCard.qty}</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Waktu Berjalan (Time Log)</p>
          <div style={{ fontSize: '64px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace', letterSpacing: '4px', textShadow: '0 0 20px rgba(16, 185, 129, 0.4)', lineHeight: 1 }}>{formatTimer(elapsedSeconds)}</div>
        </div>
        <div style={{ borderTop: '1px solid #334155', paddingTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Jumlah Berhasil Dirakit:</label>
            <input type="number" min="1" className="erp-input" value={producedQty} onChange={e => setProducedQty(Number(e.target.value))} style={{ width: '120px', background: '#1e293b', color: 'white', borderColor: '#475569', fontSize: '18px', fontWeight: 800, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, background: '#1e293b', color: '#cbd5e1', borderColor: '#334155', padding: '14px' }}>Tutup Layar (Timer Jalan)</button>
            <button onClick={handleFinish} disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1.5, background: '#10b981', borderColor: '#10b981', color: 'white', padding: '14px', fontSize: '15px', display: 'flex', gap: '8px', justifyContent: 'center' }}><CheckSquare size={20} /> {isSubmitting ? 'Menyimpan...' : 'Selesaikan Produksi'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. MAIN PAGE CONTENT
// ==========================================
function ManufacturingPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'workorders';
  const [activeTab, setActiveTab] = useState(tabParam);
  useEffect(() => { setActiveTab(tabParam || 'workorders'); }, [tabParam]);

  const { boms, workOrders, isLoading, error, refetch } = useManufacturingData() as any;
  const { items } = useStockData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateBOM, setShowCreateBOM] = useState(false);
  const [showCreateWO, setShowCreateWO] = useState(false);

  // MOCKUP LOCAL OVERRIDE PERSISTENT (Menyimpan di LocalStorage agar kebal Refresh F5)
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [activeJobCard, setActiveJobCard] = useState<any>(null);

  // Load status tersimpan saat pertama kali halaman dimuat
  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_wo_status');
    if (savedStatus) {
      try { setLocalWOStatus(JSON.parse(savedStatus)); } catch (e) {}
    }
  }, []);

  // Fungsi pintar untuk update state sekaligus simpan ke LocalStorage
  const updateWOStatus = (woName: string, status: string) => {
    setLocalWOStatus(prev => {
      const next = { ...prev, [woName]: status };
      localStorage.setItem('erp_mock_wo_status', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const next = { ...prev };
        let hasChanges = false;
        for (const key in next) { next[key] += 1; hasChanges = true; }
        return hasChanges ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sortByNewest = (data: any[]) => {
    return [...(data || [])].sort((a, b) => {
      let timeA = new Date(a.creation || 0).getTime();
      let timeB = new Date(b.creation || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return String(b.name).localeCompare(String(a.name));
    });
  };

  const sortedBOMs = useMemo(() => sortByNewest(boms), [boms]);
  
  // Terapkan Local Override ke Data Asli Frappe secara Persisten
  const displayWOs = useMemo(() => {
    return sortByNewest(workOrders).map(wo => ({
      ...wo,
      status: localWOStatus[wo.name] || wo.status
    }));
  }, [workOrders, localWOStatus]);
  
  const simulatedJobCards = useMemo(() => {
    const jc: any[] = [];
    displayWOs.forEach((wo: any) => {
      if(wo.docstatus === 1) { 
        jc.push({
          name: `JC-${wo.name.replace('MFG-WO-', '').replace('WO-', '')}-01`,
          work_order: wo.name,
          production_item: wo.production_item,
          status: wo.status === 'Completed' ? 'Completed' : (wo.status === 'In Process' ? 'Work In Progress' : 'Open'),
          qty: wo.qty,
          creation: wo.creation,
          original_wo: wo 
        });
      }
    });
    return jc;
  }, [displayWOs]);

  // PERBAIKAN FILTER: Menambahkan pengaman (b.name || '') agar tidak error toLowerCase() jika data null
  const filteredBOMs = sortedBOMs.filter((b: any) => !searchQuery || (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.item || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredWOs = displayWOs.filter((w: any) => !searchQuery || (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (w.production_item || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredJCs = simulatedJobCards.filter((j: any) => !searchQuery || (j.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (j.work_order || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const formatCreationTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSmartDelete = async (doctype: string, docname: string, docstatus: number) => {
    if (!confirm(`Yakin ingin membatalkan & menghapus ${doctype} ${docname}?`)) return;
    try {
      const { apiUpdate, apiDelete } = await import('@/lib/api');
      if (docstatus === 1) await apiUpdate(doctype, docname, { docstatus: 2 });
      await apiDelete(doctype, docname);
      
      // Bersihkan data mockup dari local storage jika didelete
      if (doctype === 'Work Order') {
        setLocalWOStatus(prev => {
          const next = { ...prev };
          delete next[docname];
          localStorage.setItem('erp_mock_wo_status', JSON.stringify(next));
          return next;
        });
      }
      
      alert(`✅ ${doctype} berhasil dihapus!`); refetch();
    } catch (err: any) { alert(`❌ Gagal menghapus!\n\nAlasan: ${extractFrappeError(err)}`); }
  };

  const handleWOStart = async (wo: any) => {
    updateWOStatus(wo.name, 'In Process');
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Work Order', wo.name, { status: 'In Process' });
      alert(`✅ Work Order dimulai! (Silakan cek tab Job Card untuk timer)`); refetch();
    } catch (err) { alert("Simulasi: Status diubah ke In Process."); refetch(); }
  };

  const handleWOSubmit = async (wo: any) => {
    if(!confirm('Yakin ingin Submit (Mengunci) Work Order ini?')) return;
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Work Order', wo.name, { docstatus: 1 });
      alert('✅ Work Order disubmit! (Job Card otomatis dibuat untuk operator)'); refetch();
    } catch (err) { alert("Simulasi: WO disubmit."); refetch(); }
  };

  const handleJCStart = async (jc: any) => {
    updateWOStatus(jc.original_wo.name, 'In Process');
    if (activeTimers[jc.name] !== undefined) {
      setActiveJobCard(jc);
      return;
    }
    setActiveTimers(prev => ({ ...prev, [jc.name]: 0 }));
    setActiveJobCard(jc); 
    
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Work Order', jc.original_wo.name, { status: 'In Process' });
      refetch();
    } catch (err) { refetch(); }
  };

  const handleJCFinish = async (jc: any, producedQty: number) => {
    updateWOStatus(jc.original_wo.name, 'Completed');
    setActiveTimers(prev => { const next = { ...prev }; delete next[jc.name]; return next; });
    setActiveJobCard(null); 
    alert(`🎉 BINGO! Produksi Selesai!\n\n${producedQty} unit berhasil dirakit dan dikirim ke Gudang Barang Jadi.\nSilakan lanjut ke Tahap 7 (Delivery Note)!`);
    
    try {
      const { apiUpdate } = await import('@/lib/api');
      await apiUpdate('Work Order', jc.original_wo.name, { status: 'Completed', produced_qty: producedQty });
      refetch();
    } catch (err) { refetch(); }
  };

  const getPageInfo = () => {
    switch(activeTab) {
      case 'bom': return { title: 'Bill of Materials', desc: 'Kelola resep dan daftar bahan baku produksi' };
      case 'workorders': return { title: 'Work Orders', desc: 'Daftar Surat Perintah Kerja produksi' };
      case 'jobcards': return { title: 'Job Cards (Terminal Lapangan)', desc: 'Kartu tugas interaktif untuk operator perakitan' };
      default: return { title: 'Manufacturing', desc: 'Modul Produksi' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat data dari ERPNext...</div>}
      {error && <div className="error-box"><AlertCircle size={16} />{error}</div>}

      {/* RENDER SEMUA MODALS */}
      {showCreateBOM && <CreateBOMModal items={items} onClose={() => setShowCreateBOM(false)} onSuccess={() => refetch()} />}
      {showCreateWO && <CreateWorkOrderModal boms={sortedBOMs.filter(b=>b.docstatus===1)} onClose={() => setShowCreateWO(false)} onSuccess={() => refetch()} />}
      
      {/* POP-UP TERMINAL JOB CARD */}
      {activeJobCard && (
        <ActiveJobCardModal 
          jobCard={activeJobCard} 
          elapsedSeconds={activeTimers[activeJobCard.name] || 0} 
          onClose={() => setActiveJobCard(null)} 
          onFinish={handleJCFinish} 
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{pageInfo.title}</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>{pageInfo.desc}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'bom' && <button className="btn btn-primary btn-sm mobile-btn" style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }} onClick={() => setShowCreateBOM(true)}><Plus size={14} /> BOM Baru</button>}
          {activeTab === 'workorders' && <button className="btn btn-primary btn-sm mobile-btn" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }} onClick={() => setShowCreateWO(true)}><Plus size={14} /> Work Order Baru</button>}
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

        {/* TABEL BOM */}
        {activeTab === 'bom' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No.</th>
                  <th>BOM ID & Tanggal</th>
                  <th>Item Produksi</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th>Status</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBOMs.map((bom: any, index: number) => (
                  <tr key={bom.name}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '13px' }}>{bom.name}</div>
                      {bom.creation && <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>Dibuat: {formatCreationTime(bom.creation)}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{bom.item}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{bom.quantity || 1}</td>
                    <td>
                      <span className={`badge ${bom.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {bom.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <a href={`http://34.101.192.135:8080/app/bom/${encodeURIComponent(bom.name)}`} target="_blank" rel="noopener noreferrer" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#4B5563', borderRadius: '6px', padding: '6px', display: 'flex' }} title="Buka di ERPNext"><Eye size={14} /></a>
                        <button onClick={() => handleSmartDelete('BOM', bom.name, bom.docstatus)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Hapus"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBOMs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Belum ada Bill of Materials (BOM).</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* TABEL WORK ORDERS */}
        {activeTab === 'workorders' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>WO Number & Tanggal</th><th>Item Produksi</th><th style={{ textAlign: 'center' }}>Qty</th><th>Status</th><th style={{ width: '180px', textAlign: 'center' }}>Actions</th></tr></thead>
              <tbody>
                {filteredWOs.map((wo: any, index: number) => (
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
                    <td>
                      <span className={`badge ${wo.status === 'Completed' ? 'badge-success' : wo.status === 'In Process' ? 'badge-info' : wo.status === 'Draft' ? 'badge-gray' : 'badge-warning'}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {wo.status === 'Draft' && <button onClick={() => handleWOSubmit(wo)} className="badge badge-info" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}><Send size={12}/> Submit</button>}
                        {wo.status === 'Not Started' && <button onClick={() => handleWOStart(wo)} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '4px', alignItems: 'center', background: '#e879f9', color: 'white' }}><PlayCircle size={12}/> Start</button>}
                        {wo.status === 'In Process' && <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>Cek tab Job Card 👉</span>}
                        {wo.status === 'Completed' && <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}><CheckCircle size={12} style={{display:'inline', verticalAlign:'middle'}}/> Selesai</span>}
                        
                        <a href={`http://34.101.192.135:8080/app/work-order/${encodeURIComponent(wo.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4B5563', padding: '4px' }}><Eye size={16} /></a>
                        <button onClick={() => handleSmartDelete('Work Order', wo.name, wo.docstatus)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredWOs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Belum ada Work Order.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* TABEL JOB CARDS DENGAN LIVE TIMER */}
        {activeTab === 'jobcards' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead><tr><th style={{ width: '40px', textAlign: 'center' }}>No.</th><th>Job Card ID</th><th>Work Order Ref</th><th>Item Produksi</th><th>Status Tugas</th><th style={{ textAlign: 'center' }}>Terminal Operator</th></tr></thead>
              <tbody>
                {filteredJCs.map((jc: any, index: number) => {
                  const isActive = activeTimers[jc.name] !== undefined;
                  const elapsedSeconds = isActive ? activeTimers[jc.name] : 0;
                  const displayStatus = isActive ? 'Work In Progress' : jc.status;

                  return (
                    <tr key={jc.name} style={{ background: isActive ? '#f0fdf4' : 'transparent', transition: 'background 0.3s' }}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '13px' }}>{jc.name}</div>
                        {jc.creation && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Dibuat: {formatCreationTime(jc.creation)}</div>}
                      </td>
                      <td style={{ fontWeight: 600, color: '#8b5cf6', fontSize: '12px' }}>{jc.work_order}</td>
                      <td style={{ fontSize: '13px' }}>{jc.production_item} (Target: {jc.qty})</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          <span className={`badge ${displayStatus === 'Completed' ? 'badge-success' : displayStatus === 'Work In Progress' ? 'badge-info' : 'badge-warning'}`}>
                            {displayStatus}
                          </span>
                          {/* LIVE TIMER BERKEDIP DI TABEL */}
                          {isActive && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)', animation: 'pulse 1.5s infinite' }}>
                              <Timer size={14} /> {formatTimer(elapsedSeconds)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {isActive ? (
                            <button onClick={() => setActiveJobCard(jc)} className="badge badge-success" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '6px', alignItems: 'center', background: '#0284c7', color: 'white', padding: '6px 12px', boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.2)' }}>
                              <MonitorPlay size={14}/> Buka Terminal Layar
                            </button>
                          ) : jc.status === 'Completed' ? (
                            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px' }}>
                              <CheckSquare size={14} /> Tugas Tuntas
                            </span>
                          ) : (
                            <button onClick={() => handleJCStart(jc)} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none', display: 'flex', gap: '6px', alignItems: 'center', background: '#f59e0b', color: 'white', padding: '6px 12px' }}>
                              <PlayCircle size={14}/> Mulai Rakit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredJCs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Belum ada Job Card. (Submit Work Order untuk memunculkan Job Card).</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 rgba(16, 185, 129, 0); } 50% { opacity: 0.85; box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); } }
        .erp-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
        .erp-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111827; outline: none; transition: border-color 0.2s; }
        .erp-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139,92,246,0.1); }
        .error-box { background: #fee2e2; border-radius: 6px; padding: 10px; color: #991b1b; font-size: 12px; margin-top: 10px; display: flex; align-items: center; gap: 8px; }
        .badge-purple { background: #ede9fe; color: #6d28d9; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        
        .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .responsive-grid { grid-template-columns: 1fr; } .mobile-btn { width: 100%; justify-content: center; margin-bottom: 8px; } }
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