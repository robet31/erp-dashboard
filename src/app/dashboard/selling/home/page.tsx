'use client';

import React, { useMemo } from 'react';
import { useSellingData, useDashboardData } from '@/hooks/useFrappeData';
import { useAuth } from '@/providers/auth-provider';
import {
  ShoppingCart, DollarSign, Users, TrendingUp,
  Package, FileText, ArrowUpRight, AlertCircle,
  CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, defs, linearGradient, stop
} from 'recharts';

const COLOR_PRIMARY = '#3b82f6';
const COLOR_ACCENT = '#06b6d4';

const ROLE_TITLES: Record<string, string> = {
  admin_sales: 'Staff Selling',
  admin_gudang: 'Staff Gudang',
  manajer_produksi: 'Manager Produksi',
  administrator: 'Administrator',
};

const formatUang = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

const formatUangSingkat = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return 'Rp 0';
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}Jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}Rb`;
  return formatUang(n);
};

export default function SellingHomePage() {
  const { user } = useAuth();
  const { salesOrders, customers, isLoading } = useSellingData();
  const { revenueTrend } = useDashboardData();
  const roleTitle = user ? ROLE_TITLES[user.role] || 'User' : 'User';

  const stats = useMemo(() => {
    const rawSales = salesOrders as any[];
    const totalSalesOrders = rawSales.length;
    const totalSalesAmount = rawSales.reduce((sum, o) => sum + (o.grand_total || 0), 0);
    const activeCustomers = customers.filter((c: any) => !c.disabled).length;
    const soToDeliver = rawSales.filter(o => o.docstatus === 1 && o.per_delivered < 100 && o.status !== 'Completed').length;
    const soToBill = rawSales.filter(o => o.docstatus === 1 && (o.per_billed || 0) < 100 && o.status !== 'Completed').length;
    const completedOrders = rawSales.filter(o => o.status === 'Completed').length;
    const pendingOrders = rawSales.filter(o => o.status === 'Draft' || o.status === 'On Hold').length;
    return { totalSalesOrders, totalSalesAmount, activeCustomers, soToDeliver, soToBill, completedOrders, pendingOrders };
  }, [salesOrders, customers]);

  const STATS = [
    {
      key: 'totalSalesAmount', label: 'Total Revenue', value: formatUangSingkat(stats.totalSalesAmount),
      icon: DollarSign, color: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', change: '+12%', positive: true
    },
    {
      key: 'totalSalesOrders', label: 'Sales Orders', value: stats.totalSalesOrders,
      icon: ShoppingCart, color: '#8b5cf6', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', change: `${stats.pendingOrders} pending`, positive: null
    },
    {
      key: 'activeCustomers', label: 'Active Customers', value: stats.activeCustomers,
      icon: Users, color: '#10b981', bg: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', change: 'Terdaftar', positive: true
    },
    {
      key: 'soToDeliver', label: 'To Deliver', value: stats.soToDeliver,
      icon: Package, color: '#f59e0b', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', change: 'Perlu dikirim', positive: null
    },
    {
      key: 'soToBill', label: 'To Bill', value: stats.soToBill,
      icon: FileText, color: '#ef4444', bg: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', change: 'Perlu ditagih', positive: null
    },
  ];

  // Recent orders (mock last 4)
  const recentOrders = (salesOrders as any[]).slice(0, 5).map(o => ({
    name: o.name || '-',
    customer: o.customer || '-',
    amount: o.grand_total || 0,
    status: o.status || 'Draft',
  }));

  const statusColor = (s: string) => {
    if (s === 'Completed') return { bg: '#dcfce7', color: '#16a34a' };
    if (s === 'On Hold') return { bg: '#fee2e2', color: '#dc2626' };
    if (s === 'Draft') return { bg: '#f3f4f6', color: '#6b7280' };
    return { bg: '#dbeafe', color: '#1d4ed8' };
  };

  if (isLoading) return (
    <div className="sh-loading">
      <div className="sh-spinner" />
      <p>Memuat data Selling...</p>
    </div>
  );

  return (
    <div className="sh-root">
      {/* Page Header */}
      <div className="sh-page-header">
        <div>
          <h1 className="sh-title">Selling Overview</h1>
          <p className="sh-subtitle">Dashboard penjualan untuk <span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>{roleTitle}</span></p>
        </div>
        <div className="sh-header-badge">
          <CheckCircle2 size={14} />
          <span>Sinkron ERPNext</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="sh-stats-grid">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="sh-stat-card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="sh-stat-icon-wrap" style={{ background: s.bg }}>
                <Icon size={22} color={s.color} />
              </div>
              <div className="sh-stat-label">{s.label}</div>
              <div className="sh-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="sh-stat-change">
                {s.positive === true && <ArrowUpRight size={12} color="#10b981" />}
                <span style={{ color: s.positive === true ? '#10b981' : s.positive === false ? '#ef4444' : '#9ca3af' }}>
                  {s.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Chart + Recent Orders */}
      <div className="sh-two-col">
        {/* Revenue Chart */}
        <div className="sh-card sh-chart-card">
          <div className="sh-card-header">
            <div>
              <div className="sh-card-title">Revenue Trend</div>
              <div className="sh-card-subtitle">Grafik penjualan per bulan</div>
            </div>
            <div className="sh-legend-pill" style={{ background: '#eff6ff', color: COLOR_PRIMARY }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_PRIMARY, display: 'inline-block' }} />
              Penjualan
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <YAxis width={65} tickFormatter={v => formatUangSingkat(v)} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any) => [formatUang(v), 'Revenue']}
                contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Poppins' }}
              />
              <Area type="monotone" dataKey="revenue" stroke={COLOR_PRIMARY} strokeWidth={2.5} fill="url(#gradRev)" activeDot={{ r: 5, fill: COLOR_PRIMARY, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="sh-card">
          <div className="sh-card-header">
            <div>
              <div className="sh-card-title">Sales Orders Terbaru</div>
              <div className="sh-card-subtitle">{recentOrders.length} order terakhir</div>
            </div>
          </div>
          {recentOrders.length === 0 ? (
            <div className="sh-empty">
              <AlertCircle size={28} color="#d1d5db" />
              <p>Belum ada data order</p>
            </div>
          ) : (
            <div className="sh-orders-list">
              {recentOrders.map((o, i) => {
                const sc = statusColor(o.status);
                return (
                  <div key={i} className="sh-order-row">
                    <div className="sh-order-num">{o.name}</div>
                    <div className="sh-order-customer">{o.customer}</div>
                    <div className="sh-order-amount">{formatUangSingkat(o.amount)}</div>
                    <div className="sh-status-pill" style={{ background: sc.bg, color: sc.color }}>{o.status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Completion Rate Banner */}
      <div className="sh-card sh-banner">
        <div className="sh-banner-left">
          <CheckCircle2 size={28} color="#10b981" />
          <div>
            <div className="sh-banner-title">Order Completion Rate</div>
            <div className="sh-banner-sub">{stats.completedOrders} dari {stats.totalSalesOrders} order selesai</div>
          </div>
        </div>
        <div className="sh-banner-right">
          <div className="sh-rate-value" style={{ color: '#10b981' }}>
            {stats.totalSalesOrders > 0 ? Math.round((stats.completedOrders / stats.totalSalesOrders) * 100) : 0}%
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sh-root { font-family: 'Poppins', sans-serif; animation: fadeSlideUp 0.4s ease-out; }

        .sh-loading { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .sh-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .sh-loading p { font-size: 13px; color: #6b7280; }

        .sh-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 12px; }
        .sh-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .sh-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .sh-header-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 20px; }

        .sh-stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 20px; }

        .sh-stat-card {
          background: white;
          border-radius: 16px;
          padding: 18px 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          animation: fadeSlideUp 0.4s ease-out both;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sh-stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

        .sh-stat-icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .sh-stat-label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .sh-stat-value { font-size: 22px; font-weight: 800; line-height: 1.2; margin-bottom: 6px; }
        .sh-stat-change { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; }

        .sh-two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 16px; }

        .sh-card {
          background: white;
          border-radius: 18px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        .sh-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
        .sh-card-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .sh-card-subtitle { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .sh-legend-pill { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 20px; }

        .sh-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px; color: #9ca3af; font-size: 13px; }

        .sh-orders-list { display: flex; flex-direction: column; gap: 8px; }
        .sh-order-row { display: grid; grid-template-columns: 1.2fr 1.4fr 1fr auto; gap: 8px; align-items: center; padding: 10px 12px; background: #f8fafc; border-radius: 10px; transition: background 0.15s; }
        .sh-order-row:hover { background: #eff6ff; }
        .sh-order-num { font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sh-order-customer { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sh-order-amount { font-size: 12px; font-weight: 700; color: #3b82f6; white-space: nowrap; }
        .sh-status-pill { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }

        .sh-banner { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-color: #a7f3d0; }
        .sh-banner-left { display: flex; align-items: center; gap: 14px; }
        .sh-banner-title { font-size: 14px; font-weight: 700; color: #065f46; }
        .sh-banner-sub { font-size: 12px; color: #059669; margin-top: 2px; }
        .sh-rate-value { font-size: 28px; font-weight: 800; }

        @media (max-width: 1200px) { .sh-stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px) {
          .sh-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .sh-two-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) { .sh-stats-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
