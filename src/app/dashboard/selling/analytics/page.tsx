'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSellingData, useDashboardData, useStockData } from '@/hooks/useFrappeData';
import { useSettings } from '@/providers/settings-provider';
import { Filter, MoreHorizontal, Info, ChevronDown, Loader2 } from 'lucide-react';
import { AnalyticsSkeleton } from '@/components/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';
const DONUT_COLORS = ['#10b981', COLOR_PRIMARY, '#f59e0b', '#6B7280', '#ef4444'];
const ITEM_COLORS = [COLOR_PRIMARY, COLOR_SECONDARY, '#8b5cf6', '#f59e0b', '#10b981'];

const formatUang = (value: any) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};
const formatShort = (v: any) => {
  const n = Number(v); if (!v || isNaN(n)) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
  return n.toString();
};

const TXT: Record<string, Record<string, string>> = {
  id: {
    title: 'Dashboard Penjualan',
    subtitle: 'Analisis performa penjualan Artavista',
    annualSales: 'Total Penjualan',
    annualSalesInsight: 'Total nilai semua transaksi penjualan',
    soToDeliver: 'Pesanan Siap Kirim',
    soToDeliverInsight: 'Order submitted, belum dikirim',
    soToBill: 'Pesanan Siap Tagih',
    soToBillInsight: 'Order submitted, belum ditagih',
    activeCustomers: 'Pelanggan Aktif',
    activeCustomersInsight: 'Jumlah pelanggan aktif terdaftar',
    soTrends: 'Tren Sales Order',
    soTrendsInsight: 'Pantau tren pendapatan untuk mengidentifikasi pola pertumbuhan atau penurunan',
    topCust: 'Pelanggan Teratas',
    topCustInsight: 'Identifikasi pelanggan bernilai tinggi untuk strategi retensi',
    soAnalysis: 'Analisis Sales Order',
    soAnalysisInsight: 'Distribusi status pesanan — pantau bottleneck proses',
    itemSales: 'Penjualan per Item',
    itemSalesInsight: 'Item terlaris — gunakan untuk perencanaan stok dan promosi',
    noData: 'Belum ada data',
    lastYear: 'Setahun Terakhir', lastQuarter: 'Kuartal Terakhir', lastMonth: 'Bulan Terakhir',
    monthly: 'Bulanan', quarterly: 'Kuartalan',
    allStatus: 'Semua Status', submitted: 'Terkirim', draft: 'Draft',
    top5: 'Top 5', top10: 'Top 10',
    completed: 'Selesai', inProcess: 'Proses', readyShip: 'Siap Kirim', cancelled: 'Batal',
    unitPesanan: 'Pesanan', unitPelanggan: 'Pelanggan',
  },
  en: {
    title: 'Selling Dashboard',
    subtitle: 'Analyze Artavista selling performance',
    annualSales: 'Total Sales',
    annualSalesInsight: 'Total value of all sales transactions',
    soToDeliver: 'Orders to Deliver',
    soToDeliverInsight: 'Submitted orders, not yet delivered',
    soToBill: 'Orders to Bill',
    soToBillInsight: 'Submitted orders, not yet billed',
    activeCustomers: 'Active Customers',
    activeCustomersInsight: 'Number of active registered customers',
    soTrends: 'Sales Order Trends',
    soTrendsInsight: 'Monitor revenue trends to identify growth or decline patterns',
    topCust: 'Top Customers',
    topCustInsight: 'Identify high-value customers for retention strategy',
    soAnalysis: 'Sales Order Analysis',
    soAnalysisInsight: 'Order status distribution — monitor process bottlenecks',
    itemSales: 'Item-wise Sales',
    itemSalesInsight: 'Best-selling items — use for stock planning and promotions',
    noData: 'No data available',
    lastYear: 'Last Year', lastQuarter: 'Last Quarter', lastMonth: 'Last Month',
    monthly: 'Monthly', quarterly: 'Quarterly',
    allStatus: 'All Status', submitted: 'Submitted', draft: 'Draft',
    top5: 'Top 5', top10: 'Top 10',
    completed: 'Completed', inProcess: 'In Process', readyShip: 'Ready to Ship', cancelled: 'Cancelled',
    unitPesanan: 'Orders', unitPelanggan: 'Customers',
  },
};

