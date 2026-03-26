'use client';

import React, { useMemo } from 'react';
import { useStockData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getWarehousesByCompany } from '@/config/frappe-data';

const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';

// Formatter Uang Realistis (Tanpa M)
const formatUang = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

export default function StockHomePage() {
  const { items, isLoading } = useStockData();
  const warehouses = getWarehousesByCompany('Netra Vidya');

  // Kalkulasi Matrix Utama
  const stats = useMemo(() => {
    const totalActiveItems = items.filter((i: any) => !i.disabled).length;
    const totalWarehouses = warehouses.length;
    
    // Asumsi Stock Value = Standard Rate * 15 (simulasi)
    const totalStockValue = items.reduce((sum: number, item: any) => sum + ((item.standard_rate || 1500000) * 15), 0);

    // Grouping item by Item Group
    const groupData: Record<string, number> = {};
    items.forEach((item: any) => {
      const group = item.item_group || 'Products';
      const val = (item.standard_rate || 1500000) * 15;
      groupData[group] = (groupData[group] || 0) + val;
    });

    const stockByGroup = Object.entries(groupData).map(([name, value]) => ({ name, value }));

    return { totalActiveItems, totalWarehouses, totalStockValue, stockByGroup };
  }, [items, warehouses]);

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Memuat data Home...</div>;

  const CardHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#6B7280' }}><Filter size={14} /></button>
        <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#6B7280' }}><MoreHorizontal size={14} /></button>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ROW 1: Stock Value by Item Group */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <CardHeader title="Stock Value by Item Group" subtitle="Last synced just now" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.stockByGroup} margin={{ top: 20, right: 30, left: 30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => formatUang(v).replace(/,\d{2}/, '')} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={120} />
            <Tooltip formatter={(value: number) => formatUang(value)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
            <Bar dataKey="value" name="Total Value" fill={COLOR_PRIMARY} barSize={120} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 2: Bottom Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Stock Value</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(stats.totalStockValue)}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Warehouses</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{stats.totalWarehouses}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Active Items</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{stats.totalActiveItems}</div>
        </div>
      </div>

    </div>
  );
}