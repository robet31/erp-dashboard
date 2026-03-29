'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/providers/settings-provider';
import { Filter, MoreHorizontal, Loader2, Info } from 'lucide-react';
import { HomeSkeleton } from '@/components/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FIXED_COMPANY = 'Artavista';
const CHART_COLOR = '#e8a0bf';

const formatRp = (v: any) => {
  const n = Number(v); if (!v || isNaN(n)) return 'Rp 0,00';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M`;
  return new Intl.NumberFormat('id-ID').format(n);
};
const formatFull = (v: any) => {
  const n = Number(v); if (!v || isNaN(n)) return 'Rp 0,00';
  return `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
};
const formatNum = (v: any, lang: string = 'id') => {
  const n = Number(v); if (!v || isNaN(n)) return '0';
  if (lang === 'id') return new Intl.NumberFormat('id-ID').format(n);
  return new Intl.NumberFormat('en-US').format(n);
};

const TXT: Record<string, Record<string, string>> = {
  id: {
    title: 'Manufacturing',
    subtitle: 'Modul Produksi — Pantau produksi dan work order pabrik Artavista',
    shortcuts: 'Pintasan Anda',
    producedQty: 'Kuantitas Diproduksi',
    producedQtySub: 'Jumlah unit yang diproduksi tiap bulan',
    openWO: 'Open Work Orders',
    wipWO: 'WIP Work Orders',
    mfgItemValue: 'Nilai Barang Diproduksi',
    openInsight: 'work order belum dimulai, jadwalkan segera',
    wipInsight: 'work order dalam proses produksi',
    valueInsight: 'Nilai total barang yang telah selesai diproduksi',
    chartInsight: 'Tren produksi bulanan — pantau konsistensi output pabrik',
    noData: 'Belum ada data produksi',
    lastYear: 'Setahun Terakhir',
    lastQuarter: 'Kuartal Terakhir',
    lastMonth: 'Bulan Terakhir',
    monthly: 'Bulanan',
    quarterly: 'Kuartalan',
    unitWO: 'WO',
  },
  en: {
    title: 'Manufacturing',
    subtitle: 'Manufacturing Module — Monitor production and work orders for Artavista',
    shortcuts: 'Your Shortcuts',
    producedQty: 'Produced Quantity',
    producedQtySub: 'Units produced per month',
    openWO: 'Open Work Orders',
    wipWO: 'WIP Work Orders',
    mfgItemValue: 'Manufactured Items Value',
    openInsight: 'work orders not yet started, schedule them soon',
    wipInsight: 'work orders currently in production process',
    valueInsight: 'Total value of items that have been produced',
    chartInsight: 'Monthly production trend — monitor factory output consistency',
    noData: 'No production data yet',
    lastYear: 'Last Year',
    lastQuarter: 'Last Quarter',
    lastMonth: 'Last Month',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    unitWO: 'WO',
  },
};

