'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { getRoleConfig } from '@/config/rbac';
import { Home, PieChart, Users, ShoppingCart, Receipt, Package, Warehouse, ArrowRightLeft, Truck, Layers, Cog, Wrench, X, LayoutDashboard, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInitials, shortenName } from '@/lib/utils';
import { Suspense, useEffect, useState } from 'react';
import { useSidebar } from '@/app/dashboard/layout';

type NavItem = { href: string; label: string; icon: React.ReactNode; module: 'dashboard' | 'selling' | 'stock' | 'manufacturing' | 'users'; tabId?: string; };
type NavGroup = { title: string; items: NavItem[]; requiredModule: 'selling' | 'stock' | 'manufacturing' | 'admin'; };

const NAV_GROUPS: NavGroup[] = [
  { title: 'Selling', requiredModule: 'selling', items: [ { href: '/dashboard/selling/home', label: 'Home', icon: <Home size={18} />, module: 'selling' }, { href: '/dashboard/selling/analytics', label: 'Dashboard', icon: <PieChart size={18} />, module: 'selling' }, { href: '/dashboard/selling', tabId: 'customers', label: 'Customer', icon: <Users size={18} />, module: 'selling' }, { href: '/dashboard/selling', tabId: 'orders', label: 'Sales Order', icon: <ShoppingCart size={18} />, module: 'selling' }, { href: '/dashboard/selling', tabId: 'invoices', label: 'Sales Invoice', icon: <Receipt size={18} />, module: 'selling' }, ] },
  { title: 'Inventory', requiredModule: 'stock', items: [ { href: '/dashboard/stock/home', label: 'Home', icon: <Home size={18} />, module: 'stock' }, { href: '/dashboard/stock/analytics', label: 'Dashboard', icon: <LayoutDashboard size={18} />, module: 'stock' }, { href: '/dashboard/stock', tabId: 'stockentry', label: 'Stock Entry', icon: <ArrowRightLeft size={18} />, module: 'stock' }, { href: '/dashboard/stock', tabId: 'items', label: 'Item', icon: <Package size={18} />, module: 'stock' }, { href: '/dashboard/stock', tabId: 'warehouse', label: 'Warehouse', icon: <Warehouse size={18} />, module: 'stock' }, { href: '/dashboard/stock', tabId: 'delivery', label: 'Delivery Note', icon: <Truck size={18} />, module: 'stock' }, ] },
  { title: 'Manufacturing', requiredModule: 'manufacturing', items: [ { href: '/dashboard/manufacturing/home', label: 'Home', icon: <Home size={18} />, module: 'manufacturing' }, { href: '/dashboard/manufacturing/analytics', label: 'Dashboard', icon: <PieChart size={18} />, module: 'manufacturing' }, { href: '/dashboard/manufacturing', tabId: 'bom', label: 'BOM', icon: <Layers size={18} />, module: 'manufacturing' }, { href: '/dashboard/manufacturing', tabId: 'workorders', label: 'Work Order', icon: <Cog size={18} />, module: 'manufacturing' }, { href: '/dashboard/manufacturing', tabId: 'jobcards', label: 'Job Card', icon: <Wrench size={18} />, module: 'manufacturing' }, ] }
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const { user, logout, canAccess } = useAuth();
  const { isOpen, isMinimized, toggleSidebar, closeSidebar, toggleMinimize } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => { closeSidebar(); }, [pathname, currentTab]); 

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

  return (
    <>
      <aside className={`main-sidebar ${isOpen ? 'is-open' : ''} ${isMinimized ? 'is-minimized' : ''}`}>
        {/* Header - Logo */}
        <div className="sidebar-header">
          <img src="/logoartawhite.png" alt="Artavista" className="logo-img" />
          <button onClick={closeSidebar} className="close-sidebar-btn"><X size={18} /></button>
        </div>

        {/* Minimize Toggle Button */}
        <button className="minimize-btn" onClick={toggleMinimize} title={isMinimized ? 'Perluas sidebar' : 'Miniize sidebar'}>
          {isMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group, groupIdx) => {
            if (!canAccess(group.requiredModule as any)) return null;
            return (
              <div key={groupIdx} className="nav-group">
                {!isMinimized && (
                  <div className="nav-group-title">{group.title}</div>
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
                      >
                        <span className="nav-icon">{item.icon}</span>
                        {!isMinimized && <span className="nav-label">{item.label}</span>}
                        {active && !isMinimized && <div className="active-indicator" />}
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
          <div className="user-profile-mini" title={isMinimized ? `${user.full_name} - ${roleConfig.label}` : undefined}>
            <div className="user-avatar" style={{ background: roleConfig.color }}>{initials}</div>
            {!isMinimized && (
              <div className="user-details">
                <div className="user-name">{shortenName(user.full_name, 18)}</div>
                <div className="user-role" style={{ color: roleConfig.color }}>{roleConfig.label}</div>
              </div>
            )}
          </div>
          <button onClick={logout} className="logout-btn" title="Keluar Sistem">
            <LogOut size={18} />
          </button>
        </div>

        {/* Module Access Tags - Only for Administrator */}
        {!isMinimized && user?.role === 'administrator' && (
          <div className="sidebar-module-access">
            <span className="module-access-label">Akses Modul</span>
            <div className="module-tags">
              {canAccess('selling') && <span className="module-tag selling">Selling</span>}
              {canAccess('stock') && <span className="module-tag stock">Inventory</span>}
              {canAccess('manufacturing') && <span className="module-tag manufacturing">Manufacturing</span>}
              {canAccess('users') && <span className="module-tag users">Users</span>}
            </div>
          </div>
        )}
      </aside>
      
      <style>{`
        .main-sidebar {
          width: 260px;
          min-width: 260px;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
          z-index: 90;
          position: relative;
        }

        .main-sidebar.is-minimized {
          width: 72px;
          min-width: 72px;
        }

        .main-sidebar.is-minimized .logo-text-group {
          display: none;
        }

        .main-sidebar.is-minimized .logo-container {
          justify-content: center;
        }

        .main-sidebar.is-minimized .sidebar-header {
          justify-content: center;
          padding: 16px 8px;
        }

        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .logo-img {
          width: 140px;
          height: 42px;
          object-fit: contain;
          border-radius: 10px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          padding: 6px;
        }
          color: #d97706;
        }

        .module-tag.users {
          background: #f3e8ff;
          color: #9333ea;
        }

        .main-sidebar.is-minimized .logo-img {
          width: 42px;
          height: 42px;
        }

        .minimize-btn {
          position: absolute;
          right: -12px;
          top: 72px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .minimize-btn:hover {
          background: #f3f4f6;
          transform: scale(1.1);
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .nav-group {
          margin-bottom: 20px;
        }

        .nav-group-title {
          font-size: 10px;
          color: #9CA3AF;
          font-weight: 700;
          padding: 0 12px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          color: #4B5563;
          background: transparent;
          font-weight: 500;
          position: relative;
          text-decoration: none;
          padding: 10px 12px;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
        }

        .nav-item:hover {
          background: #f3f4f6 !important;
          color: #054CC7 !important;
        }

        .nav-item:hover .nav-icon {
          color: #054CC7 !important;
        }

        .nav-item.active {
          background: #eff6ff;
          color: #054CC7;
          font-weight: 700;
        }

        .nav-item.active .nav-icon {
          color: #17C3CC;
        }

        .nav-icon {
          color: #9CA3AF;
          margin-right: 12px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-label {
          flex: 1;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .active-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: #054CC7;
          border-radius: 4px 0 0 4px;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #f3f4f6;
          background: #fafafb;
          display: flex;
          align-items: center;
          gap: 12px;
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
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .user-details {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .user-name {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
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
          width: 38px;
          height: 38px;
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

        .sidebar-module-access {
          padding: 12px 16px;
          border-top: 1px solid #f3f4f6;
          background: #fafafb;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .module-access-label {
          font-size: 9px;
          color: #9CA3AF;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .module-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 4px;
        }

        .module-tag {
          font-size: 8px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .module-tag.selling {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .module-tag.stock {
          background: #dcfce7;
          color: #16a34a;
        }

        .module-tag.manufacturing {
          background: #fef3c7;
          color: #d97706;
        }

        .module-tag.users {
          background: #f3e8ff;
          color: #9333ea;
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
          margin-left: auto;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .main-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 280px !important;
            min-width: 280px !important;
            height: 100vh;
            transform: translateX(-100%);
            z-index: 90;
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          }
          .main-sidebar.is-open {
            transform: translateX(0);
          }
          .main-sidebar.is-minimized {
            width: 280px !important;
            min-width: 280px !important;
          }
          .sidebar-header {
            padding: 12px 16px;
            justify-content: space-between;
          }
          .logo-img {
            width: 120px;
            height: 36px;
          }
          .sidebar-module-access {
            display: none;
          }
          .close-sidebar-btn {
            display: flex;
            width: 40px;
            height: 40px;
            min-width: 40px;
          }
          .minimize-btn {
            display: none;
          }
          .nav-item {
            padding: 14px 16px;
            min-height: 48px;
          }
          .nav-icon {
            min-width: 24px;
          }
          .nav-label {
            font-size: 14px;
          }
          .nav-group-title {
            padding: 0 16px;
            font-size: 11px;
          }
          .sidebar-footer {
            padding: 16px;
            min-height: 72px;
          }
          .user-avatar {
            width: 44px;
            height: 44px;
            min-width: 44px;
          }
          .logout-btn {
            width: 44px;
            height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div style={{ width: '260px', background: 'white', borderRight: '1px solid #e5e7eb' }} />}>
      <SidebarContent />
    </Suspense>
  );
}
