'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSellingData } from '@/hooks/useFrappeData';
import { useAuth } from '@/providers/auth-provider';
import {
  ShoppingCart, DollarSign, Calculator, ArrowUpRight, AlertCircle,
  CheckCircle2, Info, X, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const TREND_COLOR_BLUE = '#3b82f6'; 

const ROLE_TITLES: Record<string, string> = {
  admin_sales: 'Staff Selling',
  admin_gudang: 'Staff Gudang',
  manajer_produksi: 'Manager Produksi',
  administrator: 'Administrator',
};

const formatUang = (value: number | string | undefined | any) => {
  if (value === undefined || value === null) return 'Rp 0,00';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0,00';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const formatNumber = (value: number | string | undefined | any) => {
  if (value === undefined || value === null) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
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
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
        {payload.map((entry: any, index: number) => {
          const valStr = isCurrency ? formatUang(entry.value) : formatNumber(entry.value);
          return (
            <div key={index} style={{ marginBottom: index !== payload.length - 1 ? '10px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: entry.color || TREND_COLOR_BLUE }} />
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
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, marginBottom: '24px', fontFamily: "'Poppins', sans-serif" }}>{text}</p>
        <button onClick={onClose} className="btn-understand" style={{ width: '100%', padding: '12px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Poppins', sans-serif" }}>
          Mengerti
        </button>
      </div>
    </div>
  );
}

export default function SellingHomePage() {
  const { user } = useAuth();
  const { salesOrders, isLoading, refetch } = useSellingData();
  const roleTitle = user ? ROLE_TITLES[user.role] || 'User' : 'User';

  const [infoData, setInfoData] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const stats = useMemo(() => {
    const rawSales = salesOrders || [];
    const validSales = rawSales.filter((o: any) => o.docstatus === 1);

    const totalSalesOrders = validSales.length;
    const totalSalesAmount = validSales.reduce((sum: number, o: any) => sum + (Number(o.grand_total) || 0), 0);
    const averageOrderValue = totalSalesOrders > 0 ? (totalSalesAmount / totalSalesOrders) : 0;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = monthNames.map(m => ({ month: m, revenue: 0 }));

    validSales.forEach((so: any) => {
      const dateStr = so.transaction_date || so.delivery_date || so.creation;
      if (dateStr) {
        const date = new Date(dateStr);
        const mIdx = date.getMonth(); 
        if (mIdx >= 0 && mIdx < 12) {
          monthlyRevenue[mIdx].revenue += (Number(so.grand_total) || 0);
        }
      }
    });

    return { totalSalesOrders, totalSalesAmount, averageOrderValue, monthlyRevenue };
  }, [salesOrders]);

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <Loader2 className="animate-spin" size={36} color={COLOR_PRIMARY} style={{ margin: '0 auto 12px' }} />
      <p style={{ color: '#64748b', fontSize: '13px' }}>Memuat data Selling Dashboard...</p>
    </div>
  );

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
          onMouseOver={e => e.currentTarget.style.color = COLOR_PRIMARY}
          onMouseOut={e => e.currentTarget.style.color = '#4b5563'}
        >
          <Info size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      
      <InfoModal 
        show={infoData.show} 
        title={infoData.title} 
        text={infoData.text} 
        onClose={() => setInfoData({ ...infoData, show: false })} 
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Selling Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '20px' }}>
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff' }}>
        <ChartHeader 
          title="Sales Order Trends" 
          subtitle="Last synced just now" 
          infoText="Grafik ini menampilkan tren fluktuasi total pendapatan (Revenue) bulanan dari seluruh Sales Order yang berhasil disahkan (Submitted) dalam kurun waktu satu tahun." 
        />
        
        {stats.monthlyRevenue.some(m => m.revenue > 0) ? (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={stats.monthlyRevenue} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TREND_COLOR_BLUE} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={TREND_COLOR_BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" interval={0} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis width={60} tickFormatter={(v) => formatShortAxis(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FrappeChartTooltip isCurrency={true} />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="revenue" name="Total Sales Revenue" stroke={TREND_COLOR_BLUE} strokeWidth={2.5} fill="url(#gradRev)" activeDot={{ r: 5, fill: TREND_COLOR_BLUE }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px', background: '#f8fafc', borderRadius: '8px', flexDirection: 'column', gap: '8px' }}>
            <AlertCircle size={32} color="#d1d5db" />
            <p>Belum ada data pendapatan (Belum ada pesanan disahkan)</p>
          </div>
        )}
      </div>

      <div className="metrics-grid-3">
        <MetricCard 
          title="Sales Orders" 
          value={formatCompact(stats.totalSalesOrders)} 
          color="#3b82f6" 
          icon={<ShoppingCart size={24} />} 
          infoText={`Total aktual: ${formatNumber(stats.totalSalesOrders)} pesanan.\nMenampilkan total kuantitas dokumen pesanan penjualan yang sudah disahkan/aktif di sistem.`} 
        />
        <MetricCard 
          title="Total Sales Amount" 
          value={formatCompact(stats.totalSalesAmount, true)} 
          color="#10b981" 
          icon={<DollarSign size={24} />} 
          infoText={`Total aktual: ${formatUang(stats.totalSalesAmount)}.\nTotal akumulasi uang dari seluruh pesanan penjualan yang sah.`} 
        />
        <MetricCard 
          title="Average Order Value" 
          value={formatCompact(stats.averageOrderValue, true)} 
          color="#f59e0b" 
          icon={<Calculator size={24} />} 
          infoText={`Rata-rata aktual: ${formatUang(stats.averageOrderValue)}.\nNilai rata-rata dari setiap transaksi pesanan yang sah.`} 
        />
      </div>

      <style>{`
        /* ── CSS KHUSUS CARD KPI ── */
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
          .metrics-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}