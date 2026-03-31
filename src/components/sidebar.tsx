'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import {
  Home, PieChart, Users, ShoppingCart, Receipt, Package, Warehouse,
  ArrowRightLeft, Truck, Layers, Cog, Wrench, X, LayoutDashboard,
  LogOut, ChevronLeft, ChevronRight, Clock, Wifi, WifiOff
} from 'lucide-react';
import { getInitials, shortenName } from '@/lib/utils';
import { Suspense, useEffect, useState } from 'react';
import { useSidebar } from '@/app/dashboard/layout';

type NavItem = { href: string; label: string; icon: React.ReactNode; module: 'dashboard' | 'selling' | 'stock' | 'manufacturing' | 'users'; tabId?: string; };
type NavGroup = { title: string; emoji: string; items: NavItem[]; requiredModule: 'selling' | 'stock' | 'manufacturing' | 'admin'; color: string; };

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
  const secondsPct = (now.getSeconds() / 59) * 100;

  // --- KONTEN DINAMIS BERDASARKAN ROLE ---
  let cardTitle = "Artavista ERP";
  let cardDesc = "Sistem tersinkronisasi secara penuh.";
  let illSrc = "/images/ill-default.png"; 

  const userRole = user.role.toLowerCase();
  
  if (userRole === 'administrator' || userRole === 'admin') {
      cardTitle = "Administrator";
      cardDesc = "Kendali penuh atas seluruh modul operasional.";
      illSrc = "/humans1.png"; 
  } else if (userRole.includes('sales')) {
      cardTitle = "Kinerja Sales";
      cardDesc = "Pantau target & tagihan.";
      illSrc = "/images/ill-sales.png";
  } else if (userRole.includes('stock') || userRole.includes('gudang')) {
      cardTitle = "Kelola Stok";
      cardDesc = "Mutasi barang terpantau aman.";
      illSrc = "/images/ill-stock.png";
  } else if (userRole.includes('manufacturing') || userRole.includes('produksi')) {
      cardTitle = "Produksi";
      cardDesc = "Kejar target Work Order harian.";
      illSrc = "/images/ill-mfg.png";
  }

  return (
    <>
      <aside className={`main-sidebar ${isOpen ? 'is-open' : ''} ${isMinimized ? 'is-minimized' : ''}`}>
        
        {/* Header Lurus & Presisi (Sejajar dengan Topbar 70px) */}
        <div className="sidebar-header">
          <div className="sidebar-logo-wrap">
            <img src="/logo.png" alt="Artavista ERP" className="sidebar-main-logo" />
          </div>
          <button onClick={closeSidebar} className="close-sidebar-btn"><X size={18} /></button>
        </div>

        {/* Minimize Toggle Button - Presisi di tengah Header */}
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
            if (!canAccess(group.requiredModule as any)) return null;
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

        {/* BOTTOM ERP SYSTEM INFO CARD */}
        {!isMinimized && (
          <div className="sidebar-promo-card">
            <div className="promo-illustration">
              <img src={illSrc} alt={cardTitle} />
            </div>
            <div className="promo-content-right">
              <h4>{cardTitle}</h4>
              <p>{cardDesc}</p>
            </div>
          </div>
        )}

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
          border-right: 1px solid #f1f5f9;
        }

        .main-sidebar.is-minimized {
          width: 72px;
          min-width: 72px;
        }

        /* ── HEADER & BRANDING LURUS PRESISI ── */
        .sidebar-header {
          padding: 0 20px; /* Kiri Kanan presisi dengan topbar dan konten */
          height: 70px;    /* Fix sama dengan tinggi Topbar */
          display: flex;
          align-items: center; /* Rata tengah vertikal */
          justify-content: space-between;
          border-bottom: 1px solid transparent; 
        }

        .sidebar-logo-wrap {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .sidebar-main-logo {
          height: auto; 
          max-height: 36px; /* Tinggi logo proporsional */
          width: auto; 
          max-width: 100%; 
          object-fit: contain; 
          object-position: left center; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Trik saat di-minimize agar hanya icon kiri terlihat rapi */
        .main-sidebar.is-minimized .sidebar-main-logo {
          width: 32px;
          height: 32px;
          object-fit: cover; 
          object-position: left center; 
        }

        /* Posisi Minimize Berada di TENGAH garis potong Header */
        .minimize-btn {
          position: absolute;
          right: -12px;
          top: 35px; /* Setengah dari height Header 70px */
          transform: translateY(-50%);
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
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }

        .minimize-btn:hover {
          background: #eff6ff;
          color: #054CC7;
          transform: translateY(-50%) scale(1.1);
        }

        /* ── CLOCK WIDGET (Top) ── */
        .sidebar-clock {
          margin: 4px 16px 12px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #eff6ff 0%, #e0f7ff 100%);
          border: 1px solid #bfdbfe;
          border-radius: 12px;
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
          padding: 8px 12px;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }

        .nav-group { margin-bottom: 8px; }

        .nav-group-title {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 700;
          padding: 12px 10px 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-group-emoji { font-size: 13px; }

        .nav-group-divider {
          height: 2px;
          border-radius: 1px;
          margin: 12px 8px 8px;
          opacity: 0.3;
        }

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          color: #64748b;
          background: transparent;
          font-weight: 500;
          position: relative;
          text-decoration: none;
          padding: 10px 12px;
          border-radius: 10px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .nav-item:hover {
          background: #f8fafc;
          color: #054CC7;
        }

        .nav-item:hover .nav-icon { color: var(--item-color, #054CC7); }

        .nav-item.active {
          background: #eff6ff;
          color: #054CC7;
          font-weight: 700;
        }

        .nav-item.active .nav-icon { color: var(--item-color, #17C3CC); }

        .nav-icon {
          color: #94a3b8;
          margin-right: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .main-sidebar.is-minimized .nav-icon { margin-right: 0; }

        .nav-label {
          flex: 1;
          font-size: 13px;
        }

        .active-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
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
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .tooltip-label::before {
          content: '';
          position: absolute;
          left: -4px;
          top: 50%;
          transform: translateY(-50%);
          border: 4px solid transparent;
          border-right-color: #1e293b;
        }

        /* ── NEW BOTTOM CARD ── */
        .sidebar-promo-card {
          margin: 0 16px 16px 16px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          border-radius: 16px;
          padding: 16px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(5,76,199,0.2);
          display: flex; 
          justify-content: flex-end; 
          min-height: 120px; 
        }

        .promo-illustration {
          position: absolute;
          left: -20px; 
          bottom: -15px; 
          width: 140px;
          height: 140px;
          z-index: 1;
        }

        .promo-illustration img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom left;
          opacity: 0.95;
        }
        
        .promo-content-right {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-end; 
          text-align: right;
          width: 65%; 
        }

        .sidebar-promo-card h4 {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 800;
          color: white;
          line-height: 1.2;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .sidebar-promo-card p {
          margin: 0 0 12px 0;
          font-size: 11px;
          opacity: 0.9;
          line-height: 1.4;
          color: white;
        }

        /* ── FOOTER ── */
        .sidebar-footer {
          padding: 16px 16px;
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-profile-mini {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          overflow: hidden;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
          position: relative;
        }

        .avatar-status {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid white;
        }

        .user-details {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .user-name {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 11px;
          font-weight: 600;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #fef2f2;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ef4444;
          transition: all 0.2s;
          flex-shrink: 0;
          border: none;
        }

        .logout-btn:hover {
          background: #fecaca;
          color: #b91c1c;
        }

        .close-sidebar-btn {
          display: none;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #f1f5f9;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          color: #475569;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .main-sidebar {
            position: fixed;
            left: 0; top: 0;
            width: 280px !important;
            min-width: 280px !important;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 90;
            box-shadow: 4px 0 40px rgba(0,0,0,0.2);
          }
          .main-sidebar.is-open { transform: translateX(0); }
          .main-sidebar.is-minimized { width: 280px !important; min-width: 280px !important; }
          .sidebar-header { padding: 0 16px; height: 70px; justify-content: space-between; }
          .close-sidebar-btn { display: flex; }
          .minimize-btn { display: none; }
          .nav-item { padding: 12px 14px; }
        }
      `}</style>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div style={{ width: '260px', minWidth: '260px', background: '#ffffff', borderRight: '1px solid #f1f5f9', height: '100vh' }} />}>
      <SidebarContent />
    </Suspense>
  );
}