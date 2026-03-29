'use client';

import React, { useMemo, useState } from 'react';
import { useSellingData, useDashboardData } from '@/hooks/useFrappeData';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/providers/settings-provider';
import { Filter, MoreHorizontal, Loader2, TrendingUp, Info } from 'lucide-react';
import { HomeSkeleton } from '@/components/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const formatRp = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return 'Rp 0,00';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace('.', ',')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
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
const CHART_COLOR = '#e8a0bf';

// Text keys for bilingual support
const TXT: Record<string, Record<string, string>> = {
  id: {
    title: 'Selling',
    subtitle: 'Modul Penjualan — Pantau tren order dan pelanggan Artavista',
    shortcuts: 'Pintasan Anda',
    soTrends: 'Tren Sales Order',
    soTrendsSub: 'Grafik penjualan per bulan',
    chartInsight: 'Pantau tren pendapatan bulanan — identifikasi pola pertumbuhan atau penurunan',
    salesOrders: 'Sales Orders',
    totalSalesAmt: 'Total Nilai Penjualan',
    avgOrderVal: 'Rata-rata Nilai Order',
    soInsight: 'pesanan siap dikelola, cek status masing-masing',
    totalInsight: 'Nilai total dari semua Sales Order',
    avgInsight: 'Rata-rata per transaksi, pantau tren naik/turun',
    noData: 'Belum ada data penjualan',
    lastYear: 'Setahun Terakhir',
    lastQuarter: 'Kuartal Terakhir',
    lastMonth: 'Bulan Terakhir',
    monthly: 'Bulanan',
    quarterly: 'Kuartalan',
    weekly: 'Mingguan',
    toDeliver: 'siap kirim',
    toBill: 'siap tagih',
    unitPesanan: 'Pesanan',
  },
  en: {
    title: 'Selling',
    subtitle: 'Selling Module — Monitor order trends and Artavista customers',
    shortcuts: 'Your Shortcuts',
    soTrends: 'Sales Order Trends',
    soTrendsSub: 'Sales per month graph',
    chartInsight: 'Monitor monthly revenue trends — identify growth or decline patterns',
    salesOrders: 'Sales Orders',
    totalSalesAmt: 'Total Sales Amount',
    avgOrderVal: 'Average Order Value',
    soInsight: 'orders ready to manage, check each status',
    totalInsight: 'Total value from all Sales Orders',
    avgInsight: 'Average per transaction, watch for upward/downward trends',
    noData: 'No sales data yet',
    lastYear: 'Last Year',
    lastQuarter: 'Last Quarter',
    lastMonth: 'Last Month',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    weekly: 'Weekly',
    toDeliver: 'to deliver',
    toBill: 'to bill',
    unitPesanan: 'Orders',
  },
};

