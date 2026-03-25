'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

// Shared context for sidebar open state
export const SidebarContext = createContext<{
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}>({ isOpen: false, toggleSidebar: () => {}, closeSidebar: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Close sidebar on route change / resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8f9fb', fontFamily: "'Montserrat', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '4px solid #e5e7eb', borderTopColor: '#0066B3',
            animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>Memuat dashboard...</p>
        </div>
        <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const sidebarCtx = {
    isOpen: sidebarOpen,
    toggleSidebar: () => setSidebarOpen(p => !p),
    closeSidebar: () => setSidebarOpen(false),
  };

  return (
    <SidebarContext.Provider value={sidebarCtx}>
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#f8f9fb',
        fontFamily: "'Montserrat', sans-serif",
      }}>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="sidebar-mobile-overlay open"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Topbar />
          <main style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
