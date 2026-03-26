'use client';

import React, { useMemo } from 'react';
import { useSellingData, useDashboardData } from '@/hooks/useFrappeData';
import { ShoppingCart, DollarSign, Users, TrendingUp, MoreHorizontal, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';

const formatUang = (value: number | string | undefined | any) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

// Fungsi khusus agar angka di sumbu Y (YAxis) lebih ringkas dan muat di layar
const formatUangSingkat = (value: number | string | undefined | any) => {
  if (!value) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  
  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(1)} M`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(0)} Jt`;
  }
  return formatUang(num);
};

export default function SellingHomePage() {
  const { salesOrders, customers, isLoading } = useSellingData();
  const { revenueTrend } = useDashboardData();

  const stats = useMemo(() => {
    const rawSales = salesOrders as any[];
    const totalSalesOrders = rawSales.length;
    const totalSalesAmount = rawSales.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const activeCustomers = customers.filter(c => !c.disabled).length;
    
    const soToDeliver = rawSales.filter(o => o.docstatus === 1 && o.per_delivered < 100 && o.status !== 'Completed').length;
    const soToBill = rawSales.filter(o => o.docstatus === 1 && (o.per_billed || 0) < 100 && o.status !== 'Completed').length;

    return { totalSalesOrders, totalSalesAmount, activeCustomers, soToDeliver, soToBill };
  }, [salesOrders, customers]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat data Selling...</p></div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="chart-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>Total Sales Amount</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(stats.totalSalesAmount)}</div>
          </div>
          <div style={{ width: '48px', height: '48px', background: `${COLOR_PRIMARY}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR_PRIMARY }}><DollarSign size={24} /></div>
        </div>

        <div className="chart-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>Total Sales Orders</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{stats.totalSalesOrders}</div>
          </div>
          <div style={{ width: '48px', height: '48px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}><ShoppingCart size={24} /></div>
        </div>

        <div className="chart-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>Active Customers</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{stats.activeCustomers}</div>
          </div>
          <div style={{ width: '48px', height: '48px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}><Users size={24} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="chart-container" style={{ padding: '16px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>SO to Deliver</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>{stats.soToDeliver}</p>
        </div>
        <div className="chart-container" style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fde68a' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>SO to Bill</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: '#78350f', marginTop: '4px' }}>{stats.soToBill}</p>
        </div>
      </div>

      <div className="chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Revenue Trend</h3>
          <TrendingUp size={18} color="#9CA3AF" />
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
            {/* FIX: Set width to 80 so large numbers fit, and use short formatter */}
            <YAxis width={80} tickFormatter={(v: any) => formatUangSingkat(v)} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: any) => formatUang(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Poppins' }} />
            <Area type="monotone" dataKey="revenue" name="Total Sales" stroke={COLOR_PRIMARY} strokeWidth={3} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: COLOR_PRIMARY }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}