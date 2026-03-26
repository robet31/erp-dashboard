'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useDashboardData } from '@/hooks/useFrappeData';
import {
  ShoppingCart, DollarSign, Package,
  TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Info, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatRupiah } from '@/lib/utils';
import Link from 'next/link';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const FIXED_COMPANY = 'Netra Vidya';

function ChartCard({ title, subtitle, icon, color, info, action, children }: any) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color }}>{icon}</div>
          <div><p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</p><p style={{ fontSize: '11px', color: '#6B7280' }}>{subtitle}</p></div>
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
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>{label}</p>
        <p style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>{value}</p>
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

const statusLabels: Record<string, string> = { 'To Deliver and Bill': 'Siap Kirim', 'Completed': 'Selesai', 'Draft': 'Draft', 'Cancelled': 'Dibatalkan' };

export default function DashboardPage() {
  const { user, getWidgets } = useAuth();
  const { salesOrders, revenueTrend, workOrderStatus, stats, isLoading, refetch } = useDashboardData();

  // FIX TypeScript: Safe casting
  const widgets = getWidgets() as unknown as string[];

  const companySalesOrders = useMemo(() => (salesOrders as any[]).filter((so: any) => so.company === FIXED_COMPANY), [salesOrders]);
  
  const totalCompanyRevenue = companySalesOrders.reduce((sum: number, so: any) => sum + (so.grand_total || 0), 0);

  const donutData = [
    { name: 'Selesai', value: workOrderStatus.completed },
    { name: 'Dalam Proses', value: workOrderStatus.inProcess },
    { name: 'Menunggu', value: workOrderStatus.pending },
  ];

  const sortedRecentOrders = useMemo(() => {
    return [...companySalesOrders].sort((a: any, b: any) => new Date(b.creation || 0).getTime() - new Date(a.creation || 0).getTime()).slice(0, 5);
  }, [companySalesOrders]);

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}><RefreshCw size={32} color="#0066B3" className="spin" /><p>Memuat data dari ERP...</p><style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style></div>;

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Dashboard {(user?.role as unknown as string) === 'direktur' ? 'Direktur' : 'Manajemen'}</h1>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>Monitor performa bisnis Netra Vidya.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {widgets.includes('revenue_stats') && (
          <>
            <StatCard label="Total Orders" value={companySalesOrders.length.toString()} sub={`Khusus Netra Vidya`} positive={true} icon={<ShoppingCart size={22} />} color="#0066B3" bg="linear-gradient(135deg, #eff6ff, #dbeafe)" link="/dashboard/selling?tab=orders" />
            <StatCard label="Total Revenue" value={formatRupiah(totalCompanyRevenue)} sub={`Total Keseluruhan`} positive={true} icon={<DollarSign size={22} />} color="#059669" bg="linear-gradient(135deg, #ecfdf5, #d1fae5)" link="/dashboard/selling?tab=orders" />
          </>
        )}
        {widgets.includes('items') && <StatCard label="Produk Aktif" value={stats.activeItems.toString()} sub="Global Catalog" positive={true} icon={<Package size={22} />} color="#7c3aed" bg="linear-gradient(135deg, #f5f3ff, #ede9fe)" link="/dashboard/stock?tab=items" />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: widgets.includes('revenue_stats') ? '1fr 340px' : '1fr', gap: '16px', marginBottom: '16px' }}>
        {widgets.includes('revenue_stats') && (
          <ChartCard title="Revenue Trend" subtitle="Riwayat Transaksi" icon={<TrendingUp size={16} />} color="#0066B3">
            <div style={{ background: '#eff6ff', color: '#0066B3', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginBottom: '12px', display: 'inline-block' }}>
              {formatRupiah(totalCompanyRevenue)} <span style={{ fontSize: '10px', color: '#6B7280', display: 'block' }}>Total Histori Netra Vidya</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={totalCompanyRevenue > 0 ? revenueTrend : []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: any) => formatRupiah(v).replace(/,/g, '.').slice(0, -5)} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="revenue" stroke="#0066B3" strokeWidth={2.5} fill="#eff6ff" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgets.includes('production_status') && (
          <ChartCard title="Status Produksi" subtitle="Dashboard Work Orders" icon={<Activity size={16} />} color="#10b981">
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                    {donutData.map((_, index) => <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>{workOrderStatus.total}</p>
                <p style={{ fontSize: '10px', color: '#6B7280' }}>Total</p>
              </div>
            </div>
          </ChartCard>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {widgets.includes('sales_orders') && (
          <ChartCard title="Order Terbaru" subtitle="Khusus Netra Vidya" icon={<ShoppingCart size={16} />} color="#f59e0b">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedRecentOrders.map((order: any, index: number) => (
                <div key={order.name} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', color: '#0066B3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: '#0066B3' }}>{order.name}</span><span style={{ background: `#e5e7eb`, color: '#374151', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>{statusLabels[order.status] || order.status}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><p style={{ fontSize: '12px', color: '#374151' }}>{order.customer_name}</p><p style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>{formatRupiah(order.grand_total)}</p></div>
                  </div>
                </div>
              ))}
              {sortedRecentOrders.length === 0 && <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', padding: '16px' }}>Belum ada pesanan masuk.</p>}
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}