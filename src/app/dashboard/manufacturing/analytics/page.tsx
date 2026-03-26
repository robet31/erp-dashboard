'use client';

import React, { useMemo } from 'react';
import { useManufacturingData } from '@/hooks/useFrappeData';
import { Clock, Filter, Loader2, Factory, CheckCircle, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';
const COLORS = [COLOR_PRIMARY, COLOR_SECONDARY, '#f59e0b', '#9ca3af', '#ef4444'];
const FIXED_COMPANY = 'Netra Vidya';

export default function ManufacturingAnalyticsPage() {
  const { workOrders, isLoading } = useManufacturingData() as any;

  // KALKULASI 100% DATA REAL DARI ERPNEXT
  const data = useMemo(() => {
    // Filter khusus Netra Vidya
    const wos = (workOrders || []).filter((wo: any) => 
      wo.company === FIXED_COMPANY || 
      (wo.name && wo.name.includes('NV')) || 
      (wo.fg_warehouse && wo.fg_warehouse.includes('NV'))
    );

    // 1. Metrics Card Asli
    const totalWO = wos.length;
    const completedWO = wos.filter((wo: any) => wo.status === 'Completed').length;
    const ongoingWO = wos.filter((wo: any) => wo.status === 'In Process').length; 

    // 2. Pie Chart: Work Order Status
    const statusCounts: Record<string, number> = {};
    wos.forEach((wo: any) => {
      const status = wo.status || 'Draft';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const woAnalysis = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    // 3. Bar Chart: Planned vs Actual by Item
    const itemMap: Record<string, { name: string, planned: number, actual: number }> = {};
    wos.forEach((wo: any) => {
      const item = wo.production_item || 'Unknown';
      if (!itemMap[item]) itemMap[item] = { name: item, planned: 0, actual: 0 };
      
      itemMap[item].planned += Number(wo.qty || 0);
      // Di Frappe, jika completed, produced_qty akan terisi. Kalau kosong, pakai patokan status
      const actualQty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      itemMap[item].actual += actualQty;
    });
    const producedByItem = Object.values(itemMap);

    // 4. Area Chart: Trend Work Order per Bulan
    const monthMap: Record<string, { name: string, total: number, completed: number }> = {};
    wos.forEach((wo: any) => {
      if (!wo.creation) return;
      const m = new Date(wo.creation).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      if (!monthMap[m]) monthMap[m] = { name: m, total: 0, completed: 0 };
      
      monthMap[m].total += 1;
      if (wo.status === 'Completed') monthMap[m].completed += 1;
    });
    // Urutkan berdasarkan waktu
    const woByMonth = Object.values(monthMap).sort((a, b) => {
      return new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime();
    });

    return { totalWO, completedWO, ongoingWO, woAnalysis, producedByItem, woByMonth };
  }, [workOrders]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat analitik manufaktur...</p></div>;

  const MetricCard = ({ title, value, color, icon }: any) => (
    <div className="chart-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: color }}>{value}</div>
      </div>
      <div style={{ width: '48px', height: '48px', background: `${color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        {icon}
      </div>
    </div>
  );

  const ChartHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="mobile-flex-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      <span style={{ fontSize: '11px', color: '#6B7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Data Real {FIXED_COMPANY}</span>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ROW 1: METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <MetricCard title="Total Work Orders" value={data.totalWO} color="#111827" icon={<Factory size={24} />} />
        <MetricCard title="Completed Work Orders" value={data.completedWO} color={COLOR_PRIMARY} icon={<CheckCircle size={24} />} />
        <MetricCard title="WIP / In Process" value={data.ongoingWO} color="#f59e0b" icon={<Activity size={24} />} />
      </div>

      {/* ROW 2: PIE & AREA CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        
        {/* PIE CHART: Status Produksi */}
        <div className="chart-container">
          <ChartHeader title="Work Order Status Analysis" subtitle="Distribusi status seluruh perintah kerja" />
          {data.woAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.woAnalysis} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.woAnalysis.map((entry, i) => {
                     // Custom color based on status
                     let cellColor = '#9ca3af';
                     if (entry.name === 'Completed') cellColor = COLOR_PRIMARY;
                     if (entry.name === 'In Process') cellColor = '#f59e0b';
                     if (entry.name === 'Draft') cellColor = '#6B7280';
                     return <Cell key={i} fill={cellColor} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{fontFamily: 'Poppins', borderRadius: '8px', fontSize: '12px'}}/>
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'Poppins', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>Belum ada data Work Order</div>
          )}
        </div>

        {/* AREA CHART: Trend WO by Month */}
        <div className="chart-container">
          <ChartHeader title="Production Volume Trend" subtitle="Jumlah perintah kerja per bulan" />
          {data.woByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.woByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_SECONDARY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLOR_SECONDARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{fontFamily: 'Poppins', borderRadius: '8px', fontSize: '12px'}}/>
                <Area type="monotone" dataKey="total" name="Total WO" stroke={COLOR_SECONDARY} strokeWidth={3} fill="url(#colorTrend)" activeDot={{ r: 6, fill: COLOR_SECONDARY }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>Belum ada histori produksi per bulan</div>
          )}
        </div>

      </div>

      {/* ROW 3: PLANNED VS ACTUAL BAR CHART */}
      <div className="chart-container">
        <ChartHeader title="Planned vs Actual Production (By Item)" subtitle="Perbandingan target kuantitas dengan hasil aktual" />
        {data.producedByItem.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.producedByItem} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{fontFamily: 'Poppins', borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontFamily: 'Poppins', paddingBottom: '10px' }} />
              <Bar dataKey="planned" name="Target (Planned)" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="actual" name="Telah Diproduksi (Actual)" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>Belum ada data target perakitan item</div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mobile-flex-col { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .mobile-full-width { width: 100% !important; max-width: none !important; justify-content: center !important; }
          .chart-container { padding: 16px !important; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}