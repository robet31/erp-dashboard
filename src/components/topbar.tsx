'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Bell, Settings, LogOut, User, ChevronDown, X, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials, shortenName } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

// ─── Route map for breadcrumbs and search ────────────────────────────────────
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

// Maps breadcrumb label key → route path for clickable breadcrumbs
const SEGMENT_TO_PATH: Record<string, string> = {
  bcDashboard:     '/dashboard',
  bcProfile:       '/dashboard/profile',
  bcSettings:      '/dashboard/settings',
  bcSelling:       '/dashboard/selling',
  bcInventory:     '/dashboard/stock',
  bcManufacturing: '/dashboard/manufacturing',
  bcUsers:         '/dashboard/users',
  bcHome:          '', // relative, handled dynamically
  bcAnalytics:     '',
  bcData:          '',
};

// All searchable pages/features
const SEARCH_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'beranda', 'home'] },
  { label: 'Selling Home', path: '/dashboard/selling/home', keywords: ['selling', 'penjualan', 'sales', 'home', 'beranda'] },
  { label: 'Selling Analytics', path: '/dashboard/selling/analytics', keywords: ['selling', 'penjualan', 'analytics', 'analitik', 'grafik', 'chart'] },
  { label: 'Data Selling', path: '/dashboard/selling', keywords: ['selling', 'penjualan', 'data', 'order', 'customer', 'pelanggan'] },
  { label: 'Inventory Home', path: '/dashboard/stock/home', keywords: ['inventory', 'inventaris', 'stok', 'stock', 'home', 'gudang'] },
  { label: 'Inventory Analytics', path: '/dashboard/stock/analytics', keywords: ['inventory', 'stok', 'stock', 'analytics', 'analitik', 'grafik'] },
  { label: 'Data Inventory', path: '/dashboard/stock', keywords: ['inventory', 'inventaris', 'stok', 'data', 'barang', 'item', 'gudang', 'warehouse'] },
  { label: 'Manufacturing Home', path: '/dashboard/manufacturing/home', keywords: ['manufacturing', 'produksi', 'pabrik', 'home', 'beranda'] },
  { label: 'Manufacturing Analytics', path: '/dashboard/manufacturing/analytics', keywords: ['manufacturing', 'produksi', 'analytics', 'analitik'] },
  { label: 'Data Manufacturing', path: '/dashboard/manufacturing', keywords: ['manufacturing', 'produksi', 'work order', 'wo', 'data'] },
  { label: 'Profil Saya', path: '/dashboard/profile', keywords: ['profil', 'profile', 'akun', 'account', 'foto', 'nama', 'password'] },
  { label: 'Pengaturan', path: '/dashboard/settings', keywords: ['pengaturan', 'settings', 'bahasa', 'language', 'tema', 'notifikasi', 'keamanan', 'tampilan'] },
  { label: 'Kelola User', path: '/dashboard/users', keywords: ['user', 'pengguna', 'admin', 'role', 'akun', 'kelola'] },
];

const MODULE_COLORS: Record<string, string> = {
  selling:       '#3b82f6',
  stock:         '#10b981',
  manufacturing: '#f59e0b',
  users:         '#8b5cf6',
};

// Module icons for search results
const MODULE_ICON: Record<string, string> = {
  '/dashboard/selling':        '🛒',
  '/dashboard/stock':          '📦',
  '/dashboard/manufacturing':  '⚙️',
  '/dashboard/profile':        '👤',
  '/dashboard/settings':       '🔧',
  '/dashboard/users':          '👥',
  '/dashboard':                '🏠',
};
function getIcon(path: string) {
  const key = Object.keys(MODULE_ICON).find(k => path.startsWith(k) && k !== '/dashboard');
  return key ? MODULE_ICON[key] : MODULE_ICON['/dashboard'];
}

