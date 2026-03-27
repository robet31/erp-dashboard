'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Bell, Settings, LogOut, User, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials, truncate, shortenName } from '@/lib/utils';
import { useSidebar } from '@/app/dashboard/layout';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profile': 'Profil Saya',
  '/dashboard/settings': 'Pengaturan',
  '/dashboard/selling/home': 'Selling Home',
  '/dashboard/selling/analytics': 'Analytics Penjualan',
  '/dashboard/selling': 'Data Selling',
  '/dashboard/stock/home': 'Inventory Home',
  '/dashboard/stock/analytics': 'Analytics Stok',
  '/dashboard/stock': 'Data Inventory',
  '/dashboard/manufacturing/home': 'Manufacturing Home',
  '/dashboard/manufacturing/analytics': 'Analytics Produksi',
  '/dashboard/manufacturing': 'Data Manufacturing',
  '/dashboard/users': 'Kelola User',
  '/dashboard/users/home': 'Kelola User',
};

const ROLE_TITLES: Record<string, string> = {
  admin_sales: 'Staff Selling',
  admin_gudang: 'Staff Gudang',
  manajer_produksi: 'Manager Produksi',
  administrator: 'Administrator',
};

const MAX_NAME_LENGTH = 20;

export function Topbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar, isMinimized } = useSidebar();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);

  const navigateToProfile = () => {
    setShowProfileMenu(false);
    router.push('/dashboard/profile');
  };

  const navigateToSettings = () => {
    setShowProfileMenu(false);
    router.push('/dashboard/settings');
  };

  // Get current page title
  const getPageTitle = () => {
    let title = PAGE_TITLES[pathname] || 'Dashboard';
    const roleTitle = ROLE_TITLES[user.role] || 'User';

    if (pathname.includes('selling/analytics')) title = `Analytics Penjualan - ${roleTitle}`;
    else if (pathname.includes('selling/home')) title = `Selling Home - ${roleTitle}`;
    else if (pathname.includes('selling')) title = `Data Selling - ${roleTitle}`;
    else if (pathname.includes('stock/analytics')) title = `Analytics Stok - ${roleTitle}`;
    else if (pathname.includes('stock/home')) title = `Inventory Home - ${roleTitle}`;
    else if (pathname.includes('stock')) title = `Data Inventory - ${roleTitle}`;
    else if (pathname.includes('manufacturing/analytics')) title = `Analytics Produksi - ${roleTitle}`;
    else if (pathname.includes('manufacturing/home')) title = `Manufacturing Home - ${roleTitle}`;
    else if (pathname.includes('manufacturing')) title = `Data Manufacturing - ${roleTitle}`;
    else if (pathname.includes('users')) title = `Kelola User - Administrator`;

    return title;
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
  };

  return (
    <header className="topbar-header">
      {/* Left Section - Menu & Logo */}
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Buka menu">
          <Menu size={22} />
        </button>
        <div className="topbar-logo">
          <img src="/logo.png" alt="Artavista" className="topbar-logo-img" style={{ background: 'transparent' }} />
          <div className="topbar-logo-text">
            <span className="logo-main">PT ARTAVISTA</span>
            <span className="logo-sub">ERP Systems</span>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="topbar-center">
        <div className={`search-container ${showSearch ? 'active' : ''}`}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari menu, data, atau fitur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="topbar-right">
        <button className="icon-btn" title="Notifikasi">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        {/* Profile Section - Click to show dropdown */}
        <div className="profile-container" ref={profileRef}>
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar" style={{ background: roleConfig.color }}>
              {initials}
            </div>
            <ChevronDown size={16} className={`profile-chevron ${showProfileMenu ? 'open' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar" style={{ background: roleConfig.color }}>
                  {initials}
                </div>
                <div className="dropdown-info">
                  <div className="dropdown-name">{shortenName(user.full_name, MAX_NAME_LENGTH)}</div>
                  <div className="dropdown-email">{user.email}</div>
                  <div className="dropdown-role" style={{ color: roleConfig.color }}>
                    {roleConfig.label}
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item" onClick={navigateToProfile}>
                <User size={18} />
                <span>Profil Saya</span>
              </button>

              <button className="dropdown-item" onClick={navigateToSettings}>
                <Settings size={18} />
                <span>Pengaturan</span>
              </button>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item logout" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Keluar Sistem</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .topbar-header {
          height: 64px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 40;
          font-family: 'Poppins', sans-serif;
          flex-shrink: 0;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .hamburger-btn {
          display: none;
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          color: #054CC7;
          align-items: center;
          justify-content: center;
        }

        .topbar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-logo-img {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 8px;
          background: transparent;
          padding: 5px;
        }

        .topbar-logo-text {
          display: flex;
          flex-direction: column;
        }

        .topbar-logo-text .logo-main {
          font-size: 14px;
          font-weight: 800;
          color: #054CC7;
          letter-spacing: 0.02em;
          line-height: 1.2;
        }

        .topbar-logo-text .logo-sub {
          font-size: 9px;
          font-weight: 700;
          color: #17C3CC;
          letter-spacing: 0.08em;
        }

        .page-title {
          display: flex;
          flex-direction: column;
        }

        .title-main {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar-center {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 0 20px;
        }

        .search-container {
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 480px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 0 14px;
          transition: all 0.2s;
        }

        .search-container:focus-within {
          background: white;
          border-color: #054CC7;
          box-shadow: 0 0 0 3px rgba(5, 76, 199, 0.1);
        }

        .search-icon {
          color: #9CA3AF;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #1e293b;
        }

        .search-input::placeholder {
          color: #9CA3AF;
        }

        .search-clear {
          background: none;
          border: none;
          cursor: pointer;
          color: #9CA3AF;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-clear:hover {
          color: #374151;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: white;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #374151;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .notification-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-container {
          position: relative;
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-btn:hover {
          background: #f3f4f6;
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 800;
        }

        .profile-chevron {
          color: #9CA3AF;
          transition: transform 0.2s;
        }

        .profile-chevron.open {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          z-index: 100;
          animation: dropdownFade 0.2s ease;
          overflow: hidden;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .dropdown-info {
          flex: 1;
          min-width: 0;
        }

        .dropdown-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .dropdown-email {
          font-size: 12px;
          color: #6B7280;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-role {
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }

        .dropdown-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s;
          text-align: left;
          font-family: 'Poppins', sans-serif;
        }

        .dropdown-item:hover {
          background: #f3f4f6;
          color: #054CC7;
        }

        .dropdown-item.logout {
          color: #dc2626;
        }

        .dropdown-item.logout:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .topbar-center {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .hamburger-btn {
            display: flex;
          }

          .topbar-logo {
            display: flex;
          }
          
          .topbar-logo-img {
            width: 32px;
            height: 32px;
          }
          
          .topbar-logo-text .logo-main {
            font-size: 12px;
          }
          
          .topbar-logo-text .logo-sub {
            font-size: 8px;
          }
          
          .topbar-header {
            padding: 0 12px;
            gap: 8px;
            height: 56px;
          }
          
          .topbar-left {
            gap: 8px;
          }
          
          .topbar-right {
            gap: 4px;
          }
          
          .profile-avatar {
            width: 32px;
            height: 32px;
            font-size: 11px;
          }
          
          .profile-btn {
            padding: 2px;
          }
          
          .profile-chevron {
            display: none;
          }
          
          .icon-btn {
            display: none;
          }
          
          .profile-dropdown {
            width: 260px;
            right: -8px;
          }
        }
      `}</style>
    </header>
  );
}
