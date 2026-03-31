'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import { Cog, Activity, AlertCircle, FolderOpen, DollarSign, Info, X, CheckCircle2, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLOR_PRIMARY = '#054CC7'; 
const FIXED_COMPANY = 'PT Artavista';

const formatUang = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

const formatNumber = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return '0';
  return new Intl.NumberFormat('en-US').format(n);
};

const formatCompact = (value: number | string | undefined | any, isCurrency = false) => {
  if (!value) return isCurrency ? 'Rp 0' : '0';
  const num = Number(value);
  if (isNaN(num)) return isCurrency ? 'Rp 0' : '0';
  
  let formatted = '';
  if (num >= 1000000000) formatted = (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + ' B';
  else if (num >= 1000000) formatted = (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + ' M';
  else if (num >= 1000) formatted = (num / 1000).toFixed(2).replace(/\.?0+$/, '') + ' K';
  else formatted = new Intl.NumberFormat('id-ID').format(num);

  return isCurrency ? `Rp ${formatted}` : formatted;
};

// ── CUSTOM TOOLTIP ALA FRAPPE ──
const FrappeChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ marginBottom: index !== payload.length - 1 ? '10px' : 0 }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: entry.color, lineHeight: 1 }}>{formatNumber(entry.value)}</div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>{entry.name}</div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ── MODAL INFORMASI ──
function InfoModal({ show, title, text, onClose }: { show: boolean, title: string, text: string, onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
      <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '16px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', margin: '0 16px', animation: 'scaleIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: COLOR_PRIMARY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Info size={24} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontFamily: "'Poppins', sans-serif", whiteSpace: 'pre-wrap' }}>{text}</p>
        <button onClick={onClose} className="btn-understand" style={{ width: '100%', padding: '12px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif" }}>
          Mengerti
        </button>
      </div>
      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .btn-understand:hover { background: #e5e7eb !important; color: #111827 !important; }
      `}</style>
    </div>
  );
}

export default function ManufacturingHomePage() {
  const { workOrders, isLoading: isMfgLoading } = useManufacturingData() as any;
  const { items, isLoading: isStockLoading } = useStockData();
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});
  const [infoData, setInfoData] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });

  useEffect(() => {
    const saved = localStorage.getItem('erp_mock_wo_status');
    if (saved) { try { setLocalWOStatus(JSON.parse(saved)); } catch {} }
  }, []);

  const stats = useMemo(() => {
    const overriddenWOs = (workOrders || []).map((wo: any) => {
      const status = localWOStatus[wo.name] || wo.status;
      return {
        ...wo,
        status,
        produced_qty: status === 'Completed' ? (Number(wo.produced_qty) || Number(wo.qty)) : Number(wo.produced_qty)
      };
    });

    const wos = overriddenWOs.filter((wo: any) =>
      wo.company === FIXED_COMPANY ||
      (wo.name && wo.name.includes('NV')) ||
      (wo.fg_warehouse && wo.fg_warehouse.includes('NV'))
    );

    let totalProducedQty = 0;
    let manufacturedValue = 0;
    
    wos.filter((wo: any) => wo.docstatus === 1).forEach((wo: any) => {
      const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      if (qty > 0) {
        totalProducedQty += qty;
        const itemDetail = items.find((i: any) => i.item_code === wo.production_item);
        manufacturedValue += qty * (itemDetail?.standard_rate || 0);
      }
    });

    const openWOs = wos.filter((wo: any) => wo.status === 'Draft' || wo.status === 'Not Started').length;
    const wipWOs = wos.filter((wo: any) => wo.status === 'In Process').length;

    // --- LOGIKA CHART 13 BULAN ---
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    // const rollingMonths = [];
    // PERBAIKAN: Beri tipe data secara spesifik atau gunakan any[]
    const rollingMonths: any[] = [];

// ATAU jika ingin lebih rapi (Sangat Disarankan):
// const rollingMonths: { monthStr: string; monthRaw: number; yearRaw: number; qty: number }[] = [];
    
    for (let i = 12; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      rollingMonths.push({
        monthStr: `${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`,
        monthRaw: d.getMonth(),
        yearRaw: d.getFullYear(),
        qty: 0
      });
    }

    wos.filter((wo: any) => wo.docstatus === 1).forEach((wo: any) => {
      if (!wo.creation) return;
      const woDate = new Date(wo.creation);
      const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      if (qty > 0) {
        const match = rollingMonths.find(m => m.monthRaw === woDate.getMonth() && m.yearRaw === woDate.getFullYear());
        if (match) match.qty += qty;
      }
    });

    const producedTrend = rollingMonths.map(m => ({ day: m.monthStr, qty: m.qty }));

    return { 
      totalProducedQty, openWOs, wipWOs, manufacturedValue, producedTrend
    };
  }, [workOrders, items, localWOStatus]);

  if (isMfgLoading || isStockLoading) return (
    <div className="tw-root" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div className="mh-spinner" style={{ margin: '0 auto 12px' }} />
      <p style={{ color: '#64748b', fontSize: '13px' }}>Memuat data produksi...</p>
      <style>{`
        .mh-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: ${COLOR_PRIMARY}; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  const MetricCard = ({ title, value, gradFrom, gradTo, icon, infoText }: any) => (
    <div className="metric-card" style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)` }}>
      <div className="metric-card-content">
        <div className="metric-card-header">
          <span className="metric-title">{title}</span>
          {infoText && (
            <button 
              onClick={() => setInfoData({ show: true, title, text: infoText })}
              className="metric-info-btn"
              title="Lihat Detail Nilai"
            >
              <Info size={14} />
            </button>
          )}
        </div>
        <div className="metric-value">{value}</div>
      </div>
      <div className="metric-icon">
        {icon}
      </div>
    </div>
  );

  return (
    <div className="tw-root" style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      {/* HEADER PAGE */}
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>Manufacturing Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Ringkasan performa lini produksi Anda hari ini.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      {/* ── BAGIAN ATAS: HERO CARD ── */}
      <div className="frappe-welcome-card" style={{ marginBottom: '24px' }}>
        <div className="welcome-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
             <Target size={16} color="rgba(255,255,255,0.8)" />
             <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manajemen Produksi</span>
          </div>
          <h1 className="welcome-title">Halo, Tim Manufaktur!</h1>
          <p className="welcome-subtitle">
            Hari ini Anda memantau {stats.openWOs} pesanan kerja yang belum dimulai dan {stats.wipWOs} sedang diproses. Terus awasi efisiensi lini produksi.
          </p>
          <div style={{ marginTop: '20px' }}>
            <Link href="/dashboard/manufacturing?tab=workorders" style={{ textDecoration: 'none' }}>
              <button className="btn-welcome-yellow">
                Kelola Work Order
              </button>
            </Link>
          </div>
        </div>
        
        <div className="welcome-ill-wrapper">
          <div className="welcome-ill-box">
            <img src="/images/ill-mfg.png" alt="Manufacturing Illustration" />
          </div>
        </div>
      </div>

      {/* ── BAGIAN TENGAH: 3 STATS CARDS GRADIENT ── */}
      <div className="metrics-grid-3">
        <MetricCard 
          title="Open Work Orders" 
          value={formatNumber(stats.openWOs)} 
          gradFrom="#054CC7" gradTo="#0B79C9" 
          icon={<FolderOpen size={24} />} 
          infoText="Jumlah keseluruhan Surat Perintah Kerja (Work Order) yang berstatus Draft atau belum dikerjakan." 
        />
        <MetricCard 
          title="WIP Work Orders" 
          value={formatNumber(stats.wipWOs)} 
          gradFrom="#0B79C9" gradTo="#11A5CB" 
          icon={<Activity size={24} />} 
          infoText="Jumlah Surat Perintah Kerja yang saat ini sedang dalam proses perakitan di lantai pabrik." 
        />
        <MetricCard 
          title="Manufactured Items Value" 
          value={formatCompact(stats.manufacturedValue, true)} 
          gradFrom="#11A5CB" gradTo="#17C3CC" 
          icon={<DollarSign size={24} />} 
          infoText="Estimasi total nilai finansial (Rupiah) dari seluruh barang jadi yang berhasil diproduksi." 
        />
      </div>

      {/* ── BAGIAN BAWAH: CHART PRODUCED QUANTITY ── */}
      <div className="chart-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1f2937', margin: 0 }}>Produced Quantity Trend</h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>Last synced just now</p>
          </div>
          <div>
            <button 
              onClick={() => setInfoData({ show: true, title: 'Produced Quantity', text: 'Menampilkan tren kuantitas barang jadi yang berhasil diproduksi dari bulan yang sama tahun lalu hingga bulan ini (13 Bulan Terakhir).' })}
              style={{ background: '#f8fafc', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} 
              title="Lihat Informasi"
              onMouseOver={e => e.currentTarget.style.color = COLOR_PRIMARY}
              onMouseOut={e => e.currentTarget.style.color = '#4b5563'}
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {stats.producedTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.producedTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMfg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="qty" name="Produced Quantity" stroke={COLOR_PRIMARY} strokeWidth={2.5} fill="url(#gradMfg)" activeDot={{ r: 5, fill: COLOR_PRIMARY, stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-placeholder">
            <AlertCircle size={28} color="#d1d5db" style={{ marginBottom: '8px' }} />
            <p>Belum ada data produksi</p>
          </div>
        )}
      </div>

      <style>{`
        /* GLOBAL RESET & ANIMATION */
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .tw-root {
           background-color: #EEF2F6; 
           min-height: calc(100vh - 80px);
           padding: 20px;
           border-radius: 16px;
           margin: -10px; 
        }
        
        .page-header-row {
           display: flex; 
           align-items: center; 
           justify-content: space-between; 
           margin-bottom: 24px; 
           flex-wrap: wrap; 
           gap: 12px;
        }

        /* ── CSS KHUSUS CARD WELCOME ── */
        .frappe-welcome-card {
            background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
            border-radius: 16px;
            padding: 32px 40px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 30px rgba(5, 76, 199, 0.2);
            min-height: 160px;
        }

        .welcome-content {
            position: relative;
            z-index: 2;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .welcome-title {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 8px 0;
            letter-spacing: -0.02em;
        }

        .welcome-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            line-height: 1.5;
            max-width: 85%;
        }

        .btn-welcome-yellow {
            background: #FFB800;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(255, 184, 0, 0.3);
        }
        
        .btn-welcome-yellow:hover {
            transform: translateY(-2px);
            background: #F5A623;
        }

        .welcome-ill-wrapper {
            flex-shrink: 0;
            margin-left: 20px;
            z-index: 2;
        }

        .welcome-ill-box {
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .welcome-ill-box img {
            position: absolute;
            width: 125%;
            height: 125%;
            object-fit: contain;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        /* ── CSS KHUSUS CARD KOTAK ── */
        .chart-container { background: white; border-radius: 16px; padding: 24px; width: 100%; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); border: none; margin-bottom: 20px; }
        .no-data-placeholder { height: 260px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; background: #f8fafc; border-radius: 12px; font-weight: 500; flex-direction: column; }
        
        /* ── CSS KHUSUS CARD KPI ALA FRAPPE (WARNA GRADASI) ── */
        .metric-card {
          background: white; border-radius: 16px; border: none; padding: 24px;
          display: flex; align-items: center; justify-content: space-between;
          height: 100%; min-height: 100px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          color: white;
          transition: transform 0.2s;
        }
        .metric-card:hover { transform: translateY(-3px); }
        .metric-card-content { display: flex; flex-direction: column; width: calc(100% - 56px); }
        .metric-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .metric-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-info-btn { background: none; border: none; cursor: pointer; padding: 0; color: rgba(255,255,255,0.7); display: flex; align-items: center; flex-shrink: 0; transition: color 0.2s, transform 0.2s; }
        .metric-info-btn:hover { color: #ffffff; transform: scale(1.1); }
        .metric-value { font-size: 24px; font-weight: 800; line-height: 1.2; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(255,255,255,0.2); }

        /* ── GRID RESPONSIF SEMPURNA ── */
        .metrics-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        
        @media (max-width: 1024px) {
          .metrics-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 640px) {
          .metrics-grid-3 { grid-template-columns: 1fr; }
          .chart-container { padding: 16px !important; border-radius: 12px; }
          
          /* Penyesuaian Welcome Card untuk Mobile */
          .frappe-welcome-card { 
            flex-direction: column; 
            align-items: flex-start; 
            padding: 24px; 
            gap: 20px; 
            height: auto;
          }
          .welcome-subtitle { max-width: 100%; }
          .welcome-ill-wrapper { 
            width: 100%; 
            display: flex; 
            justify-content: flex-end; 
            margin-left: 0; 
            margin-top: 10px; 
          }
          .welcome-ill-box { width: 120px; height: 120px; }
        }
      `}</style>
    </div>
  );
}