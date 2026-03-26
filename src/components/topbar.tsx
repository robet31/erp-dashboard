'use client';

import { useState } from 'react';
import { Search, Bell, RefreshCw, Menu } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ROLES } from '@/config/rbac';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

export function Topbar() {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const { toggleSidebar } = useSidebar();

  if (!user) return null;

  // Cari config role saat ini, jika tidak ketemu pakai default
  const currentRole = ROLES.find(r => r.id === user.role) || ROLES[0];
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
      fontFamily: "'Poppins', sans-serif",
      flexShrink: 0,
    }}>
      {/* Hamburger - Mobile Only */}
      <button
        className="hamburger-btn"
        onClick={toggleSidebar}
        aria-label="Buka menu"
        style={{
          background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
          padding: '6px', cursor: 'pointer', display: 'none' // akan di-override CSS mobile
        }}
      >
        <Menu size={18} color="#374151" />
      </button>

      {/* Search Bar */}
      <div className="topbar-search-wrap" style={{ flex: 1, position: 'relative', maxWidth: '360px' }}>
        <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
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
            fontFamily: "'Poppins', sans-serif",
            background: '#f8f9fb',
            outline: 'none',
            color: '#374151',
          }}
          onFocus={e => { e.target.style.borderColor = '#0066B3'; e.target.style.background = 'white'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f8f9fb'; }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* TAMPILAN ROLE STATIS (TANPA KLIK/DROPDOWN) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '20px',
        background: `${currentRole.color}15`, 
        border: `1px solid ${currentRole.color}30`,
        color: currentRole.color, fontSize: '11px', fontWeight: 700,
        fontFamily: "'Poppins', sans-serif",
        whiteSpace: 'nowrap',
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentRole.color, flexShrink: 0 }} />
        <span className="topbar-username" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {currentRole.label}
        </span>
      </div>

      {/* Notifications */}
      <button style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: 'white', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', flexShrink: 0,
      }}>
        <Bell size={16} color="#374151" />
        <div style={{ position: 'absolute', top: '7px', right: '7px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, borderLeft: '1px solid #e5e7eb', paddingLeft: '12px', marginLeft: '4px' }}>
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
          <span style={{ fontSize: '10px', color: '#6B7280' }}>{user.email}</span> {/* <--- INI YANG DIPERBAIKI (Ganti ID jadi Email) */}
        </div>
      </div>
    </header>
  );
}