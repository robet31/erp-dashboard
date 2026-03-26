'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, RefreshCw, Menu, ShoppingCart, Wrench, Package, Check, Truck, DollarSign, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ROLES } from '@/config/rbac';
import { getInitials } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

export function Topbar() {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const currentRole = ROLES.find(r => r.id === user.role) || ROLES[0];
  const initials = getInitials(user.full_name);

  // DATABASE NOTIFIKASI PINTAR (Di-filter berdasarkan Role)
  const ALL_NOTIFICATIONS = [
    { id: 1, roles: ['warehouse', 'manufacturing'], icon: <Package size={16} />, color: '#d97706', bg: '#fffbeb', title: 'Stok Menipis: RM-CPU-I7', desc: 'Sistem mendeteksi stok komponen RM-CPU-I7 tersisa 12 unit.', time: 'Baru saja' },
    { id: 2, roles: ['sales'], icon: <ShoppingCart size={16} />, color: '#054CC7', bg: '#eff6ff', title: 'Pesanan Baru (PT Mega Buana)', desc: 'Siska menerbitkan SO untuk 25 Unit NetraBook Pro 15.', time: '2 jam yang lalu' },
    { id: 3, roles: ['manufacturing'], icon: <Wrench size={16} />, color: '#059669', bg: '#ecfdf5', title: 'Produksi Selesai (#WO-002)', desc: 'Budi telah menyelesaikan perakitan 10 unit laptop di area WIP.', time: 'Kemarin' },
    { id: 4, roles: ['warehouse', 'sales'], icon: <Truck size={16} />, color: '#0ea5e9', bg: '#e0f2fe', title: 'Pengiriman Berhasil', desc: 'Delivery Note #DN-001 ke PT Distribusi Teknologi telah dikirim.', time: 'Kemarin' },
    { id: 5, roles: ['sales'], icon: <DollarSign size={16} />, color: '#7c3aed', bg: '#f3e8ff', title: 'Pembayaran Diterima', desc: 'Faktur PT Distribusi (Rp 155.000.000) telah ditandai Lunas.', time: '2 hari yang lalu' },
    { id: 6, roles: ['manufacturing'], icon: <LayoutDashboard size={16} />, color: '#f59e0b', bg: '#fef3c7', title: 'BOM Baru Diaktifkan', desc: 'Resep perakitan FG-NB-PRO15 telah ditambahkan ke sistem.', time: '3 hari yang lalu' },
  ];

  // Filter notifikasi agar hanya muncul sesuai Role user yang sedang login
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const userNotifs = useMemo(() => {
    return ALL_NOTIFICATIONS.filter(notif => notif.roles.includes(user.role as string));
  }, [user.role]);

  const markAllAsRead = () => {
    setHasUnread(false);
    setIsNotifOpen(false); 
  };

  const handleSeeAllActivity = () => {
    setIsNotifOpen(false);
    alert('Halaman "Log Aktivitas Menyeluruh" sedang dalam tahap pengembangan dan akan hadir di versi berikutnya! 🚀');
  };

  return (
    <header className="topbar-header" style={{ height: '60px', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', position: 'sticky', top: 0, zIndex: 40, fontFamily: "'Poppins', sans-serif", flexShrink: 0 }}>
      
      <button className="hamburger-btn" onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} aria-label="Buka menu">
        <Menu size={22} />
      </button>

      <div style={{ flex: 1 }} />

      <div className="role-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: `${currentRole.color}15`, border: `1px solid ${currentRole.color}30`, color: currentRole.color, fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentRole.color, flexShrink: 0 }} />
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentRole.label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="icon-btn" title="Notifikasi">
            <Bell size={18} color="#374151" />
            {hasUnread && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '2px solid white' }} />}
          </button>

          {isNotifOpen && (
            <div style={{ position: 'absolute', top: '120%', right: '-10px', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden', zIndex: 100, animation: 'fadeInDown 0.2s ease-out' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Notifikasi Sistem</span>
                {hasUnread && (
                  <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#054CC7', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Tandai dibaca
                  </button>
                )}
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {userNotifs.length > 0 ? (
                  userNotifs.map((notif) => (
                    <div key={notif.id} className="notif-item" style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px', cursor: 'pointer', opacity: hasUnread ? 1 : 0.6, transition: 'opacity 0.3s' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: notif.bg, color: notif.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {notif.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{notif.title}</p>
                        <p style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{notif.desc}</p>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '6px', fontWeight: 500 }}>{notif.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                    Belum ada notifikasi untuk role Anda.
                  </div>
                )}
              </div>
              
              <div style={{ padding: '12px', background: '#f9fafb', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                <button onClick={handleSeeAllActivity} style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 700, color: '#054CC7', cursor: 'pointer' }}>
                  Lihat Semua Aktivitas
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button onClick={() => window.location.reload()} className="icon-btn hide-mobile" title="Muat Ulang Data">
          <RefreshCw size={18} color="#374151" />
        </button>
      </div>

      <div className="user-profile-sec" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, borderLeft: '1px solid #e5e7eb', paddingLeft: '16px', marginLeft: '4px', overflow: 'hidden' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: currentRole.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
          {initials}
        </div>
        <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column', maxWidth: '140px', minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.full_name}>{user.full_name}</span>
          <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.email}>{user.email}</span>
        </div>
      </div>

      <style>{`
        .hamburger-btn { display: none; background: none; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; cursor: pointer; color: #054CC7; align-items: center; justify-content: center; position: relative; z-index: 50; }
        .icon-btn { width: 36px; height: 36px; border-radius: 8px; background: white; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: background 0.2s; }
        .icon-btn:hover { background: #f3f4f6; }
        .notif-item { transition: background 0.2s; }
        .notif-item:hover { background: #f9fafb; }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .hamburger-btn { display: flex; }
          .role-badge { display: none !important; }
          .hide-mobile { display: none !important; }
          .user-info-text { max-width: 90px !important; } 
          .topbar-header { padding: 0 16px !important; gap: 12px !important; }
          .user-profile-sec { padding-left: 12px !important; border-left: none !important; margin-left: 0 !important; }
        }
      `}</style>
    </header>
  );
}