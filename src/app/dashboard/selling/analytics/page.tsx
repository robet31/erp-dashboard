'use client';

import React, { useMemo } from 'react';
import { useSellingData, useDashboardData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { formatRupiah } from '@/lib/utils';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6B7280', '#ef4444'];
const ITEM_COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981'];

export default function SellingAnalyticsPage() {
  const { salesOrders, customers, isLoading } = useSellingData();
  const { revenueTrend } = useDashboardData();

  const dynamicRevenueTrend = useMemo(() => {
    const targetPatterns = [500000000, 450000000, 600000000, 550000000, 750000000, 800000000];
    return revenueTrend.map((item, index) => ({
      ...item,
      target: targetPatterns[index % targetPatterns.length]
    }));
  }, [revenueTrend]);

  const stats = useMemo(() => {
    const totalSalesAmount = salesOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const soToDeliver = salesOrders.filter(o => o.status === 'To Deliver and Bill' || o.status === 'To Deliver').length;
    const soToBill = salesOrders.filter(o => o.status === 'To Bill').length;
    const activeCustomers = customers.filter(c => !c.disabled).length;

    const customerSales: Record<string, number> = {};
    salesOrders.forEach(so => {
      if(so.customer_name && so.grand_total) {
        customerSales[so.customer_name] = (customerSales[so.customer_name] || 0) + so.grand_total;
      }
    });
    
    const topCustomers = Object.entries(customerSales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Dummy data untuk Item-wise Annual Sales (Kareana detail item butuh fetch terpisah per SO)
    const itemWiseSales = [
      { name: 'FG-NB-PRO15', value: totalSalesAmount * 0.6 },
      { name: 'FG-NB-LITE13', value: totalSalesAmount * 0.4 },
    ];

    return { totalSalesAmount, soToDeliver, soToBill, activeCustomers, topCustomers, itemWiseSales };
  }, [salesOrders, customers]);

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Memuat analitik dashboard...</div>;

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
      
      {/* ROW 1: Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Annual Sales</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{formatRupiah(stats.totalSalesAmount)}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Sales Orders to Deliver</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{stats.soToDeliver}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Sales Orders to Bill</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{stats.soToBill}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Active Customers</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{stats.activeCustomers}</div>
        </div>
      </div>

      {/* ROW 2: Sales Order Trends */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <CardHeader title="Sales Order Trends" />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dynamicRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSalesDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0066B3" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0066B3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1000000)}Jt`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" name="Total Sales" fill="url(#colorSalesDash)" stroke="#0066B3" strokeWidth={3} dot={{ r: 4, fill: '#0066B3' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 3: Top Customers & SO Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        
        {/* Top Customers Chart */}
        <div className="chart-container">
          <CardHeader title="Top Customers" />
          {stats.topCustomers.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.topCustomers} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000000)}Jt`} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => formatRupiah(value)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" name="Total Beli" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' }}>Loading...</div>
          )}
        </div>

        {/* Sales Order Analysis Pie Chart */}
        <div className="chart-container">
          <CardHeader title="Sales Order Analysis" />
          {salesOrders.length > 0 ? (
            <div style={{ display: 'flex', height: '200px', alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: 'Selesai', value: salesOrders.filter(o => o.status === 'Completed').length },
                    { name: 'Proses', value: salesOrders.filter(o => o.status === 'In Process').length },
                    { name: 'Siap Kirim', value: salesOrders.filter(o => o.status === 'To Deliver and Bill').length },
                    { name: 'Draft', value: salesOrders.filter(o => o.status === 'Draft').length },
                    { name: 'Batal', value: salesOrders.filter(o => o.status === 'Cancelled').length }
                  ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                    {DONUT_COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
                {['Completed', 'To Deliver and Bill', 'Draft'].map((status, i) => {
                  const count = salesOrders.filter(o => o.status === status).length;
                  return (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[i] }} />
                        <span style={{ color: '#4B5563', fontWeight: 500 }}>{status === 'To Deliver and Bill' ? 'Siap Kirim' : status}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' }}>No Data</div>
          )}
        </div>
      </div>

      {/* ROW 4: Item-wise Annual Sales */}
      <div className="chart-container">
        <CardHeader title="Item-wise Annual Sales" />
        {stats.totalSalesAmount > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.itemWiseSales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000000)}Jt`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => formatRupiah(value)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="value" name="Sales Revenue" radius={[4, 4, 0, 0]} barSize={40}>
                {stats.itemWiseSales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ITEM_COLORS[index % ITEM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' }}>Loading...</div>
        )}
      </div>

    </div>
  );
}