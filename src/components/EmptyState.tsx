'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; };
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon = '📭', title, description, action, size = 'md' }: EmptyStateProps) {
  const sizes = {
    sm: { padding: '32px 20px', iconSize: '48px', titleSize: '14px', descSize: '12px' },
    md: { padding: '56px 32px', iconSize: '72px', titleSize: '16px', descSize: '13px' },
    lg: { padding: '80px 40px', iconSize: '100px', titleSize: '20px', descSize: '14px' },
  };
  const s = sizes[size];

  return (
    <div className="empty-state-wrapper" style={{ padding: s.padding }}>
      {/* Animated floating icon */}
      <div className="empty-icon-wrap" style={{ width: s.iconSize, height: s.iconSize }}>
        <div className="empty-icon-ring ring1" />
        <div className="empty-icon-ring ring2" />
        <div className="empty-icon-ring ring3" />
        <div className="empty-icon-emoji">{icon}</div>
      </div>

      <h3 className="empty-title" style={{ fontSize: s.titleSize }}>{title}</h3>
      {description && (
        <p className="empty-description" style={{ fontSize: s.descSize }}>{description}</p>
      )}
      {action && (
        <button className="empty-action-btn" onClick={action.onClick}>
          <span>+</span> {action.label}
        </button>
      )}

      <style>{`
        .empty-state-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
        }

        .empty-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .empty-icon-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid;
          animation: ripple 2.5s ease-out infinite;
        }
        .ring1 { inset: 0; border-color: rgba(99,102,241,0.3); animation-delay: 0s; }
        .ring2 { inset: -12px; border-color: rgba(99,102,241,0.18); animation-delay: 0.4s; }
        .ring3 { inset: -24px; border-color: rgba(99,102,241,0.08); animation-delay: 0.8s; }

        @keyframes ripple {
          0% { transform: scale(0.85); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }

        .empty-icon-emoji {
          font-size: 36px;
          line-height: 1;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
          z-index: 1;
          position: relative;
        }

        .empty-title {
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
          font-family: 'Poppins', sans-serif;
        }

        .empty-description {
          color: #9CA3AF;
          line-height: 1.6;
          max-width: 320px;
          font-family: 'Poppins', sans-serif;
          margin-bottom: 20px;
        }

        .empty-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }
        .empty-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99,102,241,0.5);
        }
        .empty-action-btn span { font-size: 16px; }
      `}</style>
    </div>
  );
}

// Komponen loading skeleton premium
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-wrap">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.05}s` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton-cell" style={{ flex: j === 0 ? '0.5' : '1', animationDelay: `${(i * cols + j) * 0.03}s` }} />
          ))}
        </div>
      ))}
      <style>{`
        .skeleton-wrap { display: flex; flex-direction: column; gap: 8px; padding: 8px; }
        .skeleton-row { display: flex; gap: 12px; align-items: center; }
        .skeleton-cell {
          height: 16px; border-radius: 8px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// Stat card dengan animasi angka
export function StatCard({ label, value, icon, color = '#6366f1', sub }: {
  label: string; value: string | number; icon: string; color?: string; sub?: string;
}) {
  return (
    <div className="stat-card-premium">
      <div className="stat-card-icon" style={{ background: `${color}18`, color }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div className="stat-card-body">
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value" style={{ color }}>{value}</p>
        {sub && <p className="stat-card-sub">{sub}</p>}
      </div>
      <div className="stat-card-glow" style={{ background: `${color}08` }} />
      <style>{`
        .stat-card-premium {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.04);
          position: relative;
          overflow: hidden;
          transition: all 0.2s;
          cursor: default;
        }
        .stat-card-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .stat-card-icon {
          width: 56px; height: 56px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-card-label {
          font-size: 12px; color: #9CA3AF; font-weight: 600;
          font-family: 'Poppins', sans-serif; margin: 0;
        }
        .stat-card-value {
          font-size: 24px; font-weight: 800;
          font-family: 'Poppins', sans-serif; margin: 2px 0 0;
        }
        .stat-card-sub {
          font-size: 11px; color: #9CA3AF;
          font-family: 'Poppins', sans-serif; margin: 2px 0 0;
        }
        .stat-card-glow {
          position: absolute; inset: 0; pointer-events: none;
        }
      `}</style>
    </div>
  );
}
