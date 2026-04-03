'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useManufacturingData } from '@/hooks/useFrappeData';
import { Loader2, Factory, CheckCircle, Clock, PackageOpen, Info, X, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const TREND_COLOR_BLUE = '#3b82f6';

const formatNumber = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return '0';
  return new Intl.NumberFormat('id-ID').format(n);
};

// ── CUSTOM TOOLTIP ALA FRAPPE ──
const FrappeChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ marginBottom: index !== payload.length - 1 ? '10px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.color || TREND_COLOR_BLUE }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{formatNumber(entry.value)}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginLeft: '16px' }}>{entry.name}</div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const FrappePieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>{data.name}</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: data.payload.fill, lineHeight: 1 }}>{formatNumber(data.value)}</div>
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
      <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '20px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', margin: '0 16px', animation: 'scaleIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: COLOR_PRIMARY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Info size={24} /></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontFamily: "'Poppins', sans-serif" }}>{text}</p>
        <button onClick={onClose} className="btn-understand" style={{ width: '100%', padding: '12px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif" }}>Mengerti</button>
      </div>
    </div>
  );
}

export default function ManufacturingAnalyticsPage() {
  const { workOrders, isLoading } = useManufacturingData() as any;
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});
  const [infoData, setInfoData] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });

  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_wo_status');
    if (savedStatus) { try { setLocalWOStatus(JSON.parse(savedStatus)); } catch (e) {} }
  }, []);

  const data = useMemo(() => {
    const safeWOs = workOrders || [];

    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    // Mapping override status lokal untuk semua WO
    const allWOs = safeWOs.map((wo: any) => {
        const currentStatus = localWOStatus[wo.name] || wo.status;
        return {
          ...wo,
          status: currentStatus,
          produced_qty: currentStatus === 'Completed' ? (Number(wo.produced_qty) || Number(wo.qty)) : Number(wo.produced_qty)
        };
    });

    // ── METRIK 4 KARTU ──
    let monthlyTotalWO = 0; 
    let monthlyCompletedWO = 0;
    let inProcessWOs = 0;
    let pendingWOs = 0;

    allWOs.forEach((wo: any) => {
      // Metrik In Process & Pending (Draft/Not Started) dari total keseluruhan data
      if (wo.status === 'In Process') inProcessWOs++;
      if (wo.status === 'Draft' || wo.status === 'Not Started') pendingWOs++;
      
      // Metrik Bulanan
      if (wo.creation) {
        const d = new Date(wo.creation);
        if (d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear) {
          monthlyTotalWO++;
          if (wo.status === 'Completed') monthlyCompletedWO++;
        }
      }
    });

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // ── 1. PRODUCED QTY (12 BULAN BERGULIR) ──
    const producedQty12M: { monthStr: string; monthRaw: number; yearRaw: number; qty: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      producedQty12M.push({ monthStr: `${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`, monthRaw: d.getMonth(), yearRaw: d.getFullYear(), qty: 0 });
    }
    allWOs.forEach((wo: any) => {
      if (wo.creation && wo.docstatus !== 2) { 
        const d = new Date(wo.creation);
        const match = producedQty12M.find((m: any) => m.monthRaw === d.getMonth() && m.yearRaw === d.getFullYear());
        if (match) {
          const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (Number(wo.qty) || 0);
          match.qty += qty;
        }
      }
    });

    // ── 2. QUARTERLY WORK ORDERS (6 QUARTER BERGULIR) ──
    const quarterlyWOs: { monthStr: string; qRaw: number; yearRaw: number; total: number }[] = [];
    let currQ = Math.floor(currentMonthIdx / 3) + 1;
    let currY = currentYear;
    for (let i = 5; i >= 0; i--) {
      let q = currQ - i; let y = currY;
      while (q <= 0) { q += 4; y -= 1; }
      quarterlyWOs.push({ monthStr: `Quarter ${q} ${y}`, qRaw: q, yearRaw: y, total: 0 });
    }
    allWOs.forEach((wo: any) => {
      if (wo.creation && wo.docstatus !== 2) {
        const d = new Date(wo.creation);
        const wq = Math.floor(d.getMonth() / 3) + 1;
        const matchOp = quarterlyWOs.find((m: any) => m.qRaw === wq && m.yearRaw === d.getFullYear());
        if (matchOp) matchOp.total += 1;
      }
    });

    // ── 3. WORK ORDER STATUS DISTRIBUTION (PIE CHART) ──
    const woAnalysisData = [
      { name: 'Draft', value: 0, color: '#94a3b8' },
      { name: 'Submitted', value: 0, color: '#3b82f6' },
      { name: 'Not Started', value: 0, color: '#f59e0b' },
      { name: 'In Process', value: 0, color: '#17C3CC' },
      { name: 'Stock Reserved', value: 0, color: '#8b5cf6' },
      { name: 'Rest', value: 0, color: '#10b981' },
    ];
    allWOs.forEach((wo: any) => {
      let s = wo.status || 'Draft';
      if (wo.docstatus === 0) s = 'Draft';
      else if (wo.docstatus === 1 && wo.status === 'Draft') s = 'Submitted';
      
      const target = woAnalysisData.find(x => x.name === s);
      if (target) target.value += 1;
      else woAnalysisData[5].value += 1; 
    });

    // ── 4. PENDING WORK ORDER AGEING (PIE CHART) ──
    const pendingWOsData = [
      { name: '0-30 Days', value: 0, color: '#3b82f6' },
      { name: '30-60 Days', value: 0, color: '#f59e0b' },
      { name: '60-90 Days', value: 0, color: '#f43f5e' },
      { name: '90 Above', value: 0, color: '#64748b' },
    ];
    allWOs.forEach((wo: any) => {
      if (wo.status !== 'Completed' && wo.docstatus !== 2) {
        const days = Math.floor((now.getTime() - new Date(wo.creation || now).getTime()) / 86400000);
        if (days <= 30) pendingWOsData[0].value++;
        else if (days <= 60) pendingWOsData[1].value++;
        else if (days <= 90) pendingWOsData[2].value++;
        else pendingWOsData[3].value++;
      }
    });

    // ── 5. WORK ORDER QTY ANALYSIS (BAR 6 BULAN BERGULIR) ──
    const woQtyTrend: { monthStr: string; monthRaw: number; yearRaw: number; Pending: number; Completed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      woQtyTrend.push({ monthStr: `${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`, monthRaw: d.getMonth(), yearRaw: d.getFullYear(), Pending: 0, Completed: 0 });
    }
    allWOs.forEach((wo: any) => {
      if (!wo.creation || wo.docstatus === 2) return;
      const d = new Date(wo.creation);
      const match = woQtyTrend.find((m: any) => m.monthRaw === d.getMonth() && m.yearRaw === d.getFullYear());
      if (match) {
        const produced = Number(wo.produced_qty) || 0;
        const total = Number(wo.qty) || 0;
        
        if (wo.docstatus === 0 || wo.status === 'Draft' || wo.status === 'Not Started') {
            match.Pending += total;
        } else if (wo.status === 'Completed') {
            match.Completed += total;
        } else {
            match.Completed += produced;
            match.Pending += Math.max(0, total - produced);
        }
      }
    });

    // ── 6. TOP 5 MANUFACTURED ITEMS (PENGGANTI JOB CARD/DOWNTIME) ──
    const itemMap: Record<string, number> = {};
    allWOs.forEach((wo: any) => {
      if(wo.docstatus !== 2 && wo.production_item) {
        const itemName = wo.item_name || wo.production_item;
        itemMap[itemName] = (itemMap[itemName] || 0) + (Number(wo.qty) || 0);
      }
    });
    const topItems = Object.entries(itemMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { 
      monthlyTotalWO, monthlyCompletedWO, inProcessWOs, pendingWOs,
      producedQty12M, quarterlyWOs, woAnalysisData, pendingWOsData, woQtyTrend, topItems
    };
  }, [workOrders, localWOStatus]);

  if (isLoading) return (
    <div className="tw-root" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <Loader2 className="animate-spin" size={36} color={COLOR_PRIMARY} style={{ margin: '0 auto 12px' }} />
      <p style={{ color: '#64748b', fontSize: '13px' }}>Memuat analitik manufaktur...</p>
    </div>
  );

  // COMPONENT UNTUK METRIC KARTU YANG DILENGKAPI TOMBOL INFO (GAYA SELLING/GRADIENT)
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

  const ChartHeader = ({ title, infoText }: { title: string, infoText?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Last synced just now</span>
        {infoText && (
          <button 
            onClick={() => setInfoData({ show: true, title, text: infoText })} 
            style={{ background: '#f8fafc', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} 
            title="Lihat Informasi"
          >
            <Info size={16} />
          </button>
        )}
      </div>
    </div>
  );

  // ── KOMPONEN KHUSUS: FRAPPE PIE CHART DENGAN LEGEND INTERAKTIF ──
  const FrappePieChart = ({ data, title, infoText }: any) => {
    const [activeName, setActiveName] = useState(data[0]?.name || '');
    const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
    const activeItem = data.find((d: any) => d.name === activeName) || data[0] || { name: '', value: 0 };
    const activePercent = total > 0 ? ((activeItem.value / total) * 100).toFixed(1) : '0.0';

    return (
      <div className="chart-container">
        <ChartHeader title={title} infoText={infoText} />
        <div className="pie-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%" className="pie-chart-graphic">
            <PieChart>
              {total === 0 ? (
                <Pie data={[{value: 1, color: '#f1f5f9'}]} cx="50%" cy="50%" innerRadius={65} outerRadius={85} dataKey="value" isAnimationActive={false}>
                  <Cell fill="#f1f5f9" />
                </Pie>
              ) : (
                <Pie data={data.filter((d: any) => d.value > 0)} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" onMouseEnter={(dataItem: any) => setActiveName(dataItem.name)}>
                  {data.filter((d: any) => d.value > 0).map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              )}
              <Tooltip content={<FrappePieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pie-chart-legend">
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activeItem.name}: <span style={{ color: '#111827' }}>{activePercent}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.map((d: any) => (
                <div 
                  key={d.name} 
                  onMouseEnter={() => setActiveName(d.name)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
                    background: activeName === d.name ? '#f8fafc' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: activeName === d.name ? 700 : 500 }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tw-root" style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      {/* HEADER PAGE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>Analytics Center</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Analisis mendalam performa manufaktur & operasional</p>
        </div>
      </div>

      {/* ROW 1: 4 METRICS CARDS (UI GRADASI) */}
      <div className="metrics-grid">
        <MetricCard 
          title="Total Work Orders (Bulan Ini)" 
          value={formatNumber(data.monthlyTotalWO)} 
          gradFrom="#054CC7" gradTo="#0B79C9" 
          icon={<Factory size={24} />} 
          infoText="Jumlah keseluruhan Surat Perintah Kerja (Work Order) yang dibuat pada bulan berjalan."
        />
        <MetricCard 
          title="Completed Work Orders" 
          value={formatNumber(data.monthlyCompletedWO)} 
          gradFrom="#0B79C9" gradTo="#11A5CB" 
          icon={<CheckCircle size={24} />} 
          infoText="Jumlah Surat Perintah Kerja (Work Order) yang telah berstatus Selesai pada bulan berjalan."
        />
        <MetricCard 
          title="In Process Work Orders" 
          value={formatNumber(data.inProcessWOs)} 
          gradFrom="#11A5CB" gradTo="#17C3CC" 
          icon={<Clock size={24} />} 
          infoText="Total Work Order yang saat ini sedang dalam status In Process (sedang dirakit di lantai pabrik)."
        />
        <MetricCard 
          title="Pending Work Orders" 
          value={formatNumber(data.pendingWOs)} 
          gradFrom="#17C3CC" gradTo="#2dd4bf" 
          icon={<PackageOpen size={24} />} 
          infoText="Jumlah Work Order yang masih tertunda (berstatus Draft atau Not Started)."
        />
      </div>

      {/* ROW 2: 2 AREA CHARTS (12 MONTHS TREN & QUARTER) */}
      <div className="area-charts-grid">
        <div className="chart-container">
          <ChartHeader title="Produced Quantity Trend" infoText="Total kuantitas barang yang diproyeksikan/diproduksi dalam 12 Bulan terakhir." />
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.producedQty12M} margin={{ top: 10, right: 20, left: -20, bottom: 40 }}>
              <defs>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              {/* PERBAIKAN SUMBU X (Memutar Text 45 Derajat untuk Mobile) */}
              <XAxis 
                dataKey="monthStr" 
                interval="preserveStartEnd" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Area type="monotone" dataKey="qty" name="Produced/Target Qty" stroke={COLOR_PRIMARY} strokeWidth={3} fill="url(#colorProd)" activeDot={{ r: 6, fill: COLOR_PRIMARY, stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <ChartHeader title="Quarterly Work Orders" infoText="Jumlah total Surat Perintah (Work Order) yang dibuat per Kuartal (Quarter)." />
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.quarterlyWOs} margin={{ top: 10, right: 20, left: -20, bottom: 40 }}>
              <defs>
                <linearGradient id="colorOp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#17C3CC" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#17C3CC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthStr" 
                interval="preserveStartEnd" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Area type="monotone" dataKey="total" name="Total WOs" stroke="#17C3CC" strokeWidth={3} fill="url(#colorOp)" activeDot={{ r: 6, fill: '#17C3CC', stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3: PIE CHARTS (WO ANALYSIS & AGEING) */}
      <div className="pie-charts-grid">
        <FrappePieChart data={data.woAnalysisData} title="Work Order Status Analysis" infoText="Distribusi keseluruhan berdasarkan Status Work Order." />
        <FrappePieChart data={data.pendingWOsData} title="Pending Work Order (Ageing)" infoText="Analisis umur Work Order yang belum diselesaikan (Ageing Analysis)." />
      </div>

      {/* ROW 4: BAR CHARTS (QTY TREND & TOP ITEMS) */}
      <div className="bottom-charts-grid">
        
        {/* Work Order Qty Analysis (Bar Chart 6 Bulan) */}
        <div className="chart-container">
          <ChartHeader title="Work Order Qty Analysis (6 Bulan)" infoText="Membandingkan Pending Qty dan Completed Qty secara berdampingan dalam 6 bulan terakhir." />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.woQtyTrend} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthStr" 
                interval="preserveStartEnd" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
              
              <Bar dataKey="Pending" name="Pending Qty" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={22} />
              <Bar dataKey="Completed" name="Completed Qty" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Manufactured Items (Bar Chart Pengganti Job Card) */}
        <div className="chart-container">
          <ChartHeader title="Top 5 Items to Manufacture" infoText="5 Barang dengan target produksi (Quantity) tertinggi berdasarkan seluruh Work Order." />
          {data.topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart layout="vertical" data={data.topItems} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                {/* Agar nama Item tidak terpotong, kita perbesar lebar sumbu Y (width={110}) dan kurangi fontSize */}
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                
                <Bar dataKey="qty" name="Target Quantity" fill="#17C3CC" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-box">
              <AlertCircle size={32} color="#d1d5db" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0 }}>Belum ada data barang untuk diproduksi</p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .tw-root {
           background-color: #EEF2F6; 
           min-height: calc(100vh - 80px);
           padding: 24px;
           border-radius: 16px;
           box-sizing: border-box;
           width: 100%;
           overflow-x: hidden;
        }

        .chart-container { 
          background: white; 
          border-radius: 16px; 
          padding: 24px; 
          border: none; 
          width: 100%; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.02); 
          box-sizing: border-box;
        }
        
        .no-data-box { 
          height: 260px; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          color: #9CA3AF; 
          font-size: 13px; 
          background: #f8fafc; 
          border-radius: 12px; 
          font-weight: 500; 
        }
        
        /* ── CSS KHUSUS CARD KPI (GRADASI) ── */
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
          gap: 16px; 
          margin-bottom: 24px; 
          width: 100%;
          box-sizing: border-box;
        }
        
        .metric-card {
          background: white; border-radius: 16px; border: none; padding: 24px;
          display: flex; align-items: center; justify-content: space-between;
          height: 100%; min-height: 100px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          color: white;
          transition: transform 0.2s;
          box-sizing: border-box;
        }
        .metric-card:hover { transform: translateY(-3px); }
        .metric-card-content { display: flex; flex-direction: column; width: calc(100% - 56px); }
        .metric-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .metric-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-info-btn { background: none; border: none; cursor: pointer; padding: 0; color: rgba(255,255,255,0.7); display: flex; align-items: center; flex-shrink: 0; transition: color 0.2s, transform 0.2s; }
        .metric-info-btn:hover { color: #ffffff; transform: scale(1.1); }
        .metric-value { font-size: 24px; font-weight: 800; line-height: 1.2; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(255,255,255,0.2); }

        /* GRID UNTUK CHART AREA & BOTTOM */
        .area-charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .pie-charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .bottom-charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 20px; }

        /* Pie Chart Layout */
        .pie-chart-wrapper {
          display: flex; 
          align-items: center; 
          height: 260px; 
          flex-wrap: wrap; 
        }
        .pie-chart-graphic { flex: 1; min-width: 150px; }
        .pie-chart-legend { flex: 1; padding-left: 16px; min-width: 150px; }

        @media (max-width: 1024px) {
          .bottom-charts-grid, .area-charts-grid { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 640px) {
          .tw-root { padding: 12px; margin: 0; border-radius: 0; }
          .chart-container { padding: 16px !important; border-radius: 12px; }
          .pie-chart-wrapper { flex-direction: column; height: auto; gap: 20px; }
          .pie-chart-graphic { height: 220px !important; width: 100% !important; }
          .pie-chart-legend { padding-left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}