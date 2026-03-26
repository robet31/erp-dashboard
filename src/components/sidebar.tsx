'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { getRoleConfig } from '@/config/rbac';
import { Home, PieChart, Users, ShoppingCart, Receipt, Package, Warehouse, ArrowRightLeft, Truck, Layers, Cog, Wrench, X, LayoutDashboard, LogOut } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Suspense, useEffect } from 'react';
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
  const { isOpen, closeSidebar } = useSidebar();

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
      <aside className={`main-sidebar ${isOpen ? 'is-open' : ''}`}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #054CC7 0%, #17C3CC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '18px' }}>N</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#054CC7', lineHeight: 1.1 }}>NETRA VIDYA</div>
              <div style={{ fontSize: '10px', color: '#17C3CC', letterSpacing: '0.05em', marginTop: '2px', fontWeight: 700 }}>OEM Assembler</div>
            </div>
          </div>
          <button onClick={closeSidebar} className="close-sidebar-btn"><X size={18} color="#374151" /></button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {NAV_GROUPS.map((group, groupIdx) => {
            if (!canAccess(group.requiredModule as any)) return null;
            return (
              <div key={groupIdx} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, padding: '0 12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{group.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.tabId);
                    const fullHref = item.tabId ? `${item.href}?tab=${item.tabId}` : item.href;
                    return (
                      <Link key={item.label} href={fullHref} className="nav-item"
                        style={{
                          display: 'flex', alignItems: 'center', color: active ? '#054CC7' : '#4B5563',
                          background: active ? '#eff6ff' : 'transparent', 
                          fontWeight: active ? 700 : 500, position: 'relative', textDecoration: 'none',
                          padding: '10px 12px', borderRadius: '8px', transition: 'all 0.2s'
                        }}>
                        <span style={{ color: active ? '#17C3CC' : '#9CA3AF', marginRight: '12px' }}>{item.icon}</span>
                        <span style={{ flex: 1, fontSize: '13px' }}>{item.label}</span>
                        {active && <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '4px', height: '24px', background: '#054CC7', borderRadius: '4px 0 0 4px' }} />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6', background: '#fafafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: roleConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</div>
              <div style={{ fontSize: '11px', color: roleConfig.color, fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roleConfig.label}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fecaca'} onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}><LogOut size={16} /> Keluar Sistem</button>
        </div>
      </aside>
      
      <style>{`
        .main-sidebar {
          width: 250px; min-width: 250px; height: 100vh; background: #ffffff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; font-family: 'Poppins', sans-serif; transition: transform 0.3s ease; z-index: 90;
        }
        .nav-item:hover { background: #f3f4f6 !important; color: #054CC7 !important; }
        .nav-item:hover span:first-child { color: #054CC7 !important; }
        .close-sidebar-btn { display: none; width: 32px; height: 32px; align-items: center; justify-content: center; flex-shrink: 0; background: #f3f4f6; border-radius: 8px; border: none; cursor: pointer; }
        
        @media (max-width: 768px) {
          .main-sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); }
          .main-sidebar.is-open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .close-sidebar-btn { display: flex; }
        }
      `}</style>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<div style={{ width: '250px', background: 'white', borderRight: '1px solid #e5e7eb' }} />}>
      <SidebarContent />
    </Suspense>
  );
}