export default function ManufacturingHomePage() {
  const router = useRouter();
  const { workOrders, isLoading: isMfgLoading } = useManufacturingData() as any;
  const { items, isLoading: isStockLoading } = useStockData();
  const { settings } = useSettings();
  const lang = settings.language || 'id';
  const t = TXT[lang] || TXT.id;
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});
  const [chartRange, setChartRange] = useState('lastYear');
  const [chartGranularity, setChartGranularity] = useState('monthly');

  useEffect(() => {
    const s = localStorage.getItem('erp_mock_wo_status');
    if (s) { try { setLocalWOStatus(JSON.parse(s)); } catch {} }
  }, []);

  const stats = useMemo(() => {
    const wos = (workOrders || []).map((wo: any) => ({
      ...wo, status: localWOStatus[wo.name] || wo.status,
      produced_qty: (localWOStatus[wo.name] === 'Completed') ? (Number(wo.produced_qty) || Number(wo.qty)) : Number(wo.produced_qty)
    })).filter((wo: any) => wo.company === FIXED_COMPANY);

    const openWOs = wos.filter((wo: any) => wo.status === 'Draft' || wo.status === 'Not Started').length;
    const wipWOs = wos.filter((wo: any) => wo.status === 'In Process').length;

    let mfgValue = 0;
    wos.forEach((wo: any) => {
      const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      if (qty > 0) {
        const item = items.find((i: any) => i.item_code === wo.production_item);
        mfgValue += qty * (item?.standard_rate || 0);
      }
    });

    // Chart: Show WO activity per month (planned + produced)
    // Even if nothing is produced yet, show planned qty so chart is never empty
    const trendMap: Record<string, { planned: number; produced: number; woCount: number }> = {};
    wos.forEach((wo: any) => {
      if (!wo.creation) return;
      const m = new Date(wo.creation).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!trendMap[m]) trendMap[m] = { planned: 0, produced: 0, woCount: 0 };
      trendMap[m].planned += Number(wo.qty) || 0;
      trendMap[m].woCount += 1;
      const prodQty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      trendMap[m].produced += prodQty;
    });
    const producedTrend = Object.entries(trendMap)
      .map(([day, d]) => ({ day, planned: d.planned, produced: d.produced, woCount: d.woCount }))
      .sort((a, b) => new Date(`1 ${a.day}`).getTime() - new Date(`1 ${b.day}`).getTime());

    return { openWOs, wipWOs, mfgValue, producedTrend };
  }, [workOrders, items, localWOStatus]);

  // Filter chart data based on range
  const filteredTrend = useMemo(() => {
    const data = stats.producedTrend;
    if (chartRange === 'lastMonth') return data.slice(-1);
    if (chartRange === 'lastQuarter') return data.slice(-3);
    return data;
  }, [stats.producedTrend, chartRange]);

  if (isMfgLoading || isStockLoading) return <HomeSkeleton />;

  return (
    <div className="fhome">
      {/* ── Module Title ── */}
      <div className="fhome-header">
        <h1 className="fhome-title">{t.title}</h1>
        <p className="fhome-subtitle">{t.subtitle}</p>
      </div>

      {/* ── Your Shortcuts ── */}
      <h2 className="fhome-section-title">{t.shortcuts}</h2>

      {/* ── Produced Quantity Chart (Frappe HOME: simple chart) ── */}
      <div className="fhome-chart-card">
        <div className="fhome-chart-head">
          <div>
            <div className="fhome-chart-title">{t.producedQty}</div>
            <div className="fhome-chart-sub">{t.producedQtySub}</div>
          </div>
          <div className="fhome-chart-actions">
            <select className="fhome-select" value={chartRange} onChange={e => setChartRange(e.target.value)}>
              <option value="lastYear">{t.lastYear}</option>
              <option value="lastQuarter">{t.lastQuarter}</option>
              <option value="lastMonth">{t.lastMonth}</option>
            </select>
            <select className="fhome-select" value={chartGranularity} onChange={e => setChartGranularity(e.target.value)}>
              <option value="monthly">{t.monthly}</option>
              <option value="quarterly">{t.quarterly}</option>
            </select>

          </div>
        </div>
        <div className="fhome-chart-body">
          {filteredTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMfgPlanned" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gradMfgProduced" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.2} /><stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any, n: any) => [`${v} unit`, n === 'planned' ? (lang === 'id' ? 'Target Produksi' : 'Planned') : (lang === 'id' ? 'Diproduksi' : 'Produced')]} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb', fontFamily: 'Poppins' }} />
                <Area type="monotone" dataKey="planned" name={lang === 'id' ? 'Target' : 'Planned'} stroke="#6366f1" strokeWidth={2} fill="url(#gradMfgPlanned)" strokeDasharray="5 3" dot={false} />
                <Area type="monotone" dataKey="produced" name={lang === 'id' ? 'Diproduksi' : 'Produced'} stroke={CHART_COLOR} strokeWidth={2.5} fill="url(#gradMfgProduced)" activeDot={{ r: 4, fill: CHART_COLOR, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="fhome-empty">{t.noData}</div>}
        </div>
        <div className="fhome-nc-footer" style={{ margin: 0, padding: '10px 16px' }}><Info size={12} /><span>{t.chartInsight}</span></div>
      </div>

      {/* ── 3 Number Cards (Frappe HOME style) ── */}
      <div className="fhome-cards-row fhome-cards-3">
        <div className="fhome-nc" onClick={() => router.push('/dashboard/manufacturing?tab=workorders')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.openWO}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatNum(stats.openWOs, lang)} <span className="fhome-nc-unit">{t.unitWO}</span></div>
          <div className="fhome-nc-footer"><Info size={12} /><span>{stats.openWOs} {t.openInsight}</span></div>
        </div>
        <div className="fhome-nc" onClick={() => router.push('/dashboard/manufacturing?tab=workorders')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.wipWO}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatNum(stats.wipWOs, lang)} <span className="fhome-nc-unit">{t.unitWO}</span></div>
          <div className="fhome-nc-footer"><Info size={12} /><span>{stats.wipWOs} {t.wipInsight}</span></div>
        </div>
        <div className="fhome-nc" onClick={() => router.push('/dashboard/manufacturing?tab=workorders')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.mfgItemValue}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatFull(stats.mfgValue)}</div>
          <div className="fhome-nc-footer"><Info size={12} /><span>{t.valueInsight}</span></div>
        </div>
      </div>

      <style>{`
        .fhome { font-family: 'Poppins', sans-serif; animation: fhFadeIn 0.3s ease-out; }
        @keyframes fhFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fhSpin { to { transform: rotate(360deg); } }
        .fhome-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; }
        .fhome-spin { animation: fhSpin 0.8s linear infinite; color: #f59e0b; }
        .fhome-loading p { color: #6b7280; font-size: 13px; }

        .fhome-header { margin-bottom: 20px; }
        .fhome-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .fhome-subtitle { font-size: 13px; color: #6b7280; margin: 0; }
        .fhome-section-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 14px; }

        .fhome-cards-row { display: grid; gap: 14px; margin-bottom: 18px; }
        .fhome-cards-3 { grid-template-columns: repeat(3, 1fr); }
        .fhome-nc { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; }
        .fhome-nc:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-color: #d1d5db; }
        .fhome-nc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .fhome-nc-label { font-size: 12px; font-weight: 500; color: #6b7280; }
        .fhome-nc-more { color: #d1d5db; cursor: pointer; }
        .fhome-nc-value { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px; display: flex; align-items: baseline; gap: 6px; }
        .fhome-nc-unit { font-size: 13px; font-weight: 500; color: #9ca3af; }
        .fhome-nc-footer { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 8px; }

        .fhome-chart-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 18px; overflow: hidden; }
        .fhome-chart-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px; }
        .fhome-chart-title { font-size: 14px; font-weight: 600; color: #111827; }
        .fhome-chart-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .fhome-chart-actions { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
        .fhome-filter-btn { background: transparent; border: 1px solid #e5e7eb; border-radius: 6px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: all 0.15s; }
        .fhome-filter-btn:hover { background: #f9fafb; color: #374151; }
        .fhome-chart-body { padding: 18px 20px; }

        .fhome-select { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Poppins', sans-serif; }
        .fhome-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }

        @media (max-width: 768px) {
          .fhome-cards-3 { grid-template-columns: 1fr; }
          .fhome-chart-head { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}