'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { getRoleConfig } from '@/config/rbac';
import {
  Home, PieChart, Users, ShoppingCart, Receipt, 
  Package, Warehouse, ArrowRightLeft, Truck, 
  Layers, Cog, Wrench, X, LayoutDashboard, LogOut
} from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { Suspense, useEffect } from 'react';
import { useSidebar } from '@/app/dashboard/layout';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  module: 'dashboard' | 'selling' | 'stock' | 'manufacturing' | 'users';
  tabId?: string;
};

type NavGroup = { 
  title: string; 
  items: NavItem[];
  requiredModule: 'selling' | 'stock' | 'manufacturing' | 'admin';
};

const NAV_GROUPS: NavGroup[] = [
  // =====================================
  // 1. MODUL SELLING
  // =====================================
  {
    title: 'Selling',
    requiredModule: 'selling',
    items: [
      { href: '/dashboard/selling/home', label: 'Home', icon: <Home size={18} />, module: 'selling' },
      { href: '/dashboard/selling/analytics', label: 'Dashboard', icon: <PieChart size={18} />, module: 'selling' },
      { href: '/dashboard/selling', tabId: 'customers', label: 'Customer', icon: <Users size={18} />, module: 'selling' },
      { href: '/dashboard/selling', tabId: 'orders', label: 'Sales Order', icon: <ShoppingCart size={18} />, module: 'selling' },
      { href: '/dashboard/selling', tabId: 'invoices', label: 'Sales Invoice', icon: <Receipt size={18} />, module: 'selling' },
    ]
  },
  // =====================================
  // 2. MODUL INVENTORY
  // =====================================
  {
    title: 'Inventory',
    requiredModule: 'stock',
    items: [
      { href: '/dashboard/stock/home', label: 'Home', icon: <Home size={18} />, module: 'stock' },
      { href: '/dashboard/stock/analytics', label: 'Dashboard', icon: <LayoutDashboard size={18} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'stockentry', label: 'Stock Entry', icon: <ArrowRightLeft size={18} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'items', label: 'Item', icon: <Package size={18} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'warehouse', label: 'Warehouse', icon: <Warehouse size={18} />, module: 'stock' },
      { href: '/dashboard/stock', tabId: 'delivery', label: 'Delivery Note', icon: <Truck size={18} />, module: 'stock' },
    ]
  },
  // =====================================
  // 3. MODUL MANUFACTURING
  // =====================================
  {
    title: 'Manufacturing',
    requiredModule: 'manufacturing',
    items: [
      { href: '/dashboard/manufacturing/home', label: 'Home', icon: <Home size={18} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing/analytics', label: 'Dashboard', icon: <PieChart size={18} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing', tabId: 'bom', label: 'BOM', icon: <Layers size={18} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing', tabId: 'workorders', label: 'Work Order', icon: <Cog size={18} />, module: 'manufacturing' },
      { href: '/dashboard/manufacturing', tabId: 'jobcards', label: 'Job Card', icon: <Wrench size={18} />, module: 'manufacturing' },
    ]
  }
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
  const { user, logout, canAccess } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  useEffect(() => {
    // Tutup sidebar otomatis jika rute/tab berubah di layar HP
    closeSidebar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentTab]);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const avatarColor = getAvatarColor(user.full_name);
  const initials = getInitials(user.full_name);

  // Fungsi pintar agar menu tersorot (aktif) dengan benar
  const isActive = (href: string, tabId?: string) => {
    if (tabId) {
      // Menangani default routing ketika parameter tab tidak ada
      if (pathname === href && !currentTab && tabId === 'customers') return true;
      if (pathname === href && !currentTab && tabId === 'stockentry' && href.includes('stock')) return true;
      if (pathname === href && !currentTab && tabId === 'bom' && href.includes('manufacturing')) return true;
      
      return pathname === href && currentTab === tabId;
    }
    return pathname === href;
  };

  return (
    <>
      <aside
        className="sidebar-mobile-slide"
        style={{
          width: '240px',
          minWidth: '240px',
          height: '100vh',
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          fontFamily: "'Poppins', sans-serif",
          zIndex: 90,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Logo & Tombol Close (Mobile) */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="ERP Logo" style={{ height: '32px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>NETRA VIDYA</div>
              <div style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.05em', marginTop: '2px' }}>OEM Assembler</div>
            </div>
          </div>
          <button onClick={closeSidebar} className="hamburger-btn" style={{ width: '28px', height: '28px', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#f3f4f6', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
            <X size={16} color="#374151" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {NAV_GROUPS.map((group, groupIdx) => {
            // JIKA USER TIDAK PUNYA AKSES KE MODUL INI, SEMBUNYIKAN KESELURUHAN GROUP MENU-NYA
            if (!canAccess(group.requiredModule as any)) return null;

            return (
              <div key={groupIdx} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: '#111827', fontWeight: 700, padding: '0 12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {group.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.tabId);
                    const fullHref = item.tabId ? `${item.href}?tab=${item.tabId}` : item.href;

                    return (
                      <Link key={item.label} href={fullHref} className="nav-item"
                        style={{
                          display: 'flex', alignItems: 'center', color: active ? '#0066B3' : '#4B5563',
                          background: active ? '#eff6ff' : 'transparent', 
                          fontWeight: active ? 600 : 500,
                          position: 'relative', textDecoration: 'none',
                          padding: '10px 12px', borderRadius: '8px', transition: 'all 0.2s'
                        }}>
                        <span style={{ color: active ? '#0066B3' : '#9CA3AF', marginRight: '12px' }}>
                          {item.icon}
                        </span>
                        <span style={{ flex: 1, fontSize: '13px' }}>{item.label}</span>
                        {active && (
                          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '4px', height: '24px', background: '#0066B3', borderRadius: '4px 0 0 4px' }} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6', background: '#fafafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{roleConfig.label}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
            onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      <style>{`
        .nav-item:hover { background: #f3f4f6 !important; color: #111827 !important; }
        .nav-item:hover span:first-child { color: #4B5563 !important; }
        
        /* Desktop: Sembunyikan tombol hamburger-close */
        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
        }

        /* Mobile: Sidebar behavior */
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
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div style={{ width: '240px', background: 'white', borderRight: '1px solid #e5e7eb' }} />}>
      <SidebarContent />
    </Suspense>
  );
}