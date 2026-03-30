'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Settings, LogOut, User, ChevronDown, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials, shortenName } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

const ROUTES = [
  { path: '/dashboard',                      segments: ['bcDashboard'] as const },
  { path: '/dashboard/profile',              segments: ['bcDashboard', 'bcProfile'] as const },
  { path: '/dashboard/settings',             segments: ['bcDashboard', 'bcSettings'] as const },
  { path: '/dashboard/selling/home',         segments: ['bcDashboard', 'bcSelling', 'bcHome'] as const },
  { path: '/dashboard/selling/analytics',    segments: ['bcDashboard', 'bcSelling', 'bcAnalytics'] as const },
  { path: '/dashboard/selling',              segments: ['bcDashboard', 'bcSelling', 'bcData'] as const },
  { path: '/dashboard/stock/home',           segments: ['bcDashboard', 'bcInventory', 'bcHome'] as const },
  { path: '/dashboard/stock/analytics',      segments: ['bcDashboard', 'bcInventory', 'bcAnalytics'] as const },
  { path: '/dashboard/stock',                segments: ['bcDashboard', 'bcInventory', 'bcData'] as const },
  { path: '/dashboard/manufacturing/home',   segments: ['bcDashboard', 'bcManufacturing', 'bcHome'] as const },
  { path: '/dashboard/manufacturing/analytics', segments: ['bcDashboard', 'bcManufacturing', 'bcAnalytics'] as const },
  { path: '/dashboard/manufacturing',        segments: ['bcDashboard', 'bcManufacturing', 'bcData'] as const },
  { path: '/dashboard/users',               segments: ['bcDashboard', 'bcUsers'] as const },
];

const SEGMENT_TO_PATH: Record<string, string> = {
  bcDashboard: '/dashboard', bcProfile: '/dashboard/profile', bcSettings: '/dashboard/settings',
  bcSelling: '/dashboard/selling', bcInventory: '/dashboard/stock', bcManufacturing: '/dashboard/manufacturing',
  bcUsers: '/dashboard/users', bcHome: '', bcAnalytics: '', bcData: '',
};

const MODULE_COLORS: Record<string, string> = {
  selling: '#3b82f6', stock: '#10b981', manufacturing: '#f59e0b', users: '#8b5cf6',
};

