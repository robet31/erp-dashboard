'use client';

import { useState } from 'react';
import { Search, Bell, RefreshCw, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ROLES, type UserRole } from '@/config/rbac';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

export function Topbar() {
  const { user, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { toggleSidebar } = useSidebar();

  if (!user) return null;

  const currentRole = ROLES.find(r => r.id === user.role)!;
  const avatarColor = getAvatarColor(user.full_name);
  const initials = getInitials(user.full_name);

  return (
    <header style={{
      height: '56px',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '10px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      fontFamily: "'Montserrat', sans-serif",
      flexShrink: 0,
    }}>
      {/* Hamburger - Mobile Only */}
      <button
        className="hamburger-btn"
        onClick={toggleSidebar}
        aria-label="Buka menu"
      >
        <Menu size={18} color="#374151" />
      </button>

      {/* Search */}
      <div className="topbar-search-wrap" style={{ flex: 1, position: 'relative', maxWidth: '360px' }}>
        <Search size={14} color="#9CA3AF" style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)'
        }} />
        <input
          type="text"
          placeholder="Cari data..."
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px 7px 30px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: "'Montserrat', sans-serif",
            background: '#f8f9fb',
            outline: 'none',
            color: '#374151',
          }}
          onFocus={e => { e.target.style.borderColor = '#0066B3'; e.target.style.background = 'white'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f8f9fb'; }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Role Switcher */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: '6px',
            border: '1px solid #e5e7eb', background: 'white',
            color: '#374151', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentRole.color, flexShrink: 0 }} />
          <span className="topbar-username">{currentRole.label}</span>
          <ChevronDown size={12} color="#6B7280" />
        </button>

        {showRoleMenu && (
          <div style={{
            position: 'absolute', top: '100%', right: 0,
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            zIndex: 100, marginTop: '6px', minWidth: '200px',
            overflow: 'hidden', animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ padding: '8px 12px 6px', fontSize: '10px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>
              Ganti Role
            </div>
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => { switchRole(role.id as UserRole); setShowRoleMenu(false); }}
                style={{
                  width: '100%', padding: '9px 12px',
                  background: user.role === role.id ? '#eff6ff' : 'white',
                  border: 'none', display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
                  color: user.role === role.id ? '#0066B3' : '#374151',
                  fontSize: '13px', fontWeight: user.role === role.id ? 700 : 500,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (user.role !== role.id) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (user.role !== role.id) e.currentTarget.style.background = 'white'; }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{role.label}</span>
                <span style={{ background: `${role.color}15`, color: role.color, padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 700 }}>{role.badge}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <button style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: 'white', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', flexShrink: 0,
      }}>
        <Bell size={16} color="#374151" />
        <div style={{
          position: 'absolute', top: '7px', right: '7px',
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#ef4444', border: '2px solid white',
        }} />
      </button>

      {/* Refresh */}
      <button
        onClick={() => window.location.reload()}
        style={{
          width: '36px', height: '36px', borderRadius: '8px',
          background: 'white', border: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <RefreshCw size={15} color="#374151" />
      </button>

      {/* User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: avatarColor, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div className="topbar-username" style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{user.full_name}</span>
          <span style={{ fontSize: '10px', color: '#6B7280' }}>{currentRole.description}</span>
        </div>
      </div>

      {/* Click outside handler */}
      {showRoleMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowRoleMenu(false)}
        />
      )}
    </header>
  );
}