export default function SellingHomePage() {
  const router = useRouter();
  const { salesOrders, isLoading } = useSellingData();
  const { revenueTrend } = useDashboardData();
  const { settings } = useSettings();
  const lang = settings.language || 'id';
  const t = TXT[lang] || TXT.id;

  const [chartRange, setChartRange] = useState('lastYear');
  const [chartGranularity, setChartGranularity] = useState('monthly');

  // Filter chart data based on selected range
  const filteredTrend = useMemo(() => {
    const data = revenueTrend || [];
    if (chartRange === 'lastMonth') return data.slice(-1);
    if (chartRange === 'lastQuarter') return data.slice(-3);
    return data; // lastYear
  }, [revenueTrend, chartRange]);

  const stats = useMemo(() => {
    const orders = salesOrders as any[];
    const totalSales = orders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
    const soCount = orders.length;
    const avgOrder = soCount > 0 ? totalSales / soCount : 0;
    const toDeliver = orders.filter(o => o.docstatus === 1 && (o.per_delivered || 0) < 100 && o.status !== 'Completed').length;
    const toBill = orders.filter(o => o.docstatus === 1 && (o.per_billed || 0) < 100 && o.status !== 'Completed').length;
    return { totalSales, soCount, avgOrder, toDeliver, toBill };
  }, [salesOrders]);

  if (isLoading) return <HomeSkeleton />;

  return (
    <div className="fhome">
      {/* ── Module Title (like Frappe Home page header) ── */}
      <div className="fhome-header">
        <h1 className="fhome-title">{t.title}</h1>
        <p className="fhome-subtitle">{t.subtitle}</p>
      </div>

      {/* ── Your Shortcuts ── */}
      <h2 className="fhome-section-title">{t.shortcuts}</h2>

      {/* ── Sales Order Trends Chart (like Frappe /desk/selling) ── */}
      <div className="fhome-chart-card">
        <div className="fhome-chart-head">
          <div>
            <div className="fhome-chart-title">{t.soTrends}</div>
            <div className="fhome-chart-sub">{t.soTrendsSub}</div>
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
              <option value="weekly">{t.weekly}</option>
            </select>

          </div>
        </div>
        <div className="fhome-chart-body">
          {filteredTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSellHome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis width={55} tickFormatter={v => formatRp(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [formatFull(v), 'Revenue']} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb', fontFamily: 'Poppins' }} />
                <Area type="monotone" dataKey="revenue" stroke={CHART_COLOR} strokeWidth={2} fill="url(#gradSellHome)" activeDot={{ r: 4, fill: CHART_COLOR, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="fhome-empty">{t.noData}</div>}
        </div>
        <div className="fhome-nc-footer" style={{ margin: 0, padding: '10px 16px' }}><Info size={12} /><span>{t.chartInsight}</span></div>
      </div>

      {/* ── 3 Number Cards (matching Frappe HOME: Sales Orders, Total Sales Amount, Average Order Value) ── */}
      <div className="fhome-cards-row fhome-cards-3">
        <div className="fhome-nc" onClick={() => router.push('/dashboard/selling?tab=orders')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.salesOrders}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatNum(stats.soCount, lang)} <span className="fhome-nc-unit">{t.unitPesanan}</span></div>
          <div className="fhome-nc-footer">
            <Info size={12} />
            <span>{stats.toDeliver} {t.toDeliver}, {stats.toBill} {t.toBill}</span>
          </div>
        </div>
        <div className="fhome-nc" onClick={() => router.push('/dashboard/selling?tab=orders')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.totalSalesAmt}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatFull(stats.totalSales)}</div>
          <div className="fhome-nc-footer">
            <Info size={12} />
            <span>{t.totalInsight}</span>
          </div>
        </div>
        <div className="fhome-nc" onClick={() => router.push('/dashboard/selling?tab=orders')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.avgOrderVal}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatFull(stats.avgOrder)}</div>
          <div className="fhome-nc-footer">
            <Info size={12} />
            <span>{t.avgInsight}</span>
          </div>
        </div>
      </div>

      <style>{`
        .fhome { font-family: 'Poppins', sans-serif; animation: fhFadeIn 0.3s ease-out; }
        @keyframes fhFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fhSpin { to { transform: rotate(360deg); } }
        .fhome-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; }
        .fhome-spin { animation: fhSpin 0.8s linear infinite; color: #3b82f6; }
        .fhome-loading p { color: #6b7280; font-size: 13px; }

        .fhome-header { margin-bottom: 20px; }
        .fhome-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .fhome-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

        .fhome-section-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 14px; }

        .fhome-cards-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
        .fhome-cards-3 { grid-template-columns: repeat(3, 1fr); }
        .fhome-nc {
          background: white; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 18px 20px; cursor: pointer; transition: all 0.15s;
        }
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
        .fhome-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }

        .fhome-select { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Poppins', sans-serif; }

        @media (max-width: 768px) {
          .fhome-cards-row { grid-template-columns: 1fr; }
          .fhome-chart-head { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
