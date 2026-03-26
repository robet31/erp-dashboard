'use client';

import { Menu, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ROLES } from '@/config/rbac';
import { getInitials } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

export function Topbar() {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

  if (!user) return null;

  const currentRole = ROLES.find(r => r.id === user.role) || ROLES[0];
  const initials = getInitials(user.full_name);

  return (
    <header className="topbar-header" style={{ height: '60px', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', position: 'sticky', top: 0, zIndex: 40, fontFamily: "'Poppins', sans-serif", flexShrink: 0 }}>
      
      <button className="hamburger-btn" onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} aria-label="Buka menu">
        <Menu size={22} />
      </button>

      <div style={{ flex: 1 }} />

      <div className="role-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: `${currentRole.color}15`, border: `1px solid ${currentRole.color}30`, color: currentRole.color, fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentRole.color, flexShrink: 0 }} />
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentRole.label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button onClick={() => window.location.reload()} className="icon-btn hide-mobile" title="Muat Ulang Data">
          <RefreshCw size={18} color="#374151" />
        </button>
      </div>

      <div className="user-profile-sec" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, borderLeft: '1px solid #e5e7eb', paddingLeft: '16px', marginLeft: '4px', overflow: 'hidden' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: currentRole.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
          {initials}
        </div>
        <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column', maxWidth: '140px', minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.full_name}>{user.full_name}</span>
          <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.email}>{user.email}</span>
        </div>
      </div>

      <style>{`
        .hamburger-btn { display: none; background: none; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; cursor: pointer; color: #054CC7; align-items: center; justify-content: center; position: relative; z-index: 50; }
        .icon-btn { width: 36px; height: 36px; border-radius: 8px; background: white; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: background 0.2s; }
        .icon-btn:hover { background: #f3f4f6; }
        
        @media (max-width: 768px) {
          .hamburger-btn { display: flex; }
          .role-badge { display: none !important; }
          .hide-mobile { display: none !important; }
          .user-info-text { max-width: 90px !important; } 
          .topbar-header { padding: 0 16px !important; gap: 12px !important; }
          .user-profile-sec { padding-left: 12px !important; border-left: none !important; margin-left: 0 !important; }
        }
      `}</style>
    </header>
  );
}