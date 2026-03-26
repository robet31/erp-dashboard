'use client';

import React, { useMemo } from 'react';
import { useStockData, useSellingData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal, Calendar as CalIcon, Loader2, AlertTriangle } from 'lucide-react';
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
const FIXED_COMPANY = 'Netra Vidya';

const formatUang = (value: number | string | undefined | any) => {
  if (!value) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value));
};

export default function StockAnalyticsPage() {
  const { items, bins, stockEntries, isLoading: isStockLoading } = useStockData();
  const { deliveryNotes, isLoading: isSellingLoading } = useSellingData();
  const warehouses = getWarehousesByCompany(FIXED_COMPANY);

  const stats = useMemo(() => {
    const totalActiveItems = items.filter((i: any) => !i.disabled).length;
    const totalWarehouses = warehouses.length;

    // 1. MENGHITUNG STOK REALISTIS MURNI MILIK NETRA VIDYA
    const nvBins = bins.filter((b: any) => b.warehouse.includes(FIXED_COMPANY) || b.warehouse.includes('- NV'));
    
    let totalStockValue = 0;
    const whValues: Record<string, number> = {};

    warehouses.forEach(w => whValues[w.name.split(' - ')[0]] = 0); // Init 0

    // Hitung murni dari Bins Asli (Server)
    nvBins.forEach((b: any) => {
      const val = Number(b.stock_value) || 0;
      totalStockValue += val;
      const whName = b.warehouse.split(' - ')[0];
      if(whValues[whName] !== undefined) whValues[whName] += val;
    });

    const whStockValue = Object.entries(whValues)
      .map(([name, value]) => ({ name, value }))
      .filter(w => w.value > 0); // Sembunyikan gudang yang Rp 0

    // 2. REAL Purchase Receipt Trends (Berdasarkan jumlah mutasi Material Receipt per bulan)
    const receiptMap: Record<string, number> = {};
    const nvStockEntries = stockEntries.filter((se: any) => se.company === FIXED_COMPANY && se.docstatus === 1 && se.stock_entry_type === 'Material Receipt');
    
    nvStockEntries.forEach((se: any) => {
      if (!se.posting_date) return;
      const month = new Date(se.posting_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      receiptMap[month] = (receiptMap[month] || 0) + 1;
    });

    const receiptTrends = Object.entries(receiptMap)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());

    // 3. REAL Delivery Trends (Berdasarkan jumlah Surat Jalan keluar per bulan)
    const deliveryMap: Record<string, number> = {};
    const nvDeliveries = deliveryNotes.filter((dn: any) => dn.company === FIXED_COMPANY && dn.docstatus === 1 && dn.is_return !== 1);
    
    nvDeliveries.forEach((dn: any) => {
      if (!dn.posting_date) return;
      const month = new Date(dn.posting_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      deliveryMap[month] = (deliveryMap[month] || 0) + 1;
    });

    const deliveryTrends = Object.entries(deliveryMap)
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());

    // 4. REAL Oldest Items (Item Paling Lama Dibuat)
    const oldestItems = [...items]
      .filter((i: any) => i.is_stock_item)
      .sort((a: any, b: any) => new Date(a.creation).getTime() - new Date(b.creation).getTime())
      .slice(0, 5);

    // 5. REAL Item Shortage Summary (Barang yang sisa sedikit di gudang)
    const shortageItems = nvBins
      .filter((b: any) => Number(b.actual_qty) > 0 && Number(b.actual_qty) <= 15)
      .map((b: any) => ({ name: b.item_code, value: Number(b.actual_qty) }))
      .sort((a: any, b: any) => a.value - b.value)
      .slice(0, 5);

    return { totalActiveItems, totalWarehouses, totalStockValue, whStockValue, receiptTrends, deliveryTrends, oldestItems, shortageItems };
  }, [items, warehouses, bins, stockEntries, deliveryNotes]);

  if (isStockLoading || isSellingLoading) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat analitik murni ERPNext...</p></div>;

  const CardHeader = ({ title, subtitle }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12}/> {subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Total Active Items</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{stats.totalActiveItems}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Total Warehouses</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>{stats.totalWarehouses}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>Total Stock Value (Netra Vidya)</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(stats.totalStockValue)}</div>
        </div>
      </div>

      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Warehouse wise Stock Value</h3>
          <span style={{ fontSize: '11px', color: '#6B7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Data Aktual ERPNext</span>
        </div>

        {stats.whStockValue.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.whStockValue} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: any) => formatUang(v).replace(/,\d{2}/, '')} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={100} />
              {/* FIX: Formatter casting to any */}
              <Tooltip formatter={(value: any) => formatUang(value)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" name="Total Value" fill={COLOR_SECONDARY} barSize={60} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', height: '250px', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px', background: '#f8fafc', borderRadius: '8px' }}>
            Belum ada stok barang bernilai di gudang.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container">
          <CardHeader title="Material Receipt Trends" subtitle="Frekuensi penerimaan barang per bulan" />
          {stats.receiptTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.receiptTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorReceipt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TREND_COLOR_1} stopOpacity={0.2} /><stop offset="95%" stopColor={TREND_COLOR_1} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [`${v} Transaksi`, 'Mutasi Masuk']} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" name="Receipts" fill="url(#colorReceipt)" stroke={TREND_COLOR_1} strokeWidth={2} activeDot={{ r: 6, fill: TREND_COLOR_1 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '220px', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>Belum ada histori penerimaan barang.</div>
          )}
        </div>
        
        <div className="chart-container">
          <CardHeader title="Delivery Trends" subtitle="Frekuensi pengiriman barang per bulan" />
          {stats.deliveryTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.deliveryTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TREND_COLOR_2} stopOpacity={0.2} /><stop offset="95%" stopColor={TREND_COLOR_2} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [`${v} Pengiriman`, 'Dikirim']} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" name="Deliveries" fill="url(#colorDelivery)" stroke={TREND_COLOR_2} strokeWidth={2} activeDot={{ r: 6, fill: TREND_COLOR_2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '220px', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>Belum ada histori pengiriman barang.</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        
        {/* Oldest Items List */}
        <div className="chart-container">
          <CardHeader title="Oldest Registered Items" />
          {stats.oldestItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.oldestItems.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fb', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{item.item_code}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>Created: {formatDate(item.creation)}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: COLOR_PRIMARY }}>{item.item_group}</div>
                </div>
              ))}
            </div>
          ) : (
             <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>No Data</div>
          )}
        </div>

        {/* Item Low Stock Summary */}
        <div className="chart-container">
          <CardHeader title="Low Stock Warning (<= 15 Unit)" subtitle="Daftar item yang harus segera di-restock" />
          {stats.shortageItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.shortageItems} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#111827', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [`${v} Unit tersisa`, 'Stok']} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Current Stock" fill="#ef4444" barSize={24} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '13px', background: '#ecfdf5', borderRadius: '8px', fontWeight: 600 }}>✅ Stok semua item di gudang terpantau aman.</div>
          )}
        </div>
        
      </div>
    </div>
  );
}