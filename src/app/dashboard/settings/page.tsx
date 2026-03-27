'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials } from '@/lib/utils';
import { Bell, Moon, Sun, Globe, Lock, Eye, EyeOff, Save, Check, Monitor, Shield, User, Mail, Key, Palette, MessageSquare, Smartphone, Calendar, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    emailNotifications: true,
    language: 'id',
    compactMode: false,
    autoLogout: '30',
  });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('appearance');

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleSetting = (key: string) => {
    setSettings({ ...settings, [key as keyof typeof settings]: !settings[key as keyof typeof settings] });
  };

  const sections = [
    { id: 'appearance', label: 'Tampilan', icon: Palette },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'account', label: 'Akun', icon: User },
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title-text">Pengaturan</h1>
        <p className="page-subtitle-text">Kelola preferensi dan pengaturan sistem</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button 
                key={section.id}
                className={`settings-nav-btn ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={18} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeSection === 'appearance' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>Tampilan</h3>
                <p>Kustomisasi tampilan antarmuka</p>
              </div>

              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-icon dark">
                      <Moon size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Mode Gelap</span>
                      <span className="setting-desc">Aktifkan tema gelap sistem</span>
                    </div>
                  </div>
                  <button 
                    className={`toggle-btn ${settings.darkMode ? 'active' : ''}`}
                    onClick={() => toggleSetting('darkMode')}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <Globe size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Bahasa</span>
                      <span className="setting-desc">Pilih bahasa antarmuka</span>
                    </div>
                  </div>
                  <select 
                    className="setting-select"
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <Monitor size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Mode Kompat</span>
                      <span className="setting-desc">Tampilkan lebih banyak data</span>
                    </div>
                  </div>
                  <button 
                    className={`toggle-btn ${settings.compactMode ? 'active' : ''}`}
                    onClick={() => toggleSetting('compactMode')}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>Notifikasi</h3>
                <p>Kelola pemberitahuan sistem</p>
              </div>

              <div className="settings-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-icon bell">
                      <Bell size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Notifikasi Push</span>
                      <span className="setting-desc">Terima notifikasi di browser</span>
                    </div>
                  </div>
                  <button 
                    className={`toggle-btn ${settings.notifications ? 'active' : ''}`}
                    onClick={() => toggleSetting('notifications')}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-icon mail">
                      <MessageSquare size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Notifikasi Email</span>
                      <span className="setting-desc">Terima notifikasi via email</span>
                    </div>
                  </div>
                  <button 
                    className={`toggle-btn ${settings.emailNotifications ? 'active' : ''}`}
                    onClick={() => toggleSetting('emailNotifications')}
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>Keamanan</h3>
                <p>Pengaturan keamanan akun</p>
              </div>

              <div className="settings-card">
                <div className="setting-item clickable">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <Key size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Ganti Password</span>
                      <span className="setting-desc">Ubah password akun Anda</span>
                    </div>
                  </div>
                  <button className="setting-action-btn">Ubah</button>
                </div>

                <div className="setting-item clickable">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <Shield size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Two-Factor Authentication</span>
                      <span className="setting-desc">Aktifkan verifikasi dua langkah</span>
                    </div>
                  </div>
                  <button className="setting-action-btn secondary">Aktifkan</button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-icon">
                      <Clock size={18} />
                    </div>
                    <div className="setting-text">
                      <span className="setting-label">Auto Logout</span>
                      <span className="setting-desc">Logout otomatis setelah tidak aktif</span>
                    </div>
                  </div>
                  <select 
                    className="setting-select"
                    value={settings.autoLogout}
                    onChange={(e) => setSettings({ ...settings, autoLogout: e.target.value })}
                  >
                    <option value="15">15 menit</option>
                    <option value="30">30 menit</option>
                    <option value="60">1 jam</option>
                    <option value="never">Tidak pernah</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>Info Akun</h3>
                <p>Informasi akun saat ini</p>
              </div>

              <div className="settings-card account-card">
                <div className="account-header">
                  <div className="account-avatar" style={{ background: roleConfig.color }}>
                    {initials}
                  </div>
                  <div className="account-info">
                    <h4>{user.full_name}</h4>
                    <span style={{ color: roleConfig.color }}>{roleConfig.label}</span>
                  </div>
                </div>

                <div className="account-details">
                  <div className="detail-row">
                    <Mail size={16} />
                    <div>
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <Calendar size={16} />
                    <div>
                      <span className="detail-label">Bergabung</span>
                      <span className="detail-value">Januari 2024</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <Clock size={16} />
                    <div>
                      <span className="detail-label">Terakhir Login</span>
                      <span className="detail-value">Hari ini, 09:30</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="settings-footer">
            <button className="save-btn" onClick={handleSave}>
              <Save size={18} />
              Simpan Pengaturan
            </button>
            
            {saved && (
              <div className="save-success">
                <Check size={16} />
                Pengaturan berhasil disimpan!
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .settings-page {
          padding: 0;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-title-text {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 4px;
        }

        .page-subtitle-text {
          font-size: 14px;
          color: #6B7280;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
        }

        .settings-sidebar {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        @media (max-width: 768px) {
          .settings-sidebar {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 8px;
          }
        }

        .settings-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
          text-align: left;
        }

        .settings-nav-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .settings-nav-btn.active {
          background: #eff6ff;
          color: #054CC7;
          font-weight: 600;
        }

        .settings-content {
          flex: 1;
        }

        .settings-section {
          margin-bottom: 24px;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .section-header p {
          font-size: 13px;
          color: #6B7280;
        }

        .settings-card {
          background: white;
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-radius: 10px;
          transition: background 0.2s;
        }

        .setting-item:hover {
          background: #f9fafb;
        }

        .setting-item.clickable {
          cursor: pointer;
        }

        .setting-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .setting-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6B7280;
        }

        .setting-icon.dark {
          background: #1e293b;
          color: #f8fafc;
        }

        .setting-icon.bell {
          background: #fef3c7;
          color: #d97706;
        }

        .setting-icon.mail {
          background: #dbeafe;
          color: #2563eb;
        }

        .setting-text {
          display: flex;
          flex-direction: column;
        }

        .setting-label {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .setting-desc {
          font-size: 12px;
          color: #6B7280;
          margin-top: 2px;
        }

        .toggle-btn {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          background: #e5e7eb;
          border: none;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .toggle-btn.active {
          background: #054CC7;
        }

        .toggle-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .toggle-btn.active .toggle-slider {
          left: 25px;
        }

        .setting-select {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          background: white;
          cursor: pointer;
          min-width: 120px;
        }

        .setting-action-btn {
          padding: 8px 16px;
          background: #054CC7;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .setting-action-btn:hover {
          background: #043b9c;
        }

        .setting-action-btn.secondary {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        .setting-action-btn.secondary:hover {
          background: #f9fafb;
        }

        .account-card {
          padding: 20px;
        }

        .account-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 16px;
        }

        .account-avatar {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 800;
        }

        .account-info h4 {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .account-info span {
          font-size: 13px;
          font-weight: 600;
        }

        .account-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #6B7280;
        }

        .detail-row > div {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-size: 12px;
          color: #9CA3AF;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .settings-footer {
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
        }

        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(5, 76, 199, 0.3);
        }

        .save-success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 10px;
          color: #059669;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
