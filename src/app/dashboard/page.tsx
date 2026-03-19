'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useDashboardData } from '@/hooks/useFrappeData';
import {
  ShoppingCart, DollarSign, Package, AlertTriangle,
  TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Info, RefreshCw, AlertCircle,
  Users, Warehouse, FileText, CheckCircle, Clock, XCircle, Plus, Edit, Truck,
  Cog, BarChart3
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { formatRupiah, formatDate } from '@/lib/utils';
import Link from 'next/link';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const today = new Date();
const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

interface ChartCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  info?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, icon, color, info, action, children }: ChartCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color }}>{icon}</div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</p>
            <p style={{ fontSize: '11px', color: '#6B7280' }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {info && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: showInfo ? '#0066B3' : '#9CA3AF',
                padding: '4px', borderRadius: '4px',
              }}
              title="Klik untuk info"
            >
              <Info size={16} />
            </button>
          )}
          {action}
        </div>
      </div>
      {showInfo && info && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '8px', padding: '12px', marginBottom: '12px',
          fontSize: '12px', color: '#1e40af', lineHeight: 1.5,
        }}>
          {info}
        </div>
      )}
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, formatter }: { 
  active?: boolean; 
  payload?: Array<{ value: number; name?: string; color?: string }>; 
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: '12px', fontFamily: "'Montserrat', sans-serif",
    }}>
      <p style={{ fontWeight: 700, color: '#374151', marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#0066B3' }}>
          {p.name || ''}: <strong>{formatter ? formatter(p.value) : new Intl.NumberFormat('id-ID').format(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: '12px', fontFamily: "'Montserrat', sans-serif",
    }}>
      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{new Intl.NumberFormat('id-ID').format(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, positive, icon, color, bg, onClick, link }: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
  icon: React.ReactNode;
  color: string;
  bg: string;
  onClick?: () => void;
  link?: string;
}) {
  const content = (
    <div 
      className="stat-card card-hover" 
      onClick={onClick}
      style={{ cursor: onClick || link ? 'pointer' : 'default' }}
    >
      <div>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>{label}</p>
        <p style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>{value}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {positive
            ? <ArrowUpRight size={13} color="#10b981" />
            : <ArrowDownRight size={13} color="#ef4444" />
          }
          <p style={{ fontSize: '11px', color: positive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {sub}
          </p>
        </div>
      </div>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
    </div>
  );

  if (link) {
    return <Link href={link} style={{ textDecoration: 'none' }}>{content}</Link>;
  }
  return content;
}

const statusColors: Record<string, string> = {
  'To Deliver and Bill': '#3b82f6',
  'Completed': '#10b981',
  'Draft': '#6B7280',
  'Cancelled': '#ef4444',
  'In Process': '#3b82f6',
  'Not Started': '#f59e0b',
  'Pending': '#f59e0b',
  'Closed': '#6B7280',
};
  
const statusLabels: Record<string, string> = {
  'To Deliver and Bill': 'Siap Kirim',
  'Completed': 'Selesai',
  'Draft': 'Draft',
  'Cancelled': 'Dibatalkan',
  'In Process': 'Dalam Proses',
  'Not Started': 'Belum Mulai',
  'Pending': 'Menunggu',
  'Closed': 'Tutup',
};

export default function DashboardPage() {
  const { user, canAccess, getWidgets, can } = useAuth();
  const { 
    salesOrders, revenueTrend, workOrderStatus, stockByCategory, 
    productionTrend, stats, isLoading, error, refetch 
  } = useDashboardData();

  const widgets = getWidgets();
  const todayStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  const revenueThisMonth = revenueTrend.length > 0 ? revenueTrend[revenueTrend.length - 1].revenue : 0;
  const lastMonthRevenue = revenueTrend.length > 1 ? revenueTrend[revenueTrend.length - 2].revenue : 0;
  const revenueGrowth = lastMonthRevenue > 0 ? ((revenueThisMonth - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;

  const pendingOrders = salesOrders.filter(o => o.status === 'To Deliver and Bill' || o.status === 'Draft');
  const completedOrders = salesOrders.filter(o => o.status === 'Completed');

  const topProducts = salesOrders
    .flatMap(order => (order.items || []).map(item => ({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: item.qty,
      amount: item.amount || 0,
    })))
    .reduce((acc, item) => {
      const existing = acc.find(p => p.item_code === item.item_code);
      if (existing) {
        existing.qty += item.qty;
        existing.amount += item.amount;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as { item_code: string; item_name: string; qty: number; amount: number }[])
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((p, i) => ({
      rank: i + 1,
      name: p.item_name,
      qty: `${new Intl.NumberFormat('id-ID').format(p.qty)} unit`,
      revenue: p.amount,
      color: ['#0066B3', '#059669', '#7c3aed', '#d97706', '#6B7280'][i],
      pct: 100 - (i * 18),
    }));

  const donutData = [
    { name: 'Selesai', value: workOrderStatus.completed },
    { name: 'Dalam Proses', value: workOrderStatus.inProcess },
    { name: 'Menunggu', value: workOrderStatus.pending },
    { name: 'Ditolak', value: workOrderStatus.rejected },
  ];

  const lowStockItems = stats.lowStockCount;

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <RefreshCw size={32} color="#0066B3" className="spin" />
        <p style={{ color: '#6B7280', fontSize: '14px' }}>Memuat data dari ERP...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
            Dashboard {user?.role === 'direktur' ? 'Direktur' : user?.role === 'manajer_pabrik' ? 'Manajer Pabrik' : user?.role === 'sales' ? 'Sales' : user?.role === 'gudang' ? 'Gudang' : 'Produksi'}
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            {user?.role === 'direktur' && 'Monitor performa bisnis dan metrik utama ERP System'}
            {user?.role === 'manajer_pabrik' && 'Monitor produksi, inventory, dan orders'}
            {user?.role === 'sales' && 'Kelola sales order dan customer Anda'}
            {user?.role === 'gudang' && 'Kelola inventory dan stock'}
            {user?.role === 'produksi' && 'Monitor work orders dan produksi'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={refetch}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: '10px', padding: '8px 14px',
              fontSize: '13px', fontWeight: 600, color: '#374151',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '10px', padding: '8px 14px',
            fontSize: '13px', fontWeight: 600, color: '#374151',
          }}>
            <Activity size={15} color="#0066B3" />
            {todayStr}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fecaca',
          borderRadius: '8px', padding: '12px 16px',
          color: '#991b1b', fontSize: '13px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>Gagal memuat data: {error}</span>
          <button onClick={refetch} style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Coba Lagi</button>
        </div>
      )}

      {/* Stats Row - Visible to all */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {widgets.includes('revenue_stats') && (
          <>
            <StatCard
              label="Total Orders"
              value={stats.totalOrders.toString()}
              sub={`${Number(revenueGrowth) > 0 ? '+' : ''}${revenueGrowth}% dari bulan lalu`}
              positive={Number(revenueGrowth) >= 0}
              icon={<ShoppingCart size={22} />}
              color="#0066B3"
              bg="linear-gradient(135deg, #eff6ff, #dbeafe)"
              link={canAccess('selling') ? '/dashboard/selling' : undefined}
            />
            <StatCard
              label="Revenue Bulan Ini"
              value={formatRupiah(stats.totalRevenue)}
              sub={`${Number(revenueGrowth) > 0 ? '+' : ''}${revenueGrowth}% dari bulan lalu`}
              positive={Number(revenueGrowth) >= 0}
              icon={<DollarSign size={22} />}
              color="#059669"
              bg="linear-gradient(135deg, #ecfdf5, #d1fae5)"
            />
          </>
        )}
        {widgets.includes('items') && (
          <StatCard
            label="Produk Aktif"
            value={stats.activeItems.toString()}
            sub="Item dalam katalog"
            positive={true}
            icon={<Package size={22} />}
            color="#7c3aed"
            bg="linear-gradient(135deg, #f5f3ff, #ede9fe)"
            link={canAccess('stock') ? '/dashboard/stock' : undefined}
          />
        )}
        {widgets.includes('low_stock_alerts') && (
          <StatCard
            label="Low Stock Alert"
            value={stats.lowStockCount.toString()}
            sub="Perlu restock segera"
            positive={stats.lowStockCount === 0}
            icon={<AlertTriangle size={22} />}
            color="#d97706"
            bg="linear-gradient(135deg, #fffbeb, #fef3c7)"
            link={canAccess('stock') ? '/dashboard/stock' : undefined}
          />
        )}
        {widgets.includes('work_orders') && (
          <StatCard
            label="Work Orders"
            value={workOrderStatus.total.toString()}
            sub={`${workOrderStatus.completed} selesai`}
            positive={workOrderStatus.completed > 0}
            icon={<Cog size={22} />}
            color="#0891b2"
            bg="linear-gradient(135deg, #ecfeff, #cffafe)"
            link={canAccess('manufacturing') ? '/dashboard/manufacturing' : undefined}
          />
        )}
      </div>

      {/* Quick Actions - Role Based */}
      {widgets.includes('quick_actions') && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Quick Actions
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {can('create_sales_order') && (
              <Link href="/dashboard/selling" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}>
                  <Plus size={14} /> Sales Order Baru
                </button>
              </Link>
            )}
            {can('create_customer') && (
              <Link href="/dashboard/selling" style={{ textDecoration: 'none' }}>
                <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
                  <Users size={14} /> Customer Baru
                </button>
              </Link>
            )}
            {can('create_item') && (
              <Link href="/dashboard/stock" style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
                  <Package size={14} /> Tambah Item
                </button>
              </Link>
            )}
            {can('create_stock_entry') && (
              <Link href="/dashboard/stock" style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
                  <Warehouse size={14} /> Stock Entry
                </button>
              </Link>
            )}
            {can('create_work_order') && (
              <Link href="/dashboard/manufacturing" style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
                  <Cog size={14} /> Work Order Baru
                </button>
              </Link>
            )}
            {can('create_bom') && (
              <Link href="/dashboard/manufacturing" style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
                  <FileText size={14} /> BOM Baru
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: widgets.includes('revenue_stats') ? '1fr 340px' : '1fr', gap: '16px', marginBottom: '16px' }}>
        {widgets.includes('revenue_stats') && (
          <ChartCard
            title="Revenue Trend"
            subtitle="6 Bulan Terakhir"
            icon={<TrendingUp size={16} />}
            color="#0066B3"
            info="Grafik ini menunjukkan trend pendapatan perusahaan selama 6 bulan terakhir."
          >
            <div style={{
              background: '#eff6ff', color: '#0066B3', padding: '4px 12px',
              borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginBottom: '12px',
              display: 'inline-block',
            }}>
              {formatRupiah(revenueThisMonth)}
              <span style={{ fontSize: '10px', color: '#6B7280', display: 'block' }}>Total bulan ini</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066B3" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0066B3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatRupiah(v).replace(/,/g, '.').slice(0, -5)} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={(v) => formatRupiah(v)} />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0066B3" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#0066B3', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgets.includes('production_status') && (
          <ChartCard
            title="Status Produksi"
            subtitle="Dashboard Work Orders"
            icon={<Activity size={16} />}
            color="#10b981"
            info="Pie chart ini menampilkan distribusi status work order produksi."
          >
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>{workOrderStatus.total}</p>
                <p style={{ fontSize: '10px', color: '#6B7280' }}>Total</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
              {donutData.map((item, i) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
                  <span style={{ color: '#6B7280', flex: 1 }}>{item.name}</span>
                  <strong style={{ color: '#111827' }}>{item.value}</strong>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {widgets.includes('sales_orders') && (
          <ChartCard
            title="Order Terbaru"
            subtitle="Sales Orders"
            icon={<ShoppingCart size={16} />}
            color="#f59e0b"
            info="Daftar sales order terbaru yang masuk ke sistem."
            action={
              canAccess('selling') && (
                <Link href="/dashboard/selling" style={{ fontSize: '11px', color: '#0066B3', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat Semua →
                </Link>
              )
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {salesOrders.slice(0, 5).map((order) => {
                const color = statusColors[order.status] || '#6B7280';
                return (
                  <div key={order.name} style={{
                    padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #f3f4f6', background: '#fafafa',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0066B3' }}>{order.name}</span>
                      <span style={{ background: `${color}15`, color, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#374151', marginBottom: '2px' }}>{order.customer_name}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{formatRupiah(order.grand_total)}</p>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}

        {widgets.includes('customers') && (
          <ChartCard
            title="Data Pelanggan"
            subtitle="Customer Summary"
            icon={<Users size={16} />}
            color="#7c3aed"
            info="Informasi customers yang tersedia di sistem."
            action={
              canAccess('selling') && (
                <Link href="/dashboard/selling" style={{ fontSize: '11px', color: '#0066B3', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat Semua →
                </Link>
              )
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#0066B3' }}>{stats.totalOrders}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>Total Orders</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>{completedOrders.length}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>Selesai</p>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#d97706' }}>{pendingOrders.length}</p>
                <p style={{ fontSize: '11px', color: '#6B7280' }}>Menunggu Proses</p>
              </div>
            </div>
          </ChartCard>
        )}

        {widgets.includes('bins') && !widgets.includes('customers') && (
          <ChartCard
            title="Stock Overview"
            subtitle="Inventory Status"
            icon={<Package size={16} />}
            color="#7c3aed"
            info="Ringkasan status inventory."
            action={
              canAccess('stock') && (
                <Link href="/dashboard/stock" style={{ fontSize: '11px', color: '#0066B3', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat Semua →
                </Link>
              )
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#0066B3' }}>{stats.activeItems}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>Produk Aktif</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#d97706' }}>{lowStockItems}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>Low Stock</p>
                </div>
              </div>
            </div>
          </ChartCard>
        )}

        {widgets.includes('work_orders') && (
          <ChartCard
            title="Work Orders"
            subtitle="Manufacturing Orders"
            icon={<Cog size={16} />}
            color="#0891b2"
            info="Status work orders produksi."
            action={
              canAccess('manufacturing') && (
                <Link href="/dashboard/manufacturing" style={{ fontSize: '11px', color: '#0066B3', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat Semua →
                </Link>
              )
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {workOrderStatus.total > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '8px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{workOrderStatus.completed}</p>
                    <p style={{ fontSize: '10px', color: '#6B7280' }}>Selesai</p>
                  </div>
                  <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '8px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#0066B3' }}>{workOrderStatus.inProcess}</p>
                    <p style={{ fontSize: '10px', color: '#6B7280' }}>Proses</p>
                  </div>
                  <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{workOrderStatus.pending}</p>
                    <p style={{ fontSize: '10px', color: '#6B7280' }}>Menunggu</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
                  <p>Belum ada work orders</p>
                </div>
              )}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Stock by Category - Only for roles with stock access */}
      {widgets.includes('bins') && stockByCategory.length > 0 && (
        <ChartCard
          title="Stock per Kategori"
          subtitle="Distribusi inventory berdasarkan kategori produk"
          icon={<Package size={16} />}
          color="#0066B3"
          info="Visualisasi jumlah stock per kategori produk."
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stockByCategory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="qty" name="Qty (pcs)" fill="#0066B3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Production vs Target - For manufacturing roles */}
      {widgets.includes('production_status') && (
        <ChartCard
          title="Produksi vs Target"
          subtitle="6 bulan terakhir"
          icon={<BarChart3 size={16} />}
          color="#0891b2"
          info="Perbandingan antara jumlah produksi aktual dengan target yang ditetapkan."
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={productionTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="planned" name="Target" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="produced" name="Produksi" fill="#0066B3" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
