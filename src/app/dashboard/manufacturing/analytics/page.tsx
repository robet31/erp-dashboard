'use client';

import React, { useMemo, useState } from 'react';
import { useManufacturingData } from '@/hooks/useFrappeData';
import { Clock, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#9ca3af', '#ef4444'];

export default function ManufacturingAnalyticsPage() {
  const { workOrders, isLoading } = useManufacturingData() as any;

  // Filter State (Simulasi UI filter)
  const [filters, setFilters] = useState<Record<string, string>>({
    producedQty: 'Monthly',
    completedOp: 'Monthly',
    woAnalysis: 'All Time',
    qiAnalysis: 'All Time',
    pendingWo: 'All Time',
    downtime: 'Last Month',
    woQty: 'Monthly',
    jobCard: 'Monthly'
  });

  const handleFilterChange = (chart: string, value: string) => {
    setFilters(prev => ({ ...prev, [chart]: value }));
  };

  // Generate Simulated Data for Analytics Dashboard based on Work Orders & User Requirements
  const data = useMemo(() => {
    const wos = workOrders || [];
    const totalWO = wos.length || 24;
    const completedWO = wos.filter((wo: any) => wo.status === 'Completed').length || 15;
    
    // Line Chart: Completed Operation
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const completedOperations = shortDays.map(d => ({ name: d, qty: Math.floor(Math.random() * 40) + 10 }));
    
    // Bar Chart: Produced Quantity
    const producedQuantity = shortDays.map(d => ({ name: d, qty: Math.floor(Math.random() * 100) + 20 }));

    // Pie Chart: Work Order Analysis (Sesuai Request: Not Started, Completed, In Process, Draft)
    const woAnalysis = [
      { name: 'Not Started', value: wos.filter((wo: any) => wo.status === 'Not Started').length || 2 },
      { name: 'Completed', value: completedWO || 2 },
      { name: 'In Process', value: wos.filter((wo: any) => wo.status === 'In Process').length || 1 },
      { name: 'Draft', value: wos.filter((wo: any) => wo.status === 'Draft').length || 1 }
    ];

    // Pie Chart: Quality Inspection
    const qiAnalysis = [
      { name: 'Accepted', value: 85 },
      { name: 'Rejected', value: 5 },
      { name: 'Rework', value: 10 }
    ];

    // Bar Chart: Downtime Analysis
    const downtime = [
      { machine: 'Machine A', hours: 12 },
      { machine: 'Machine B', hours: 8 },
      { machine: 'Machine C', hours: 3 },
      { machine: 'Machine D', hours: 15 }
    ];

    // Area Chart: WO Qty Analysis (Sesuai Request: 4 Bulan)
    const fourMonths = ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];
    const woQtyAnalysis = fourMonths.map(d => ({ 
      name: d, 
      planned: Math.floor(Math.random() * 50) + 50, 
      actual: Math.floor(Math.random() * 50) + 30 
    }));

    // Bar Chart: Job Card Analysis (Sesuai Request: 1 Tahun / 12 Bulan)
    const twelveMonths = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
    const jobCardAnalysis = twelveMonths.map(w => ({
      name: w.split(' ')[0], // Ambil bulan singkatnya saja agar muat di grafik
      completed: Math.floor(Math.random() * 20) + 5,
      pending: Math.floor(Math.random() * 10) + 1,
    }));

    // Bar Chart: Pending Work Order (Sesuai Request: Rentang Hari)
    const pendingWOsAge = [
      { name: '0-30 Days', qty: Math.floor(Math.random() * 5) + 2 },
      { name: '30-60 Days', qty: Math.floor(Math.random() * 3) + 1 },
      { name: '60-90 Days', qty: Math.floor(Math.random() * 2) },
      { name: '90 Above', qty: 0 }
    ];

    return { 
      totalWO, completedWO, ongoingJC: 8, monthlyQI: 42,
      completedOperations, producedQuantity, woAnalysis, qiAnalysis, downtime, woQtyAnalysis, jobCardAnalysis, pendingWOsAge
    };
  }, [workOrders]);

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Memuat analitik...</div>;

  const MetricCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
    <div className="chart-container" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: color }}>{value}</div>
    </div>
  );

  const ChartHeader = ({ title, time, chartKey, filterOptions }: { title: string, time?: string, chartKey: string, filterOptions: string[] }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
        {time && <p style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Clock size={10} /> Last synced {time}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: '6px', padding: '2px 6px' }}>
        <Filter size={12} color="#6B7280" style={{ marginRight: '4px' }} />
        <select 
          value={filters[chartKey]} 
          onChange={(e) => handleFilterChange(chartKey, e.target.value)}
          style={{ background: 'transparent', border: 'none', fontSize: '11px', color: '#4B5563', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
        >
          {filterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ROW 1: METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <MetricCard title="Monthly Total Work Order" value={data.totalWO} color="#111827" />
        <MetricCard title="Monthly Completed Work Order" value={data.completedWO} color="#10b981" />
        <MetricCard title="Ongoing Job Card" value={data.ongoingJC} color="#f59e0b" />
        <MetricCard title="Monthly Quality Inspection" value={data.monthlyQI} color="#0ea5e9" />
      </div>

      {/* ROW 2: MAIN CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container">
          <ChartHeader title="Produced Quantity" time="1 minute ago" chartKey="producedQty" filterOptions={['Daily', 'Weekly', 'Monthly']} />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.producedQuantity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="qty" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <ChartHeader title="Completed Operation" time="1 minute ago" chartKey="completedOp" filterOptions={['Daily', 'Weekly', 'Monthly']} />
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.completedOperations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="qty" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3: ANALYSIS PIES & PENDING */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div className="chart-container">
          <ChartHeader title="Work Order Analysis" chartKey="woAnalysis" filterOptions={['All Time', 'This Year', 'This Month']} />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.woAnalysis} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {data.woAnalysis.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <ChartHeader title="Quality Inspection Analysis" chartKey="qiAnalysis" filterOptions={['All Time', 'This Year', 'This Month']} />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.qiAnalysis} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {data.qiAnalysis.map((_, i) => <Cell key={i} fill={[ '#10b981', '#ef4444', '#f59e0b' ][i]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <ChartHeader title="Pending Work Order" chartKey="pendingWo" filterOptions={['All Time', 'This Year']} />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.pendingWOsAge} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="qty" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 4: DOWNTIME, WO QTY & JOB CARD ANALYSIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div className="chart-container">
          <ChartHeader title="Last Month Downtime Analysis" chartKey="downtime" filterOptions={['Last Month', 'This Month']} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.downtime} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="machine" type="category" tick={{ fontSize: 11, fill: '#111827', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} Hours`, 'Downtime']} />
              <Bar dataKey="hours" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <ChartHeader title="Work Order Qty Analysis" chartKey="woQty" filterOptions={['Quarterly', 'Monthly', 'Yearly']} />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.woQtyAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="planned" name="Planned" stroke="#9CA3AF" fill="#f3f4f6" strokeWidth={2} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <ChartHeader title="Job Card Analysis" chartKey="jobCard" filterOptions={['Yearly', 'Monthly']} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.jobCardAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
              <Bar dataKey="pending" name="Pending/Open" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}