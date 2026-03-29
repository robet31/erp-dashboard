'use client';

import React from 'react';

// ── Skeleton Primitives ──
export function SkeletonBox({ w = '100%', h = '20px', r = '6px', className = '' }: { w?: string; h?: string; r?: string; className?: string }) {
  return <div className={`sk-box ${className}`} style={{ width: w, height: h, borderRadius: r }} />;
}

export function SkeletonCircle({ size = '40px' }: { size?: string }) {
  return <div className="sk-box" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />;
}

// ── Card Skeletons ──
export function SkeletonNumberCard() {
  return (
    <div className="sk-card">
      <SkeletonBox w="60%" h="12px" />
      <div style={{ margin: '12px 0 8px' }}><SkeletonBox w="45%" h="28px" /></div>
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '8px', marginTop: '4px' }}>
        <SkeletonBox w="80%" h="10px" />
      </div>
    </div>
  );
}

export function SkeletonChartCard({ height = '240px' }: { height?: string }) {
  return (
    <div className="sk-chart-card">
      <div className="sk-chart-head">
        <SkeletonBox w="140px" h="14px" />
        <SkeletonBox w="100px" h="28px" r="6px" />
      </div>
      <div className="sk-chart-body">
        <SkeletonBox w="100%" h={height} r="8px" />
      </div>
      <div className="sk-chart-foot">
        <SkeletonBox w="70%" h="10px" />
      </div>
    </div>
  );
}

// ── Table Row Skeleton ──
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="sk-table-row">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBox key={i} w={i === 0 ? '30%' : `${60 + Math.random() * 30}%`} h="14px" />
      ))}
    </div>
  );
}

// ── Full Page Skeleton ──
export function DashboardSkeleton({ cards = 3, charts = 2 }: { cards?: number; charts?: number }) {
  return (
    <div className="sk-root">
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <SkeletonBox w="240px" h="24px" />
        <div style={{ marginTop: '8px' }}><SkeletonBox w="320px" h="13px" /></div>
      </div>
      {/* Number Cards */}
      <div className={`sk-grid sk-grid-${cards}`}>
        {Array.from({ length: cards }).map((_, i) => <SkeletonNumberCard key={i} />)}
      </div>
      {/* Charts */}
      {Array.from({ length: charts }).map((_, i) => <SkeletonChartCard key={i} />)}

      <style>{`
        .sk-root { font-family: 'Poppins', sans-serif; animation: skFadeIn 0.3s ease-out; }
        @keyframes skFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes skPulse {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .sk-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skPulse 1.5s ease-in-out infinite;
        }
        .sk-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 18px 20px;
        }
        .sk-chart-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          margin-bottom: 18px;
          overflow: hidden;
        }
        .sk-chart-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        .sk-chart-body { padding: 18px 20px; }
        .sk-chart-foot { padding: 10px 16px; border-top: 1px solid #f3f4f6; }
        .sk-grid { display: grid; gap: 14px; margin-bottom: 18px; }
        .sk-grid-3 { grid-template-columns: repeat(3, 1fr); }
        .sk-grid-4 { grid-template-columns: repeat(4, 1fr); }
        .sk-table-row {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        @media (max-width: 900px) {
          .sk-grid-3 { grid-template-columns: 1fr; }
          .sk-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .sk-grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

// ── Home Page Skeleton ──
export function HomeSkeleton() {
  return <DashboardSkeleton cards={3} charts={1} />;
}

// ── Analytics Page Skeleton ──  
export function AnalyticsSkeleton({ cards = 4 }: { cards?: number }) {
  return <DashboardSkeleton cards={cards} charts={2} />;
}

// ── Table Page Skeleton ──
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="sk-root">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox w="200px" h="20px" />
        <SkeletonBox w="120px" h="34px" r="8px" />
      </div>
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px' }}>
        {Array.from({ length: rows }).map((_, i) => <SkeletonTableRow key={i} cols={cols} />)}
      </div>
      <style>{`
        .sk-root { font-family: 'Poppins', sans-serif; animation: skFadeIn 0.3s ease-out; }
        @keyframes skFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes skPulse {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .sk-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skPulse 1.5s ease-in-out infinite;
        }
        .sk-table-row {
          display: flex;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
      `}</style>
    </div>
  );
}
