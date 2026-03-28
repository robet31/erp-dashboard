'use client';

import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

// Context untuk buka/tutup sidebar
export const SidebarContext = createContext<{
  isOpen: boolean;
  isMinimized: boolean;
  toggleSidebar: () => void;
  toggleMinimize: () => void;
  closeSidebar: () => void;
}>({ isOpen: false, isMinimized: false, toggleSidebar: () => {}, toggleMinimize: () => {}, closeSidebar: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const autoLogoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Responsive: on desktop always show sidebar (not as overlay)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsOpen(false);      // not overlay mode
        setIsMinimized(false); // full sidebar on desktop
      } else if (window.innerWidth > 768) {
        setIsOpen(false);
        setIsMinimized(true);  // minimized on tablet
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-logout timer
  useEffect(() => {
    if (!isAuthenticated || settings.autoLogout === 'never') return;
    const timeoutMs = parseInt(settings.autoLogout) * 60 * 1000;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (autoLogoutRef.current) clearTimeout(autoLogoutRef.current);
      autoLogoutRef.current = setTimeout(() => {
        logout();
        router.push('/login?reason=auto-logout');
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // init timer

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (autoLogoutRef.current) clearTimeout(autoLogoutRef.current);
    };
  }, [isAuthenticated, settings.autoLogout, logout, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setIsOpen(false); }, [pathname]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)', fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin-slow 0.8s linear infinite' }} />
            <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#a78bfa', animation: 'spin-slow 1.2s linear infinite reverse' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600 }}>Memuat sistem...</p>
        </div>
        <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarContext.Provider value={{
      isOpen,
      isMinimized,
      toggleSidebar: () => setIsOpen(o => !o),
      toggleMinimize: () => setIsMinimized(m => !m),
      closeSidebar: () => setIsOpen(false)
    }}>
      <div className={`dashboard-shell ${settings.darkMode ? 'dark-mode' : ''} ${settings.compactMode ? 'compact-mode' : ''}`}>

        {/* Mobile overlay */}
        <div
          className={`mobile-overlay ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(false)}
        />

        <Sidebar />

        <div className="main-content-area">
          <Topbar />
          <main className="page-main">
            <div className="page-container">
              {children}
            </div>
          </main>
        </div>
      </div>

      <style>{`
        /* ── Shell layout ── */
        .dashboard-shell {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: var(--bg-main, #f8f9fb);
          font-family: 'Poppins', sans-serif;
          font-size: var(--app-font-size, 14px);
          color: var(--text-primary, #0f172a);
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* ── Main content right of sidebar ── */
        .main-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
          transition: all 0.3s ease;
        }

        /* ── Page scrollable area ── */
        .page-main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: var(--spacing-lg, 24px);
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }
        .page-main::-webkit-scrollbar { width: 5px; }
        .page-main::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }

        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Mobile overlay ── */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(3px);
          z-index: 85;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .mobile-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }

        /* ── Dark mode globals ── */
        .dark-mode .topbar-header { background: var(--topbar-bg, #0f172a) !important; border-color: var(--border-color, #334155) !important; }
        .dark-mode .topbar-inner { color: var(--text-primary, #f1f5f9); }
        .dark-mode .main-sidebar { background: var(--bg-sidebar, #0f172a) !important; border-color: var(--border-color, #334155) !important; }
        .dark-mode .sidebar-header { border-color: var(--border-color, #334155) !important; }
        .dark-mode .sidebar-clock { background: #1e293b !important; border-color: #334155 !important; }
        .dark-mode .nav-item { color: var(--text-secondary, #94a3b8) !important; }
        .dark-mode .nav-group-title { color: var(--text-secondary, #94a3b8) !important; }
        .dark-mode .sidebar-footer { border-color: var(--border-color, #334155) !important; background: #0f172a !important; }
        .dark-mode .brand-main, .dark-mode .clock-time, .dark-mode .user-name { color: var(--text-primary, #f1f5f9) !important; }
        .dark-mode .brand-sub, .dark-mode .clock-date, .dark-mode .user-role { color: var(--text-secondary, #94a3b8) !important; }
        .dark-mode .topbar-brand-text .brand-main { color: var(--text-primary, #f1f5f9) !important; }
        .dark-mode .breadcrumb-link { color: var(--text-secondary, #94a3b8) !important; }
        .dark-mode .breadcrumb-link:hover { background: #1e293b !important; }
        .dark-mode .search-wrap { background: #1e293b !important; border-color: #334155 !important; }
        .dark-mode .search-input { color: var(--text-primary, #f1f5f9) !important; }
        .dark-mode .topbar-clock { background: #1e293b !important; border-color: #334155 !important; }
        .dark-mode .icon-action-btn { background: #1e293b !important; border-color: #334155 !important; color: var(--text-primary, #f1f5f9) !important; }
        .dark-mode .profile-btn { background: #1e293b !important; border-color: #334155 !important; }
        .dark-mode .profile-name { color: var(--text-primary, #f1f5f9) !important; }
        .dark-mode .notif-dropdown, .dark-mode .profile-dropdown, .dark-mode .search-dropdown { background: #1e293b !important; border-color: #334155 !important; }
        .dark-mode .notif-item { border-color: #334155 !important; }
        .dark-mode .notif-item-title, .dark-mode .profile-dropdown-name { color: var(--text-primary, #f1f5f9) !important; }
        .dark-mode .page-main { background: var(--bg-main, #0f172a); }

        /* ── Compact mode globals ── */
        .compact-mode .page-main { padding: var(--spacing-md, 12px) !important; }
        .compact-mode .nav-item { padding: 6px 10px !important; }
        .compact-mode .sidebar-clock { padding: 8px 12px !important; }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .mobile-overlay { display: block; }
          .page-main { padding: 14px !important; }
          .page-container { max-width: 100%; }

          /* Sidebar slides in from left as overlay on mobile */
          .main-sidebar {
            position: fixed !important;
            left: -280px !important;
            top: 0 !important;
            height: 100vh !important;
            z-index: 90 !important;
            box-shadow: none !important;
            transition: left 0.3s cubic-bezier(0.4,0,0.2,1) !important;
          }
          .main-sidebar.is-open {
            left: 0 !important;
            box-shadow: 4px 0 24px rgba(0,0,0,0.15) !important;
          }
          /* Minimized sidebar still hidden on mobile by default */
          .main-sidebar.is-minimized {
            left: -80px !important;
          }
          .main-sidebar.is-minimized.is-open {
            left: 0 !important;
          }
        }

        /* ── Tablet ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .page-main { padding: 16px !important; }
        }
      `}</style>
    </SidebarContext.Provider>
  );
}