'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import { Cog, Activity, AlertCircle, FolderOpen, DollarSign, Info, X } from 'lucide-react';
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
};

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
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontFamily: "'Poppins', sans-serif" }}>{text}</p>
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

    // --- LOGIKA CHART 13 BULAN (Bulan yang sama tahun lalu s/d Bulan ini) ---
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const rollingMonths = [];
    
    // Loop 12 artinya mundur 1 tahun pas (Total 13 titik bulan)
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

  // KONFIGURASI 3 KARTU KPI
  const STATS = [
    {
      label: 'Open Work Orders', 
      value: formatNumber(stats.openWOs),
      icon: FolderOpen, color: '#f43f5e', bg: '#ffe4e6',
      infoText: 'Jumlah keseluruhan Surat Perintah Kerja (Work Order) yang berstatus Draft atau belum dikerjakan.'
    },
    {
      label: 'WIP Work Orders', 
      value: formatNumber(stats.wipWOs),
      icon: Activity, color: '#054CC7', bg: '#eff6ff',
      infoText: 'Jumlah Surat Perintah Kerja yang saat ini sedang dalam proses perakitan di lantai pabrik.'
    },
    {
      label: 'Manufactured Items Value', 
      value: formatUang(stats.manufacturedValue),
      icon: DollarSign, color: '#8b5cf6', bg: '#ede9fe',
      infoText: 'Estimasi total nilai finansial (Rupiah) dari seluruh barang jadi yang berhasil diproduksi.'
    },
  ];

  if (isMfgLoading || isStockLoading) return (
    <div className="mh-loading">
      <div className="mh-spinner" />
      <p>Memuat data produksi...</p>
    </div>
  );

  return (
    <div className="mh-root">
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      {/* Header */}
      <div className="mh-header">
        <div>
          <h1 className="mh-title">Manufacturing</h1>
          <p className="mh-subtitle">Monitor produksi <span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>{FIXED_COMPANY}</span> secara real-time</p>
        </div>
        <div className="mh-header-badge">
          <Cog size={14} className="mh-badge-spin" />
          <span>Produksi Aktif</span>
        </div>
      </div>

      {/* ── BAGIAN ATAS: CHART PRODUCED QUANTITY ── */}
      <div className="mh-card mh-chart-card" style={{ marginBottom: '20px' }}>
        <div className="mh-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="mh-card-title" style={{ fontSize: '16px' }}>Produced Quantity</div>
            <div className="mh-card-subtitle" style={{ marginBottom: '12px' }}>Last synced 31 minutes ago</div>
            
            {/* BIG NUMBER ala Frappe Dashboard Chart */}
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#111827', marginBottom: '16px', letterSpacing: '-0.5px' }}>
              {formatNumber(stats.totalProducedQty)}
            </div>
          </div>
          <button 
            onClick={() => setInfoData({ show: true, title: 'Produced Quantity', text: 'Menampilkan tren kuantitas barang jadi yang berhasil diproduksi dari bulan yang sama tahun lalu hingga bulan ini (13 Bulan Terakhir).' })}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Lihat Informasi"
          >
            <Info size={16} />
          </button>
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
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Area type="monotone" dataKey="qty" name="Produced Quantity" stroke={COLOR_PRIMARY} strokeWidth={2.5} fill="url(#gradMfg)" activeDot={{ r: 5, fill: COLOR_PRIMARY }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="mh-empty" style={{ height: '300px' }}>
            <AlertCircle size={28} color="#d1d5db" />
            <p>Belum ada data produksi</p>
          </div>
        )}
      </div>

      {/* ── BAGIAN BAWAH: 3 STATS CARDS ── */}
      <div className="mh-stats-grid">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="mh-stat-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="mh-stat-label" style={{ marginBottom: 0 }}>{s.label}</div>
                  <button 
                    onClick={() => setInfoData({ show: true, title: s.label, text: s.infoText })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                  >
                    <Info size={14} />
                  </button>
                </div>
                <div className="mh-stat-icon-wrap" style={{ background: s.bg }}>
                  <Icon size={18} color={s.color} />
                </div>
              </div>
              <div className="mh-stat-value" style={{ marginBottom: '14px' }}>{s.value}</div>
              <div className="mh-stat-trend">Last synced just now</div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spinBadge { to { transform: rotate(360deg); } }

        .mh-root { font-family: 'Poppins', sans-serif; animation: fadeSlideUp 0.4s ease-out; }

        .mh-loading { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .mh-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: ${COLOR_PRIMARY}; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .mh-loading p { font-size: 13px; color: #64748b; }

        .mh-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 12px; }
        .mh-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .mh-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .mh-header-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${COLOR_PRIMARY}; background: #eff6ff; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 20px; }
        .mh-badge-spin { animation: spinBadge 3s linear infinite; }

        .mh-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }

        .mh-stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          animation: fadeSlideUp 0.4s ease-out both;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mh-stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .mh-stat-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .mh-stat-label { font-size: 14px; font-weight: 600; color: #4b5563; }
        .mh-stat-value { font-size: 28px; font-weight: 800; color: #111827; line-height: 1.1; }
        .mh-stat-trend { font-size: 11px; font-weight: 500; color: #94a3b8; display: block; border-top: 1px solid #f1f5f9; padding-top: 10px; }

        .mh-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          width: 100%;
        }

        .mh-card-title { font-size: 16px; font-weight: 700; color: #0f172a; }
        .mh-card-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }

        .mh-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px; color: #94a3b8; font-size: 13px; background: #f8fafc; border-radius: 8px; }

        @media (max-width: 1100px) { .mh-stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .mh-stats-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}