export function Topbar() {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const { avatarUrl } = useAvatar();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showNotif, setShowNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Work Order Selesai', msg: 'WO-2024-001 telah selesai diproduksi', time: '5 mnt lalu', color: '#10b981', read: false },
    { id: 2, title: 'Stok Menipis', msg: 'Item bahan baku tersisa < 10 unit', time: '1 jam lalu', color: '#f59e0b', read: false },
    { id: 3, title: 'Sales Order Baru', msg: 'SO-2024-099 dari Customer Budi Santoso', time: '2 jam lalu', color: '#3b82f6', read: false },
  ]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

  const moduleColor = pathname.includes('selling')       ? MODULE_COLORS.selling
    : pathname.includes('stock')                          ? MODULE_COLORS.stock
    : pathname.includes('manufacturing')                  ? MODULE_COLORS.manufacturing
    : pathname.includes('users')                          ? MODULE_COLORS.users
    : '#054CC7';

  // ── Breadcrumb ──────────────────────────────────────────────────────────────
  const routeInfo = ROUTES.find(r => r.path === pathname) ?? ROUTES[0];
  const breadcrumbs = routeInfo.segments.map((seg, i) => {
    const label = t[seg] ?? seg;
    // Determine clickable path
    let path = SEGMENT_TO_PATH[seg] || '';
    if (!path && i > 0) {
      // For Home/Analytics/Data, derive from parent context
      const parentSeg = routeInfo.segments[i - 1];
      const parentPath = SEGMENT_TO_PATH[parentSeg] || '/dashboard';
      if (seg === 'bcHome')      path = parentPath + '/home';
      else if (seg === 'bcAnalytics') path = parentPath + '/analytics';
      else if (seg === 'bcData') path = parentPath;
    }
    const isLast = i === routeInfo.segments.length - 1;
    return { label, path, isLast };
  });

  // ── Search ──────────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return SEARCH_ITEMS.filter(item =>
      item.keywords.some(kw => kw.includes(q)) ||
      item.label.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  const handleSearchSelect = (path: string) => {
    router.push(path);
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <header className="topbar-header">
      {/* Accent bar */}
      <div className="topbar-accent" style={{ background: `linear-gradient(90deg, #054CC7, ${moduleColor}, #17C3CC)` }} />

      <div className="topbar-inner">
        {/* ── Left ── */}
        <div className="topbar-left">
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle menu">
            <Menu size={20} />
          </button>

          <div className="topbar-brand">
            <img src="/logo.png" alt="Artavista" className="topbar-logo-img" />
            <div className="topbar-brand-text">
              <span className="brand-main">PT ARTAVISTA</span>
              <span className="brand-sub">ERP Systems</span>
            </div>
          </div>

          <div className="topbar-divider" />

          {/* Breadcrumb — fully clickable */}
          <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="breadcrumb-item">
                {i > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
                {crumb.isLast ? (
                  <span className="breadcrumb-current" style={{ color: moduleColor }}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.path || '/dashboard'} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* ── Center: Search ── */}
        <div className="topbar-center" ref={searchRef}>
          <div className="search-wrap" onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}>
            <Search size={15} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`${t.search}  (Ctrl+K)`}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="search-input"
              autoComplete="off"
            />
            {searchQuery && (
              <button className="search-clear" onClick={e => { e.stopPropagation(); setSearchQuery(''); searchInputRef.current?.focus(); }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {showSearch && (
            <div className="search-dropdown">
              {searchResults.length === 0 ? (
                <div className="search-empty">
                  {searchQuery
                    ? <><Search size={18} /><span>{t.searchNoResult} "<strong>{searchQuery}</strong>"</span></>
                    : <><Search size={18} /><span>{t.searchHint}</span></>
                  }
                </div>
              ) : (
                <>
                  <div className="search-results-header">{t.searchResults}</div>
                  {searchResults.map(item => (
                    <button key={item.path} className="search-result-item" onClick={() => handleSearchSelect(item.path)}>
                      <span className="search-result-icon">{getIcon(item.path)}</span>
                      <div className="search-result-text">
                        <span className="search-result-label">{item.label}</span>
                        <span className="search-result-path">{item.path}</span>
                      </div>
                      <span className="search-result-go">{t.goTo} →</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Right ── */}
        <div className="topbar-right">
          {/* Live Clock */}
          <div className="topbar-clock">
            <Clock size={13} className="clock-icon" />
            <div className="clock-text">
              <span className="clock-time">{timeStr}</span>
              <span className="clock-date">{dateStr}</span>
            </div>
          </div>

          {/* Notifications */}
          <div className="notif-container" ref={notifRef}>
            <button className="icon-action-btn" onClick={() => setShowNotif(!showNotif)} title={t.notifications}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotif && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-title">{t.notifications}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {unreadCount > 0 && <span className="notif-badge">{t.unreadCount(unreadCount)}</span>}
                    <button
                      onClick={() => { setNotifications(ns => ns.map(n => ({ ...n, read: true }))); setUnreadCount(0); }}
                      style={{ fontSize: 11, color: '#054CC7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: 'Poppins, sans-serif' }}
                    >{t.markAllRead}</button>
                  </div>
                </div>

                {notifications.map(n => (
                  <div
                    key={n.id}
                    className="notif-item"
                    style={{ background: n.read ? 'white' : '#f0f7ff', cursor: 'pointer' }}
                    onClick={() => {
                      setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x));
                      setUnreadCount(c => Math.max(0, c - (n.read ? 0 : 1)));
                    }}
                  >
                    <div className="notif-dot" style={{ background: n.color }} />
                    <div className="notif-body">
                      <div className="notif-item-title" style={{ fontWeight: n.read ? 600 : 700 }}>{n.title}</div>
                      <div className="notif-item-msg">{n.msg}</div>
                      <div className="notif-item-time">{n.time}</div>
                    </div>
                    {!n.read && <div style={{ width: 7, height: 7, background: '#054CC7', borderRadius: '50%', flexShrink: 0, marginTop: 4, alignSelf: 'flex-start' }} />}
                  </div>
                ))}

                <div className="notif-footer" onClick={() => setShowNotif(false)}>
                  {t.notifications} →
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="profile-container" ref={profileRef}>
            <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-avatar" style={{ background: roleConfig.color, overflow: 'hidden', padding: avatarUrl ? 0 : undefined }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  : initials
                }
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
                  <div className="profile-dropdown-avatar" style={{ background: roleConfig.color, overflow: 'hidden', padding: avatarUrl ? 0 : undefined }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                      : initials
                    }
                  </div>
                  <div>
                    <div className="profile-dropdown-name">{user.full_name}</div>
                    <div className="profile-dropdown-email">{user.email}</div>
                    <span className="profile-dropdown-role" style={{ background: `${roleConfig.color}15`, color: roleConfig.color }}>
                      {roleConfig.label}
                    </span>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <Link href="/dashboard/profile" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                  <User size={15} />
                  <span>{t.profile}</span>
                </Link>
                <Link href="/dashboard/settings" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                  <Settings size={15} />
                  <span>{t.settings}</span>
                </Link>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-menu-item logout-item"
                  onClick={() => { setShowProfileMenu(false); logout(); router.push('/login'); }}
                >
                  <LogOut size={15} />
                  <span>{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .topbar-header {
          position: sticky; top: 0; z-index: 80;
          background: white;
          box-shadow: 0 1px 0 #f1f5f9, 0 2px 8px rgba(0,0,0,0.04);
          font-family: 'Poppins', sans-serif;
        }

        .topbar-accent { height: 3px; width: 100%; }

        .topbar-inner {
          display: flex; align-items: center;
          padding: 0 16px;
          height: 56px;
          position: relative;   /* anchor for absolute search */
        }

        /* ── Left ── */
        .topbar-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        /* Hamburger — hidden on desktop, visible on mobile only */
        .hamburger-btn {
          display: none;   /* hidden desktop */
          width: 36px; height: 36px;
          background: transparent; border: none; border-radius: 8px;
          align-items: center; justify-content: center;
          cursor: pointer; color: #374151;
          transition: all 0.2s;
        }
        .hamburger-btn:hover { background: #f3f4f6; color: #054CC7; }

        .topbar-brand { display: flex; align-items: center; gap: 8px; }
        .topbar-logo-img { height: 32px; width: auto; object-fit: contain; }
        .topbar-brand-text { display: flex; flex-direction: column; line-height: 1; }
        .brand-main { font-size: 12px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em; }
        .brand-sub { font-size: 9px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }

        .topbar-divider { width: 1px; height: 24px; background: #e5e7eb; flex-shrink: 0; }

        /* Breadcrumb */
        .topbar-breadcrumb { display: flex; align-items: center; gap: 2px; }
        .breadcrumb-item { display: flex; align-items: center; gap: 2px; }
        .breadcrumb-sep { color: #d1d5db; }
        .breadcrumb-link {
          font-size: 13px; font-weight: 500; color: #6b7280;
          text-decoration: none; padding: 3px 6px; border-radius: 6px;
          transition: all 0.15s;
        }
        .breadcrumb-link:hover { background: #f0f7ff; color: #054CC7; }
        .breadcrumb-current { font-size: 13px; font-weight: 700; padding: 3px 6px; }

        /* ── Center: Search — absolutely centered ── */
        .topbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          max-width: calc(100% - 500px);
        }

        .search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 0 12px;
          height: 38px; cursor: text;
          transition: all 0.2s;
        }
        .search-wrap:focus-within {
          background: white; border-color: #054CC7;
          box-shadow: 0 0 0 3px rgba(5,76,199,0.08);
        }
        .search-icon { color: #94a3b8; flex-shrink: 0; }
        .search-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 13px; font-family: 'Poppins', sans-serif; color: #0f172a;
          width: 100%; min-width: 0;
        }
        .search-input::placeholder { color: #94a3b8; }
        .search-clear {
          background: none; border: none; cursor: pointer; color: #9ca3af;
          display: flex; align-items: center; padding: 2px;
          transition: color 0.15s;
        }
        .search-clear:hover { color: #374151; }

        /* Search dropdown */
        .search-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: white; border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 16px 50px rgba(0,0,0,0.12);
          z-index: 200; overflow: hidden;
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }

        .search-empty {
          display: flex; align-items: center; gap: 10px;
          padding: 18px 16px; color: #94a3b8; font-size: 13px;
        }

        .search-results-header {
          padding: 8px 14px 4px;
          font-size: 10px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .search-result-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 10px 14px;
          background: none; border: none; cursor: pointer;
          text-align: left; font-family: 'Poppins', sans-serif;
          transition: background 0.15s;
        }
        .search-result-item:hover { background: #f0f7ff; }
        .search-result-icon { font-size: 18px; width: 24px; flex-shrink: 0; }
        .search-result-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .search-result-label { font-size: 13px; font-weight: 600; color: #0f172a; }
        .search-result-path { font-size: 10px; color: #94a3b8; margin-top: 1px; }
        .search-result-go { font-size: 11px; font-weight: 600; color: #054CC7; white-space: nowrap; opacity: 0; transition: opacity 0.15s; }
        .search-result-item:hover .search-result-go { opacity: 1; }

        /* ── Right ── */
        .topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }

        .topbar-clock {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 10px; background: #f8fafc;
          border: 1px solid #e5e7eb; border-radius: 8px;
        }
        .clock-icon { color: #054CC7; }
        .clock-text { display: flex; gap: 4px; align-items: baseline; }
        .clock-time { font-size: 13px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; }
        .clock-date { font-size: 10px; font-weight: 500; color: #64748b; border-left: 1px solid #e5e7eb; padding-left: 4px; }

        /* Notifications */
        .notif-container { position: relative; }
        .icon-action-btn {
          position: relative; width: 38px; height: 38px;
          background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #374151; transition: all 0.2s;
        }
        .icon-action-btn:hover { background: #eff6ff; color: #054CC7; border-color: rgba(5,76,199,0.2); }

        /* Notification count dot — scoped to topbar only, NOT a global .badge override */
        .notif-count {
          position: absolute; top: -3px; right: -3px;
          min-width: 18px; height: 18px;
          border-radius: 9px;
          background: #ef4444; color: white;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white; padding: 0 4px;
          box-sizing: border-box; line-height: 1;
        }

        .notif-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 310px; background: white;
          border: 1px solid #e5e7eb; border-radius: 14px;
          box-shadow: 0 16px 50px rgba(0,0,0,0.12); z-index: 100;
          overflow: hidden; animation: dropIn 0.15s ease;
        }
        .notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-bottom: 1px solid #f1f5f9;
        }
        .notif-title { font-size: 13px; font-weight: 700; color: #0f172a; }
        .notif-badge {
          font-size: 10px; font-weight: 700; color: #054CC7;
          background: #eff6ff; padding: 2px 8px; border-radius: 20px;
        }
        .notif-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 14px; border-bottom: 1px solid #f9fafb;
          transition: background 0.15s;
        }
        .notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
        .notif-body { flex: 1; min-width: 0; }
        .notif-item-title { font-size: 12px; color: #0f172a; }
        .notif-item-msg { font-size: 11px; color: #64748b; margin-top: 2px; }
        .notif-item-time { font-size: 10px; color: #9ca3af; margin-top: 3px; }
        .notif-footer {
          padding: 10px 14px; text-align: center;
          font-size: 12px; font-weight: 600; color: #054CC7;
          cursor: pointer;
        }
        .notif-footer:hover { background: #f0f7ff; }

        /* Profile */
        .profile-container { position: relative; }
        .profile-btn {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 5px 10px 5px 5px; cursor: pointer; transition: all 0.2s;
        }
        .profile-btn:hover { background: #eff6ff; border-color: rgba(5,76,199,0.2); }
        .profile-avatar {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 11px; font-weight: 800;
          position: relative; flex-shrink: 0;
        }
        .profile-online-dot {
          position: absolute; bottom: -1px; right: -1px;
          width: 8px; height: 8px; background: #10b981;
          border-radius: 50%; border: 1.5px solid white;
        }
        .profile-info { display: flex; flex-direction: column; text-align: left; }
        .profile-name { font-size: 12px; font-weight: 700; color: #0f172a; white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
        .profile-role { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .profile-chevron { color: #94a3b8; transition: transform 0.2s; flex-shrink: 0; }
        .profile-chevron.rotated { transform: rotate(180deg); }

        .profile-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 240px; background: white;
          border: 1px solid #e5e7eb; border-radius: 14px;
          box-shadow: 0 16px 50px rgba(0,0,0,0.12); z-index: 100;
          overflow: hidden; animation: dropIn 0.15s ease;
        }
        .profile-dropdown-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px; background: linear-gradient(135deg, #f0f7ff, #e0f7ff);
        }
        .profile-dropdown-avatar {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 15px; font-weight: 800; flex-shrink: 0;
        }
        .profile-dropdown-name { font-size: 13px; font-weight: 700; color: #0f172a; }
        .profile-dropdown-email { font-size: 11px; color: #64748b; margin-top: 1px; }
        .profile-dropdown-role {
          display: inline-block; font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 20px; margin-top: 4px;
        }
        .profile-dropdown-divider { height: 1px; background: #f1f5f9; }
        .profile-menu-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; width: 100%; background: none; border: none;
          font-size: 13px; font-weight: 500; color: #374151;
          cursor: pointer; text-decoration: none; font-family: 'Poppins', sans-serif;
          transition: background 0.15s;
        }
        .profile-menu-item:hover { background: #f3f4f6; }
        .logout-item { color: #dc2626; }
        .logout-item:hover { background: #fff1f2; }

        /* Mobile */
        @media (max-width: 768px) {
          .hamburger-btn { display: flex; }   /* show on mobile */
          .topbar-brand-text { display: none; }
          .topbar-clock { display: none; }
          .topbar-divider { display: none; }
          .topbar-breadcrumb { display: none; }
          .topbar-center {
            position: static;
            transform: none;
            width: auto;
            max-width: none;
            flex: 1;
          }
        }
      `}</style>
    </header>
  );
}
