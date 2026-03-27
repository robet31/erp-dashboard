'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
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
  const { isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(false);
      if (window.innerWidth < 1024) setIsMinimized(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb', fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#054CC7', animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>Memuat sistem...</p>
        </div>
        <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarContext.Provider value={{ isOpen, isMinimized, toggleSidebar: () => setIsOpen(!isOpen), toggleMinimize: () => setIsMinimized(!isMinimized), closeSidebar: () => setIsOpen(false) }}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8f9fb', fontFamily: "'Poppins', sans-serif" }}>
        
        {/* OVERLAY MOBILE - Hanya aktif jika sidebar open */}
        <div 
          className={`mobile-overlay ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(false)}
        />

        <Sidebar />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Topbar />
          <main style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      <style>{`
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background-color: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(2px);
          z-index: 80;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .mobile-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        @media (max-width: 768px) {
          .mobile-overlay { display: block; }
          main {
            padding: 16px !important;
          }
        }
      `}</style>
    </SidebarContext.Provider>
  );
}