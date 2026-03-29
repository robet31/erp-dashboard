'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useManufacturingData } from '@/hooks/useFrappeData';
import { useSettings } from '@/providers/settings-provider';
import { Info, Loader2, Factory, CheckCircle, Activity } from 'lucide-react';
import { AnalyticsSkeleton } from '@/components/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLOR_PRIMARY = '#d97706';
const COLOR_SECONDARY = '#eab308';
const FIXED_COMPANY = 'Artavista';

const TXT: Record<string, Record<string, string>> = {
  id: {
    title: 'Dashboard Manufaktur',
    subtitle: 'Analisis produksi dan work order pabrik Artavista',
    totalWO: 'Total Work Orders', totalWOInsight: 'Jumlah seluruh perintah kerja yang tercatat',
    completedWO: 'WO Selesai', completedWOInsight: 'Work order yang sudah selesai diproduksi',
    wipWO: 'WO Dalam Proses', wipWOInsight: 'Work order sedang dikerjakan di lantai produksi',
    woStatus: 'Analisis Status WO', woStatusInsight: 'Distribusi status — identifikasi bottleneck produksi',
    woTrend: 'Tren Volume Produksi', woTrendInsight: 'Tren bulanan — pantau konsistensi kapasitas pabrik',
    plannedVsActual: 'Target vs Aktual Produksi', plannedVsActualInsight: 'Perbandingan target dan hasil nyata — ukur efisiensi produksi',
    noData: 'Belum ada data',
    loading: 'Memuat dashboard manufaktur...',
    lastYear: 'Setahun Terakhir', lastQuarter: 'Kuartal Terakhir', lastMonth: 'Bulan Terakhir',
    allStatus: 'Semua Status', draftOnly: 'Draft', inProcessOnly: 'In Process', completedOnly: 'Selesai',
    planned: 'Target (Planned)', actual: 'Diproduksi (Actual)',
    unitWO: 'WO',
  },
  en: {
    title: 'Manufacturing Dashboard',
    subtitle: 'Analyze production and work orders of Artavista factory',
    totalWO: 'Total Work Orders', totalWOInsight: 'Total recorded work orders in the system',
    completedWO: 'Completed WO', completedWOInsight: 'Work orders fully produced',
    wipWO: 'WIP / In Process', wipWOInsight: 'Work orders currently being processed on the production floor',
    woStatus: 'WO Status Analysis', woStatusInsight: 'Status distribution — identify production bottlenecks',
    woTrend: 'Production Volume Trend', woTrendInsight: 'Monthly trend — monitor factory capacity consistency',
    plannedVsActual: 'Planned vs Actual Production', plannedVsActualInsight: 'Target vs actual output — measure production efficiency',
    noData: 'No data available',
    loading: 'Loading manufacturing dashboard...',
    lastYear: 'Last Year', lastQuarter: 'Last Quarter', lastMonth: 'Last Month',
    allStatus: 'All Status', draftOnly: 'Draft', inProcessOnly: 'In Process', completedOnly: 'Completed',
    planned: 'Target (Planned)', actual: 'Actual Produced',
    unitWO: 'WO',
  },
};

