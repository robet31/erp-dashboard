'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useDashboardData } from '@/hooks/useFrappeData';
import { getWidgetIds } from '@/config/rbac';
import {
  ShoppingCart, DollarSign, Package,
  TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Info, RefreshCw,
  Layers, Warehouse as WarehouseIcon, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { formatRupiah, formatRupiahFull, formatNumber } from '@/lib/utils';
import Link from 'next/link';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const FIXED_COMPANY = 'Artavista';

function ChartCard({ title, subtitle, icon, color, info, action, children }: any) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color }}>{icon}</div>
          <div><p style={{ fontSize: '14px', fontWeight: 700 }} className="dm-text-primary">{title}</p><p style={{ fontSize: '11px' }} className="dm-text-secondary">{subtitle}</p></div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {info && <button onClick={() => setShowInfo(!showInfo)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: showInfo ? '#0066B3' : '#9CA3AF' }}><Info size={16} /></button>}
          {action}
        </div>
      </div>
      {showInfo && info && <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '12px', color: '#1e40af' }}>{info}</div>}
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, positive, icon, color, bg, link }: any) {
  const content = (
    <div className="stat-card card-hover" style={{ cursor: link ? 'pointer' : 'default' }}>
      <div>
        <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }} className="dm-text-secondary">{label}</p>
        <p style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }} className="dm-text-primary">{value}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {positive ? <ArrowUpRight size={13} color="#10b981" /> : <ArrowDownRight size={13} color="#ef4444" />}
          <p style={{ fontSize: '11px', color: positive ? '#10b981' : '#ef4444', fontWeight: 600 }}>{sub}</p>
        </div>
      </div>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0 }}>{icon}</div>
    </div>
  );
  if (link) return <Link href={link} style={{ textDecoration: 'none' }}>{content}</Link>;
  return content;
}

