'use client';

import React, { useMemo } from 'react';
import { useSellingData, useDashboardData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatRupiah } from '@/lib/utils';

export default function SellingHomePage() {
  const { salesOrders, isLoading } = useSellingData();
  const { revenueTrend } = useDashboardData();

  // Kustomisasi Tren Revenue
  const dynamicRevenueTrend = useMemo(() => {
    const targetPatterns = [500000000, 450000000, 600000000, 550000000, 750000000, 800000000];
    return revenueTrend.map((item, index) => ({
      ...item,
      target: targetPatterns[index % targetPatterns.length]
    }));
  }, [revenueTrend]);

  // Kalkulasi Matrix Utama
  const stats = useMemo(() => {
    const totalSalesAmount = salesOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const avgOrderValue = salesOrders.length > 0 ? totalSalesAmount / salesOrders.length : 0;
    return { totalSalesAmount, avgOrderValue };
  }, [salesOrders]);

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Memuat data Home...</div>;

  const CardHeader = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#6B7280' }}><Filter size={14} /></button>
        <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#6B7280' }}><MoreHorizontal size={14} /></button>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ROW 1: Sales Order Trends */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <CardHeader title="Sales Order Trends" />
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dynamicRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSalesHome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0066B3" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0066B3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1000000)}Jt`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" name="Total Sales" fill="url(#colorSalesHome)" stroke="#0066B3" strokeWidth={3} dot={{ r: 4, fill: '#0066B3' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 2: Bottom Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Sales Orders</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{salesOrders.length}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Sales Amount</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{formatRupiah(stats.totalSalesAmount)}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Average Order Value</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{formatRupiah(stats.avgOrderValue)}</div>
        </div>
      </div>

    </div>
  );
}