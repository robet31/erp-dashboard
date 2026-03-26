'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSellingData, useDashboardData } from '@/hooks/useFrappeData';
import { Filter, MoreHorizontal } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLOR_PRIMARY = '#054CC7';

const formatUang = (value: number | string | undefined) => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
};

export default function SellingHomePage() {
  const { salesOrders, isLoading } = useSellingData();
  const { revenueTrend } = useDashboardData();

  // STATE UNTUK SMART BYPASS
  const [localDocStatus, setLocalDocStatus] = useState<Record<string, number>>({});
  const [localSOProgress, setLocalSOProgress] = useState<Record<string, { delivered: number, billed: number }>>({});

  useEffect(() => {
    const savedStatus = localStorage.getItem('erp_mock_selling_status');
    if (savedStatus) { try { setLocalDocStatus(JSON.parse(savedStatus)); } catch (e) {} }
    const savedProgress = localStorage.getItem('erp_mock_so_progress');
    if (savedProgress) { try { setLocalSOProgress(JSON.parse(savedProgress)); } catch (e) {} }
  }, []);

  const dynamicRevenueTrend = useMemo(() => {
    const targetPatterns = [500000000, 450000000, 600000000, 550000000, 750000000, 800000000];
    return revenueTrend.map((item, index) => ({
      ...item,
      target: targetPatterns[index % targetPatterns.length]
    }));
  }, [revenueTrend]);

  // TERAPKAN SMART BYPASS KE DATA SALES ORDER
  const patchedSalesOrders = useMemo(() => {
    return salesOrders.map(so => {
      const localStatus = localDocStatus[so.name];
      const progress = localSOProgress[so.name] || { delivered: 0, billed: 0 };
      
      let finalDelivered = progress.delivered > 0 ? progress.delivered : (so.per_delivered || 0);
      let finalBilled = progress.billed > 0 ? progress.billed : (so.per_billed || 0);
      let finalStatus = so.status;
      let finalDocstatus = so.docstatus;

      if (localStatus !== undefined) {
         finalDocstatus = localStatus;
         if (localStatus === 1) finalStatus = 'To Deliver and Bill'; 
      }
      if (finalDocstatus === 1 && finalDelivered >= 100 && finalBilled >= 100) {
         finalStatus = 'Completed';
      }
      return { ...so, docstatus: finalDocstatus, status: finalStatus, per_delivered: finalDelivered, per_billed: finalBilled };
    });
  }, [salesOrders, localDocStatus, localSOProgress]);

  const stats = useMemo(() => {
    const totalSalesAmount = patchedSalesOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
    const avgOrderValue = patchedSalesOrders.length > 0 ? totalSalesAmount / patchedSalesOrders.length : 0;
    return { totalSalesAmount, avgOrderValue };
  }, [patchedSalesOrders]);

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Memuat data Home...</div>;

  const CardHeader = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#6B7280' }}><Filter size={14} /></button>
        <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#6B7280' }}><MoreHorizontal size={14} /></button>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ROW 1: Sales Order Trends */}
      <div className="chart-container" style={{ marginBottom: '16px' }}>
        <CardHeader title="Sales Order Trends" />
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dynamicRevenueTrend} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSalesHome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => formatUang(v).replace(/,\d{2}/, '')} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => formatUang(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }} />
            <Area type="monotone" dataKey="revenue" name="Total Sales" fill="url(#colorSalesHome)" stroke={COLOR_PRIMARY} strokeWidth={3} dot={{ r: 4, fill: COLOR_PRIMARY }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 2: Bottom Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Sales Orders</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{patchedSalesOrders.length}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Total Sales Amount</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: COLOR_PRIMARY }}>{formatUang(stats.totalSalesAmount)}</div>
        </div>
        <div className="chart-container" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Average Order Value</span><MoreHorizontal size={14} color="#9CA3AF" /></div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{formatUang(stats.avgOrderValue)}</div>
        </div>
      </div>

    </div>
  );
}