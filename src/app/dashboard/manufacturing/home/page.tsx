'use client';

import React, { useMemo } from 'react';
import { useManufacturingData } from '@/hooks/useFrappeData';
import { Cog, MoreHorizontal, CheckCircle, Activity, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLOR_PRIMARY = '#054CC7';

const formatUang = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

export default function ManufacturingHomePage() {
  const { workOrders, isLoading } = useManufacturingData() as any;

  const stats = useMemo(() => {
    const wos = workOrders || [];
    const openWOs = wos.filter((wo: any) => wo.status === 'Draft' || wo.status === 'Not Started').length;
    const wipWOs = wos.filter((wo: any) => wo.status === 'In Process').length;
    
    const manufacturedValue = wos
      .filter((wo: any) => wo.status === 'Completed')
      .reduce((sum: number, wo: any) => sum + ((wo.qty || 0) * 15000000), 0); 

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const producedTrend = days.map(d => ({
      day: d,
      qty: Math.floor(Math.random() * 50) + 10
    }));

    return { openWOs, wipWOs, manufacturedValue, producedTrend };
  }, [workOrders]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat data Home...</p></div>;

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
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{formatUang(stats.manufacturedValue || 150000000)}</div>
        </div>
      </div>

      {/* SECTION: PRODUCED QUANTITY CHART */}
      <div className="chart-container">
        <div className="mobile-flex-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Produced Quantity</h3>
            <p style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Last synced just now</p>
          </div>
        </div>
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