const statusLabels: Record<string, Record<string, string>> = {
  id: { 'To Deliver and Bill': 'Siap Kirim', 'Completed': 'Selesai', 'Draft': 'Draft', 'Cancelled': 'Dibatalkan' },
  en: { 'To Deliver and Bill': 'To Ship', 'Completed': 'Completed', 'Draft': 'Draft', 'Cancelled': 'Cancelled' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings, t } = useSettings();
  const lang = settings.language;
  const { salesOrders, items, bins, workOrders, revenueTrend, workOrderStatus, stats, isLoading, refetch } = useDashboardData();

  // Use getWidgetIds helper to get string[] of widget IDs for this role
  const widgetIds = useMemo(() => user ? getWidgetIds(user.role) : [], [user]);

  // No company filter - show ALL data from ERP (the ERPNext already filters by API key permissions)
  const allSalesOrders = salesOrders as any[];
  const totalRevenue = allSalesOrders.reduce((sum: number, so: any) => sum + (so.grand_total || 0), 0);

  // Stock analytics
  const stockByCategory = useMemo(() => {
    const map: Record<string, { qty: number; value: number }> = {};
    (bins as any[]).forEach((bin: any) => {
      const item = (items as any[]).find(i => i.item_code === bin.item_code);
      const cat = item?.item_group || 'Other';
      if (!map[cat]) map[cat] = { qty: 0, value: 0 };
      map[cat].qty += bin.actual_qty || 0;
      map[cat].value += bin.stock_value || 0;
    });
    return Object.entries(map).map(([category, d]) => ({ category, qty: d.qty, value: d.value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [bins, items]);

  // Low stock items
  const lowStockItems = useMemo(() => {
    return (bins as any[]).filter(b => (b.actual_qty || 0) < 10 && (b.actual_qty || 0) > 0).slice(0, 5);
  }, [bins]);

  const donutData = [
    { name: t.completed, value: workOrderStatus.completed },
    { name: t.inProcess, value: workOrderStatus.inProcess },
    { name: t.waiting, value: workOrderStatus.pending },
  ];

  const sortedRecentOrders = useMemo(() => {
    return [...allSalesOrders].sort((a: any, b: any) => new Date(b.creation || 0).getTime() - new Date(a.creation || 0).getTime()).slice(0, 5);
  }, [allSalesOrders]);

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}><RefreshCw size={32} color="#0066B3" className="spin" /><p className="dm-text-secondary">Memuat data dari ERP...</p><style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style></div>;

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }} className="dm-text-primary">{t.dashTitle}</h1>
          <p style={{ fontSize: '13px' }} className="dm-text-secondary">{t.dashSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={refetch} className="dm-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><RefreshCw size={14} /> {t.refresh}</button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {widgetIds.includes('revenue_stats') && (
          <>
            <StatCard label={t.totalOrders} value={formatNumber(allSalesOrders.length)} sub={t.allSalesOrders} positive={allSalesOrders.length > 0} icon={<ShoppingCart size={22} />} color="#0066B3" bg="linear-gradient(135deg, #eff6ff, #dbeafe)" link="/dashboard/selling?tab=orders" />
            <StatCard label={t.totalRevenue} value={formatRupiahFull(totalRevenue)} sub={lang === 'id' ? 'Total Keseluruhan' : 'Grand Total'} positive={totalRevenue > 0} icon={<DollarSign size={22} />} color="#059669" bg="linear-gradient(135deg, #ecfdf5, #d1fae5)" link="/dashboard/selling?tab=orders" />
          </>
        )}
        {widgetIds.includes('items') && (
          <>
            <StatCard label={t.activeProducts} value={formatNumber(stats.activeItems)} sub={t.itemCatalog} positive={true} icon={<Package size={22} />} color="#7c3aed" bg="linear-gradient(135deg, #f5f3ff, #ede9fe)" link="/dashboard/stock?tab=items" />
            <StatCard label={t.lowStock} value={formatNumber(stats.lowStockCount)} sub={stats.lowStockCount > 0 ? t.needsRestock : (lang === 'id' ? 'Semua aman' : 'All safe')} positive={stats.lowStockCount === 0} icon={<AlertTriangle size={22} />} color={stats.lowStockCount > 0 ? '#ef4444' : '#10b981'} bg={stats.lowStockCount > 0 ? 'linear-gradient(135deg, #fef2f2, #fee2e2)' : 'linear-gradient(135deg, #ecfdf5, #d1fae5)'} link="/dashboard/stock?tab=items" />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: widgetIds.includes('revenue_stats') && widgetIds.includes('production_status') ? '1fr 340px' : '1fr', gap: '16px', marginBottom: '16px' }}>
        {widgetIds.includes('revenue_stats') && (
          <ChartCard title={t.revenueTrend} subtitle={t.revenueTrendDesc} icon={<TrendingUp size={16} />} color="#0066B3">
            <div style={{ background: '#eff6ff', color: '#0066B3', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginBottom: '12px', display: 'inline-block' }}>
              {formatRupiahFull(totalRevenue)} <span style={{ fontSize: '10px', color: '#6B7280', display: 'block' }}>Total Revenue</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: any) => formatRupiah(v).replace(/,/g, '.').slice(0, -5)} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => formatRupiah(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#0066B3" strokeWidth={2.5} fill="#eff6ff" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgetIds.includes('production_status') && (
          <ChartCard title={t.productionStatus} subtitle={t.productionStatusDesc} icon={<Activity size={16} />} color="#10b981">
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                    {donutData.map((_, index) => <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 800 }} className="dm-text-primary">{workOrderStatus.total}</p>
                <p style={{ fontSize: '10px' }} className="dm-text-secondary">Total</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
              {donutData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i] }} />
                  <span className="dm-text-secondary">{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* ── Stock by Category + Recent Orders ── */}
      <div style={{ display: 'grid', gridTemplateColumns: widgetIds.includes('sales_orders') && widgetIds.includes('items') ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
        {widgetIds.includes('items') && stockByCategory.length > 0 && (
          <ChartCard title={t.stockByCategory} subtitle={t.stockByCategoryDesc} icon={<Layers size={16} />} color="#7c3aed">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stockByCategory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => v.toLocaleString()} />
                <Bar dataKey="qty" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgetIds.includes('sales_orders') && (
          <ChartCard title={t.recentOrders} subtitle={t.recentOrdersDesc} icon={<ShoppingCart size={16} />} color="#f59e0b">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedRecentOrders.map((order: any, index: number) => (
                <div key={order.name} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #f3f4f6)', background: 'var(--bg-card, #fafafa)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', color: '#0066B3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: '#0066B3' }}>{order.name}</span><span style={{ background: `#e5e7eb`, color: '#374151', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>{(statusLabels[lang] || statusLabels.id)[order.status] || order.status}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><p style={{ fontSize: '12px' }} className="dm-text-secondary">{order.customer_name}</p><p style={{ fontSize: '13px', fontWeight: 800 }} className="dm-text-primary">{formatRupiahFull(order.grand_total)}</p></div>
                  </div>
                </div>
              ))}
              {sortedRecentOrders.length === 0 && <p style={{ fontSize: '12px', textAlign: 'center', padding: '16px' }} className="dm-text-secondary">{t.noOrdersYet}</p>}
            </div>
          </ChartCard>
        )}
      </div>

      {/* ── Low Stock Alert ── */}
      {widgetIds.includes('items') && lowStockItems.length > 0 && (
        <ChartCard title="Peringatan Stok Rendah" subtitle="Item dengan qty < 10" icon={<AlertTriangle size={16} />} color="#ef4444">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {lowStockItems.map((bin: any) => (
              <div key={bin.name} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>{bin.item_code}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '8px' }}>{bin.warehouse}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444' }}>{bin.actual_qty} unit</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}