export function Topbar() {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const { avatarUrl } = useAvatar();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

  const moduleColor = pathname.includes('selling') ? MODULE_COLORS.selling
    : pathname.includes('stock') ? MODULE_COLORS.stock
    : pathname.includes('manufacturing') ? MODULE_COLORS.manufacturing
    : pathname.includes('users') ? MODULE_COLORS.users : '#054CC7';

  const routeInfo = ROUTES.find(r => r.path === pathname) ?? ROUTES[0];
  const breadcrumbs = routeInfo.segments.map((seg, i) => {
    const label = t[seg] ?? seg;
    let path = SEGMENT_TO_PATH[seg] || '';
    if (!path && i > 0) {
      const parentSeg = routeInfo.segments[i - 1];
      const parentPath = SEGMENT_TO_PATH[parentSeg] || '/dashboard';
      if (seg === 'bcHome') path = parentPath + '/home';
      else if (seg === 'bcAnalytics') path = parentPath + '/analytics';
      else if (seg === 'bcData') path = parentPath;
    }
    const isLast = i === routeInfo.segments.length - 1;
    return { label, path, isLast };
  });

  return (
    <header className="topbar-header">
      <div className="topbar-accent" style={{ background: `linear-gradient(90deg, #054CC7, ${moduleColor}, #17C3CC)` }} />
      <div className="topbar-inner">
        <div className="topbar-left">
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle menu"><Menu size={20} /></button>
          <div className="topbar-brand">
            <img src="/logo.png" alt="Artavista" className="topbar-logo-img" />
            <div className="topbar-brand-text">
              <span className="brand-main">PT ARTAVISTA</span>
              <span className="brand-sub">ERP Systems</span>
            </div>
          </div>
          <div className="topbar-divider" />
          <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="breadcrumb-item">
                {i > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
                {crumb.isLast ? <span className="breadcrumb-current" style={{ color: moduleColor }}>{crumb.label}</span>
                  : <Link href={crumb.path || '/dashboard'} className="breadcrumb-link">{crumb.label}</Link>}
              </span>
            ))}
          </nav>
        </div>

        <div style={{ flex: 1 }} />

        <div className="topbar-right">
          
          <button 
            className="icon-action-btn refresh-btn" 
            onClick={handleRefresh} 
            title="Refresh Data ERP"
          >
            <RefreshCw size={16} className={isRefreshing ? "spin-animation" : ""} />
          </button>

          <div className="topbar-clock">
            <Clock size={13} className="clock-icon" />
            <div className="clock-text">
              <span className="clock-time">{timeStr}</span>
              <span className="clock-date">{dateStr}</span>
            </div>
          </div>

          <div className="profile-container" ref={profileRef}>
            <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-avatar" style={{ background: roleConfig.color }}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : initials}
                <span className="profile-online-dot" />
              </div>
              <div className="profile-info">
                <span className="profile-name">{shortenName(user.full_name, 14)}</span>
                <span className="profile-role" style={{ color: roleConfig.color }}>{roleConfig.label}</span>
              </div>
              <ChevronDown size={14} className={`profile-chevron ${showProfileMenu ? 'rotated' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar" style={{ background: roleConfig.color }}>
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : initials}
                  </div>
                  <div>
                    <div className="profile-dropdown-name">{user.full_name}</div>
                    <div className="profile-dropdown-email">{user.email}</div>
                    <span className="profile-dropdown-role" style={{ background: `${roleConfig.color}15`, color: roleConfig.color }}>{roleConfig.label}</span>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <Link href="/dashboard/profile" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}><User size={15} /><span>{t.profile}</span></Link>
                <Link href="/dashboard/settings" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}><Settings size={15} /><span>{t.settings}</span></Link>
                <div className="profile-dropdown-divider" />
                <button className="profile-menu-item logout-item" onClick={() => { setShowProfileMenu(false); logout(); router.push('/login'); }}><LogOut size={15} /><span>{t.logout}</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .topbar-header { position: sticky; top: 0; z-index: 80; background: white; box-shadow: 0 1px 0 #f1f5f9, 0 2px 8px rgba(0,0,0,0.04); font-family: 'Poppins', sans-serif; }
        .topbar-accent { height: 3px; width: 100%; }
        .topbar-inner { display: flex; align-items: center; padding: 0 16px; height: 56px; }
        .topbar-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .hamburger-btn { display: none; width: 36px; height: 36px; background: transparent; border: none; border-radius: 8px; align-items: center; justify-content: center; cursor: pointer; color: #374151; transition: all 0.2s; }
        .hamburger-btn:hover { background: #f3f4f6; color: #054CC7; }
        .topbar-brand { display: flex; align-items: center; gap: 8px; }
        .topbar-logo-img { height: 32px; width: auto; object-fit: contain; }
        .topbar-brand-text { display: flex; flex-direction: column; line-height: 1; }
        .brand-main { font-size: 12px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em; }
        .brand-sub { font-size: 9px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
        .topbar-divider { width: 1px; height: 24px; background: #e5e7eb; flex-shrink: 0; }
        .topbar-breadcrumb { display: flex; align-items: center; gap: 2px; }
        .breadcrumb-item { display: flex; align-items: center; gap: 2px; }
        .breadcrumb-sep { color: #d1d5db; }
        .breadcrumb-link { font-size: 13px; font-weight: 500; color: #6b7280; text-decoration: none; padding: 3px 6px; border-radius: 6px; transition: all 0.15s; }
        .breadcrumb-link:hover { background: #f0f7ff; color: #054CC7; }
        .breadcrumb-current { font-size: 13px; font-weight: 700; padding: 3px 6px; }
        .topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }
        
        .icon-action-btn { position: relative; width: 34px; height: 34px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; }
        .icon-action-btn:hover { background: #eff6ff; color: #054CC7; border-color: rgba(5,76,199,0.2); }
        .spin-animation { animation: spin 1s linear infinite; color: #054CC7; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .topbar-clock { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; }
        .clock-icon { color: #054CC7; }
        .clock-text { display: flex; gap: 4px; align-items: baseline; }
        .clock-time { font-size: 13px; font-weight: 700; color: #0f172a; }
        .clock-date { font-size: 10px; font-weight: 500; color: #64748b; border-left: 1px solid #e5e7eb; padding-left: 4px; }
        
        .profile-container { position: relative; }
        .profile-btn { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px 8px 4px 4px; cursor: pointer; transition: all 0.2s; }
        .profile-btn:hover { background: #eff6ff; border-color: rgba(5,76,199,0.2); }
        .profile-avatar { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 800; position: relative; flex-shrink: 0; }
        .profile-online-dot { position: absolute; bottom: -2px; right: -2px; width: 8px; height: 8px; background: #10b981; border-radius: 50%; border: 1.5px solid white; }
        .profile-info { display: flex; flex-direction: column; text-align: left; }
        .profile-name { font-size: 12px; font-weight: 700; color: #0f172a; white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
        .profile-role { font-size: 9px; font-weight: 600; text-transform: uppercase; }
        .profile-chevron { color: #94a3b8; transition: transform 0.2s; }
        .profile-chevron.rotated { transform: rotate(180deg); }
        
        .profile-dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 240px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 16px 50px rgba(0,0,0,0.12); z-index: 100; overflow: hidden; animation: dropIn 0.15s ease; }
        @keyframes dropIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .profile-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 14px; background: linear-gradient(135deg, #f0f7ff, #e0f7ff); }
        .profile-dropdown-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 15px; font-weight: 800; }
        .profile-dropdown-name { font-size: 13px; font-weight: 700; color: #0f172a; }
        .profile-dropdown-email { font-size: 11px; color: #64748b; margin-top: 2px; }
        .profile-dropdown-role { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; margin-top: 6px; }
        .profile-dropdown-divider { height: 1px; background: #f1f5f9; }
        .profile-menu-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; width: 100%; background: none; border: none; font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; text-decoration: none; font-family: 'Poppins', sans-serif; transition: background 0.15s; }
        .profile-menu-item:hover { background: #f3f4f6; color: #054CC7; }
        .logout-item { color: #dc2626; }
        .logout-item:hover { background: #fff1f2; color: #b91c1c; }
        
        @media (max-width: 768px) { .hamburger-btn { display: flex; } .topbar-brand-text, .topbar-clock, .topbar-divider, .topbar-breadcrumb { display: none; } }
      `}</style>
    </header>
  );
}