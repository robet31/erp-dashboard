'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials } from '@/lib/utils';
import {
  Shield, User, Mail, Key, Eye, EyeOff,
  Check, AlertCircle, Zap, ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useSettings();
  const { avatarUrl } = useAvatar();
  
  // Set default tab ke 'account'
  const [activeSection, setActiveSection] = useState('account');
  
  // State untuk form Ganti Password
  const [passwordForm, setPasswordForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwShow, setPwShow] = useState({ current: false, newPw: false, confirm: false });
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'mismatch'>('idle');
  const [pwErrorMessage, setPwErrorMessage] = useState('');

  if (!user) return null;
  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPw || !passwordForm.confirm) {
      setPwErrorMessage('Harap isi semua kolom password');
      setPwStatus('error'); 
      setTimeout(() => setPwStatus('idle'), 3000); 
      return;
    }
    if (passwordForm.newPw !== passwordForm.confirm) {
      setPwStatus('mismatch'); 
      setTimeout(() => setPwStatus('idle'), 3000); 
      return;
    }
    if (passwordForm.newPw.length < 6) {
      setPwErrorMessage('Password baru minimal 6 karakter');
      setPwStatus('error'); 
      setTimeout(() => setPwStatus('idle'), 3000); 
      return;
    }

    setPwStatus('saving');
    setPwErrorMessage('');
    
    try {
      // API Call ke Backend untuk Update Password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword: passwordForm.current,
          newPassword: passwordForm.newPw,
        })
      });

      // CEK APAKAH RESPONSE ADALAH JSON (Penting untuk menghindari Error HTML <!DOCTYPE>)
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.indexOf("application/json") !== -1;

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Gagal mengubah password');
        } else {
          // Jika backend API /api/auth/change-password belum dibuat, tangani secara aman
          throw new Error('API belum tersedia (Gagal memanggil server)');
        }
      }

      // Jika Berhasil
      setPwStatus('success');
      setPasswordForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setPwStatus('idle'), 4000);

    } catch (err: any) {
      // Tangkap error dengan rapi tanpa membuat aplikasi crash
      setPwErrorMessage(err.message);
      setPwStatus('error');
      setTimeout(() => setPwStatus('idle'), 4000);
    }
  };

  const sections = [
    { id: 'account',       label: t.accountInfo,   icon: User     },
    { id: 'security',      label: t.security,      icon: Shield   },
  ];

  const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const loginDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="sp-root">
      <div className="sp-header">
        <h1 className="sp-title">{t.settings}</h1>
        <p className="sp-subtitle">Kelola informasi akun dan keamanan Anda</p>
      </div>

      <div className="sp-layout">
        {/* Sidebar nav */}
        <div className="sp-nav">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                className={`sp-nav-btn ${activeSection === s.id ? 'sp-nav-btn-active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <Icon size={17} />
                <span>{s.label}</span>
                {activeSection === s.id && <ChevronRight size={14} className="sp-nav-arrow" />}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div className="sp-content">

          {/* ─── ACCOUNT INFO ─── */}
          {activeSection === 'account' && (
            <div className="sp-section" key="account">
              <div className="sp-section-head">
                <div className="sp-section-icon sp-icon-green"><User size={18} color="#10b981" /></div>
                <div>
                  <h3>{t.accountInfo}</h3>
                  <p>{t.profileSubtitle}</p>
                </div>
              </div>

              <div className="sp-card sp-card-padded">
                <div className="sp-account-header">
                  <div className="sp-account-avatar" style={{ background: roleConfig.color, overflow: avatarUrl ? 'hidden' : undefined, padding: avatarUrl ? 0 : undefined }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                      : initials
                    }
                  </div>
                  <div>
                    <div className="sp-account-name">{user.full_name}</div>
                    <div className="sp-account-role" style={{ color: roleConfig.color }}>{roleConfig.label}</div>
                    <div className="sp-account-status">
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      Akun Aktif
                    </div>
                  </div>
                </div>
                <div className="sp-account-details">
                  {[
                    { icon: <Mail size={15} />,   label: t.email,        value: user.email },
                    { icon: <Shield size={15} />, label: t.role,         value: roleConfig.label },
                    { icon: <Zap size={15} />,    label: t.accessModule, value: roleConfig.modules?.join(', ') || 'Semua modul' },
                    { icon: <Key size={15} />,    label: t.lastLogin,    value: `${loginTime} · ${loginDate}` },
                  ].map((d, i) => (
                    <div key={i} className="sp-detail-row">
                      <div className="sp-detail-icon">{d.icon}</div>
                      <div>
                        <div className="sp-detail-label">{d.label}</div>
                        <div className="sp-detail-value">{d.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── SECURITY ─── */}
          {activeSection === 'security' && (
            <div className="sp-section" key="security">
              <div className="sp-section-head">
                <div className="sp-section-icon sp-icon-blue"><Shield size={18} color="#3b82f6" /></div>
                <div>
                  <h3>{t.security}</h3>
                  <p>Kelola keamanan password akun Anda</p>
                </div>
              </div>

              {/* Change Password */}
              <div className="sp-card sp-card-padded">
                <div className="sp-card-title"><Key size={16} color="#054CC7" /> {t.changePassword}</div>
                <div className="sp-pw-form">
                  {[
                    { key: 'current', label: t.currentPassword, placeholder: '••••••••' },
                    { key: 'newPw',   label: t.newPassword,     placeholder: 'Min. 6 karakter' },
                    { key: 'confirm', label: t.confirmPassword,  placeholder: 'Ulangi password baru' },
                  ].map(f => (
                    <div key={f.key} className="sp-pw-group">
                      <label className="sp-pw-label">{f.label}</label>
                      <div className="sp-pw-wrap">
                        <input
                          type={pwShow[f.key as keyof typeof pwShow] ? 'text' : 'password'}
                          className="sp-pw-input"
                          placeholder={f.placeholder}
                          value={passwordForm[f.key as keyof typeof passwordForm]}
                          onChange={e => setPasswordForm(p => ({ ...p, [f.key]: e.target.value }))}
                          autoComplete="new-password"
                        />
                        <button className="sp-pw-eye" type="button"
                          onClick={() => setPwShow(p => ({ ...p, [f.key]: !p[f.key as keyof typeof pwShow] }))}>
                          {pwShow[f.key as keyof typeof pwShow] ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {passwordForm.newPw && (
                    <div>
                      <div className="sp-pw-strength-label">Kekuatan password:</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {[1,2,3,4].map(i => {
                          const len = passwordForm.newPw.length;
                          const hasUpper = /[A-Z]/.test(passwordForm.newPw);
                          const hasNum   = /[0-9]/.test(passwordForm.newPw);
                          const hasSpec  = /[^A-Za-z0-9]/.test(passwordForm.newPw);
                          const score = (len >= 6 ? 1 : 0) + (len >= 10 ? 1 : 0) + (hasUpper || hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                          const colors = ['#ef4444','#f59e0b','#22c55e','#10b981'];
                          return (
                            <div key={i} style={{
                              flex: 1, height: 4, borderRadius: 2,
                              background: i <= score ? (colors[score - 1] || '#e2e8f0') : '#e2e8f0',
                              transition: 'background 0.3s'
                            }} />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button className="sp-pw-btn" onClick={handleChangePassword} disabled={pwStatus === 'saving'}>
                    {pwStatus === 'saving' ? 'Memproses...' : t.savePassword}
                  </button>

                  {pwStatus === 'success'  && <div className="sp-alert sp-alert-ok"><Check size={14} /> {t.passwordSaved || 'Password berhasil diperbarui!'}</div>}
                  {pwStatus === 'mismatch' && <div className="sp-alert sp-alert-err"><AlertCircle size={14} /> {t.passwordMismatch || 'Konfirmasi password tidak cocok!'}</div>}
                  {pwStatus === 'error'    && <div className="sp-alert sp-alert-err"><AlertCircle size={14} /> {pwErrorMessage || t.passwordError || 'Terjadi kesalahan, pastikan data benar.'}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sectionIn   { from { opacity:0; transform:translateX(6px); }  to { opacity:1; transform:translateX(0); } }
        @keyframes spin        { to { transform:rotate(360deg); } }

        /* ── Root ── */
        .sp-root { font-family: 'Poppins', sans-serif; animation: fadeSlideUp 0.35s ease-out; color: var(--text-primary, #0f172a); }
        .sp-header { margin-bottom: 22px; }
        .sp-title { font-size: 22px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0; }
        .sp-subtitle { font-size: 13px; color: var(--text-secondary, #64748b); margin: 3px 0 0; }

        /* ── Layout ── */
        .sp-layout { display: grid; grid-template-columns: 210px 1fr; gap: 20px; align-items: start; }

        /* ── Nav ── */
        .sp-nav {
          display: flex; flex-direction: column; gap: 2px;
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px; padding: 8px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
          position: sticky; top: 8px;
        }
        .sp-nav-btn {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 11px 13px; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 500; color: var(--text-secondary, #64748b);
          background: transparent; cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all 0.18s; text-align: left;
        }
        .sp-nav-btn:hover { background: var(--bg-hover, #f3f4f6); color: var(--text-primary, #0f172a); }
        .sp-nav-btn-active {
          background: linear-gradient(135deg, rgba(5,76,199,0.1), rgba(23,195,204,0.1)) !important;
          color: #054CC7 !important; font-weight: 600;
        }
        .sp-nav-arrow { margin-left: auto; color: #054CC7; flex-shrink: 0; }

        /* ── Content ── */
        .sp-content { min-width: 0; }
        .sp-section { animation: sectionIn 0.22s ease-out; }
        .sp-section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .sp-section-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sp-icon-blue   { background: #eff6ff; }
        .sp-icon-green  { background: #ecfdf5; }
        .sp-section-head h3 { font-size: 16px; font-weight: 700; color: var(--text-primary, #0f172a); margin: 0; }
        .sp-section-head p  { font-size: 12px; color: var(--text-secondary, #94a3b8); margin: 3px 0 0; }

        /* ── Cards ── */
        .sp-card {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .sp-card-padded { padding: 20px; }
        .sp-card-title  { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text-primary, #0f172a); margin-bottom: 16px; }

        /* ── Password form ── */
        .sp-pw-form { display: flex; flex-direction: column; gap: 14px; }
        .sp-pw-group { display: flex; flex-direction: column; gap: 5px; }
        .sp-pw-label { font-size: 12px; font-weight: 600; color: var(--text-primary, #374151); }
        .sp-pw-wrap { position: relative; }
        .sp-pw-input { width: 100%; padding: 10px 38px 10px 12px; border: 1.5px solid var(--border-color, #e2e8f0); border-radius: 10px; font-size: 13px; font-family: 'Poppins', sans-serif; background: var(--input-bg, #f8fafc); color: var(--text-primary, #0f172a); outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .sp-pw-input:focus { border-color: #054CC7; box-shadow: 0 0 0 3px rgba(5,76,199,0.08); }
        .sp-pw-input::placeholder { color: var(--text-secondary, #94a3b8); }
        .sp-pw-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; }
        .sp-pw-strength-label { font-size: 11px; color: var(--text-secondary, #64748b); }
        .sp-pw-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 20px; background: linear-gradient(135deg,#054CC7,#17C3CC); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; transition: opacity 0.2s; width: fit-content;}
        .sp-pw-btn:hover { opacity: 0.9; }
        .sp-pw-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Alerts ── */
        .sp-alert { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; font-size: 12px; font-weight: 500; }
        .sp-alert-ok  { background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; }
        .sp-alert-err { background: #fff1f2; border: 1px solid #fecdd3; color: #dc2626; }

        /* ── Account section ── */
        .sp-account-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--border-color, #f1f5f9); }
        .sp-account-avatar { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 800; }
        .sp-account-name   { font-size: 15px; font-weight: 700; color: var(--text-primary, #0f172a); }
        .sp-account-role   { font-size: 12px; font-weight: 600; margin-top: 2px; }
        .sp-account-status { font-size: 11px; color: var(--text-secondary, #94a3b8); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .sp-account-details { display: flex; flex-direction: column; gap: 12px; }
        .sp-detail-row   { display: flex; align-items: flex-start; gap: 10px; }
        .sp-detail-icon  { color: #94a3b8; margin-top: 1px; flex-shrink: 0; }
        .sp-detail-label { font-size: 10.5px; font-weight: 600; color: var(--text-secondary, #94a3b8); text-transform: uppercase; letter-spacing: 0.05em; }
        .sp-detail-value { font-size: 13px; font-weight: 600; color: var(--text-primary, #0f172a); margin-top: 1px; }

        /* ══════════════════════════════════
            DARK MODE OVERRIDES FOR SETTINGS
        ══════════════════════════════════ */
        body.dark-mode .sp-title       { color: #e8f0fe !important; }
        body.dark-mode .sp-subtitle    { color: #8fa8c8 !important; }
        body.dark-mode .sp-nav         { background: #0f1c2e; border-color: #1e3050; }
        body.dark-mode .sp-nav-btn     { color: #8fa8c8; }
        body.dark-mode .sp-nav-btn:hover { background: #182336; color: #e8f0fe; }
        body.dark-mode .sp-nav-btn-active { background: rgba(99,102,241,0.18) !important; color: #a5b4fc !important; }
        body.dark-mode .sp-card        { background: #0f1c2e; border-color: #1e3050; }
        body.dark-mode .sp-card-padded { background: #0f1c2e; }
        body.dark-mode .sp-card-title  { color: #e8f0fe; }
        body.dark-mode .sp-section-head h3 { color: #e8f0fe; }
        body.dark-mode .sp-section-head p  { color: #8fa8c8; }
        body.dark-mode .sp-pw-label    { color: #c7d9f5; }
        body.dark-mode .sp-pw-input    { background: #0d1829; border-color: #1e3050; color: #e8f0fe; }
        body.dark-mode .sp-pw-input::placeholder { color: #4a6285; }
        body.dark-mode .sp-pw-strength-label { color: #8fa8c8; }
        body.dark-mode .sp-account-name   { color: #e8f0fe; }
        body.dark-mode .sp-account-status { color: #8fa8c8; }
        body.dark-mode .sp-account-header { border-color: #1e3050; }
        body.dark-mode .sp-detail-label   { color: #8fa8c8; }
        body.dark-mode .sp-detail-value   { color: #c7d9f5; }
        body.dark-mode .sp-detail-icon    { color: #4a6285; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .sp-layout { grid-template-columns: 1fr; }
          .sp-nav { flex-direction: row; overflow-x: auto; position: static; padding: 6px; }
          .sp-nav-btn { flex-shrink: 0; font-size: 12px; padding: 8px 12px; }
          .sp-nav-arrow { display: none; }
        }
      `}</style>
    </div>
  );
}