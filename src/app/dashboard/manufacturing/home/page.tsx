'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import { Cog, MoreHorizontal, CheckCircle, Activity, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const FIXED_COMPANY = 'Netra Vidya';

const formatUang = (value: number | string | undefined) => {
  if (!value) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value));
};

export default function ManufacturingHomePage() {
  const { workOrders, isLoading: isMfgLoading } = useManufacturingData() as any;
  const { items, isLoading: isStockLoading } = useStockData();

  // STATE UNTUK MEMBACA PROGRESS GOD MODE LOKAL
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_wo_status');
    if (savedStatus) {
      try { setLocalWOStatus(JSON.parse(savedStatus)); } catch (e) {}
    }
  }, []);

  const stats = useMemo(() => {
    // 0. Terapkan override status dari lokal ke data ERPNext
    const overriddenWOs = (workOrders || []).map((wo: any) => {
      const currentStatus = localWOStatus[wo.name] || wo.status;
      return {
        ...wo,
        status: currentStatus,
        produced_qty: currentStatus === 'Completed' ? (Number(wo.produced_qty) || Number(wo.qty)) : Number(wo.produced_qty)
      };
    });

    // 1. Filter khusus Netra Vidya
    const wos = overriddenWOs.filter((wo: any) => 
      wo.company === FIXED_COMPANY || 
      (wo.name && wo.name.includes('NV')) || 
      (wo.fg_warehouse && wo.fg_warehouse.includes('NV'))
    );

    // 2. Hitung Status WO
    const openWOs = wos.filter((wo: any) => wo.status === 'Draft' || wo.status === 'Not Started').length;
    const wipWOs = wos.filter((wo: any) => wo.status === 'In Process').length;
    
    // 3. Hitung REAL Manufactured Value (Qty Selesai * Harga Standar Item)
    let manufacturedValue = 0;
    wos.forEach((wo: any) => {
      // Ambil qty yang sudah diproduksi (atau qty total jika statusnya Completed)
      const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      
      if (qty > 0) {
        // Cari harga standar dari master item
        const itemDetail = items.find((i: any) => i.item_code === wo.production_item);
        const rate = itemDetail?.standard_rate || 0; 
        manufacturedValue += (qty * rate);
      }
    });

    // 4. Trend Produksi Nyata per Bulan
    const trendMap: Record<string, number> = {};
    wos.forEach((wo: any) => {
      if (!wo.creation) return;
      const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      
      if (qty > 0) {
        const month = new Date(wo.creation).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        trendMap[month] = (trendMap[month] || 0) + qty;
      }
    });

    const producedTrend = Object.entries(trendMap)
      .map(([day, qty]) => ({ day, qty }))
      .sort((a, b) => new Date(`1 ${a.day}`).getTime() - new Date(`1 ${b.day}`).getTime());

    return { openWOs, wipWOs, manufacturedValue, producedTrend };
  }, [workOrders, items, localWOStatus]);

  if (isMfgLoading || isStockLoading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat data produksi dari ERPNext...</p></div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* SECTION: METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="chart-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Open Work Orders</span><Activity size={16} color={COLOR_PRIMARY} /></div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>{stats.openWOs}</div>
        </div>
        <div className="chart-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>WIP Work Orders</span><Cog size={16} color="#f59e0b" /></div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>{stats.wipWOs}</div>
        </div>
        <div className="chart-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Manufactured Items Value</span><MoreHorizontal size={16} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{formatUang(stats.manufacturedValue)}</div>
        </div>
      </div>

      {/* SECTION: PRODUCED QUANTITY CHART */}
      <div className="chart-container">
        <div className="mobile-flex-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Produced Quantity Trend</h3>
            <p style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Data Aktual ERPNext</p>
          </div>
        </div>
        
        {stats.producedTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats.producedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProduced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Poppins' }} />
              <Area type="monotone" dataKey="qty" name="Qty Produced" stroke={COLOR_PRIMARY} strokeWidth={3} fill="url(#colorProduced)" activeDot={{ r: 6, fill: COLOR_PRIMARY, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px', background: '#f8fafc', borderRadius: '8px' }}>
            Belum ada barang yang selesai diproduksi.
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mobile-flex-col { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .chart-container { padding: 16px !important; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}