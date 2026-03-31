'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useStockData } from '@/hooks/useFrappeData';
import { useAuth } from '@/providers/auth-provider';
import { Loader2, Info, X, CheckCircle2, Package, Warehouse, DollarSign, Target } from 'lucide-react';
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
  const { user } = useAuth();
  const { items, bins, warehouses, isLoading } = useStockData();
  const [infoData, setInfoData] = useState<{show: boolean, title: string, text: string}>({ show: false, title: '', text: '' });

  const stats = useMemo(() => {
    const totalActiveItems = (items || []).filter((i: any) => !i.disabled).length;
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

    // Mengambil 10 Data Teratas
    const stockByGroup = Object.entries(groupData)
      .map(([name, value]) => ({ name, value }))
      .filter(g => g.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); 

    return { totalActiveItems, totalWarehouses, totalStockValue, stockByGroup };
  }, [items, bins, warehouses]);

  if (isLoading) return <div className="tw-root" style={{ textAlign: 'center', padding: '80px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat data Dashboard...</p></div>;

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
        <button 
          onClick={() => setInfoData({ show: true, title, text: infoText })} 
          style={{ background: '#f8fafc', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} 
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
    <div className="tw-root" style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      
      <InfoModal show={infoData.show} title={infoData.title} text={infoData.text} onClose={() => setInfoData({ ...infoData, show: false })} />

      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>Stock Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Ringkasan posisi stok dan persediaan Anda hari ini.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      {/* ROW 1: WELCOME CARD */}
      <div className="frappe-welcome-card" style={{ marginBottom: '24px' }}>
          <div className="welcome-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Target size={16} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manajemen Gudang</span>
            </div>
            <h1 className="welcome-title">Halo, Tim Gudang!</h1>
            <p className="welcome-subtitle">
              Hari ini Anda memantau {stats.totalActiveItems} jenis produk yang tersebar. 
              Terus awasi mutasi barang masuk dan keluar untuk memastikan tidak ada stok fisik yang minus.
            </p>
            <div style={{ marginTop: '20px' }}>
              <Link href="/dashboard/stock?tab=stockentry" style={{ textDecoration: 'none' }}>
                <button className="btn-welcome-yellow">
                  Buat Mutasi Baru
                </button>
              </Link>
            </div>
          </div>
          
          <div className="welcome-ill-wrapper">
              <div className="welcome-ill-box">
                <img src="/images/ill-stock.png" alt="Stock Illustration" />
              </div>
          </div>
      </div>

      {/* ROW 2: KPI METRICS DI ATAS CHART */}
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

      {/* ROW 3: CHART */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <ChartHeader 
          title="Stock Value by Item Group (Top 10)" 
          subtitle="Last synced just now" 
          infoText="Grafik ini menampilkan 10 kategori barang (Item Group) teratas berdasarkan total nilai valuasi uang (dalam Rupiah)." 
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

        /* ── CSS KHUSUS CARD WELCOME ── */
        .frappe-welcome-card {
            background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
            border-radius: 16px;
            padding: 32px 40px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 30px rgba(5, 76, 199, 0.2);
            min-height: 160px;
        }

        .welcome-content {
            position: relative;
            z-index: 2;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .welcome-title {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 8px 0;
            letter-spacing: -0.02em;
        }

        .welcome-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            line-height: 1.5;
            max-width: 85%;
        }

        .btn-welcome-yellow {
            background: #FFB800;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(255, 184, 0, 0.3);
        }
        
        .btn-welcome-yellow:hover {
            transform: translateY(-2px);
            background: #F5A623;
        }

        .welcome-ill-wrapper {
            flex-shrink: 0;
            margin-left: 20px;
            z-index: 2;
        }

        /* Kotak Background Ilustrasi */
        .welcome-ill-box {
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        /* PERBAIKAN PRESISI GAMBAR (Center Alignment) */
        .welcome-ill-box img {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120%; /* Sedikit lebih besar dari kotak, namun proporsional */
            height: auto;
            max-height: 140%;
            object-fit: contain;
        }

        /* ── CSS KHUSUS CARD KOTAK ── */
        .chart-container { background: white; border-radius: 16px; padding: 24px; width: 100%; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); border: none; margin-bottom: 20px; }
        .no-data-placeholder { height: 260px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; background: #f8fafc; border-radius: 12px; font-weight: 500; flex-direction: column; }
        
        /* ── CSS KHUSUS CARD KPI ALA FRAPPE (WARNA GRADASI) ── */
        .metric-card {
          background: white; border-radius: 16px; border: none; padding: 24px;
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
        
        @media (max-width: 1024px) {
          .metrics-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 640px) {
          .metrics-grid-3 { grid-template-columns: 1fr; }
          .chart-container { padding: 16px !important; border-radius: 12px; }
          
          /* Penyesuaian Welcome Card untuk Mobile */
          .frappe-welcome-card { 
            flex-direction: column; 
            align-items: flex-start; 
            padding: 24px; 
            gap: 20px; 
            height: auto;
          }
          .welcome-subtitle { max-width: 100%; }
          .welcome-ill-wrapper { 
            width: 100%; 
            display: flex; 
            justify-content: flex-end; 
            margin-left: 0; 
            margin-top: 10px; 
          }
          .welcome-ill-box { width: 120px; height: 120px; }
          
          /* Penyesuaian Presisi Gambar Mobile */
          .welcome-ill-box img {
             width: 110%;
             max-height: 120%;
          }
        }
      `}</style>
    </div>
  );
}