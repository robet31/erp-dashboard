'use client';

import React, { useMemo } from 'react';
import { useStockData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatRupiah } from '@/lib/utils';
import { getWarehousesByCompany } from '@/config/frappe-data';

const CHART_COLOR = '#f472b6'; // Warna Pink khas ERPNext Stock

export default function StockHomePage() {
  const { items, isLoading } = useStockData();
  const warehouses = getWarehousesByCompany('Netra Vidya');

  // Kalkulasi Matrix Utama
  const stats = useMemo(() => {
    const totalActiveItems = items.filter((i: any) => !i.disabled).length;
    const totalWarehouses = warehouses.length;
    
    // Asumsi Stock Value = Standard Rate * (Random Qty 10-50 untuk visualisasi jika Bin kosong)
    // Di real-case, ini harus fetch dari doctype 'Bin'
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
          <BarChart data={stats.stockByGroup} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1000000)} M`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => formatRupiah(value)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="value" name="Total Value" fill={CHART_COLOR} barSize={120} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 2: Bottom Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Stock Value</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{formatRupiah(stats.totalStockValue)}</div>
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