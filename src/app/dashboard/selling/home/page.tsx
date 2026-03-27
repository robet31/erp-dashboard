'use client';

import React, { useMemo } from 'react';
import { useSellingData, useDashboardData } from '@/hooks/useFrappeData';
import { useAuth } from '@/providers/auth-provider';
import { ShoppingCart, DollarSign, Users, TrendingUp, Loader2, Package, FileText } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';

const ROLE_TITLES: Record<string, string> = {
  admin_sales: 'Staff Selling',
  admin_gudang: 'Staff Gudang',
  manajer_produksi: 'Manager Produksi',
  administrator: 'Administrator',
};

const formatUang = (value: number | string | undefined | any) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

const formatUangSingkat = (value: number | string | undefined | any) => {
  if (!value) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  
  if (num >= 1000000000) {
    return `Rp${(num / 1000000000).toFixed(1)}M`;
  }
  if (num >= 1000000) {
    return `Rp${(num / 1000000).toFixed(0)}Jt`;
  }
  if (num >= 1000) {
    return `Rp${(num / 1000).toFixed(0)}Rb`;
  }
  return formatUang(num);
};

const STATS_CARDS = [
  { key: 'totalSalesAmount', label: 'Total Sales Amount', icon: DollarSign, color: COLOR_PRIMARY, bg: '#eff6ff', insight: 'Total revenue from all sales orders' },
  { key: 'totalSalesOrders', label: 'Total Sales Orders', icon: ShoppingCart, color: '#4B5563', bg: '#f3f4f6', insight: 'Jumlah pesanan penjualan yang masuk' },
  { key: 'activeCustomers', label: 'Active Customers', icon: Users, color: '#4B5563', bg: '#f3f4f6', insight: 'Jumlah pelanggan aktif yang terdaftar' },
  { key: 'soToDeliver', label: 'SO to Deliver', icon: Package, color: '#d97706', bg: '#fef3c7', insight: 'Pesanan yang perlu dikirim ke pelanggan' },
  { key: 'soToBill', label: 'SO to Bill', icon: FileText, color: '#059669', bg: '#ecfdf5', insight: 'Pesanan yang perlu ditagihkan ke pelanggan' },
];

export default function SellingHomePage() {
  const { user } = useAuth();
  const { salesOrders, customers, isLoading } = useSellingData();
  const { revenueTrend } = useDashboardData();
  const roleTitle = user ? ROLE_TITLES[user.role] || 'User' : 'User';

  const stats = useMemo(() => {
    const rawSales = salesOrders as any[];
    const totalSalesOrders = rawSales.length;
    const totalSalesAmount = rawSales.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const activeCustomers = customers.filter(c => !c.disabled).length;
    
    const soToDeliver = rawSales.filter(o => o.docstatus === 1 && o.per_delivered < 100 && o.status !== 'Completed').length;
    const soToBill = rawSales.filter(o => o.docstatus === 1 && (o.per_billed || 0) < 100 && o.status !== 'Completed').length;

    return { totalSalesOrders, totalSalesAmount, activeCustomers, soToDeliver, soToBill };
  }, [salesOrders, customers]);

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} />
      <p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat data Selling...</p>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title-text">Selling Home</h1>
        <p className="page-subtitle-text">Overview data penjualan untuk <span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>{roleTitle}</span></p>
      </div>

      {/* Stats Cards - Horizontal Layout */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {STATS_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof typeof stats];
          const displayValue = card.key.includes('Amount') ? formatUangSingkat(value) : value;
          
          return (
            <div key={card.key} style={{ 
              flex: '1 1 0', 
              minWidth: '180px',
              background: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
              border: '1px solid #f3f4f6',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
                  <div style={{ fontSize: card.key.includes('Amount') ? '20px' : '24px', fontWeight: 800, color: card.color, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayValue}</div>
                </div>
                <div style={{ width: '44px', height: '44px', background: card.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={card.color} />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                <TrendingUp size={12} />
                {card.insight}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Revenue Trend</h3>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Grafik penjualan per bulan</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#eff6ff', borderRadius: '20px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR_PRIMARY }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: COLOR_PRIMARY }}>Penjualan</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueTrend}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
            <YAxis width={70} tickFormatter={(v: any) => formatUangSingkat(v)} tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: any) => formatUang(value)} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Poppins' }} />
            <Area type="monotone" dataKey="revenue" name="Total Sales" stroke={COLOR_PRIMARY} strokeWidth={2.5} fill="url(#colorRevenue)" activeDot={{ r: 5, fill: COLOR_PRIMARY }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .page-header {
          margin-bottom: 24px;
        }
        .page-title-text {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 4px;
        }
        .page-subtitle-text {
          font-size: 14px;
          color: #6B7280;
        }
      `}</style>
    </div>
  );
}