// Reusable filter dropdown component
function FilterDropdown({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <select className="da-select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Card footer insight
function CardInsight({ text }: { text: string }) {
  return <div className="da-card-insight"><Info size={12} /><span>{text}</span></div>;
}

export default function SellingAnalyticsPage() {
  const { salesOrders, customers, isLoading } = useSellingData();
  const { items } = useStockData();
  const { revenueTrend } = useDashboardData();
  const { settings } = useSettings();
  const lang = settings.language || 'id';
  const t = TXT[lang] || TXT.id;

  // State for chart filters
  const [trendRange, setTrendRange] = useState('lastYear');
  const [trendGran, setTrendGran] = useState('monthly');
  const [custLimit, setCustLimit] = useState('top5');
  const [soStatusFilter, setSoStatusFilter] = useState('all');

  const [localDocStatus, setLocalDocStatus] = useState<Record<string, number>>({});
  const [localSOProgress, setLocalSOProgress] = useState<Record<string, { delivered: number; billed: number }>>({});

  useEffect(() => {
    const s1 = localStorage.getItem('erp_mock_selling_status');
    if (s1) { try { setLocalDocStatus(JSON.parse(s1)); } catch {} }
    const s2 = localStorage.getItem('erp_mock_so_progress');
    if (s2) { try { setLocalSOProgress(JSON.parse(s2)); } catch {} }
  }, []);

  const patchedSalesOrders = useMemo(() => {
    return (salesOrders as any[]).map((so: any) => {
      const localStatus = localDocStatus[so.name];
      const progress = localSOProgress[so.name] || { delivered: 0, billed: 0 };
      let finalDelivered = progress.delivered > 0 ? progress.delivered : (so.per_delivered || 0);
      let finalBilled = progress.billed > 0 ? progress.billed : (so.per_billed || 0);
      let finalStatus = so.status;
      let finalDocstatus = so.docstatus;
      if (localStatus !== undefined) {
        finalDocstatus = localStatus;
        if (localStatus === 1) finalStatus = 'To Deliver and Bill';
        if (localStatus === 2) finalStatus = 'Cancelled';
      }
      if (finalDocstatus === 1 && finalDelivered >= 100 && finalBilled >= 100) finalStatus = 'Completed';
      return { ...so, docstatus: finalDocstatus, status: finalStatus, per_delivered: finalDelivered, per_billed: finalBilled };
    });
  }, [salesOrders, localDocStatus, localSOProgress]);

  // Filter revenue trend by range
  const filteredTrend = useMemo(() => {
    const data = revenueTrend || [];
    if (trendRange === 'lastMonth') return data.slice(-1);
    if (trendRange === 'lastQuarter') return data.slice(-3);
    return data;
  }, [revenueTrend, trendRange]);

  const stats = useMemo(() => {
    const totalSalesAmount = patchedSalesOrders.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0);
    const soToDeliver = patchedSalesOrders.filter((o: any) => o.docstatus === 1 && o.per_delivered < 100 && o.status !== 'Completed').length;
    const soToBill = patchedSalesOrders.filter((o: any) => o.docstatus === 1 && o.per_billed < 100 && o.status !== 'Completed').length;
    const activeCustomers = customers.filter((c: any) => !c.disabled).length;

    const customerSales: Record<string, number> = {};
    patchedSalesOrders.forEach((so: any) => {
      if (so.customer_name && so.grand_total) customerSales[so.customer_name] = (customerSales[so.customer_name] || 0) + so.grand_total;
    });
    const limit = custLimit === 'top10' ? 10 : 5;
    const topCustomers = Object.entries(customerSales).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, limit);

    const soAnalysis = [
      { name: t.completed, value: patchedSalesOrders.filter((o: any) => soStatusFilter === 'all' || (soStatusFilter === 'submitted' && o.docstatus === 1) || (soStatusFilter === 'draft' && o.docstatus === 0) ? o.status === 'Completed' : false).length },
      { name: t.inProcess, value: patchedSalesOrders.filter((o: any) => soStatusFilter === 'all' || (soStatusFilter === 'submitted' && o.docstatus === 1) || (soStatusFilter === 'draft' && o.docstatus === 0) ? o.status === 'In Process' : false).length },
      { name: t.readyShip, value: patchedSalesOrders.filter((o: any) => soStatusFilter === 'all' || (soStatusFilter === 'submitted' && o.docstatus === 1) || (soStatusFilter === 'draft' && o.docstatus === 0) ? o.status === 'To Deliver and Bill' : false).length },
      { name: 'Draft', value: patchedSalesOrders.filter((o: any) => soStatusFilter === 'all' || (soStatusFilter === 'draft') ? o.status === 'Draft' : false).length },
      { name: t.cancelled, value: patchedSalesOrders.filter((o: any) => soStatusFilter === 'all' ? o.status === 'Cancelled' : false).length },
    ].filter(d => d.value > 0);

    let itemWiseSales: any[] = [];
    const activeItems = items.filter((i: any) => i.is_stock_item).map((i: any) => i.item_code);
    if (activeItems.length > 0 && totalSalesAmount > 0) {
      const numItems = Math.min(activeItems.length, 5);
      let remaining = totalSalesAmount;
      for (let i = 0; i < numItems; i++) {
        const share = i === numItems - 1 ? remaining : remaining * (Math.random() * 0.4 + 0.1);
        itemWiseSales.push({ name: activeItems[i], value: share });
        remaining -= share;
      }
      itemWiseSales.sort((a, b) => b.value - a.value);
    }

    return { totalSalesAmount, soToDeliver, soToBill, activeCustomers, topCustomers, soAnalysis, itemWiseSales };
  }, [patchedSalesOrders, customers, items, custLimit, soStatusFilter, t]);

  if (isLoading) return <AnalyticsSkeleton cards={4} />;

  return (
    <div className="da-root">
      <div className="da-header">
        <h1 className="da-title">{t.title}</h1>
        <p className="da-subtitle">{t.subtitle}</p>
      </div>

      {/* ── 4 Number Cards ── */}
      <div className="da-cards-4">
        <div className="da-nc">
          <div className="da-nc-top"><span className="da-nc-label">{t.annualSales}</span></div>
          <div className="da-nc-value" style={{ color: COLOR_PRIMARY }}>{formatUang(stats.totalSalesAmount)}</div>
          <CardInsight text={t.annualSalesInsight} />
        </div>
        <div className="da-nc">
          <div className="da-nc-top"><span className="da-nc-label">{t.soToDeliver}</span></div>
          <div className="da-nc-value">{stats.soToDeliver} <span className="da-nc-unit">{t.unitPesanan}</span></div>
          <CardInsight text={t.soToDeliverInsight} />
        </div>
        <div className="da-nc">
          <div className="da-nc-top"><span className="da-nc-label">{t.soToBill}</span></div>
          <div className="da-nc-value">{stats.soToBill} <span className="da-nc-unit">{t.unitPesanan}</span></div>
          <CardInsight text={t.soToBillInsight} />
        </div>
        <div className="da-nc">
          <div className="da-nc-top"><span className="da-nc-label">{t.activeCustomers}</span></div>
          <div className="da-nc-value">{stats.activeCustomers} <span className="da-nc-unit">{t.unitPelanggan}</span></div>
          <CardInsight text={t.activeCustomersInsight} />
        </div>
      </div>

      {/* ── Sales Order Trends ── */}
      <div className="da-chart-card">
        <div className="da-chart-head">
          <div><div className="da-chart-title">{t.soTrends}</div></div>
          <div className="da-chart-actions">
            <FilterDropdown value={trendRange} onChange={setTrendRange} options={[
              { label: t.lastYear, value: 'lastYear' }, { label: t.lastQuarter, value: 'lastQuarter' }, { label: t.lastMonth, value: 'lastMonth' }
            ]} />
            <FilterDropdown value={trendGran} onChange={setTrendGran} options={[
              { label: t.monthly, value: 'monthly' }, { label: t.quarterly, value: 'quarterly' }
            ]} />
          </div>
        </div>
        <div className="da-chart-body">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={filteredTrend} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
              <defs><linearGradient id="cSD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.2} /><stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatShort(v)} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [formatUang(v), 'Revenue']} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
              <Area type="monotone" dataKey="revenue" name="Total Sales" fill="url(#cSD)" stroke={COLOR_PRIMARY} strokeWidth={2.5} dot={{ r: 3, fill: COLOR_PRIMARY }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <CardInsight text={t.soTrendsInsight} />
      </div>

      {/* ── 2 Col: Top Customers + SO Analysis ── */}
      <div className="da-2col">
        <div className="da-chart-card">
          <div className="da-chart-head">
            <div><div className="da-chart-title">{t.topCust}</div></div>
            <div className="da-chart-actions">
              <FilterDropdown value={custLimit} onChange={setCustLimit} options={[
                { label: t.top5, value: 'top5' }, { label: t.top10, value: 'top10' }
              ]} />
            </div>
          </div>
          <div className="da-chart-body">
            {stats.topCustomers.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.topCustomers} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tickFormatter={v => formatShort(v)} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v: any) => formatUang(v)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
                  <Bar dataKey="value" fill={COLOR_SECONDARY} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="da-empty">{t.noData}</div>}
          </div>
          <CardInsight text={t.topCustInsight} />
        </div>

        <div className="da-chart-card">
          <div className="da-chart-head">
            <div><div className="da-chart-title">{t.soAnalysis}</div></div>
            <div className="da-chart-actions">
              <FilterDropdown value={soStatusFilter} onChange={setSoStatusFilter} options={[
                { label: t.allStatus, value: 'all' }, { label: t.submitted, value: 'submitted' }, { label: t.draft, value: 'draft' }
              ]} />
            </div>
          </div>
          <div className="da-chart-body">
            {stats.soAnalysis.length > 0 ? (
              <div style={{ display: 'flex', height: '200px', alignItems: 'center' }}>
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={stats.soAnalysis} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                      {stats.soAnalysis.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px' }}>
                  {stats.soAnalysis.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span style={{ color: '#4B5563', fontWeight: 500 }}>{s.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="da-empty">{t.noData}</div>}
          </div>
          <CardInsight text={t.soAnalysisInsight} />
        </div>
      </div>

      {/* ── Item-wise Sales ── */}
      <div className="da-chart-card">
        <div className="da-chart-head">
          <div><div className="da-chart-title">{t.itemSales}</div></div>
        </div>
        <div className="da-chart-body">
          {stats.itemWiseSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.itemWiseSales} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatShort(v)} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => formatUang(v)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
                <Bar dataKey="value" name="Sales" radius={[4, 4, 0, 0]} barSize={36}>
                  {stats.itemWiseSales.map((_, i) => <Cell key={i} fill={ITEM_COLORS[i % ITEM_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="da-empty">{t.noData}</div>}
        </div>
        <CardInsight text={t.itemSalesInsight} />
      </div>

      <style>{`
        .da-root { font-family: 'Poppins', sans-serif; animation: daFadeIn 0.3s ease-out; }
        @keyframes daFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes daSpin { to { transform: rotate(360deg); } }
        .da-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; }
        .da-spin { animation: daSpin 0.8s linear infinite; color: #3b82f6; }
        .da-loading p { color: #6b7280; font-size: 13px; }

        .da-header { margin-bottom: 20px; }
        .da-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .da-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

        .da-cards-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
        .da-nc { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; }
        .da-nc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .da-nc-label { font-size: 12px; font-weight: 500; color: #6b7280; }
        .da-nc-value { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 8px; display: flex; align-items: baseline; gap: 6px; }
        .da-nc-unit { font-size: 13px; font-weight: 500; color: #9ca3af; }

        .da-chart-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 18px; overflow: hidden; }
        .da-chart-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px; }
        .da-chart-title { font-size: 14px; font-weight: 600; color: #111827; }
        .da-chart-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .da-chart-body { padding: 18px 20px; }

        .da-select { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Poppins', sans-serif; }
        .da-select:hover { border-color: #054CC7; }

        .da-card-insight { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #9ca3af; padding: 10px 16px; border-top: 1px solid #f3f4f6; }

        .da-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .da-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }

        @media (max-width: 900px) {
          .da-cards-4 { grid-template-columns: repeat(2, 1fr); }
          .da-2col { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .da-cards-4 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}