function FilterDropdown({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return <select className="da-select" value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function CardInsight({ text }: { text: string }) {
  return <div className="da-card-insight"><Info size={12} /><span>{text}</span></div>;
}

export default function ManufacturingAnalyticsPage() {
  const { workOrders, isLoading } = useManufacturingData() as any;
  const { settings } = useSettings();
  const lang = settings.language || 'id';
  const t = TXT[lang] || TXT.id;

  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});
  const [trendRange, setTrendRange] = useState('lastYear');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    try { const s = localStorage.getItem('erp_mock_wo_status'); if (s) setLocalWOStatus(JSON.parse(s)); } catch {}
  }, []);

  const data = useMemo(() => {
    const overriddenWOs = (workOrders || []).map((wo: any) => {
      const currentStatus = localWOStatus[wo.name] || wo.status;
      return { ...wo, status: currentStatus, produced_qty: currentStatus === 'Completed' ? (Number(wo.produced_qty) || Number(wo.qty)) : Number(wo.produced_qty) };
    });

    const wos = overriddenWOs.filter((wo: any) =>
      wo.company === FIXED_COMPANY || (wo.name && wo.name.includes('NV')) || (wo.fg_warehouse && (wo.fg_warehouse.includes('NV') || wo.fg_warehouse.includes('- A')))
    );

    const totalWO = wos.length;
    const completedWO = wos.filter((wo: any) => wo.status === 'Completed').length;
    const ongoingWO = wos.filter((wo: any) => wo.status === 'In Process').length;

    // Pie chart data — filtered by status dropdown
    const filteredWOsForPie = statusFilter === 'all' ? wos : wos.filter((wo: any) => {
      if (statusFilter === 'draft') return wo.status === 'Draft';
      if (statusFilter === 'inProcess') return wo.status === 'In Process';
      if (statusFilter === 'completed') return wo.status === 'Completed';
      return true;
    });
    const statusCounts: Record<string, number> = {};
    filteredWOsForPie.forEach((wo: any) => { const s = wo.status || 'Draft'; statusCounts[s] = (statusCounts[s] || 0) + 1; });
    const woAnalysis = Object.entries(statusCounts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

    // Area trend by month — include planned qty for richer visualization
    const monthMap: Record<string, { name: string; total: number; completed: number; plannedQty: number }> = {};
    wos.forEach((wo: any) => {
      if (!wo.creation) return;
      const m = new Date(wo.creation).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      if (!monthMap[m]) monthMap[m] = { name: m, total: 0, completed: 0, plannedQty: 0 };
      monthMap[m].total += 1;
      monthMap[m].plannedQty += Number(wo.qty) || 0;
      if (wo.status === 'Completed') monthMap[m].completed += 1;
    });
    let woByMonth = Object.values(monthMap).sort((a, b) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());
    if (trendRange === 'lastMonth') woByMonth = woByMonth.slice(-1);
    else if (trendRange === 'lastQuarter') woByMonth = woByMonth.slice(-3);

    // Bar chart: planned vs actual
    const itemMap: Record<string, { name: string; planned: number; actual: number }> = {};
    wos.forEach((wo: any) => {
      const item = wo.production_item || 'Unknown';
      if (!itemMap[item]) itemMap[item] = { name: item, planned: 0, actual: 0 };
      itemMap[item].planned += Number(wo.qty || 0);
      itemMap[item].actual += Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
    });
    const producedByItem = Object.values(itemMap);

    return { totalWO, completedWO, ongoingWO, woAnalysis, woByMonth, producedByItem };
  }, [workOrders, localWOStatus, trendRange, statusFilter]);

  if (isLoading) return <AnalyticsSkeleton cards={3} />;

  const rangeOpts = [{ label: t.lastYear, value: 'lastYear' }, { label: t.lastQuarter, value: 'lastQuarter' }, { label: t.lastMonth, value: 'lastMonth' }];
  const statusOpts = [{ label: t.allStatus, value: 'all' }, { label: t.draftOnly, value: 'draft' }, { label: t.inProcessOnly, value: 'inProcess' }, { label: t.completedOnly, value: 'completed' }];

  const getStatusColor = (name: string) => {
    if (name === 'Completed') return COLOR_PRIMARY;
    if (name === 'In Process') return '#f59e0b';
    if (name === 'Draft') return '#6B7280';
    return '#9ca3af';
  };

  return (
    <div className="da-root">
      <div className="da-header"><h1 className="da-title">{t.title}</h1><p className="da-subtitle">{t.subtitle}</p></div>

      {/* ── 3 Metric Cards ── */}
      <div className="da-cards-3">
        <div className="da-nc da-nc-icon">
          <div><div className="da-nc-label">{t.totalWO}</div><div className="da-nc-value">{data.totalWO} <span className="da-nc-unit">{t.unitWO}</span></div></div>
          <div className="da-nc-badge" style={{ background: '#1118270d', color: '#111827' }}><Factory size={22} /></div>
          <CardInsight text={t.totalWOInsight} />
        </div>
        <div className="da-nc da-nc-icon">
          <div><div className="da-nc-label">{t.completedWO}</div><div className="da-nc-value" style={{ color: COLOR_PRIMARY }}>{data.completedWO} <span className="da-nc-unit">{t.unitWO}</span></div></div>
          <div className="da-nc-badge" style={{ background: `${COLOR_PRIMARY}15`, color: COLOR_PRIMARY }}><CheckCircle size={22} /></div>
          <CardInsight text={t.completedWOInsight} />
        </div>
        <div className="da-nc da-nc-icon">
          <div><div className="da-nc-label">{t.wipWO}</div><div className="da-nc-value" style={{ color: '#f59e0b' }}>{data.ongoingWO} <span className="da-nc-unit">{t.unitWO}</span></div></div>
          <div className="da-nc-badge" style={{ background: '#f59e0b15', color: '#f59e0b' }}><Activity size={22} /></div>
          <CardInsight text={t.wipWOInsight} />
        </div>
      </div>

      {/* ── 2 Col: Pie + Trend ── */}
      <div className="da-2col">
        <div className="da-chart-card">
          <div className="da-chart-head"><div className="da-chart-title">{t.woStatus}</div>
            <div className="da-chart-actions"><FilterDropdown value={statusFilter} onChange={setStatusFilter} options={statusOpts} /></div>
          </div>
          <div className="da-chart-body">
            {data.woAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data.woAnalysis} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {data.woAnalysis.map((e, i) => <Cell key={i} fill={getStatusColor(e.name)} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Poppins', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'Poppins', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="da-empty">{t.noData}</div>}
          </div>
          <CardInsight text={t.woStatusInsight} />
        </div>

        <div className="da-chart-card">
          <div className="da-chart-head"><div className="da-chart-title">{t.woTrend}</div>
            <div className="da-chart-actions"><FilterDropdown value={trendRange} onChange={setTrendRange} options={rangeOpts} /></div>
          </div>
          <div className="da-chart-body">
            {data.woByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.woByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="cMfgT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_SECONDARY} stopOpacity={0.3} /><stop offset="95%" stopColor={COLOR_SECONDARY} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontFamily: 'Poppins', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="total" name="Total WO" stroke={COLOR_SECONDARY} strokeWidth={2.5} fill="url(#cMfgT)" activeDot={{ r: 5, fill: COLOR_SECONDARY }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="da-empty">{t.noData}</div>}
          </div>
          <CardInsight text={t.woTrendInsight} />
        </div>
      </div>

      {/* ── Planned vs Actual ── */}
      <div className="da-chart-card">
        <div className="da-chart-head"><div className="da-chart-title">{t.plannedVsActual}</div></div>
        <div className="da-chart-body">
          {data.producedByItem.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.producedByItem} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ fontFamily: 'Poppins', borderRadius: '8px', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'Poppins', paddingBottom: '8px' }} />
                <Bar dataKey="planned" name={t.planned} fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={36} />
                <Bar dataKey="actual" name={t.actual} fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="da-empty">{t.noData}</div>}
        </div>
        <CardInsight text={t.plannedVsActualInsight} />
      </div>

      <style>{`
        .da-root { font-family: 'Poppins', sans-serif; animation: daFadeIn 0.3s ease-out; }
        @keyframes daFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes daSpin { to { transform: rotate(360deg); } }
        .da-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; font-family: 'Poppins', sans-serif; }
        .da-spin { animation: daSpin 0.8s linear infinite; color: #d97706; }
        .da-loading p { color: #6b7280; font-size: 13px; }
        .da-header { margin-bottom: 20px; }
        .da-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .da-subtitle { font-size: 13px; color: #6b7280; margin: 0; }
        .da-cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
        .da-nc { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; overflow: hidden; }
        .da-nc-icon { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; }
        .da-nc-label { font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px; }
        .da-nc-value { font-size: 26px; font-weight: 700; color: #111827; display: flex; align-items: baseline; gap: 6px; }
        .da-nc-unit { font-size: 13px; font-weight: 500; color: #9ca3af; }
        .da-nc-badge { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .da-chart-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 18px; overflow: hidden; }
        .da-chart-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px; }
        .da-chart-title { font-size: 14px; font-weight: 600; color: #111827; }
        .da-chart-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .da-chart-body { padding: 18px 20px; }
        .da-select { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Poppins', sans-serif; }
        .da-select:hover { border-color: ${COLOR_PRIMARY}; }
        .da-card-insight { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #9ca3af; padding: 10px 16px; border-top: 1px solid #f3f4f6; }
        .da-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .da-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }
        @media (max-width: 900px) { .da-cards-3 { grid-template-columns: 1fr; } .da-2col { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}