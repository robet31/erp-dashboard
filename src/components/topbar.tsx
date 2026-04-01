'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Settings, LogOut, User, ChevronDown, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials, shortenName } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

export function Topbar() {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const { avatarUrl } = useAvatar();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);
  
  // Ambil nama panggilan (kata pertama)
  const firstName = user.full_name.trim().split(' ')[0];

  // Waktu untuk jam di sebelah kanan
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

  // Slogan Dinamis Berdasarkan Role User
  const userRole = user.role.toLowerCase();
  let roleSlogan = "Pantau ringkasan bisnis Anda hari ini.";
  
  if (userRole === 'administrator' || userRole === 'admin') {
      roleSlogan = "Kendali penuh atas seluruh modul operasional.";
  } else if (userRole.includes('sales')) {
      roleSlogan = "Pantau target & transaksi penjualan Anda.";
  } else if (userRole.includes('stock') || userRole.includes('gudang')) {
      roleSlogan = "Kelola mutasi & persediaan barang real-time.";
  } else if (userRole.includes('manufacturing') || userRole.includes('produksi')) {
      roleSlogan = "Awasi proses produksi & perintah kerja pabrik.";
  }

  return (
    <header className="topbar-header">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle menu"><Menu size={20} /></button>
          
          {/* MENGGUNAKAN CLASS BARU UNTUK MENCEGAH KONFLIK CSS */}
          <div className="topbar-greeting-wrapper">
             <h1 className="topbar-greeting-title">Welcome back, {firstName}!</h1>
             <p className="topbar-greeting-subtitle">{roleSlogan}</p>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="topbar-right">
          <button 
            className="icon-action-btn refresh-btn" 
            onClick={handleRefresh} 
            title="Refresh Data ERP"
          >
            <RefreshCw size={16} className={isRefreshing ? "spin-animation" : ""} />
          </button>

          <div className="topbar-clock">
            <Clock size={13} className="clock-icon" />
            <div className="clock-text">
              <span className="clock-time">{timeStr}</span>
              <span className="clock-date">{dateStr}</span>
            </div>
          </div>

          <div className="profile-container" ref={profileRef}>
            <button className="profile-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-avatar" style={{ background: roleConfig.color }}>
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : initials}
                <span className="profile-online-dot" />
              </div>
              <div className="profile-info">
                <span className="profile-name">{shortenName(user.full_name, 14)}</span>
                <span className="profile-role" style={{ color: roleConfig.color }}>{roleConfig.label}</span>
              </div>
              <ChevronDown size={14} className={`profile-chevron ${showProfileMenu ? 'rotated' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar" style={{ background: roleConfig.color }}>
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : initials}
                  </div>
                  <div>
                    <div className="profile-dropdown-name" style={{ color: '#111827' }}>{user.full_name}</div>
                    <div className="profile-dropdown-email">{user.email}</div>
                    <span className="profile-dropdown-role" style={{ background: `${roleConfig.color}15`, color: roleConfig.color }}>{roleConfig.label}</span>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                <Link href="/dashboard/profile" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}><User size={15} /><span>{t.profile}</span></Link>
                <Link href="/dashboard/settings" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}><Settings size={15} /><span>{t.settings}</span></Link>
                <div className="profile-dropdown-divider" />
                <button className="profile-menu-item logout-item" onClick={() => { setShowProfileMenu(false); logout(); router.push('/login'); }}><LogOut size={15} /><span>{t.logout}</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .topbar-header { position: sticky; top: 0; z-index: 80; background: white; box-shadow: 0 1px 0 #f1f5f9, 0 2px 8px rgba(0,0,0,0.04); font-family: 'Poppins', sans-serif; }
        
        .topbar-inner { display: flex; align-items: center; padding: 0 20px; height: 70px; transition: padding 0.2s, height 0.2s; } 
        .topbar-left { display: flex; align-items: center; gap: 14px; flex-shrink: 0; height: 100%; min-width: 0; }
        .hamburger-btn { display: none; width: 36px; height: 36px; background: transparent; border: none; border-radius: 8px; align-items: center; justify-content: center; cursor: pointer; color: #374151; transition: all 0.2s; flex-shrink: 0; }
        .hamburger-btn:hover { background: #f3f4f6; color: #054CC7; }
        
        /* GREETING STYLES UNIK KHUSUS TOPBAR (TIDAK AKAN KONFLIK) */
        .topbar-greeting-wrapper { display: flex; flex-direction: column; justify-content: center; height: 100%; gap: 1px; min-width: 0; }
        .topbar-greeting-title { font-size: 20px !important; font-weight: 700 !important; color: #111827 !important; margin: 0 !important; line-height: 1.1 !important; letter-spacing: -0.03em !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } 
        .topbar-greeting-subtitle { font-size: 12px !important; color: #6b7280 !important; margin: 0 !important; font-weight: 500 !important; letter-spacing: -0.01em !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .topbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; margin-left: auto; height: 100%; }
        
        .icon-action-btn { position: relative; width: 36px; height: 36px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; flex-shrink: 0; }
        .icon-action-btn:hover { background: #eff6ff; color: #054CC7; border-color: rgba(5,76,199,0.2); }
        .spin-animation { animation: spin 1s linear infinite; color: #054CC7; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .topbar-clock { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; }
        .clock-icon { color: #054CC7; }
        .clock-text { display: flex; gap: 4px; align-items: baseline; }
        .clock-time { font-size: 13px; font-weight: 700; color: #0f172a; }
        .clock-date { font-size: 11px; font-weight: 500; color: #64748b; border-left: 1px solid #e5e7eb; padding-left: 6px; }
        
        .profile-container { position: relative; display: flex; align-items: center; height: 100%; }
        .profile-btn { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 5px 10px 5px 5px; cursor: pointer; transition: all 0.2s; }
        .profile-btn:hover { background: #eff6ff; border-color: rgba(5,76,199,0.2); }
        .profile-avatar { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 800; position: relative; flex-shrink: 0; }
        .profile-online-dot { position: absolute; bottom: -2px; right: -2px; width: 8px; height: 8px; background: #10b981; border-radius: 50%; border: 1.5px solid white; }
        .profile-info { display: flex; flex-direction: column; text-align: left; }
        .profile-name { font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; max-width: 120px; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
        .profile-role { font-size: 10px; font-weight: 600; text-transform: uppercase; margin-top: 2px;}
        .profile-chevron { color: #94a3b8; transition: transform 0.2s; flex-shrink: 0; }
        .profile-chevron.rotated { transform: rotate(180deg); }
        
        .profile-dropdown { position: absolute; top: 60px; right: 0; width: 240px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 16px 50px rgba(0,0,0,0.12); z-index: 100; overflow: hidden; animation: dropIn 0.15s ease; }
        @keyframes dropIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .profile-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 14px; background: linear-gradient(135deg, #f0f7ff, #e0f7ff); }
        .profile-dropdown-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 15px; font-weight: 800; flex-shrink: 0; }
        .profile-dropdown-name { font-size: 13px; font-weight: 700; color: #0f172a; word-break: break-word; }
        .profile-dropdown-email { font-size: 11px; color: #64748b; margin-top: 2px; word-break: break-all; }
        .profile-dropdown-role { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; margin-top: 6px; }
        .profile-dropdown-divider { height: 1px; background: #f1f5f9; }
        .profile-menu-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; width: 100%; background: none; border: none; font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; text-decoration: none; font-family: 'Poppins', sans-serif; transition: background 0.15s; }
        .profile-menu-item:hover { background: #f3f4f6; color: #054CC7; }
        .logout-item { color: #dc2626; }
        .logout-item:hover { background: #fff1f2; color: #b91c1c; }
        
        /* -----------------------------------
           MEDIA QUERIES KHUSUS RESPONSIVE
           ----------------------------------- */
        @media (max-width: 768px) { 
          .topbar-inner { 
            padding: 0 12px; 
            height: 60px; /* Sedikit lebih pendek di mobile */
          }
          .hamburger-btn { 
            display: flex; 
          } 
          .topbar-left {
            gap: 10px;
          }
          
          /* Sederhanakan Teks Sapaan */
          .topbar-greeting-title { 
            font-size: 16px !important; 
          }
          .topbar-greeting-subtitle { 
            display: none !important; /* Sembunyikan slogan di mobile agar tidak penuh */
          }
          
          /* Sembunyikan Jam */
          .topbar-clock { 
            display: none; 
          } 
          
          /* Ubah tombol profil menjadi icon avatar saja */
          .profile-info, .profile-chevron { 
            display: none; 
          }
          .profile-btn { 
            padding: 4px; /* Hilangkan padding berlebih */
            background: transparent; 
            border-color: transparent;
          }
          .profile-btn:hover {
            background: transparent;
            border-color: transparent;
            opacity: 0.8;
          }
          
          .topbar-right {
            gap: 6px; /* Perkecil jarak antar icon di kanan */
          }

          /* Sesuaikan Posisi Dropdown Mobile */
          .profile-dropdown {
             top: 50px;
             width: 220px;
             right: 0px;
          }
        }

        /* Untuk layar super kecil (misal iPhone SE) */
        @media (max-width: 380px) {
          .topbar-greeting-title { 
             font-size: 14px !important; 
          }
        }
      `}</style>
    </header>
  );
}