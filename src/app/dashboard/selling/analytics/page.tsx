'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSellingData } from '@/hooks/useFrappeData';
import { Info, X, Loader2, ShieldAlert, TrendingUp, Package, FileText, Users, ArrowUpRight, Activity, CheckCircle2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const TREND_COLOR_PINK = '#f472b6'; 
const BAR_COLOR_BLUE = '#6366f1';

const formatUang = (value: number | string | undefined | any) => {
  if (!value) return 'Rp 0,00';
  const num = Number(value);
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const formatNumber = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return '0';
  return new Intl.NumberFormat('id-ID').format(n);
};

const formatShortAxis = (num: number) => {
  if (num === 0) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(0) + ' B';
  if (num >= 1000000) return (num / 1000000).toFixed(0) + ' M';
  if (num >= 1000) return (num / 1000).toFixed(0) + ' K';
  return num.toString();
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
const FrappeChartTooltip = ({ active, payload, label, isCurrency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
        {payload.map((entry: any, index: number) => {
          const valStr = isCurrency ? formatUang(entry.value) : formatNumber(entry.value);
          return (
            <div key={index} style={{ marginBottom: index !== payload.length - 1 ? '10px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.color }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{valStr}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginLeft: '16px' }}>{entry.name}</div>
            </div>
          );
        })}
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

function InfoModal({ show, title, text, onClose }: { show: boolean, title: string, text: string, onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
      <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '20px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', margin: '0 16px', animation: 'scaleIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
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

export default function SellingAnalyticsPage() {
  const { salesOrders, customers, isLoading, refetch } = useSellingData();
  const [infoData, setInfoData] = useState({ show: false, title: '', text: '' });
  
  const [soItems, setSoItems] = useState<any[]>([]);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
  const [apiPermissionError, setApiPermissionError] = useState(false);

  useEffect(() => { 
    refetch(); 
  }, [refetch]);

  useEffect(() => {
    const fetchChildDataFromParents = async () => {
      const rawSales = salesOrders || [];
      const validSoNames = rawSales.filter((o: any) => o.docstatus === 1).map((o: any) => o.name);

      if (validSoNames.length === 0) {
        setSoItems([]);
        return;
      }

      setIsFetchingItems(true);
      try {
        const promises = validSoNames.map((name: string) =>
          fetch(`/api/frappe/resource/Sales Order/${encodeURIComponent(name)}`)
            .then(res => {
                if(!res.ok) throw new Error("Gagal fetch");
                return res.json();
            })
            .catch(() => null) 
        );

        const results = await Promise.all(promises);

        let allItems: any[] = [];
        results.forEach((res) => {
          if (res && res.data && res.data.items) {
            allItems = [...allItems, ...res.data.items]; 
          }
        });

        setSoItems(allItems);
        setApiPermissionError(false);
      } catch (e: any) {
        setApiPermissionError(true);
      } finally {
        setIsFetchingItems(false);
      }
    };

    if (salesOrders && salesOrders.length > 0) {
      fetchChildDataFromParents();
    }
  }, [salesOrders]);

  const stats = useMemo(() => {
    const rawSales = salesOrders || [];
    const validSales = rawSales.filter((o: any) => o.docstatus === 1); 

    const totalSalesAmount = validSales.reduce((sum, o: any) => sum + (Number(o.grand_total) || 0), 0);
    const soToDeliver = validSales.filter((o: any) => (o.per_delivered || 0) < 100 && o.status !== 'Completed').length;
    const soToBill = validSales.filter((o: any) => (o.per_billed || 0) < 100 && o.status !== 'Completed').length;
    const activeCustomers = (customers || []).filter((c: any) => !c.disabled).length;

    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = monthNamesShort.map(m => ({ month: m, revenue: 0 }));

    validSales.forEach((so: any) => {
      const dateStr = so.transaction_date || so.delivery_date || so.creation;
      if (dateStr) {
        const monthIdx = new Date(dateStr).getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          trendData[monthIdx].revenue += (Number(so.grand_total) || 0);
        }
      }
    });

    const custMap: Record<string, number> = {};
    validSales.forEach((so: any) => {
      if (so.customer_name) {
        custMap[so.customer_name] = (custMap[so.customer_name] || 0) + (Number(so.grand_total) || 0);
      }
    });
    const topCustomers = Object.entries(custMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // ── 4. ITEM-WISE ANNUAL SALES ──
    const itemMap: Record<string, number> = {};

    if (soItems && soItems.length > 0) {
      soItems.forEach((item: any) => {
        const key = item.item_code || item.item_name || 'Unknown';
        const val = Number(item.base_net_amount) || Number(item.net_amount) || Number(item.amount) || Number(item.base_amount) || 0;
        itemMap[key] = (itemMap[key] || 0) + val;
      });
    }

    const itemWiseSales = Object.entries(itemMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // 5. SALES ORDER ANALYSIS (PIE)
    const soStatusCounts = { 'Completed': 0, 'To Deliver': 0, 'Draft': 0 };
    rawSales.forEach((wo: any) => {
      if (wo.docstatus === 2) return;
      if (wo.docstatus === 0) {
        soStatusCounts['Draft']++;
      } else if (wo.docstatus === 1) {
        if ((wo.per_delivered || 0) >= 100 && (wo.per_billed || 0) >= 100) {
          soStatusCounts['Completed']++;
        } else {
          soStatusCounts['To Deliver']++;
        }
      }
    });
    
    const soAnalysisData = [
      { name: 'Completed', value: soStatusCounts['Completed'], color: '#10b981' },
      { name: 'To Deliver', value: soStatusCounts['To Deliver'], color: '#3b82f6' },
      { name: 'Draft', value: soStatusCounts['Draft'], color: '#cbd5e1' }
    ];

    return { totalSalesAmount, soToDeliver, soToBill, activeCustomers, trendData, topCustomers, itemWiseSales, soAnalysisData };
  }, [salesOrders, customers, soItems]);

  if (isLoading) return (
    <div className="tw-root" style={{ textAlign: 'center', padding: '60px' }}>
      <Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} />
      <p style={{ color: '#6B7280' }}>Sinkronisasi Analitik Selling...</p>
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

  const ChartHeader = ({ title, infoText }: { title: string, infoText?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {infoText && (
          <button onClick={() => setInfoData({ show: true, title, text: infoText })} style={{ background: '#f8fafc', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }}>
            <Info size={16} />
          </button>
        )}
      </div>
    </div>
  );

  const FrappePieChart = ({ data, title, infoText }: any) => {
    const [activeName, setActiveName] = useState(data[0]?.name || '');
    const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
    const activeItem = data.find((d: any) => d.name === activeName) || data[0] || { name: '', value: 0 };
    const activePercent = total > 0 ? ((activeItem.value / total) * 100).toFixed(1) : '0.0';

    return (
      <div className="chart-container">
        <ChartHeader title={title} infoText={infoText} />
        <div className="pie-chart-wrapper">
          <ResponsiveContainer width="50%" height="100%" className="pie-responsive">
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

          <div className="pie-legend-wrapper">
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
                    cursor: 'pointer', padding: '6px 10px', borderRadius: '8px',
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
    <div className="tw-root" style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>Selling Analytics</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Analisis performa mendalam dan riwayat transaksi real-time.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      {/* ROW 1: KPI Metrics (GRADIENT BIRU KONTINU ALA STOCK) */}
      <div className="metrics-grid-4">
        <MetricCard title="Annual Sales" value={formatCompact(stats.totalSalesAmount, true)} gradFrom="#054CC7" gradTo="#0869C8" icon={<TrendingUp size={24} />} infoText={`Total aktual: ${formatUang(stats.totalSalesAmount)}.\nTotal akumulasi penjualan dari order aktif.`} />
        <MetricCard title="Sales Orders to Deliver" value={formatCompact(stats.soToDeliver)} gradFrom="#0869C8" gradTo="#0C88C9" icon={<Package size={24} />} infoText={`Total: ${formatNumber(stats.soToDeliver)} pesanan.\nJumlah pesanan yang belum sepenuhnya dikirim.`} />
        <MetricCard title="Sales Orders to Bill" value={formatCompact(stats.soToBill)} gradFrom="#0C88C9" gradTo="#11A7CA" icon={<FileText size={24} />} infoText={`Total: ${formatNumber(stats.soToBill)} pesanan.\nJumlah pesanan yang belum ditagihkan.`} />
        <MetricCard title="Active Customers" value={formatCompact(stats.activeCustomers)} gradFrom="#11A7CA" gradTo="#17C3CC" icon={<Users size={24} />} infoText={`Total: ${formatNumber(stats.activeCustomers)} pelanggan.\nJumlah pelanggan yang aktif di sistem.`} />
      </div>

      {/* ROW 2: AREA CHART TRENDS */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <ChartHeader title="Sales Order Trends" infoText="Grafik tren pendapatan dari pesanan dari bulan Januari sampai Desember." />
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={stats.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
                <linearGradient id="gradPinkRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TREND_COLOR_PINK} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={TREND_COLOR_PINK} stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} interval={0} dy={10} />
            <YAxis tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<FrappeChartTooltip isCurrency={true} />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="revenue" name="Total Sales Amount" stroke={TREND_COLOR_PINK} strokeWidth={3} fill="url(#gradPinkRev)" activeDot={{ r: 6, fill: TREND_COLOR_PINK, stroke: 'white', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 3: Customers & Analysis */}
      <div className="charts-grid-2">
        <div className="chart-container">
          <ChartHeader title="Top Customers" infoText="Daftar pelanggan dengan akumulasi nilai transaksi terbesar." />
          {stats.topCustomers.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.topCustomers} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<FrappeChartTooltip isCurrency={true} />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Total Sales Amount" fill={COLOR_PRIMARY} radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="no-data-placeholder">No Data</div>}
        </div>

        <FrappePieChart data={stats.soAnalysisData} title="Sales Order Analysis" infoText="Persentase status dokumen Sales Order yang ada di sistem." />
      </div>

      {/* ROW 4: Item-wise Annual Sales */}
      <div className="chart-container">
        <ChartHeader title="Item-wise Annual Sales" infoText="Analisis kontribusi nominal penjualan tahunan per masing-masing produk ditarik murni dari database." />
        
        {apiPermissionError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '13px', fontWeight: 500 }}>
            <ShieldAlert size={18} />
            <span>Gagal mengambil detail item karena diblokir oleh sistem Role Permission Frappe. Pastikan Role Read telah diaktifkan untuk Sales Order Item.</span>
          </div>
        )}

        {isFetchingItems ? (
            <div className="no-data-placeholder">
                <Loader2 className="animate-spin" size={24} style={{ marginRight: '8px' }} color={COLOR_PRIMARY} />
                Memuat rincian produk...
            </div>
        ) : stats.itemWiseSales.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.itemWiseSales} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fontWeight: 600, fill: '#111827', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                    
                    <Tooltip content={<FrappeChartTooltip isCurrency={true} />} cursor={{ fill: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'Poppins', paddingBottom: '10px', fontWeight: 500 }} />
                    <Bar dataKey="value" name="Total Sales Amount" fill={BAR_COLOR_BLUE} barSize={24} radius={[0, 6, 6, 0]} />
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="no-data-placeholder">
              {apiPermissionError ? 'Menunggu izin akses API dibuka...' : 'No Data'}
            </div>
        )}
      </div>

      <style>{`
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

        /* ── CSS KHUSUS CARD KOTAK ── */
        .chart-container { background: white; border-radius: 16px; padding: 24px; width: 100%; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); border: none; margin-bottom: 20px; }
        .no-data-placeholder { height: 260px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; background: #f8fafc; border-radius: 12px; font-weight: 500; flex-direction: column; }
        
        /* ── CSS KHUSUS CARD KPI ALA FRAPPE (GRADIENT WARNA) ── */
        .metric-card {
          border-radius: 16px; border: none; padding: 24px;
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
        .metrics-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
        .charts-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        
        /* Layout Pembungkus Pie Chart agar responsif */
        .pie-chart-wrapper { display: flex; align-items: center; height: 260px; }
        .pie-legend-wrapper { flex: 1; padding-left: 16px; }

        /* Tablet Responsive */
        @media (max-width: 1024px) {
          .metrics-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .charts-grid-2 { grid-template-columns: 1fr; }
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .chart-container { padding: 16px !important; border-radius: 12px; }
          .metrics-grid-4 { grid-template-columns: 1fr; }
          .pie-chart-wrapper { flex-direction: column; height: auto; }
          .pie-chart-wrapper .pie-responsive { width: 100% !important; height: 220px !important; }
          .pie-legend-wrapper { width: 100%; padding-left: 0; padding-top: 16px; }
        }
      `}</style>
    </div>
  );
}