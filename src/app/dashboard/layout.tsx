'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

// Shared context untuk status buka/tutup sidebar di layar mobile
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

  // Proteksi rute: jika belum login, lempar ke halaman login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Tutup sidebar jika ukuran layar berubah menjadi desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tampilan loading sebelum dashboard muncul
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

  // Value yang akan disalurkan ke Topbar & Sidebar
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
        
        {/* Mobile Overlay: Latar belakang gelap saat menu hp terbuka */}
        {sidebarOpen && (
          <div
            className="sidebar-mobile-overlay open"
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(17, 24, 39, 0.6)', // Warna abu-abu transparan
              backdropFilter: 'blur(2px)',
              zIndex: 80, // Harus di bawah index sidebar (90)
              transition: 'opacity 0.3s ease',
            }}
          />
        )}

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
    </SidebarContext.Provider>
  );
}