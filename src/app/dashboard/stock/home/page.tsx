'use client';

import React, { useMemo, useState } from 'react';
import { useStockData } from '@/hooks/useFrappeData';
import { Loader2, Info, X, CheckCircle2, Package, Warehouse, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const TREND_COLOR_PINK = '#ec4899'; 

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
const FrappeChartTooltip = ({ active, payload, label, isCurrency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
        {payload.map((entry: any, index: number) => {
          const valStr = isCurrency ? formatUang(entry.value) : formatNumber(entry.value);
          return (
            <div key={index} style={{ marginBottom: index !== payload.length - 1 ? '10px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: entry.color || TREND_COLOR_PINK }} />
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
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap', fontFamily: "'Poppins', sans-serif" }}>{text}</p>
        <button onClick={onClose} className="btn-understand" style={{ width: '100%', padding: '12px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif" }}>
          Mengerti
        </button>
      </div>
    </div>
  );
}

export default function StockHomePage() {
  // FIX: Tarik `warehouses` langsung dari database ERPNext melalui useStockData
  const { items, bins, warehouses, isLoading } = useStockData();
  const [infoData, setInfoData] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });

  const stats = useMemo(() => {
    const totalActiveItems = (items || []).filter((i: any) => !i.disabled).length;
    
    // FIX: Hitung jumlah Gudang murni dari Master Warehouse, BUKAN dari Bin (Hasilnya akan persis 7)
    const totalWarehouses = (warehouses || []).length; 

    let totalStockValue = 0;
    const groupData: Record<string, number> = {};

    (bins || []).forEach((b: any) => {
      const item = (items || []).find((i: any) => i.item_code === b.item_code);
      const rate = item?.standard_rate || b.valuation_rate || 0; 
      const actualQty = Number(b.actual_qty) || 0;
      const val = actualQty * rate;
      
      totalStockValue += val;
      const itemGroup = item?.item_group || 'Products';
      
      if(groupData[itemGroup] !== undefined) {
         groupData[itemGroup] += val;
      } else {
         groupData[itemGroup] = val; 
      }
    });

    const stockByGroup = Object.entries(groupData)
      .map(([name, value]) => ({ name, value }))
      .filter(g => g.value > 0)
      .sort((a, b) => b.value - a.value); 

    return { totalActiveItems, totalWarehouses, totalStockValue, stockByGroup };
  }, [items, bins, warehouses]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '80px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat data Dashboard...</p></div>;

  const MetricCard = ({ title, value, color, icon, infoText }: any) => (
    <div className="metric-card">
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
        <div className="metric-value" style={{ color }}>{value}</div>
      </div>
      <div className="metric-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
    </div>
  );

  const ChartHeader = ({ title, subtitle, infoText }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{subtitle}</p>}
      </div>
      <div>
        <button 
          onClick={() => setInfoData({ show: true, title, text: infoText })} 
          style={{ background: '#f3f4f6', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#4b5563', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} 
          title="Lihat Informasi"
        >
          <Info size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Stock Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '20px' }}>
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      {/* ── CHART DIPINDAHKAN KE ATAS ── */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <ChartHeader 
          title="Stock Value by Item Group" 
          subtitle="Last synced just now" 
          infoText="Grafik ini menampilkan total nilai valuasi uang (dalam Rupiah) dari seluruh barang yang dikelompokkan berdasarkan kategori barang (Item Group)." 
        />

        {stats.stockByGroup.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={stats.stockByGroup} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={70} interval={0} />
              <YAxis tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<FrappeChartTooltip isCurrency={true} />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Stock Value" fill={TREND_COLOR_PINK} barSize={80} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data-placeholder">
            <Package size={32} color="#d1d5db" style={{ marginBottom: '8px' }} />
            <p>Belum ada stok barang bernilai</p>
          </div>
        )}
      </div>

      {/* ── KPI CARDS BERADA DI BAWAH CHART ── */}
      <div className="metrics-grid-3">
        <MetricCard 
          title="Total Stock Value" 
          value={formatCompact(stats.totalStockValue, true)} 
          color="#10b981" 
          icon={<DollarSign size={24} />} 
          infoText={`Total aktual: ${formatUang(stats.totalStockValue)}.\nAkumulasi nilai seluruh aset persediaan/stok yang ada di dalam semua gudang.`} 
        />
        <MetricCard 
          title="Total Warehouses" 
          value={formatCompact(stats.totalWarehouses)} 
          color="#8b5cf6" 
          icon={<Warehouse size={24} />} 
          infoText={`Total aktual: ${formatNumber(stats.totalWarehouses)} gudang.\nMenampilkan total jumlah Gudang (Warehouse) fisik maupun grup yang terdaftar secara murni di database.`} 
        />
        <MetricCard 
          title="Total Active Items" 
          value={formatCompact(stats.totalActiveItems)} 
          color={COLOR_PRIMARY} 
          icon={<Package size={24} />} 
          infoText={`Total aktual: ${formatNumber(stats.totalActiveItems)} produk.\nMenampilkan jumlah seluruh Master Item/Produk yang saat ini berstatus Aktif.`} 
        />
      </div>

      <style>{`
        /* ── CSS KHUSUS CARD KPI ── */
        .chart-container { background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 24px; width: 100%; overflow: hidden; box-shadow: none; margin-bottom: 16px; }
        .no-data-placeholder { height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; background: #f8fafc; border-radius: 8px; font-weight: 500; }
        
        .metric-card {
          background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px;
          display: flex; align-items: center; justify-content: space-between;
          height: 100%; min-height: 100px;
        }
        .metric-card-content { display: flex; flex-direction: column; width: calc(100% - 56px); }
        .metric-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .metric-title { font-size: 13px; font-weight: 600; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-info-btn { background: none; border: none; cursor: pointer; padding: 0; color: #9ca3af; display: flex; align-items: center; flex-shrink: 0; transition: color 0.2s; }
        .metric-info-btn:hover { color: #054CC7; }
        .metric-value { font-size: 24px; font-weight: 800; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── GRID RESPONSIF SEMPURNA ── */
        .metrics-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        
        @media (max-width: 1024px) {
          .metrics-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .chart-container { padding: 16px !important; border-radius: 8px; }
          .metrics-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}