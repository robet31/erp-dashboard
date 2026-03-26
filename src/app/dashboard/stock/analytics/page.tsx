'use client';

import React, { useMemo } from 'react';
import { useStockData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal, Calendar as CalIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { formatRupiah, formatDate } from '@/lib/utils';
import { getWarehousesByCompany } from '@/config/frappe-data';

const CHART_COLOR = '#f472b6'; // Pink Stock
const TREND_COLOR_1 = '#8b5cf6'; // Purple
const TREND_COLOR_2 = '#0ea5e9'; // Blue

export default function StockAnalyticsPage() {
  const { items, isLoading } = useStockData();
  const warehouses = getWarehousesByCompany('Netra Vidya');

  const stats = useMemo(() => {
    const totalActiveItems = items.filter((i: any) => !i.disabled).length;
    const totalWarehouses = warehouses.length;
    const totalStockValue = items.reduce((sum: number, item: any) => sum + ((item.standard_rate || 1500000) * 15), 0);

    // 1. Warehouse wise Stock Value (Simulasi distribusi value ke gudang-gudang)
    const whStockValue = warehouses.slice(0, 4).map((w, i) => ({
      name: w.name.split(' - ')[0],
      value: (totalStockValue / 4) * (1 + (Math.random() * 0.2 - 0.1)) // Randomize sedikit
    }));

    // 2. Purchase Receipt Trends (Simulasi Data 6 Bulan Terakhir)
    const months = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];
    const receiptTrends = months.map(m => ({ month: m, value: Math.floor(Math.random() * 5) }));

    // 3. Delivery Trends
    const deliveryTrends = months.map(m => ({ month: m, value: Math.floor(Math.random() * 4) }));

    // 4. Oldest Items (Ambil dari data asli items)
    const oldestItems = [...items].sort((a: any, b: any) => new Date(a.creation).getTime() - new Date(b.creation).getTime()).slice(0, 5);

    // 5. Item Shortage Summary (Simulasi nilai negatif)
    const shortageItems = items.slice(0, 2).map((item: any) => ({
      name: item.item_code,
      value: -1 * Math.floor(Math.random() * 3 + 1) // Nilai minus antara -1 sd -3
    }));

    return { totalActiveItems, totalWarehouses, totalStockValue, whStockValue, receiptTrends, deliveryTrends, oldestItems, shortageItems };
  }, [items, warehouses]);

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Memuat analitik dashboard...</div>;

  const CardHeader = ({ title, subtitle, controls }: { title: string, subtitle?: string, controls?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {controls && (
          <>
            <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#374151', fontSize: '11px' }}><Filter size={12} /> Last Year</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#374151', fontSize: '11px' }}><CalIcon size={12} /> Monthly</button>
          </>
        )}
        <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#6B7280' }}><MoreHorizontal size={14} /></button>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ROW 1: Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Active Items</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{stats.totalActiveItems}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Warehouses</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{stats.totalWarehouses}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Stock Value</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{formatRupiah(stats.totalStockValue)}</div>
        </div>
      </div>

      {/* ROW 2: Warehouse wise Stock Value */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <CardHeader title="Warehouse wise Stock Value" subtitle="Last synced just now" />
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.whStockValue} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1000000)} M`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => formatRupiah(value)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="value" name="Total Value" fill={CHART_COLOR} barSize={60} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 3: Purchase Receipt & Delivery Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container">
          <CardHeader title="Purchase Receipt Trends" subtitle="Last synced just now" controls />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.receiptTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceipt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TREND_COLOR_1} stopOpacity={0.2} /><stop offset="95%" stopColor={TREND_COLOR_1} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Area type="step" dataKey="value" name="Receipts" fill="url(#colorReceipt)" stroke={TREND_COLOR_1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <CardHeader title="Delivery Trends" subtitle="Last synced just now" controls />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.deliveryTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TREND_COLOR_2} stopOpacity={0.2} /><stop offset="95%" stopColor={TREND_COLOR_2} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Area type="step" dataKey="value" name="Deliveries" fill="url(#colorDelivery)" stroke={TREND_COLOR_2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 4: Oldest Items & Item Shortage Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        
        {/* Oldest Items List */}
        <div className="chart-container">
          <CardHeader title="Oldest Items" />
          {stats.oldestItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.oldestItems.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fb', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{item.item_code}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>Created: {formatDate(item.creation)}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: CHART_COLOR }}>{item.item_group}</div>
                </div>
              ))}
            </div>
          ) : (
             <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' }}>No Data</div>
          )}
        </div>

        {/* Item Shortage Summary */}
        <div className="chart-container">
          <CardHeader title="Item Shortage Summary" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.shortageItems} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              {/* Note: Nilai negatif otomatis akan bar-nya terbalik ke bawah */}
              <Bar dataKey="value" name="Shortage Qty" fill={CHART_COLOR} barSize={80} radius={[0, 0, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
      </div>
    </div>
  );
}