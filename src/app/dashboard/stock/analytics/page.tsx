'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStockData, useSellingData } from '@/hooks/useFrappeData';
import { useSettings } from '@/providers/settings-provider';
import { Info, Loader2 } from 'lucide-react';
import { AnalyticsSkeleton } from '@/components/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { formatDate } from '@/lib/utils';
import { getWarehousesByCompany } from '@/config/frappe-data';

const COLOR_PRIMARY = '#054CC7';
const COLOR_SECONDARY = '#17C3CC';
const TREND_COLOR_1 = '#8b5cf6';
const TREND_COLOR_2 = '#0ea5e9';
const FIXED_COMPANY = 'Artavista';

const formatUang = (v: any) => {
  if (!v) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(v));
};
const formatShort = (v: any) => {
  const n = Number(v); if (!v || isNaN(n)) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toString();
};

const TXT: Record<string, Record<string, string>> = {
  id: {
    title: 'Dashboard Inventaris',
    subtitle: 'Analisis stok dan pergerakan barang gudang Artavista',
    activeItems: 'Item Aktif', activeItemsInsight: 'Jumlah item terdaftar yang aktif di sistem',
    warehouses: 'Total Gudang', warehousesInsight: 'Gudang operasional Artavista',
    totalValue: 'Total Nilai Stok', totalValueInsight: 'Nilai total barang tersimpan di seluruh gudang',
    unitItem: 'Item', unitGudang: 'Gudang',
    whValue: 'Nilai Stok per Gudang', whValueInsight: 'Distribusi nilai stok — identifikasi gudang dengan konsentrasi tinggi',
    receiptTrend: 'Tren Penerimaan Barang', receiptInsight: 'Frekuensi mutasi masuk — pantau pola pengadaan',
    deliveryTrend: 'Tren Pengiriman Barang', deliveryInsight: 'Frekuensi pengiriman — pantau efisiensi distribusi',
    oldestItems: 'Item Terlama Terdaftar', oldestInsight: 'Review item lama untuk evaluasi perputaran stok',
    lowStock: 'Peringatan Stok Rendah (≤ 15)', lowStockInsight: 'Segera lakukan restock untuk menghindari kehabisan',
    allStockSafe: '✅ Stok semua item di gudang terpantau aman.',
    noData: 'Belum ada data',
    loading: 'Memuat dashboard inventaris...',
    lastYear: 'Setahun Terakhir', lastQuarter: 'Kuartal Terakhir', lastMonth: 'Bulan Terakhir',
    allWarehouses: 'Semua Gudang',
    created: 'Dibuat',
  },
  en: {
    title: 'Inventory Dashboard',
    subtitle: 'Analyze stock and warehouse movement for Artavista',
    activeItems: 'Active Items', activeItemsInsight: 'Number of active registered items in the system',
    warehouses: 'Total Warehouses', warehousesInsight: 'Operational warehouses of Artavista',
    totalValue: 'Total Stock Value', totalValueInsight: 'Total value of goods stored across all warehouses',
    unitItem: 'Items', unitGudang: 'Warehouses',
    whValue: 'Stock Value by Warehouse', whValueInsight: 'Stock value distribution — identify warehouses with high concentration',
    receiptTrend: 'Material Receipt Trends', receiptInsight: 'Inbound frequency — monitor procurement patterns',
    deliveryTrend: 'Delivery Trends', deliveryInsight: 'Delivery frequency — monitor distribution efficiency',
    oldestItems: 'Oldest Registered Items', oldestInsight: 'Review old items for stock turnover evaluation',
    lowStock: 'Low Stock Warning (≤ 15)', lowStockInsight: 'Restock immediately to avoid stockouts',
    allStockSafe: '✅ All item stock in warehouses is safe.',
    noData: 'No data available',
    loading: 'Loading inventory dashboard...',
    lastYear: 'Last Year', lastQuarter: 'Last Quarter', lastMonth: 'Last Month',
    allWarehouses: 'All Warehouses',
    created: 'Created',
  },
};

