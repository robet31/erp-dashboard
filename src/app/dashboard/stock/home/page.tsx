'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStockData } from '@/hooks/useFrappeData';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/providers/settings-provider';
import { Filter, MoreHorizontal, Loader2, Info } from 'lucide-react';
import { HomeSkeleton } from '@/components/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getWarehousesByCompany } from '@/config/frappe-data';

const FIXED_COMPANY = 'Artavista';
const BAR_COLOR = '#e8a0bf';

const formatRp = (v: any) => {
  const n = Number(v); if (!v || isNaN(n)) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
  return new Intl.NumberFormat('id-ID').format(n);
};
const formatNum = (v: any, lang: string = 'id') => {
  const n = Number(v); if (!v || isNaN(n)) return '0';
  if (lang === 'id') return new Intl.NumberFormat('id-ID').format(n);
  return new Intl.NumberFormat('en-US').format(n);
};
const formatFull = (v: any) => {
  const n = Number(v); if (!v || isNaN(n)) return 'Rp 0';
  return `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
};

const TXT: Record<string, Record<string, string>> = {
  id: {
    title: 'Stock',
    subtitle: 'Modul Inventaris — Pantau stok dan nilai inventaris Artavista',
    stockByGroup: 'Nilai Stok per Grup Barang',
    stockByGroupSub: 'Last synced',
    totalStockValue: 'Total Nilai Stok',
    totalWarehouses: 'Total Gudang',
    totalActiveItems: 'Total Item Aktif',
    stockInsight: 'Nilai total barang tersimpan di seluruh gudang',
    whInsight: 'gudang aktif menampung stok',
    itemInsight: 'item terdaftar dan siap transaksi',
    chartInsight: 'Distribusi nilai stok per kategori — identifikasi kelompok barang bernilai tinggi',
    unitGudang: 'Gudang', unitItem: 'Item',
    noData: 'Belum ada data stok',
    lastYear: 'Setahun Terakhir',
    lastQuarter: 'Kuartal Terakhir',
    lastMonth: 'Bulan Terakhir',
    monthly: 'Bulanan',
  },
  en: {
    title: 'Stock',
    subtitle: 'Inventory Module — Monitor stock and inventory value for Artavista',
    stockByGroup: 'Stock Value by Item Group',
    stockByGroupSub: 'Last synced',
    totalStockValue: 'Total Stock Value',
    totalWarehouses: 'Total Warehouses',
    totalActiveItems: 'Total Active Items',
    stockInsight: 'Total value of goods stored across all warehouses',
    whInsight: 'active warehouses holding stock',
    itemInsight: 'items registered and ready to transact',
    chartInsight: 'Stock value distribution by category — identify high-value item groups',
    unitGudang: 'Warehouses', unitItem: 'Items',
    noData: 'No stock data available',
    lastYear: 'Last Year',
    lastQuarter: 'Last Quarter',
    lastMonth: 'Last Month',
    monthly: 'Monthly',
  },
};

export default function StockHomePage() {
  const router = useRouter();
  const { items, bins, isLoading } = useStockData();
  const { settings } = useSettings();
  const lang = settings.language || 'id';
  const t = TXT[lang] || TXT.id;
  const warehouses = getWarehousesByCompany(FIXED_COMPANY);
  const [localLedger, setLocalLedger] = useState<Record<string, number>>({});

  useEffect(() => {
    const l = localStorage.getItem('erp_mock_stock_ledger');
    if (l) { try { setLocalLedger(JSON.parse(l)); } catch {} }
  }, []);

  const stats = useMemo(() => {
    const totalActiveItems = items.filter((i: any) => !i.disabled).length;
    const totalWarehouses = warehouses.length;

    const binMap: Record<string, any> = {};
    bins.forEach((b: any) => { binMap[`${b.item_code}_${b.warehouse}`] = { ...b, actual_qty: Number(b.actual_qty) || 0 }; });
    Object.entries(localLedger).forEach(([key, qty]) => {
      if (binMap[key]) { binMap[key].actual_qty += Number(qty); }
      else { const [item_code, warehouse] = key.split('_'); binMap[key] = { item_code, warehouse, actual_qty: Number(qty) }; }
    });

    const simulatedBins = Object.values(binMap).map((b: any) => {
      const item = items.find((i: any) => i.item_code === b.item_code);
      return { ...b, stock_value: b.actual_qty * (item?.standard_rate || 0), item_group: item?.item_group || 'Products' };
    });

    let totalStockValue = 0;
    const groupData: Record<string, number> = {};
    simulatedBins.forEach((b: any) => {
      const val = Number(b.stock_value) || 0;
      totalStockValue += val;
      groupData[b.item_group] = (groupData[b.item_group] || 0) + val;
    });

    const stockByGroup = Object.entries(groupData)
      .map(([name, value]) => ({ name: name.length > 12 ? name.substring(0, 10) + '...' : name, fullName: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return { totalActiveItems, totalWarehouses, totalStockValue, stockByGroup };
  }, [items, warehouses, bins, localLedger]);

  if (isLoading) return <HomeSkeleton />;

  return (
    <div className="fhome">
      {/* ── Module Title ── */}
      <div className="fhome-header">
        <h1 className="fhome-title">{t.title}</h1>
        <p className="fhome-subtitle">{t.subtitle}</p>
      </div>

      {/* ── Stock Value by Item Group Chart ── */}
      <div className="fhome-chart-card">
        <div className="fhome-chart-head">
          <div>
            <div className="fhome-chart-title">{t.stockByGroup}</div>
            <div className="fhome-chart-sub">{t.stockByGroupSub}</div>
          </div>
          <div className="fhome-chart-actions">
            <select className="fhome-select"><option>{t.lastYear}</option><option>{t.lastQuarter}</option><option>{t.lastMonth}</option></select>
            <select className="fhome-select"><option>{t.monthly}</option></select>

          </div>
        </div>
        <div className="fhome-chart-body">
          {stats.stockByGroup.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.stockByGroup} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis width={55} tickFormatter={v => formatRp(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any, name: any, props: any) => [formatFull(v), props.payload.fullName || 'Value']} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb', fontFamily: 'Poppins' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={40} fill={BAR_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="fhome-empty">{t.noData}</div>}
        </div>
        <div className="fhome-nc-footer" style={{ margin: 0, padding: '10px 16px' }}><Info size={12} /><span>{t.chartInsight}</span></div>
      </div>

      {/* ── 3 Number Cards ── */}
      <div className="fhome-cards-row fhome-cards-3">
        <div className="fhome-nc" onClick={() => router.push('/dashboard/stock?tab=items')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.totalStockValue}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatFull(stats.totalStockValue)}</div>
          <div className="fhome-nc-footer"><Info size={12} /><span>{t.stockInsight}</span></div>
        </div>
        <div className="fhome-nc" onClick={() => router.push('/dashboard/stock?tab=warehouse')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.totalWarehouses}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatNum(stats.totalWarehouses, lang)} <span className="fhome-nc-unit">{t.unitGudang}</span></div>
          <div className="fhome-nc-footer"><Info size={12} /><span>{stats.totalWarehouses} {t.whInsight}</span></div>
        </div>
        <div className="fhome-nc" onClick={() => router.push('/dashboard/stock?tab=items')}>
          <div className="fhome-nc-head"><span className="fhome-nc-label">{t.totalActiveItems}</span><MoreHorizontal size={16} className="fhome-nc-more" /></div>
          <div className="fhome-nc-value">{formatNum(stats.totalActiveItems, lang)} <span className="fhome-nc-unit">{t.unitItem}</span></div>
          <div className="fhome-nc-footer"><Info size={12} /><span>{stats.totalActiveItems} {t.itemInsight}</span></div>
        </div>
      </div>

      <style>{`
        .fhome { font-family: 'Poppins', sans-serif; animation: fhFadeIn 0.3s ease-out; }
        @keyframes fhFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fhSpin { to { transform: rotate(360deg); } }
        .fhome-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; }
        .fhome-spin { animation: fhSpin 0.8s linear infinite; color: #10b981; }
        .fhome-loading p { color: #6b7280; font-size: 13px; }

        .fhome-header { margin-bottom: 20px; }
        .fhome-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .fhome-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

        .fhome-cards-row { display: grid; gap: 14px; margin-bottom: 18px; }
        .fhome-cards-3 { grid-template-columns: repeat(3, 1fr); }
        .fhome-nc { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; }
        .fhome-nc:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-color: #d1d5db; }
        .fhome-nc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .fhome-nc-label { font-size: 12px; font-weight: 500; color: #6b7280; }
        .fhome-nc-more { color: #d1d5db; cursor: pointer; }
        .fhome-nc-value { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px; display: flex; align-items: baseline; gap: 6px; }
        .fhome-nc-unit { font-size: 13px; font-weight: 500; color: #9ca3af; }
        .fhome-nc-footer { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 8px; }

        .fhome-chart-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 18px; overflow: hidden; }
        .fhome-chart-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px; }
        .fhome-chart-title { font-size: 14px; font-weight: 600; color: #111827; }
        .fhome-chart-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .fhome-chart-actions { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
        .fhome-filter-btn { background: transparent; border: 1px solid #e5e7eb; border-radius: 6px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6b7280; transition: all 0.15s; }
        .fhome-filter-btn:hover { background: #f9fafb; color: #374151; }
        .fhome-chart-body { padding: 18px 20px; }

        .fhome-select { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Poppins', sans-serif; }
        .fhome-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }

        @media (max-width: 768px) {
          .fhome-cards-3 { grid-template-columns: 1fr; }
          .fhome-chart-head { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}