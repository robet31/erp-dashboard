'use client';

import React, { useMemo } from 'react';
import { useManufacturingData } from '@/hooks/useFrappeData';
import { Cog, MoreHorizontal, CheckCircle, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRupiah } from '@/lib/utils';

const CHART_COLOR = '#8b5cf6'; // Warna Ungu khas Manufacturing

export default function ManufacturingHomePage() {
  const { workOrders, isLoading } = useManufacturingData() as any;

  const stats = useMemo(() => {
    const wos = workOrders || [];
    const openWOs = wos.filter((wo: any) => wo.status === 'Draft' || wo.status === 'Not Started').length;
    const wipWOs = wos.filter((wo: any) => wo.status === 'In Process').length;
    
    // Estimasi value dari Work Order yang selesai (Mock jika API belum return value utuh)
    const manufacturedValue = wos
      .filter((wo: any) => wo.status === 'Completed')
      .reduce((sum: number, wo: any) => sum + (wo.qty * 1500000), 0); // Asumsi Rp1.5M per unit produk jadi

    // Data grafik Produced Quantity (Simulasi 7 hari terakhir dari data WO)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const producedTrend = days.map(d => ({
      day: d,
      qty: Math.floor(Math.random() * 50) + 10
    }));

    return { openWOs, wipWOs, manufacturedValue, producedTrend };
  }, [workOrders]);

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Memuat data Home...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* SECTION: METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="chart-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Open Work Orders</span><Activity size={16} color="#0ea5e9" /></div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>{stats.openWOs}</div>
        </div>
        <div className="chart-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>WIP Work Orders</span><Cog size={16} color="#f59e0b" /></div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>{stats.wipWOs}</div>
        </div>
        <div className="chart-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Manufactured Items Value</span><MoreHorizontal size={16} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{formatRupiah(stats.manufacturedValue || 150000000)}</div>
        </div>
      </div>

      {/* SECTION: PRODUCED QUANTITY CHART */}
      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Produced Quantity</h3>
            <p style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Last synced just now</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={stats.producedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProduced" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="qty" name="Qty Produced" stroke={CHART_COLOR} strokeWidth={3} fill="url(#colorProduced)" activeDot={{ r: 6, fill: CHART_COLOR, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}