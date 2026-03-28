'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useManufacturingData, useStockData } from '@/hooks/useFrappeData';
import { Cog, CheckCircle, Activity, TrendingUp, Factory, Layers, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLOR_PRIMARY = '#f59e0b';
const FIXED_COMPANY = 'PT Artavista';

const formatUang = (v: any) => {
  const n = Number(v);
  if (!v || isNaN(n)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

const WO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Draft':        { label: 'Draft',       color: '#6b7280', bg: '#f3f4f6' },
  'Not Started':  { label: 'Belum Mulai', color: '#f59e0b', bg: '#fef3c7' },
  'In Process':   { label: 'Dikerjakan',  color: '#3b82f6', bg: '#dbeafe' },
  'Completed':    { label: 'Selesai',     color: '#10b981', bg: '#d1fae5' },
  'Stopped':      { label: 'Dihentikan',  color: '#ef4444', bg: '#fee2e2' },
};

export default function ManufacturingHomePage() {
  const { workOrders, isLoading: isMfgLoading } = useManufacturingData() as any;
  const { items, isLoading: isStockLoading } = useStockData();
  const [localWOStatus, setLocalWOStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('erp_mock_wo_status');
    if (saved) { try { setLocalWOStatus(JSON.parse(saved)); } catch {} }
  }, []);

  const stats = useMemo(() => {
    const overriddenWOs = (workOrders || []).map((wo: any) => {
      const status = localWOStatus[wo.name] || wo.status;
      return {
        ...wo,
        status,
        produced_qty: status === 'Completed' ? (Number(wo.produced_qty) || Number(wo.qty)) : Number(wo.produced_qty)
      };
    });

    const wos = overriddenWOs.filter((wo: any) =>
      wo.company === FIXED_COMPANY ||
      (wo.name && wo.name.includes('NV')) ||
      (wo.fg_warehouse && wo.fg_warehouse.includes('NV'))
    );

    const openWOs      = wos.filter((wo: any) => wo.status === 'Draft' || wo.status === 'Not Started').length;
    const wipWOs       = wos.filter((wo: any) => wo.status === 'In Process').length;
    const completedWOs = wos.filter((wo: any) => wo.status === 'Completed').length;
    const stoppedWOs   = wos.filter((wo: any) => wo.status === 'Stopped').length;
    const totalWOs     = wos.length;

    let manufacturedValue = 0;
    wos.forEach((wo: any) => {
      const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      if (qty > 0) {
        const itemDetail = items.find((i: any) => i.item_code === wo.production_item);
        manufacturedValue += qty * (itemDetail?.standard_rate || 0);
      }
    });

    const trendMap: Record<string, number> = {};
    wos.forEach((wo: any) => {
      if (!wo.creation) return;
      const qty = Number(wo.produced_qty) > 0 ? Number(wo.produced_qty) : (wo.status === 'Completed' ? Number(wo.qty) : 0);
      if (qty > 0) {
        const month = new Date(wo.creation).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        trendMap[month] = (trendMap[month] || 0) + qty;
      }
    });

    const producedTrend = Object.entries(trendMap)
      .map(([day, qty]) => ({ day, qty }))
      .sort((a, b) => new Date(`1 ${a.day}`).getTime() - new Date(`1 ${b.day}`).getTime());

    // Status breakdown
    const statusCounts = Object.keys(WO_STATUS_CONFIG).map(status => ({
      status,
      count: wos.filter((wo: any) => wo.status === status).length,
    })).filter(s => s.count > 0);

    // Recent WOs
    const recentWOs = wos.slice(0, 5).map((wo: any) => ({
      name: wo.name || '-',
      item: wo.production_item || '-',
      qty: wo.qty || 0,
      produced: wo.produced_qty || 0,
      status: wo.status || 'Draft',
    }));

    return { openWOs, wipWOs, completedWOs, stoppedWOs, totalWOs, manufacturedValue, producedTrend, statusCounts, recentWOs };
  }, [workOrders, items, localWOStatus]);

  const STATS = [
    {
      label: 'Total Work Orders', value: stats.totalWOs,
      icon: Factory, color: '#f59e0b', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
    },
    {
      label: 'WIP Orders', value: stats.wipWOs,
      icon: Activity, color: '#3b82f6', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
    },
    {
      label: 'Completed', value: stats.completedWOs,
      icon: CheckCircle, color: '#10b981', bg: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
    },
    {
      label: 'Manufactured Value', value: formatUang(stats.manufacturedValue),
      icon: TrendingUp, color: '#8b5cf6', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
    },
  ];

  if (isMfgLoading || isStockLoading) return (
    <div className="mh-loading">
      <div className="mh-spinner" />
      <p>Memuat data produksi...</p>
    </div>
  );

  return (
    <div className="mh-root">
      {/* Header */}
      <div className="mh-header">
        <div>
          <h1 className="mh-title">Manufacturing Overview</h1>
          <p className="mh-subtitle">Monitor produksi <span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>PT Artavista</span> secara real-time</p>
        </div>
        <div className="mh-header-badge">
          <Cog size={14} className="mh-badge-spin" />
          <span>Produksi Aktif</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mh-stats-grid">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="mh-stat-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="mh-stat-icon-wrap" style={{ background: s.bg }}>
                <Icon size={22} color={s.color} />
              </div>
              <div className="mh-stat-label">{s.label}</div>
              <div className="mh-stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Two Column */}
      <div className="mh-two-col">
        {/* Trend Chart */}
        <div className="mh-card mh-chart-card">
          <div className="mh-card-header">
            <div>
              <div className="mh-card-title">Produced Quantity Trend</div>
              <div className="mh-card-subtitle">Jumlah produksi per bulan</div>
            </div>
            <div className="mh-pill" style={{ background: '#fef3c7', color: '#d97706' }}>
              <CheckCircle2 size={12} /> Aktual ERPNext
            </div>
          </div>
          {stats.producedTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.producedTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMfg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: any) => [`${v} unit`, 'Qty Produksi']}
                  contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Poppins' }}
                />
                <Area type="monotone" dataKey="qty" stroke={COLOR_PRIMARY} strokeWidth={2.5} fill="url(#gradMfg)" activeDot={{ r: 5, fill: COLOR_PRIMARY, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="mh-empty">
              <AlertCircle size={28} color="#d1d5db" />
              <p>Belum ada data produksi</p>
            </div>
          )}
        </div>

        {/* Status Breakdown + Recent WOs */}
        <div className="mh-card">
          <div className="mh-card-header">
            <div>
              <div className="mh-card-title">Status Work Orders</div>
              <div className="mh-card-subtitle">{stats.totalWOs} work order total</div>
            </div>
          </div>

          {/* Status bars */}
          {stats.statusCounts.length === 0 ? (
            <div className="mh-empty" style={{ padding: '20px' }}>
              <p>Tidak ada work order</p>
            </div>
          ) : (
            <div className="mh-status-list">
              {stats.statusCounts.map(({ status, count }) => {
                const cfg = WO_STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
                const pct = stats.totalWOs > 0 ? Math.round((count / stats.totalWOs) * 100) : 0;
                return (
                  <div key={status} className="mh-status-row">
                    <div className="mh-status-label-wrap">
                      <span className="mh-status-pill" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <span className="mh-status-count">{count}</span>
                    </div>
                    <div className="mh-progress-bg">
                      <div className="mh-progress-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                    <span className="mh-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manufactured Value box */}
          <div className="mh-value-box">
            <div className="mh-value-label">Total Manufactured Value</div>
            <div className="mh-value-num">{formatUang(stats.manufacturedValue)}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spinBadge { to { transform: rotate(360deg); } }

        .mh-root { font-family: 'Poppins', sans-serif; animation: fadeSlideUp 0.4s ease-out; }

        .mh-loading { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .mh-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .mh-loading p { font-size: 13px; color: #6b7280; }

        .mh-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 12px; }
        .mh-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .mh-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .mh-header-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #d97706; background: #fef3c7; border: 1px solid #fde68a; padding: 6px 12px; border-radius: 20px; }
        .mh-badge-spin { animation: spinBadge 3s linear infinite; }

        .mh-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }

        .mh-stat-card {
          background: white;
          border-radius: 16px;
          padding: 18px 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          animation: fadeSlideUp 0.4s ease-out both;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mh-stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .mh-stat-icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .mh-stat-label { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .mh-stat-value { font-size: 22px; font-weight: 800; line-height: 1.2; }

        .mh-two-col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }

        .mh-card {
          background: white;
          border-radius: 18px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        .mh-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
        .mh-card-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .mh-card-subtitle { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .mh-pill { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }

        .mh-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 36px; color: #9ca3af; font-size: 13px; }

        .mh-status-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .mh-status-row { display: flex; align-items: center; gap: 10px; }
        .mh-status-label-wrap { display: flex; align-items: center; gap: 8px; width: 130px; flex-shrink: 0; }
        .mh-status-pill { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
        .mh-status-count { font-size: 12px; font-weight: 800; color: #0f172a; }
        .mh-progress-bg { flex: 1; height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .mh-progress-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
        .mh-pct { font-size: 10px; font-weight: 700; color: #94a3b8; width: 28px; text-align: right; flex-shrink: 0; }

        .mh-value-box { background: linear-gradient(135deg,#fffbeb,#fef3c7); border-radius: 12px; padding: 14px 16px; margin-top: 8px; }
        .mh-value-label { font-size: 11px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .mh-value-num { font-size: 18px; font-weight: 800; color: #d97706; }

        @media (max-width: 1100px) { .mh-stats-grid { grid-template-columns: repeat(2, 1fr); } .mh-two-col { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .mh-stats-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}