'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useManufacturingData } from '@/hooks/useFrappeData';
import { Loader2, Factory, CheckCircle, Activity, ClipboardCheck, Info, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';

// Warna Khas Frappe untuk Status
const PIE_COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#17C3CC', '#8b5cf6', '#10b981']; 
const AGE_COLORS = ['#3b82f6', '#f59e0b', '#f43f5e', '#64748b'];

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

const FrappePieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>{data.name}</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: data.payload.fill, lineHeight: 1 }}>{formatNumber(data.value)}</div>
      </div>
    );
  }
  return null;
};

function InfoModal({ show, title, text, onClose }: { show: boolean, title: string, text: string, onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
      <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '16px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', margin: '0 16px', animation: 'scaleIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: COLOR_PRIMARY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Info size={24} /></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontFamily: "'Poppins', sans-serif" }}>{text}</p>
        <button onClick={onClose} className="btn-understand" style={{ width: '100%', padding: '12px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif" }}>Mengerti</button>
      </div>
    </div>
  );
}

export default function ManufacturingAnalyticsPage() {
  const { workOrders, jobCards, qualityInspections, downtimeEntries, isLoading } = useManufacturingData() as any;
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});
  const [infoData, setInfoData] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });

  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_wo_status');
    if (savedStatus) { try { setLocalWOStatus(JSON.parse(savedStatus)); } catch (e) {} }
  }, []);

  const data = useMemo(() => {
    const safeWOs = workOrders || [];
    const safeJobCards = jobCards || [];
    const safeQIs = qualityInspections || [];
    const safeDowntimes = downtimeEntries || [];

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

    const wosValid = allWOs.filter((wo: any) => wo.docstatus === 1);

    // ── METRIK 4 KARTU ──
    let monthlyTotalWO = 0; let monthlyCompletedWO = 0;
    wosValid.forEach((wo: any) => {
      if (wo.creation) {
        const d = new Date(wo.creation);
        if (d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear) {
          monthlyTotalWO++;
          if (wo.status === 'Completed') monthlyCompletedWO++;
        }
      }
    });
    const ongoingJobCard = safeJobCards.filter((jc: any) => jc.docstatus === 1 && jc.status === 'Work In Progress').length;
    let monthlyQualityInspection = 0;
    safeQIs.filter((qi: any) => qi.docstatus === 1).forEach((qi: any) => {
      if (qi.creation) {
        const d = new Date(qi.creation);
        if (d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear) { monthlyQualityInspection++; }
      }
    });

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // ── 1. PRODUCED QTY (12 BULAN BERGULIR) ──
    const producedQty12M = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      producedQty12M.push({ monthStr: `${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`, monthRaw: d.getMonth(), yearRaw: d.getFullYear(), qty: 0 });
    }
    wosValid.forEach((wo: any) => {
      if (wo.creation) {
        const d = new Date(wo.creation);
        const match = producedQty12M.find((m: any) => m.monthRaw === d.getMonth() && m.yearRaw === d.getFullYear());
        if (match) match.qty += (Number(wo.produced_qty) || 0);
      }
    });

    // ── 2. COMPLETED OPERATION (6 QUARTER BERGULIR) ──
    const completedOpQuarters = [];
    let currQ = Math.floor(currentMonthIdx / 3) + 1;
    let currY = currentYear;
    for (let i = 5; i >= 0; i--) {
      let q = currQ - i; let y = currY;
      while (q <= 0) { q += 4; y -= 1; }
      completedOpQuarters.push({ monthStr: `Quarter ${q} ${y}`, qRaw: q, yearRaw: y, total: 0 });
    }
    wosValid.forEach((wo: any) => {
      if (wo.creation && wo.status === 'Completed') {
        const d = new Date(wo.creation);
        const wq = Math.floor(d.getMonth() / 3) + 1;
        const matchOp = completedOpQuarters.find((m: any) => m.qRaw === wq && m.yearRaw === d.getFullYear());
        if (matchOp) matchOp.total += 1;
      }
    });

    // ── 3. WORK ORDER ANALYSIS (DATA FRAPPE STYLE) ──
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
      else woAnalysisData[5].value += 1; // Rest
    });

    // ── 4. PENDING WORK ORDER (DATA FRAPPE STYLE) ──
    const pendingWOsData = [
      { name: '0-30 Days', value: 0, color: '#3b82f6' },
      { name: '30-60 Days', value: 0, color: '#f59e0b' },
      { name: '60-90 Days', value: 0, color: '#f43f5e' },
      { name: '90 Above', value: 0, color: '#64748b' },
    ];
    allWOs.forEach((wo: any) => {
      if (wo.status !== 'Completed') {
        const days = Math.floor((now.getTime() - new Date(wo.creation || now).getTime()) / 86400000);
        if (days <= 30) pendingWOsData[0].value++;
        else if (days <= 60) pendingWOsData[1].value++;
        else if (days <= 90) pendingWOsData[2].value++;
        else pendingWOsData[3].value++;
      }
    });

    // ── 5. QUALITY INSPECTION ANALYSIS ──
    const qiAnalysisData = [
      { name: 'Rejected', value: 0, color: '#ef4444' },
      { name: 'Accepted', value: 0, color: '#10b981' }
    ];
    safeQIs.filter((qi: any) => qi.docstatus === 1).forEach((qi: any) => {
      const isReject = qi.status === 'Rejected';
      if (isReject) qiAnalysisData[0].value++;
      else qiAnalysisData[1].value++;
    });

    // ── 6. DOWNTIME ANALYSIS ──
    const downtimeCounts: Record<string, number> = {};
    safeDowntimes.filter((dt: any) => dt.docstatus === 1).forEach((dt: any) => {
        const reason = dt.downtime_reason || 'Machine Error';
        downtimeCounts[reason] = (downtimeCounts[reason] || 0) + (Number(dt.downtime_minutes) || 1);
    });
    const downtimeAnalysis = Object.entries(downtimeCounts).map(([name, value], i) => ({ name, value, color: ['#6366f1', '#f43f5e', '#f59e0b', COLOR_SECONDARY][i % 4] }));

    // ── 7. WORK ORDER QTY ANALYSIS (BAR 4 BULAN BERGULIR) ──
    const woQtyTrend = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      woQtyTrend.push({ monthStr: `${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`, monthRaw: d.getMonth(), yearRaw: d.getFullYear(), Pending: 0, Completed: 0 });
    }
    allWOs.forEach((wo: any) => {
      if (!wo.creation) return;
      const d = new Date(wo.creation);
      const match = woQtyTrend.find((m: any) => m.monthRaw === d.getMonth() && m.yearRaw === d.getFullYear());
      if (match) {
        const produced = Number(wo.produced_qty) || 0;
        const total = Number(wo.qty) || 0;
        
        if (wo.docstatus === 0 || wo.status === 'Draft') {
            match.Pending += total;
        } else if (wo.status === 'Completed') {
            match.Completed += total;
        } else {
            match.Completed += produced;
            match.Pending += Math.max(0, total - produced);
        }
      }
    });

    // ── 8. JOB CARD ANALYSIS (BAR 12 BULAN JAN - DEC TAHUN INI) ──
    const jcTrend = [];
    for (let i = 0; i < 12; i++) {
      jcTrend.push({ monthStr: `${monthNamesShort[i]} ${currentYear}`, monthRaw: i, yearRaw: currentYear, Open: 0, Completed: 0 });
    }
    const simulatedJobCards: any[] = [];
    allWOs.forEach((wo: any) => {
      const isLocallySubmitted = wo.docstatus === 1 || ['Not Started', 'In Process', 'Completed'].includes(localWOStatus[wo.name]);
      if(isLocallySubmitted) simulatedJobCards.push({ status: wo.status === 'Completed' ? 'Completed' : 'Open', creation: wo.creation });
    });
    simulatedJobCards.forEach((jc: any) => {
      if (!jc.creation) return;
      const d = new Date(jc.creation);
      const match = jcTrend.find((m: any) => m.monthRaw === d.getMonth() && m.yearRaw === d.getFullYear());
      if (match) {
        if (jc.status === 'Completed') match.Completed += 1;
        else match.Open += 1;
      }
    });

    return { 
      monthlyTotalWO, monthlyCompletedWO, ongoingJobCard, monthlyQualityInspection,
      producedQty12M, completedOpQuarters, woAnalysisData, pendingWOsData, qiAnalysisData, downtimeAnalysis, woQtyTrend, jcTrend
    };
  }, [workOrders, jobCards, qualityInspections, downtimeEntries, localWOStatus]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat analitik manufaktur...</p></div>;

  // COMPONENT UNTUK METRIC KARTU YANG DILENGKAPI TOMBOL INFO
  const MetricCard = ({ title, value, color, icon, infoText }: any) => (
    <div className="chart-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{title}</span>
          {infoText && (
            <button 
              onClick={() => setInfoData({ show: true, title, text: infoText })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex', alignItems: 'center' }}
            >
              <Info size={14} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: color }}>{value}</div>
      </div>
      <div style={{ width: '48px', height: '48px', background: `${color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        {icon}
      </div>
    </div>
  );

  const ChartHeader = ({ title, infoText }: { title: string, infoText?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>Last synced 15 minutes ago</span>
        {infoText && (
          <button onClick={() => setInfoData({ show: true, title, text: infoText })} style={{ background: '#f3f4f6', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', height: '260px' }}>
          <ResponsiveContainer width="50%" height="100%">
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

          <div style={{ flex: 1, paddingLeft: '16px' }}>
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
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      {/* ROW 1: 4 METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <MetricCard 
          title="Monthly Total Work Order" 
          value={data.monthlyTotalWO} 
          color="#111827" 
          icon={<Factory size={24} />} 
          infoText="Jumlah keseluruhan Surat Perintah Kerja (Work Order) yang dibuat pada bulan berjalan."
        />
        <MetricCard 
          title="Monthly Completed Work Order" 
          value={data.monthlyCompletedWO} 
          color={COLOR_PRIMARY} 
          icon={<CheckCircle size={24} />} 
          infoText="Jumlah Surat Perintah Kerja (Work Order) yang telah berstatus Selesai pada bulan berjalan."
        />
        <MetricCard 
          title="Ongoing Job Card" 
          value={data.ongoingJobCard} 
          color={COLOR_SECONDARY} 
          icon={<Activity size={24} />} 
          infoText="Jumlah Kartu Tugas (Job Card) yang saat ini sedang dikerjakan (Work In Progress) oleh operator di pabrik."
        />
        <MetricCard 
          title="Monthly Quality Inspection" 
          value={data.monthlyQualityInspection} 
          color="#3b82f6" 
          icon={<ClipboardCheck size={24} />} 
          infoText="Jumlah total Inspeksi Kualitas (Quality Inspection) yang dicatat pada bulan berjalan."
        />
      </div>

      {/* ROW 2: 2 AREA CHARTS (12 MONTHS TREN & QUARTER) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container">
          <ChartHeader title="Produced Quantity" infoText="Total kuantitas barang yang diproduksi (12 Bulan)" />
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.producedQty12M} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthStr" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Area type="monotone" dataKey="qty" name="Produced Quantity" stroke={COLOR_PRIMARY} strokeWidth={2} fill="url(#colorProd)" activeDot={{ r: 5, fill: COLOR_PRIMARY }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <ChartHeader title="Completed Operation" infoText="Jumlah total Surat Perintah yang berstatus Selesai per Kuartal (Quarter)." />
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.completedOpQuarters} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_SECONDARY} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLOR_SECONDARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthStr" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Area type="monotone" dataKey="total" name="Completed Operation" stroke={COLOR_SECONDARY} strokeWidth={2} fill="url(#colorOp)" activeDot={{ r: 5, fill: COLOR_SECONDARY }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3: WORK ORDER ANALYSIS & QUALITY INSPECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <FrappePieChart data={data.woAnalysisData} title="Work Order Analysis" infoText="Distribusi berdasarkan Status Work Order" />
        <FrappePieChart data={data.qiAnalysisData} title="Quality Inspection Analysis" infoText="Tingkat Kelulusan Quality Control." />
      </div>

      {/* ROW 4: PENDING WO (AGEING) & DOWNTIME */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <FrappePieChart data={data.pendingWOsData} title="Pending Work Order" infoText="Analisis umur Work Order yang belum diselesaikan (Ageing Analysis)." />
        
        {/* Downtime (Gunakan Pie Biasa Karena Datanya Dinamis) */}
        <div className="chart-container">
          <ChartHeader title="Last Month Downtime Analysis" infoText="Analisis alasan pemberhentian mesin bulan lalu" />
          {data.downtimeAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.downtimeAnalysis} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value">
                  {data.downtimeAnalysis.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<FrappePieTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (<div className="no-data-box">Tidak ada catatan Downtime Mesin</div>)}
        </div>
      </div>

      {/* ROW 5: WORK ORDER QTY ANALYSIS & JOB CARD ANALYSIS (BAR CHART BULANAN) */}
      <div className="bottom-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Work Order Qty Analysis (Bar Chart 4 Bulan) */}
        <div className="chart-container">
          <ChartHeader title="Work Order Qty Analysis" infoText="Membandingkan Pending Qty dan Completed Qty secara berdampingan dalam 4 bulan terakhir." />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.woQtyTrend} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthStr" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
              
              {/* Sesuai Frappe: Pending (Abu-abu), Completed (Biru) */}
              <Bar dataKey="Pending" name="Pending" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={22} />
              <Bar dataKey="Completed" name="Completed" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Job Card Analysis (Bar Chart 12 Bulan: Jan - Des Tahun Ini) */}
        <div className="chart-container">
          <ChartHeader title="Job Card Analysis" infoText="Membandingkan status Kartu Tugas (Open vs Completed) bulan Januari - Desember tahun ini." />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.jcTrend} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="monthStr" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
              
              {/* Sesuai Frappe: Open (Abu-abu), Completed (Biru) */}
              <Bar dataKey="Open" name="Open" fill="#cbd5e1" radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="Completed" name="Completed" fill={COLOR_PRIMARY} radius={[2, 2, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <style>{`
        .chart-container { background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; width: 100%; }
        .no-data-box { height: 260px; display: flex; align-items: center; justify-content: center; color: #9CA3AF; font-size: 13px; background: #f8fafc; border-radius: 8px; }
        @media (max-width: 1024px) {
          .bottom-charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .mobile-flex-col { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .chart-container { padding: 16px !important; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}