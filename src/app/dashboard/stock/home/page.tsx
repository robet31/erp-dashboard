'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStockData } from '@/hooks/useFrappeData';
import { Package, Warehouse, AlertTriangle, BarChart3, TrendingUp, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getWarehousesByCompany } from '@/config/frappe-data';

const COLOR_PRIMARY = '#10b981';
const COLOR_ACCENT = '#06b6d4';
const FIXED_COMPANY = 'PT Artavista';

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

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

export default function StockHomePage() {
  const { items, bins, isLoading } = useStockData();
  const warehouses = getWarehousesByCompany(FIXED_COMPANY);
  const [localLedger, setLocalLedger] = useState<Record<string, number>>({});

  useEffect(() => {
    const l = localStorage.getItem('erp_mock_stock_ledger');
    if (l) setLocalLedger(JSON.parse(l));
  }, []);

  const stats = useMemo(() => {
    const totalActiveItems = items.filter((i: any) => !i.disabled).length;
    const totalWarehouses = warehouses.length;

    const binMap: Record<string, any> = {};
    bins.forEach((b: any) => {
      binMap[`${b.item_code}_${b.warehouse}`] = { ...b, actual_qty: Number(b.actual_qty) || 0 };
    });
    Object.entries(localLedger).forEach(([key, qty]) => {
      if (binMap[key]) { binMap[key].actual_qty += Number(qty); }
      else {
        const [item_code, warehouse] = key.split('_');
        binMap[key] = { item_code, warehouse, actual_qty: Number(qty) };
      }
    });

    const simulatedBins = Object.values(binMap).map((b: any) => {
      const item = items.find((i: any) => i.item_code === b.item_code);
      const rate = item?.standard_rate || 0;
      return { ...b, stock_value: b.actual_qty * rate };
    });

    const nvBins = simulatedBins.filter((b: any) =>
      b.warehouse.includes(FIXED_COMPANY) || b.warehouse.includes('- NV') || b.warehouse.includes('- ARTA')
    );

    let totalStockValue = 0;
    const groupData: Record<string, number> = {};

    nvBins.forEach((b: any) => {
      const val = Number(b.stock_value) || 0;
      totalStockValue += val;
      const itemGroup = items.find((i: any) => i.item_code === b.item_code)?.item_group || 'Products';
      groupData[itemGroup] = (groupData[itemGroup] || 0) + val;
    });

    const stockByGroup = Object.entries(groupData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Low stock items (actual_qty < 10)
    const lowStockItems = simulatedBins
      .filter((b: any) => b.actual_qty > 0 && b.actual_qty < 10)
      .slice(0, 5);

    return { totalActiveItems, totalWarehouses, totalStockValue, stockByGroup, lowStockItems };
  }, [items, warehouses, bins, localLedger]);

  const STATS = [
    {
      label: 'Total Stock Value', value: formatUangSingkat(stats.totalStockValue),
      icon: TrendingUp, color: '#10b981', bg: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', sub: 'Nilai total inventaris'
    },
    {
      label: 'Active Items', value: stats.totalActiveItems,
      icon: Package, color: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', sub: 'Produk aktif terdaftar'
    },
    {
      label: 'Warehouses', value: stats.totalWarehouses,
      icon: Warehouse, color: '#8b5cf6', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', sub: 'Gudang aktif'
    },
    {
      label: 'Item Groups', value: stats.stockByGroup.length,
      icon: BarChart3, color: '#f59e0b', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', sub: 'Kategori barang'
    },
  ];

  if (isLoading) return (
    <div className="ih-loading">
      <div className="ih-spinner" />
      <p>Memuat data Inventory...</p>
    </div>
  );

  return (
    <div className="ih-root">
      {/* Page Header */}
      <div className="ih-page-header">
        <div>
          <h1 className="ih-title">Inventory Overview</h1>
          <p className="ih-subtitle">Pantau stok dan nilai inventaris <span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>PT Artavista</span></p>
        </div>
        <div className="ih-header-badge">
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="ih-stats-grid">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="ih-stat-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="ih-stat-icon-wrap" style={{ background: s.bg }}>
                <Icon size={22} color={s.color} />
              </div>
              <div className="ih-stat-label">{s.label}</div>
              <div className="ih-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="ih-stat-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Two column */}
      <div className="ih-two-col">
        {/* Bar Chart */}
        <div className="ih-card ih-chart-card">
          <div className="ih-card-header">
            <div>
              <div className="ih-card-title">Stock Value by Item Group</div>
              <div className="ih-card-subtitle">Nilai stok per kategori barang</div>
            </div>
            <div className="ih-pill" style={{ background: '#ecfdf5', color: '#10b981' }}>
              PT Artavista
            </div>
          </div>
          {stats.stockByGroup.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.stockByGroup} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <YAxis width={65} tickFormatter={v => formatUangSingkat(v)} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: any) => [formatUang(v), 'Stock Value']}
                  contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Poppins' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {stats.stockByGroup.map((_, idx) => (
                    <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="ih-empty">
              <Package size={32} color="#d1d5db" />
              <p>Belum ada data stok</p>
            </div>
          )}
        </div>

        {/* Low Stock Warning */}
        <div className="ih-card">
          <div className="ih-card-header">
            <div>
              <div className="ih-card-title">⚠️ Stok Menipis</div>
              <div className="ih-card-subtitle">Item dengan qty &lt; 10 unit</div>
            </div>
          </div>
          {stats.lowStockItems.length === 0 ? (
            <div className="ih-empty">
              <CheckCircle2 size={28} color="#10b981" />
              <p style={{ color: '#10b981' }}>Stok semua item aman!</p>
            </div>
          ) : (
            <div className="ih-low-list">
              {stats.lowStockItems.map((item: any, i: number) => (
                <div key={i} className="ih-low-row">
                  <div className="ih-low-dot" style={{ background: item.actual_qty <= 3 ? '#ef4444' : '#f59e0b' }} />
                  <div className="ih-low-info">
                    <div className="ih-low-name">{item.item_code}</div>
                    <div className="ih-low-warehouse">{item.warehouse}</div>
                  </div>
                  <div className="ih-low-qty" style={{ color: item.actual_qty <= 3 ? '#ef4444' : '#f59e0b' }}>
                    {item.actual_qty} unit
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stock Value Summary */}
          <div className="ih-summary-box">
            <div className="ih-summary-label">Total Nilai Inventaris</div>
            <div className="ih-summary-value">{formatUang(stats.totalStockValue)}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ih-root { font-family: 'Poppins', sans-serif; animation: fadeSlideUp 0.4s ease-out; }

        .ih-loading { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .ih-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .ih-loading p { font-size: 13px; color: #6b7280; }

        .ih-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 12px; }
        .ih-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .ih-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .ih-header-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 20px; }

        .ih-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }

        .ih-stat-card {
          background: white;
          border-radius: 16px;
          padding: 18px 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          animation: fadeSlideUp 0.4s ease-out both;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ih-stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .ih-stat-icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .ih-stat-label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .ih-stat-value { font-size: 22px; font-weight: 800; line-height: 1.2; margin-bottom: 4px; }
        .ih-stat-sub { font-size: 11px; color: #9ca3af; font-weight: 500; }

        .ih-two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }

        .ih-card {
          background: white;
          border-radius: 18px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        .ih-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
        .ih-card-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .ih-card-subtitle { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .ih-pill { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }

        .ih-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 36px; color: #9ca3af; font-size: 13px; }

        .ih-low-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .ih-low-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fafafa; border-radius: 10px; }
        .ih-low-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ih-low-info { flex: 1; min-width: 0; }
        .ih-low-name { font-size: 12px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ih-low-warehouse { font-size: 10px; color: #94a3b8; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ih-low-qty { font-size: 12px; font-weight: 800; white-space: nowrap; }

        .ih-summary-box { background: linear-gradient(135deg,#ecfdf5,#d1fae5); border-radius: 12px; padding: 14px 16px; margin-top: 8px; }
        .ih-summary-label { font-size: 11px; font-weight: 600; color: #065f46; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .ih-summary-value { font-size: 18px; font-weight: 800; color: #10b981; }

        @media (max-width: 1100px) { .ih-stats-grid { grid-template-columns: repeat(2, 1fr); } .ih-two-col { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .ih-stats-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}