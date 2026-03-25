'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { getRoleConfig } from '@/config/rbac';
import {
  LayoutDashboard, ShoppingCart, Package, Cog, LogOut, BarChart2, ChevronRight, Wrench, Users, Truck, ArrowRight, FileText, Warehouse, X
} from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { Suspense, useEffect } from 'react';
import { useSidebar } from '@/app/dashboard/layout';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  module: 'dashboard' | 'selling' | 'stock' | 'manufacturing' | 'users' | 'api_tester';
  tabId?: string;
};

type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'MENU UTAMA',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, module: 'dashboard' as const }
    ]
  },
  {
    title: '1. SELLING',
    items: [
      { href: '/dashboard/selling', tabId: 'customers', label: 'Customers', icon: <Users size={18} />, module: 'selling' as const },
      { href: '/dashboard/selling', tabId: 'orders', label: 'Sales Orders', icon: <ShoppingCart size={18} />, module: 'selling' as const },
      { href: '/dashboard/selling', tabId: 'delivery', label: 'Delivery Notes', icon: <Truck size={18} />, module: 'selling' as const },
    ]
  },
  {
    title: '2. INVENTORY',
    items: [
      { href: '/dashboard/stock', tabId: 'items', label: 'Item / Master', icon: <Package size={18} />, module: 'stock' as const },
      { href: '/dashboard/stock', tabId: 'warehouse', label: 'Warehouses', icon: <Warehouse size={18} />, module: 'stock' as const },
      { href: '/dashboard/stock', tabId: 'bin', label: 'Stock Level (Bin)', icon: <BarChart2 size={18} />, module: 'stock' as const },
      { href: '/dashboard/stock', tabId: 'stockentry', label: 'Stock Entry', icon: <ArrowRight size={18} />, module: 'stock' as const },
    ]
  },
  {
    title: '3. MANUFACTURING',
    items: [
      { href: '/dashboard/manufacturing', tabId: 'bom', label: 'BOM (Resep)', icon: <FileText size={18} />, module: 'manufacturing' as const },
      { href: '/dashboard/manufacturing', tabId: 'workorders', label: 'Work Orders', icon: <Cog size={18} />, module: 'manufacturing' as const },
      { href: '/dashboard/manufacturing', tabId: 'jobcards', label: 'Job Cards', icon: <Wrench size={18} />, module: 'manufacturing' as const },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/dashboard/users', label: 'Kelola User', icon: <Users size={18} />, module: 'users' as const },
      { href: '/api-tester', label: 'API Tester', icon: <Cog size={18} />, module: 'api_tester' as const },
    ]
  }
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const { user, logout, canAccess } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  // Close sidebar when navigating
  useEffect(() => {
    closeSidebar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentTab]);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const avatarColor = getAvatarColor(user.full_name);
  const initials = getInitials(user.full_name);

  const isActive = (href: string, tabId?: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (tabId) return pathname === href && currentTab === tabId;
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside
        className="sidebar-mobile-slide"
        style={{
          width: '220px',
          minWidth: '220px',
          height: '100vh',
          background: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          fontFamily: "'Montserrat', sans-serif",
          // Mobile: fixed + slide
          zIndex: 90,
          transition: 'transform 0.3s ease',
        }}
        // On mobile apply fixed positioning and translate
        data-open={isOpen}
      >
        {/* Logo + Mobile Close Button */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="ERP Logo" style={{ height: '30px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>ERP DASHBOARD</div>
              <div style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Manufacturing ERP</div>
            </div>
          </div>
          {/* Close button - only visible on mobile */}
          <button
            onClick={closeSidebar}
            className="hamburger-btn"
            style={{ width: '28px', height: '28px', flexShrink: 0 }}
            aria-label="Tutup menu"
          >
            <X size={16} color="#374151" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_GROUPS.map((group, groupIdx) => {
            const hasAccessToGroup = group.items.some(item => canAccess(item.module as any));
            if (!hasAccessToGroup) return null;

            return (
              <div key={groupIdx} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px' }}>
                  {group.title}
                </div>

                {group.items.map((item) => {
                  if (!canAccess(item.module as any)) return null;
                  const active = isActive(item.href, item.tabId);
                  const fullHref = item.tabId ? `${item.href}?tab=${item.tabId}` : item.href;

                  return (
                    <Link key={item.label} href={fullHref} className="nav-item"
                      style={{
                        display: 'flex', color: active ? '#0066B3' : '#6a7282',
                        background: active ? '#eff6ff' : 'transparent', fontWeight: active ? 700 : 500,
                        marginBottom: '2px', position: 'relative', textDecoration: 'none'
                      }}>
                      <span style={{ color: active ? '#0066B3' : '#99A1AF' }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {active && (
                        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: '#0066B3', borderRadius: '2px 0 0 2px' }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Info */}
        <div style={{ padding: '12px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{roleConfig.description}</div>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${roleConfig.color}15`, color: roleConfig.color, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>
            <ChevronRight size={10} /> {roleConfig.label}
          </div>

          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'none', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Inline style for mobile: hide/show sidebar */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-mobile-slide {
            position: fixed !important;
            left: 0;
            top: 0;
            height: 100vh !important;
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            box-shadow: ${isOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none'};
            z-index: 90 !important;
          }
        }
      `}</style>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div style={{ width: '220px', background: 'white' }} />}>
      <SidebarContent />
    </Suspense>
  );
}