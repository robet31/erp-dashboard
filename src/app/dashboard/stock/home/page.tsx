'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStockData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getWarehousesByCompany } from '@/config/frappe-data';

const COLOR_PRIMARY = '#054CC7';
const FIXED_COMPANY = 'Netra Vidya';

const formatUang = (value: number | string | undefined | any) => {
  if (!value) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value));
};

// Fungsi khusus agar angka di sumbu Y (YAxis) lebih ringkas dan muat di layar
const formatUangSingkat = (value: number | string | undefined | any) => {
  if (!value) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  
  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(1)} M`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(0)} Jt`;
  }
  return formatUang(num);
};

export default function StockHomePage() {
  const { items, bins, isLoading } = useStockData();
  const warehouses = getWarehousesByCompany(FIXED_COMPANY);

  // STATE UNTUK MEMBACA PROGRESS GOD MODE LOKAL
  const [localLedger, setLocalLedger] = useState<Record<string, number>>({});

  useEffect(() => {
    const l = localStorage.getItem('erp_mock_stock_ledger'); if(l) setLocalLedger(JSON.parse(l));
  }, []);

  const stats = useMemo(() => {
    const totalActiveItems = items.filter((i: any) => !i.disabled).length;
    const totalWarehouses = warehouses.length;
    
    // SIMULATED BINS (Menggabungkan data ERPNext dengan Local God Mode)
    const binMap: Record<string, any> = {};
    bins.forEach((b: any) => {
      binMap[`${b.item_code}_${b.warehouse}`] = { ...b, actual_qty: Number(b.actual_qty) || 0 };
    });
    Object.entries(localLedger).forEach(([key, qty]) => {
      if (binMap[key]) {
        binMap[key].actual_qty += Number(qty);
      } else {
        const [item_code, warehouse] = key.split('_');
        binMap[key] = { item_code, warehouse, actual_qty: Number(qty) };
      }
    });

    const simulatedBins = Object.values(binMap).map((b: any) => {
      const item = items.find((i: any) => i.item_code === b.item_code);
      const rate = item?.standard_rate || 0;
      return { ...b, stock_value: b.actual_qty * rate };
    });

    // MENGHITUNG STOK REALISTIS MURNI MILIK NETRA VIDYA
    const nvBins = simulatedBins.filter((b: any) => b.warehouse.includes(FIXED_COMPANY) || b.warehouse.includes('- NV'));
    
    let totalStockValue = 0;
    const groupData: Record<string, number> = {};

    // Hitung murni dari Bins Simulasi
    nvBins.forEach((b: any) => {
      const val = Number(b.stock_value) || 0;
      totalStockValue += val;
      const itemGroup = items.find((i:any) => i.item_code === b.item_code)?.item_group || 'Products';
      groupData[itemGroup] = (groupData[itemGroup] || 0) + val;
    });

    const stockByGroup = Object.entries(groupData).map(([name, value]) => ({ name, value }));

    return { totalActiveItems, totalWarehouses, totalStockValue, stockByGroup };
  }, [items, warehouses, bins, localLedger]);

  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><Loader2 className="animate-spin" size={32} color={COLOR_PRIMARY} style={{ margin: '0 auto 16px' }} /><p style={{ color: '#6B7280', fontSize: '13px' }}>Memuat data Home...</p></div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Stock Value by Item Group</h3>
          <span style={{ fontSize: '11px', color: '#6B7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Khusus Netra Vidya</span>
        </div>
        
        {/* Render if there is actual data */}
        {stats.stockByGroup.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.stockByGroup} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis width={80} tickFormatter={(v: any) => formatUangSingkat(v)} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: any) => formatUang(value)} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" name="Total Value" fill={COLOR_PRIMARY} barSize={80} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px', background: '#f8fafc', borderRadius: '8px' }}>
            Belum ada stok barang di Gudang. Nilai Gudang: Rp 0
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Stock Value (Netra Vidya)</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: COLOR_PRIMARY, marginTop: '8px' }}>{formatUang(stats.totalStockValue)}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Warehouses</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '8px' }}>{stats.totalWarehouses}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Active Items</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '8px' }}>{stats.totalActiveItems}</div>
        </div>
      </div>
    </div>
  );
}