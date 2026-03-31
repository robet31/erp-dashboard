'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useStockData, useSellingData } from '@/hooks/useFrappeData';
import { Loader2, Info, X, Package, Warehouse, DollarSign, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const TREND_COLOR_1 = '#ec4899'; 
const TREND_COLOR_2 = '#8b5cf6'; 
const BAR_COLOR_BLUE = '#6366f1';

const formatUang = (value: number | string | undefined | any) => {
  if (!value) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value));
};

const formatNumber = (value: number | string | undefined | any) => {
  if (!value) return '0';
  return new Intl.NumberFormat('id-ID').format(Number(value));
};

const formatShortAxis = (num: number) => {
  if (num === 0) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' B';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + ' K';
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
const FrappeChartTooltip = ({ active, payload, label, isCurrency = false, isDay = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
        {payload.map((entry: any, index: number) => {
          let valStr = isCurrency ? formatUang(entry.value) : formatNumber(entry.value);
          if (isDay) valStr = `${valStr} Hari`;
          
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
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap', fontFamily: "'Poppins', sans-serif" }}>{text}</p>
        <button onClick={onClose} className="btn-understand" style={{ width: '100%', padding: '12px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif" }}>Mengerti</button>
      </div>
    </div>
  );
}

export default function StockAnalyticsPage() {
  const { items, bins, stockEntries, warehouses, isLoading: isStockLoading } = useStockData();
  const { deliveryNotes, isLoading: isSellingLoading } = useSellingData();

  const [infoData, setInfoData] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });

  const stats = useMemo(() => {
    const totalActiveItems = (items || []).filter((i: any) => !i.disabled).length;
    
    const activeWarehouses = warehouses || [];
    const totalWarehouses = activeWarehouses.length;

    let totalStockValue = 0;
    const whValues: Record<string, number> = {};

    activeWarehouses.forEach((w: any) => whValues[w.name.split(' - ')[0] || w.name] = 0);

    (bins || []).forEach((b: any) => {
      const item = (items || []).find((i: any) => i.item_code === b.item_code);
      const rate = item?.standard_rate || b.valuation_rate || 0; 
      const actualQty = Number(b.actual_qty) || 0;
      const val = actualQty * rate;
      
      totalStockValue += val;
      const whName = b.warehouse ? b.warehouse.split(' - ')[0] : 'Unknown';
      
      if(whValues[whName] !== undefined) {
         whValues[whName] += val;
      } else {
         whValues[whName] = val; 
      }
    });

    const whStockValue = Object.entries(whValues)
      .map(([name, value]) => ({ name, value }))
      .filter((w) => w.value > 0)
      .sort((a, b) => b.value - a.value);

    // 2. PURCHASE RECEIPT TRENDS
    const receiptMap: Record<string, number> = {};
    const validStockEntries = (stockEntries || []).filter((se: any) => 
      se.docstatus === 1 && 
      se.stock_entry_type === 'Material Receipt'
    );
    
    validStockEntries.forEach((se: any) => {
      if (!se.posting_date) return;
      const month = new Date(se.posting_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      receiptMap[month] = (receiptMap[month] || 0) + 1;
    });

    const receiptTrends = Object.entries(receiptMap)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());

    // 3. DELIVERY TRENDS
    const deliveryMap: Record<string, number> = {};
    const validDeliveries = (deliveryNotes || []).filter((dn: any) => 
      dn.docstatus === 1 && 
      Number(dn.is_return) !== 1
    );
    
    validDeliveries.forEach((dn: any) => {
      if (!dn.posting_date) return;
      const month = new Date(dn.posting_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      deliveryMap[month] = (deliveryMap[month] || 0) + 1;
    });

    const deliveryTrends = Object.entries(deliveryMap)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());

    // 4. OLDEST ITEMS
    const today = new Date().getTime();
    const oldestItems = [...(items || [])]
      .filter((i: any) => i.is_stock_item)
      .map((i: any) => {
        const creationTime = new Date(i.creation).getTime();
        const diffTime = Math.abs(today - (isNaN(creationTime) ? today : creationTime));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return { name: i.item_name || i.item_code, age: diffDays };
      })
      .sort((a: any, b: any) => b.age - a.age)
      .slice(0, 10); 

    // 5. ITEM SHORTAGE SUMMARY
    const shortageItems = (bins || [])
      .filter((b: any) => Number(b.actual_qty) > 0 && Number(b.actual_qty) <= 15)
      .map((b: any) => {
        const item = (items || []).find((i: any) => i.item_code === b.item_code);
        return { name: item?.item_name || b.item_code, value: Number(b.actual_qty) };
      })
      .sort((a: any, b: any) => a.value - b.value)
      .slice(0, 10);

    return { totalActiveItems, totalWarehouses, totalStockValue, whStockValue, receiptTrends, deliveryTrends, oldestItems, shortageItems };
  }, [items, warehouses, bins, stockEntries, deliveryNotes]);

  if (isStockLoading || isSellingLoading) return (
    <div className="tw-root" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <Loader2 className="animate-spin" size={36} color={COLOR_PRIMARY} style={{ margin: '0 auto 12px' }} />
      <p style={{ color: '#64748b', fontSize: '13px' }}>Memuat data Stock Dashboard...</p>
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

  const ChartHeader = ({ title, subtitle, infoText }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1f2937', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{subtitle}</p>}
      </div>
      <div>
        {infoText && (
          <button onClick={() => setInfoData({ show: true, title, text: infoText })} style={{ background: '#f8fafc', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = COLOR_PRIMARY} onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
            <Info size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="tw-root" style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>Stock Analytics</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Analisis pergerakan stok mendalam dan data inventaris real-time.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      {/* ROW 1: KPI CARDS MENGGUNAKAN GRID 3 DENGAN GRADASI */}
      <div className="metrics-grid-3">
        <MetricCard 
          title="Total Active Items" 
          value={formatCompact(stats.totalActiveItems)} 
          gradFrom="#054CC7" gradTo="#0B79C9" 
          icon={<Package size={24} />} 
          infoText={`Total aktual: ${formatNumber(stats.totalActiveItems)} item.\nMenampilkan jumlah seluruh Master Item yang aktif.`} 
        />
        <MetricCard 
          title="Total Warehouses" 
          value={formatCompact(stats.totalWarehouses)} 
          gradFrom="#0B79C9" gradTo="#11A5CB" 
          icon={<Warehouse size={24} />} 
          infoText={`Total aktual: ${formatNumber(stats.totalWarehouses)} gudang.\nTotal jumlah Gudang fisik maupun grup yang terdaftar.`} 
        />
        <MetricCard 
          title="Total Stock Value" 
          value={formatCompact(stats.totalStockValue, true)} 
          gradFrom="#11A5CB" gradTo="#17C3CC" 
          icon={<DollarSign size={24} />} 
          infoText={`Total aktual: ${formatUang(stats.totalStockValue)}.\nAkumulasi nilai seluruh aset persediaan/stok di dalam semua gudang.`} 
        />
      </div>

      {/* ROW 2: WAREHOUSE STOCK VALUE CHART */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <ChartHeader 
          title="Warehouse wise Stock Value" 
          subtitle="Last synced just now" 
          infoText="Grafik ini menampilkan total nilai valuasi uang (dalam Rupiah) dari seluruh barang yang tersimpan di masing-masing gudang (Hanya menampilkan gudang yang memiliki stok barang)." 
        />
        {stats.whStockValue.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.whStockValue} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} interval={0} />
              <YAxis width={60} tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip isCurrency={true} />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Stock Value" fill={BAR_COLOR_BLUE} barSize={40} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-placeholder">
            <Package size={32} color="#d1d5db" style={{ marginBottom: '8px' }} />
            <p>Belum ada stok barang bernilai</p>
          </div>
        )}
      </div>

      {/* ROW 3: TRENDS (SEJAJAR 50-50) */}
      <div className="charts-grid-2">
        <div className="chart-container">
          <ChartHeader title="Purchase Receipt Trends" subtitle="Last synced just now" infoText="Menampilkan fluktuasi dan jumlah dokumen penerimaan barang masuk ke gudang." />
          {stats.receiptTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.receiptTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<FrappeChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="value" name="Receipts" fill={`${TREND_COLOR_2}15`} stroke={TREND_COLOR_2} strokeWidth={2.5} activeDot={{ r: 5, fill: TREND_COLOR_2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (<div className="no-data-placeholder">No Data</div>)}
        </div>
        
        <div className="chart-container">
          <ChartHeader title="Delivery Trends" subtitle="Last synced just now" infoText="Menampilkan tren dokumen surat jalan pengiriman barang keluar gudang (Delivery Note)." />
          {stats.deliveryTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.deliveryTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<FrappeChartTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="value" name="Deliveries" fill={`${TREND_COLOR_1}15`} stroke={TREND_COLOR_1} strokeWidth={2.5} activeDot={{ r: 5, fill: TREND_COLOR_1 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (<div className="no-data-placeholder">No Data</div>)}
        </div>
      </div>

      {/* ROW 4: ITEMS ANALYSIS (SEJAJAR 50-50) */}
      <div className="charts-grid-2">
        <div className="chart-container">
          <ChartHeader title="Oldest Items" infoText="Menampilkan 10 item tertua di sistem berdasarkan waktu pembuatannya (dalam hari)." />
          {stats.oldestItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.oldestItems} margin={{ top: 20, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<FrappeChartTooltip isDay={true} />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="age" name="Days Old" fill={BAR_COLOR_BLUE} barSize={25} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="no-data-placeholder">No Data</div>)}
        </div>

        <div className="chart-container">
          <ChartHeader title="Item Shortage Summary" infoText="Peringatan item di gudang yang fisiknya mulai menipis (15 unit atau kurang)." />
          {stats.shortageItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.shortageItems} margin={{ top: 20, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<FrappeChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Current Stock" fill={TREND_COLOR_1} barSize={25} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="no-data-placeholder" style={{ color: '#10b981', background: '#ecfdf5' }}>✅ Semua stok item aman.</div>)}
        </div>
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
        .chart-container { background: white; border-radius: 16px; padding: 24px; width: 100%; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); border: none; margin-bottom: 16px; }
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
        .metrics-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .charts-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        
        /* Tablet Responsive */
        @media (max-width: 1024px) {
          .metrics-grid-3 { grid-template-columns: repeat(2, 1fr); }
          .charts-grid-2 { grid-template-columns: 1fr; }
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .chart-container { padding: 16px !important; border-radius: 12px; }
          .metrics-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}