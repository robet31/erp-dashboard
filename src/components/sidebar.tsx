'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import {
  Home, PieChart, Users, ShoppingCart, Receipt, Package, Warehouse,
  ArrowRightLeft, Truck, Layers, Cog, Wrench, X, LayoutDashboard,
  LogOut, ChevronLeft, ChevronRight, Clock, Wifi, WifiOff, Zap, UserCog
} from 'lucide-react';
import { getInitials, shortenName } from '@/lib/utils';
import { Suspense, useEffect, useState } from 'react';
import { useSidebar } from '@/app/dashboard/layout';

type NavItem = { href: string; label: string; icon: React.ReactNode; module: 'dashboard' | 'selling' | 'stock' | 'manufacturing' | 'users'; tabId?: string; };
type NavGroup = { title: string; emoji: string; items: NavItem[]; requiredModule: 'selling' | 'stock' | 'manufacturing' | 'users'; color: string; };

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Selling', emoji: '🛒', color: '#3b82f6', requiredModule: 'selling',
    items: [
      { href: '/dashboard/selling/home', label: 'Home', icon: <Home size={17} />, module: 'selling' },
      { href: '/dashboard/selling/analytics', label: 'Dashboard', icon: <PieChart size={17} />, module: 'selling' },
      { href: '/dashboard/selling', tabId: 'customers', label: 'Customer', icon: <Users size={17} />, module: 'selling' },
      { href: '/dashboard/selling', tabId: 'orders', label: 'Sales Order', icon: <ShoppingCart size={17} />, module: 'selling' },
      { href: '/dashboard/selling', tabId: 'invoices', label: 'Sales Invoice', icon: <Receipt size={17} />, module: 'selling' },
    ]
  },
  {
    title: 'Inventory', emoji: '📦', color: '#10b981', requiredModule: 'stock',
    items: [
      { href: '/dashboard/stock/home', label: 'Home', icon: <Home size={17} />, module: 'stock' },
      { href: '/dashboard/stock/analytics', label: 'Dashboard', icon: <LayoutDashboard size={17} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'stockentry', label: 'Stock Entry', icon: <ArrowRightLeft size={17} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'items', label: 'Item', icon: <Package size={17} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'warehouse', label: 'Warehouse', icon: <Warehouse size={17} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'delivery', label: 'Delivery Note', icon: <Truck size={17} />, module: 'stock' },
    ]
  },
  {
    title: 'Manufacturing', emoji: '⚙️', color: '#f59e0b', requiredModule: 'manufacturing',
    items: [
      { href: '/dashboard/manufacturing/home', label: 'Home', icon: <Home size={17} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing/analytics', label: 'Dashboard', icon: <PieChart size={17} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing', tabId: 'bom', label: 'BOM', icon: <Layers size={17} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing', tabId: 'workorders', label: 'Work Order', icon: <Cog size={17} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing', tabId: 'jobcards', label: 'Job Card', icon: <Wrench size={17} />, module: 'manufacturing' },
    ]
  },
  {
    title: 'Admin', emoji: '👥', color: '#8b5cf6', requiredModule: 'users',
    items: [
      { href: '/dashboard/users', label: 'Kelola Pengguna', icon: <UserCog size={17} />, module: 'users' },
    ]
  }
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const { user, logout, canAccess } = useAuth();
  const { avatarUrl } = useAvatar();
  const { isOpen, isMinimized, toggleSidebar, closeSidebar, toggleMinimize } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => { closeSidebar(); }, [pathname, currentTab]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);

  const isActive = (href: string, tabId?: string) => {
    if (tabId) {
      if (pathname === href && !currentTab && tabId === 'customers') return true;
      if (pathname === href && !currentTab && tabId === 'stockentry' && href.includes('stock')) return true;
      if (pathname === href && !currentTab && tabId === 'bom' && href.includes('manufacturing')) return true;
      return pathname === href && currentTab === tabId;
    }
    return pathname === href;
  };

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dayName = dayNames[now.getDay()];
  const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Animate seconds progress
  const secondsPct = (now.getSeconds() / 59) * 100;

  return (
    <>
      <aside className={`main-sidebar ${isOpen ? 'is-open' : ''} ${isMinimized ? 'is-minimized' : ''}`}>
        {/* Header - Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-wrap">
            <img src="/logoartawhite.png" alt="Artavista" className="logo-img" />
            {!isMinimized && (
              <div className="sidebar-brand-pulse">
                <Zap size={10} />
              </div>
            )}
          </div>
          <button onClick={closeSidebar} className="close-sidebar-btn"><X size={18} /></button>
        </div>

        {/* Minimize Toggle Button */}
        <button className="minimize-btn" onClick={toggleMinimize} title={isMinimized ? 'Perluas sidebar' : 'Minimize sidebar'}>
          {isMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Live Clock Widget */}
        {!isMinimized && (
          <div className="sidebar-clock">
            <div className="clock-top">
              <div className="clock-icon-wrap">
                <Clock size={13} />
              </div>
              <div className="clock-time">{timeStr}</div>
              <div className={`online-dot ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Server Online' : 'Server Offline'}>
                {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              </div>
            </div>
            <div className="clock-date">{dayName}, {dateStr}</div>
            <div className="clock-progress-bar">
              <div className="clock-progress-fill" style={{ width: `${secondsPct}%` }} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group, groupIdx) => {
            if (!canAccess(group.requiredModule)) return null;
            return (
              <div key={groupIdx} className="nav-group">
                {!isMinimized && (
                  <div className="nav-group-title" style={{ '--group-color': group.color } as React.CSSProperties}>
                    <span className="nav-group-emoji">{group.emoji}</span>
                    {group.title}
                  </div>
                )}
                {isMinimized && (
                  <div className="nav-group-divider" style={{ background: group.color }} title={group.title} />
                )}
                <div className="nav-items">
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.tabId);
                    const fullHref = item.tabId ? `${item.href}?tab=${item.tabId}` : item.href;
                    return (
                      <Link
                        key={item.label}
                        href={fullHref}
                        className={`nav-item ${active ? 'active' : ''}`}
                        onMouseEnter={() => setHoveredItem(item.label)}
                        onMouseLeave={() => setHoveredItem(null)}
                        title={isMinimized ? item.label : undefined}
                        style={{ '--item-color': group.color } as React.CSSProperties}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        {!isMinimized && <span className="nav-label">{item.label}</span>}
                        {active && !isMinimized && <div className="active-indicator" style={{ background: group.color }} />}
                        {isMinimized && hoveredItem === item.label && (
                          <div className="tooltip-label">{item.label}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>




        {/* Footer - User Profile */}
        <div className="sidebar-footer">
          <Link href="/dashboard/profile" className="user-profile-mini" title={isMinimized ? `${user.full_name} - ${roleConfig.label}` : undefined} style={{ textDecoration: 'none' }}>
            <div className="user-avatar" style={{ background: roleConfig.color, overflow: 'hidden', padding: 0 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              ) : (
                initials
              )}
              <div className="avatar-status" />
            </div>
            {!isMinimized && (
              <div className="user-details">
                <div className="user-name">{shortenName(user.full_name, 18)}</div>
                <div className="user-role" style={{ color: roleConfig.color }}>{roleConfig.label}</div>
              </div>
            )}
          </Link>
          <button onClick={logout} className="logout-btn" title="Keluar Sistem">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        .main-sidebar {
          width: 260px;
          min-width: 260px;
          height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 90;
          position: relative;
          border-right: 1px solid #e5e7eb;
        }

        .main-sidebar.is-minimized {
          width: 72px;
          min-width: 72px;
        }

        /* ── HEADER ── */
        .sidebar-header {
          padding: 16px 16px 14px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .sidebar-logo-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .logo-img {
          width: 230px;
          height: 54px;
          object-fit: contain;
          border-radius: 10px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          padding: 6px 10px;
          transition: width 0.3s, height 0.3s;
        }

        .main-sidebar.is-minimized .logo-img {
          width: 44px;
          height: 44px;
          padding: 8px;
        }

        .sidebar-brand-pulse {
          position: absolute;
          top: -4px;
          right: -6px;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #17C3CC, #054CC7);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: pulseBrand 2s ease-in-out infinite;
        }

        @keyframes pulseBrand {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(23,195,204,0.4); }
          50% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(23,195,204,0); }
        }

        .minimize-btn {
          position: absolute;
          right: -12px;
          top: 72px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 1.5px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          color: #6b7280;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .minimize-btn:hover {
          background: #eff6ff;
          color: #054CC7;
          transform: scale(1.1);
        }

        /* ── CLOCK WIDGET ── */
        .sidebar-clock {
          margin: 12px 12px 8px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #eff6ff 0%, #e0f7ff 100%);
          border: 1px solid #bfdbfe;
          border-radius: 14px;
        }

        .clock-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .clock-icon-wrap {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: linear-gradient(135deg, #054CC7, #17C3CC);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .clock-time {
          font-size: 17px;
          font-weight: 800;
          color: #054CC7;
          letter-spacing: 0.04em;
          font-variant-numeric: tabular-nums;
          flex: 1;
        }

        .online-dot {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px 5px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
        }
        .online-dot.online { background: rgba(16,185,129,0.12); color: #10b981; }
        .online-dot.offline { background: rgba(239,68,68,0.12); color: #ef4444; }

        .clock-date {
          font-size: 10px;
          color: #64748b;
          font-weight: 500;
          letter-spacing: 0.03em;
        }

        .clock-progress-bar {
          margin-top: 8px;
          height: 3px;
          background: rgba(5,76,199,0.1);
          border-radius: 99px;
          overflow: hidden;
        }

        .clock-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #054CC7, #17C3CC);
          border-radius: 99px;
          transition: width 1s linear;
        }

        /* ── NAVIGATION ── */
        .sidebar-nav {
          flex: 1;
          padding: 10px 10px;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }

        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

        .nav-group {
          margin-bottom: 4px;
        }

        .nav-group-title {
          font-size: 9.5px;
          color: #9ca3af;
          font-weight: 700;
          padding: 10px 10px 6px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-group-emoji {
          font-size: 12px;
        }

        .nav-group-divider {
          height: 2px;
          border-radius: 1px;
          margin: 10px 8px 8px;
          opacity: 0.4;
        }

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          color: #4b5563;
          background: transparent;
          font-weight: 500;
          position: relative;
          text-decoration: none;
          padding: 9px 10px;
          border-radius: 10px;
          transition: all 0.2s ease;
          white-space: nowrap;
          overflow: visible;
        }

        .nav-item:hover {
          background: #f3f4f6 !important;
          color: #054CC7 !important;
        }

        .nav-item:hover .nav-icon {
          color: var(--item-color, #054CC7) !important;
        }

        .nav-item.active {
          background: #eff6ff;
          color: #054CC7;
          font-weight: 700;
        }

        .nav-item.active .nav-icon {
          color: var(--item-color, #17C3CC);
        }

        .nav-icon {
          color: #9ca3af;
          margin-right: 10px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .main-sidebar.is-minimized .nav-icon {
          margin-right: 0;
        }

        .nav-label {
          flex: 1;
          font-size: 12.5px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .active-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          border-radius: 4px 0 0 4px;
        }

        /* Tooltip for minimized */
        .tooltip-label {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: #1e293b;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 200;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .tooltip-label::before {
          content: '';
          position: absolute;
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
          border: 6px solid transparent;
          border-right-color: #1e293b;
          border-left: none;
        }

        /* ── FOOTER ── */
        .sidebar-footer {
          padding: 12px 12px;
          border-top: 1px solid #f3f4f6;
          background: #fafafa;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-profile-mini {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          overflow: hidden;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
          position: relative;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.6);
        }

        .avatar-status {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid white;
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
        }

        .user-details {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .user-name {
          font-size: 12px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 10px;
          font-weight: 600;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #dc2626;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .logout-btn:hover {
          background: #fecaca;
          transform: scale(1.05);
        }

        .close-sidebar-btn {
          display: none;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #f3f4f6;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          color: #374151;
        }




        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .main-sidebar {
            position: fixed;
            left: 0; top: 0;
            width: 274px !important;
            min-width: 274px !important;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 90;
            box-shadow: 4px 0 40px rgba(0,0,0,0.4);
          }
          .main-sidebar.is-open { transform: translateX(0); }
          .main-sidebar.is-minimized { width: 274px !important; min-width: 274px !important; }
          .sidebar-header { padding: 12px 16px; justify-content: space-between; }
          .logo-img { width: 120px; height: 34px; }
          .close-sidebar-btn { display: flex; width: 40px; height: 40px; min-width: 40px; }
          .minimize-btn { display: none; }
          .nav-item { padding: 12px 14px; min-height: 46px; }
          .nav-label { font-size: 13px; }
          .sidebar-clock { display: none; }
        }
      `}</style>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div style={{ width: '260px', minWidth: '260px', background: '#ffffff', borderRight: '1px solid #e5e7eb', height: '100vh' }} />}>
      <SidebarContent />
    </Suspense>
  );
}