function FilterDropdown({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return <select className="da-select" value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function CardInsight({ text }: { text: string }) {
  return <div className="da-card-insight"><Info size={12} /><span>{text}</span></div>;
}

export default function StockAnalyticsPage() {
  const { items, bins, stockEntries, isLoading: isStockLoading } = useStockData();
  const { deliveryNotes, isLoading: isSellingLoading } = useSellingData();
  const warehouses = getWarehousesByCompany(FIXED_COMPANY);
  const { settings } = useSettings();
  const lang = settings.language || 'id';
  const t = TXT[lang] || TXT.id;

  const [whFilter, setWhFilter] = useState('all');
  const [receiptRange, setReceiptRange] = useState('lastYear');
  const [deliveryRange, setDeliveryRange] = useState('lastYear');

  const [localLedger, setLocalLedger] = useState<Record<string, number>>({});
  const [localEntryStatus, setLocalEntryStatus] = useState<Record<string, number>>({});
  const [localDNStatus, setLocalDNStatus] = useState<Record<string, number>>({});

  useEffect(() => {
    try { const l = localStorage.getItem('erp_mock_stock_ledger'); if (l) setLocalLedger(JSON.parse(l)); } catch {}
    try { const e = localStorage.getItem('erp_mock_stock_entry_status'); if (e) setLocalEntryStatus(JSON.parse(e)); } catch {}
    try { const d = localStorage.getItem('erp_mock_dn_status'); if (d) setLocalDNStatus(JSON.parse(d)); } catch {}
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
      return { ...b, stock_value: b.actual_qty * (item?.standard_rate || 0) };
    });
    const nvBins = simulatedBins.filter((b: any) => b.warehouse.includes(FIXED_COMPANY) || b.warehouse.includes('- NV') || b.warehouse.includes('- A'));

    let totalStockValue = 0;
    const whValues: Record<string, number> = {};
    warehouses.forEach(w => whValues[w.name.split(' - ')[0]] = 0);
    nvBins.forEach((b: any) => {
      const val = Number(b.stock_value) || 0; totalStockValue += val;
      const whName = b.warehouse.split(' - ')[0];
      if (whValues[whName] !== undefined) whValues[whName] += val;
    });
    let whStockValue = Object.entries(whValues).map(([name, value]) => ({ name, value })).filter(w => w.value > 0);
    if (whFilter !== 'all') whStockValue = whStockValue.filter(w => w.name === whFilter);

    // Receipt trends
    const overriddenEntries = stockEntries.map((se: any) => ({ ...se, docstatus: localEntryStatus[se.name] !== undefined ? localEntryStatus[se.name] : se.docstatus }));
    const nvEntries = overriddenEntries.filter((se: any) => (!se.company || se.company === FIXED_COMPANY) && se.docstatus === 1 && se.stock_entry_type === 'Material Receipt');
    const receiptMap: Record<string, number> = {};
    nvEntries.forEach((se: any) => { if (!se.posting_date) return; const m = new Date(se.posting_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); receiptMap[m] = (receiptMap[m] || 0) + 1; });
    let receiptTrends = Object.entries(receiptMap).map(([month, value]) => ({ month, value })).sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());
    if (receiptRange === 'lastMonth') receiptTrends = receiptTrends.slice(-1);
    else if (receiptRange === 'lastQuarter') receiptTrends = receiptTrends.slice(-3);

    // Delivery trends
    const overriddenDNs = deliveryNotes.map((dn: any) => ({ ...dn, docstatus: localDNStatus[dn.name] !== undefined ? localDNStatus[dn.name] : dn.docstatus }));
    const nvDeliveries = overriddenDNs.filter((dn: any) => (!dn.company || dn.company === FIXED_COMPANY) && dn.docstatus === 1 && Number(dn.is_return) !== 1);
    const deliveryMap: Record<string, number> = {};
    nvDeliveries.forEach((dn: any) => { if (!dn.posting_date) return; const m = new Date(dn.posting_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); deliveryMap[m] = (deliveryMap[m] || 0) + 1; });
    let deliveryTrends = Object.entries(deliveryMap).map(([month, value]) => ({ month, value })).sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());
    if (deliveryRange === 'lastMonth') deliveryTrends = deliveryTrends.slice(-1);
    else if (deliveryRange === 'lastQuarter') deliveryTrends = deliveryTrends.slice(-3);

    const oldestItems = [...items].filter((i: any) => i.is_stock_item).sort((a: any, b: any) => new Date(a.creation).getTime() - new Date(b.creation).getTime()).slice(0, 5);
    const shortageItems = nvBins.filter((b: any) => Number(b.actual_qty) > 0 && Number(b.actual_qty) <= 15).map((b: any) => ({ name: b.item_code, value: Number(b.actual_qty) })).sort((a, b) => a.value - b.value).slice(0, 5);

    return { totalActiveItems, totalWarehouses, totalStockValue, whStockValue, receiptTrends, deliveryTrends, oldestItems, shortageItems };
  }, [items, warehouses, bins, stockEntries, deliveryNotes, localLedger, localEntryStatus, localDNStatus, whFilter, receiptRange, deliveryRange]);

  if (isStockLoading || isSellingLoading) return <AnalyticsSkeleton cards={3} />;

  const whOptions = [{ label: t.allWarehouses, value: 'all' }, ...warehouses.map(w => ({ label: w.name.split(' - ')[0], value: w.name.split(' - ')[0] }))];
  const rangeOpts = [{ label: t.lastYear, value: 'lastYear' }, { label: t.lastQuarter, value: 'lastQuarter' }, { label: t.lastMonth, value: 'lastMonth' }];

  return (
    <div className="da-root">
      <div className="da-header"><h1 className="da-title">{t.title}</h1><p className="da-subtitle">{t.subtitle}</p></div>

      {/* ── 3 Number Cards ── */}
      <div className="da-cards-3">
        <div className="da-nc"><div className="da-nc-label">{t.activeItems}</div><div className="da-nc-value">{stats.totalActiveItems} <span className="da-nc-unit">{t.unitItem}</span></div><CardInsight text={t.activeItemsInsight} /></div>
        <div className="da-nc"><div className="da-nc-label">{t.warehouses}</div><div className="da-nc-value">{stats.totalWarehouses} <span className="da-nc-unit">{t.unitGudang}</span></div><CardInsight text={t.warehousesInsight} /></div>
        <div className="da-nc"><div className="da-nc-label">{t.totalValue}</div><div className="da-nc-value" style={{ color: COLOR_PRIMARY }}>{formatUang(stats.totalStockValue)}</div><CardInsight text={t.totalValueInsight} /></div>
      </div>

      {/* ── Warehouse Stock Value ── */}
      <div className="da-chart-card">
        <div className="da-chart-head"><div className="da-chart-title">{t.whValue}</div>
          <div className="da-chart-actions"><FilterDropdown value={whFilter} onChange={setWhFilter} options={whOptions} /></div>
        </div>
        <div className="da-chart-body">
          {stats.whStockValue.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.whStockValue} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis width={80} tickFormatter={v => formatShort(v)} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => formatUang(v)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
                <Bar dataKey="value" name="Total Value" fill={COLOR_SECONDARY} barSize={50} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="da-empty">{t.noData}</div>}
        </div>
        <CardInsight text={t.whValueInsight} />
      </div>

      {/* ── 2 Col: Receipt + Delivery Trends ── */}
      <div className="da-2col">
        <div className="da-chart-card">
          <div className="da-chart-head"><div className="da-chart-title">{t.receiptTrend}</div>
            <div className="da-chart-actions"><FilterDropdown value={receiptRange} onChange={setReceiptRange} options={rangeOpts} /></div>
          </div>
          <div className="da-chart-body">
            {stats.receiptTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.receiptTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="cRcpt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TREND_COLOR_1} stopOpacity={0.2} /><stop offset="95%" stopColor={TREND_COLOR_1} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
                  <Area type="monotone" dataKey="value" name="Receipts" fill="url(#cRcpt)" stroke={TREND_COLOR_1} strokeWidth={2} activeDot={{ r: 5, fill: TREND_COLOR_1 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="da-empty">{t.noData}</div>}
          </div>
          <CardInsight text={t.receiptInsight} />
        </div>

        <div className="da-chart-card">
          <div className="da-chart-head"><div className="da-chart-title">{t.deliveryTrend}</div>
            <div className="da-chart-actions"><FilterDropdown value={deliveryRange} onChange={setDeliveryRange} options={rangeOpts} /></div>
          </div>
          <div className="da-chart-body">
            {stats.deliveryTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.deliveryTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="cDlv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TREND_COLOR_2} stopOpacity={0.2} /><stop offset="95%" stopColor={TREND_COLOR_2} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
                  <Area type="monotone" dataKey="value" name="Deliveries" fill="url(#cDlv)" stroke={TREND_COLOR_2} strokeWidth={2} activeDot={{ r: 5, fill: TREND_COLOR_2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="da-empty">{t.noData}</div>}
          </div>
          <CardInsight text={t.deliveryInsight} />
        </div>
      </div>

      {/* ── 2 Col: Oldest Items + Low Stock ── */}
      <div className="da-2col">
        <div className="da-chart-card">
          <div className="da-chart-head"><div className="da-chart-title">{t.oldestItems}</div></div>
          <div className="da-chart-body">
            {stats.oldestItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.oldestItems.map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8f9fb', borderRadius: '8px' }}>
                    <div><div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{item.item_code}</div><div style={{ fontSize: '10px', color: '#6B7280' }}>{t.created}: {formatDate(item.creation)}</div></div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: COLOR_PRIMARY }}>{item.item_group}</div>
                  </div>
                ))}
              </div>
            ) : <div className="da-empty">{t.noData}</div>}
          </div>
          <CardInsight text={t.oldestInsight} />
        </div>

        <div className="da-chart-card">
          <div className="da-chart-head"><div className="da-chart-title">{t.lowStock}</div></div>
          <div className="da-chart-body">
            {stats.shortageItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.shortageItems} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#111827', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
                  <Bar dataKey="value" name="Stock" fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: '40px', textAlign: 'center', color: '#10b981', fontSize: '13px', fontWeight: 600, background: '#ecfdf5', borderRadius: '8px' }}>{t.allStockSafe}</div>}
          </div>
          <CardInsight text={t.lowStockInsight} />
        </div>
      </div>

      <style>{`
        .da-root { font-family: 'Poppins', sans-serif; animation: daFadeIn 0.3s ease-out; }
        @keyframes daFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes daSpin { to { transform: rotate(360deg); } }
        .da-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 12px; }
        .da-spin { animation: daSpin 0.8s linear infinite; color: #3b82f6; }
        .da-loading p { color: #6b7280; font-size: 13px; font-family: 'Poppins', sans-serif; }
        .da-header { margin-bottom: 20px; }
        .da-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .da-subtitle { font-size: 13px; color: #6b7280; margin: 0; }
        .da-cards-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
        .da-nc { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; overflow: hidden; }
        .da-nc-label { font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px; }
        .da-nc-value { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 8px; display: flex; align-items: baseline; gap: 6px; }
        .da-nc-unit { font-size: 13px; font-weight: 500; color: #9ca3af; }
        .da-chart-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 18px; overflow: hidden; }
        .da-chart-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px; }
        .da-chart-title { font-size: 14px; font-weight: 600; color: #111827; }
        .da-chart-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .da-chart-body { padding: 18px 20px; }
        .da-select { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'Poppins', sans-serif; }
        .da-select:hover { border-color: #054CC7; }
        .da-card-insight { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #9ca3af; padding: 10px 16px; border-top: 1px solid #f3f4f6; }
        .da-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .da-empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 13px; }
        @media (max-width: 900px) { .da-cards-3 { grid-template-columns: 1fr; } .da-2col { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}