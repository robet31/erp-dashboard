'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials } from '@/lib/utils';
import {
  Bell, Moon, Globe, Lock, Eye, EyeOff,
  Save, Check, Monitor, Shield, User, Mail,
  Key, Palette, MessageSquare, Clock, AlertCircle,
  RefreshCw, Volume2, VolumeX, Zap, Sun, Smartphone,
  Type, Layout, Accessibility, ChevronRight, Info
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  // draft = pending form values, settings = currently applied
  const { settings, draft, updateDraft, saveSettings, t } = useSettings();
  const { avatarUrl } = useAvatar();
  const [activeSection, setActiveSection] = useState('appearance');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [passwordForm, setPasswordForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwShow, setPwShow] = useState({ current: false, newPw: false, confirm: false });
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'mismatch'>('idle');

  // Sync draft when settings section is opened freshly
  // (draft already mirrors saved settings on load from provider)

  if (!user) return null;
  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);

  // Has anything changed from applied settings?
  const hasUnsaved = JSON.stringify(draft) !== JSON.stringify(settings);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      saveSettings();   // applies draft → DOM + localStorage
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 400);
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.newPw || !passwordForm.confirm) {
      setPwStatus('error'); setTimeout(() => setPwStatus('idle'), 3000); return;
    }
    if (passwordForm.newPw !== passwordForm.confirm) {
      setPwStatus('mismatch'); setTimeout(() => setPwStatus('idle'), 3000); return;
    }
    if (passwordForm.newPw.length < 6) {
      setPwStatus('error'); setTimeout(() => setPwStatus('idle'), 3000); return;
    }
    setPwStatus('saving');
    setTimeout(() => {
      setPwStatus('success');
      setPasswordForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setPwStatus('idle'), 4000);
    }, 800);
  };

  const playTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const sections = [
    { id: 'appearance',    label: t.appearance,   icon: Palette  },
    { id: 'notifications', label: t.notifSection,  icon: Bell     },
    { id: 'security',      label: t.security,      icon: Shield   },
    { id: 'account',       label: t.accountInfo,   icon: User     },
  ];

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      className={`sp-toggle ${checked ? 'sp-toggle-on' : ''}`}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      type="button"
    >
      <span className="sp-toggle-thumb" />
    </button>
  );

  const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const loginDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Preview mini card uses DRAFT dark mode setting
  const prevDark = draft.darkMode;

  return (
    <div className="sp-root">
      <div className="sp-header">
        <h1 className="sp-title">{t.settings}</h1>
        <p className="sp-subtitle">Kelola preferensi dan pengaturan sistem Anda</p>
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

          {/* ─── APPEARANCE ─── */}
          {activeSection === 'appearance' && (
            <div className="sp-section" key="appearance">
              <div className="sp-section-head">
                <div className="sp-section-icon sp-icon-purple"><Palette size={18} color="#8b5cf6" /></div>
                <div>
                  <h3>{t.appearance}</h3>
                  <p>Atur tampilan visual dan tema antarmuka</p>
                </div>
              </div>

              {/* Dark Mode Card with mini preview */}
              <div className="sp-feature-card" style={{ marginBottom: 16 }}>
                {/* Mini UI preview */}
                <div
                  className="sp-dark-preview"
                  style={{
                    background: prevDark
                      ? 'linear-gradient(135deg,#09111f 0%,#0f1c2e 100%)'
                      : 'linear-gradient(135deg,#f4f6fb 0%,#e8eef7 100%)',
                  }}
                >
                  {/* fake topbar */}
                  <div className="sp-dp-bar" style={{ background: prevDark ? '#07101e' : '#fff', borderColor: prevDark ? '#1e3050' : '#e2e8f0' }}>
                    <div style={{ width: 28, height: 10, borderRadius: 4, background: prevDark ? '#1e3a5f' : '#054CC7' }} />
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: prevDark ? '#1e3050' : '#f1f5f9', marginLeft: 8 }} />
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: prevDark ? '#1e3a5f' : '#e2e8f0' }} />
                  </div>
                  {/* fake cards */}
                  <div className="sp-dp-cards">
                    {[80, 55, 90].map((w, i) => (
                      <div key={i} className="sp-dp-card" style={{ background: prevDark ? '#0f1c2e' : '#fff', borderColor: prevDark ? '#1e3050' : '#e2e8f0' }}>
                        <div style={{ width: `${w}%`, height: 7, borderRadius: 3, background: prevDark ? '#1e3a5f' : '#e2e8f0', marginBottom: 5 }} />
                        <div style={{ width: '40%', height: 5, borderRadius: 3, background: prevDark ? '#2d4a6a' : '#f1f5f9' }} />
                      </div>
                    ))}
                  </div>
                  <div className="sp-dp-label" style={{ color: prevDark ? '#8fa8c8' : '#64748b' }}>
                    {prevDark ? '🌙 Dark' : '☀️ Light'}
                  </div>
                </div>

                {/* Controls */}
                <div className="sp-dark-ctrl">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {draft.darkMode ? <Moon size={20} color="#818cf8" /> : <Sun size={20} color="#f59e0b" />}
                    <div>
                      <div className="sp-item-label">{t.darkMode}</div>
                      <div className="sp-item-desc">{t.darkModeDesc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className={`sp-theme-btn ${!draft.darkMode ? 'sp-theme-btn-active' : ''}`}
                      onClick={() => updateDraft({ darkMode: false })}
                    >
                      <Sun size={13} /> Light
                    </button>
                    <button
                      type="button"
                      className={`sp-theme-btn ${draft.darkMode ? 'sp-theme-btn-dark' : ''}`}
                      onClick={() => updateDraft({ darkMode: true })}
                    >
                      <Moon size={13} /> Dark
                    </button>
                  </div>
                </div>
              </div>

              <div className="sp-card" style={{ marginBottom: 16 }}>
                {/* Data Density */}
                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><Layout size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.dataDensity}</span>
                    <span className="sp-item-desc">{t.dataDensityDesc}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['comfortable', 'cozy', 'compact'] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`sp-font-btn ${draft.dataDensity === d ? 'sp-font-btn-active' : ''}`}
                        onClick={() => updateDraft({ dataDensity: d })}
                        style={{ width: 'auto', padding: '4px 10px', fontSize: 11 }}
                      >
                        {t[d === 'comfortable' ? 'densityComfortable' : d === 'cozy' ? 'densityCozy' : 'densityCompact']}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}><Globe size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.language}</span>
                    <span className="sp-item-desc">{t.languageDesc}</span>
                  </div>
                  <select className="sp-select" value={draft.language} onChange={e => updateDraft({ language: e.target.value as 'id' | 'en' })}>
                    <option value="id">{t.langId}</option>
                    <option value="en">{t.langEn}</option>
                  </select>
                </div>

                {/* Font Size */}
                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#fefce8', color: '#ca8a04' }}><Type size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.fontSize}</span>
                    <span className="sp-item-desc">
                      {t.fontSizeDesc} —{' '}
                      <strong style={{ color: '#054CC7' }}>
                        Aa {draft.fontSize === 'sm' ? '13px' : draft.fontSize === 'md' ? '14px' : '16px'}
                      </strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['sm', 'md', 'lg'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`sp-font-btn ${draft.fontSize === s ? 'sp-font-btn-active' : ''}`}
                        onClick={() => updateDraft({ fontSize: s })}
                        style={{ fontSize: s === 'sm' ? 11 : s === 'md' ? 14 : 17 }}
                      >
                        Aa
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessibility */}
                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><Accessibility size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">Aksesibilitas Tinggi</span>
                    <span className="sp-item-desc">Tingkatkan kontras dan keterbacaan teks</span>
                  </div>
                  <span className="sp-badge-coming">{t.comingSoon}</span>
                </div>
              </div>

              {/* Language preview */}
              <div className="sp-preview-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Info size={13} color="#054CC7" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#054CC7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {draft.language === 'id' ? 'Pratinjau Bahasa' : 'Language Preview'}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#374151' }}>
                  {draft.language === 'id'
                    ? '✅ Bahasa Indonesia aktif — semua teks tampil dalam Bahasa Indonesia'
                    : '✅ English is active — all text will display in English'}
                </span>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {activeSection === 'notifications' && (
            <div className="sp-section" key="notifications">
              <div className="sp-section-head">
                <div className="sp-section-icon sp-icon-amber"><Bell size={18} color="#f59e0b" /></div>
                <div>
                  <h3>{t.notifSection}</h3>
                  <p>Atur bagaimana Anda menerima pemberitahuan</p>
                </div>
              </div>
              <div className="sp-card">
                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Bell size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.pushNotif}</span>
                    <span className="sp-item-desc">{t.pushNotifDesc}</span>
                  </div>
                  <Toggle checked={draft.notifications} onChange={() => {
                    if (!draft.notifications && 'Notification' in window) Notification.requestPermission();
                    updateDraft({ notifications: !draft.notifications });
                  }} />
                </div>

                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><Mail size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.emailNotif}</span>
                    <span className="sp-item-desc">{user.email}</span>
                  </div>
                  <Toggle checked={draft.emailNotifications} onChange={() => updateDraft({ emailNotifications: !draft.emailNotifications })} />
                </div>

                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                    {draft.soundNotifications ? <Volume2 size={17} /> : <VolumeX size={17} />}
                  </div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.soundNotif}</span>
                    <span className="sp-item-desc">{t.soundNotifDesc}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {draft.soundNotifications && (
                      <button type="button" className="sp-test-btn" onClick={playTestSound}>▶ Test</button>
                    )}
                    <Toggle checked={draft.soundNotifications} onChange={() => {
                      const next = !draft.soundNotifications;
                      updateDraft({ soundNotifications: next });
                      if (next) setTimeout(playTestSound, 100);
                    }} />
                  </div>
                </div>

                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><Smartphone size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.mobileNotif}</span>
                    <span className="sp-item-desc">{t.mobileNotifDesc}</span>
                  </div>
                  <span className="sp-badge-coming">{t.comingSoon}</span>
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
                  <p>Kelola keamanan dan akses akun Anda</p>
                </div>
              </div>

              {/* Change Password */}
              <div className="sp-card sp-card-padded" style={{ marginBottom: 16 }}>
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
                    {pwStatus === 'saving' ? 'Menyimpan...' : t.savePassword}
                  </button>

                  {pwStatus === 'success'  && <div className="sp-alert sp-alert-ok"><Check size={14} /> {t.passwordSaved}</div>}
                  {pwStatus === 'mismatch' && <div className="sp-alert sp-alert-err"><AlertCircle size={14} /> {t.passwordMismatch}</div>}
                  {pwStatus === 'error'    && <div className="sp-alert sp-alert-err"><AlertCircle size={14} /> {t.passwordError}</div>}
                </div>
              </div>

              <div className="sp-card">
                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}><Shield size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.twoFactor}</span>
                    <span className="sp-item-desc">{t.twoFactorDesc}</span>
                  </div>
                  <Toggle checked={draft.twoFactor} onChange={() => {
                    updateDraft({ twoFactor: !draft.twoFactor });
                    if (!draft.twoFactor) alert('2FA diaktifkan. Scan QR Code di aplikasi Authenticator Anda.');
                  }} />
                </div>

                <div className="sp-item">
                  <div className="sp-item-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Clock size={17} /></div>
                  <div className="sp-item-text">
                    <span className="sp-item-label">{t.autoLogout}</span>
                    <span className="sp-item-desc">{t.autoLogoutDesc}</span>
                  </div>
                  <select className="sp-select" value={draft.autoLogout} onChange={e => updateDraft({ autoLogout: e.target.value })}>
                    <option value="15">15 menit</option>
                    <option value="30">30 menit</option>
                    <option value="60">1 jam</option>
                    <option value="120">2 jam</option>
                    <option value="never">Tidak pernah</option>
                  </select>
                </div>
              </div>
            </div>
          )}

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

              <div className="sp-card sp-card-padded" style={{ marginTop: 16 }}>
                <div className="sp-card-title"><RefreshCw size={15} color="#dc2626" /> {t.dataManagement}</div>
                <p className="sp-data-desc">{t.dataManagementDesc}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="sp-action-btn sp-action-red" onClick={() => {
                    if (confirm('Reset semua cache & data lokal? Anda akan di-logout.')) {
                      localStorage.clear(); window.location.href = '/login';
                    }
                  }}><RefreshCw size={13} /> {t.resetSession}</button>
                  <button className="sp-action-btn sp-action-gray" onClick={() => {
                    localStorage.removeItem('erp_user_settings'); window.location.reload();
                  }}>{t.resetSettings}</button>
                </div>
              </div>
            </div>
          )}

          {/* Save bar — shown for appearance, notifications, security */}
          {activeSection !== 'account' && (
            <div className={`sp-save-bar ${hasUnsaved ? 'sp-save-bar-visible' : ''}`}>
              {hasUnsaved && (
                <div className="sp-unsaved-hint">
                  <Info size={13} /> Perubahan belum disimpan
                </div>
              )}
              <button className="sp-save-btn" onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? (
                  <><div className="sp-spin" /> Menyimpan...</>
                ) : saveStatus === 'saved' ? (
                  <><Check size={16} /> Tersimpan!</>
                ) : (
                  <><Save size={16} /> {t.saveSettings}</>
                )}
              </button>
              {saveStatus === 'saved' && (
                <div className="sp-save-ok"><Check size={14} /> {t.settingsSaved}</div>
              )}
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
        .sp-icon-purple { background: #f5f3ff; }
        .sp-icon-amber  { background: #fef3c7; }
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

        /* ── Dark mode FEATURE card ── */
        .sp-feature-card {
          display: flex; border-radius: 16px; overflow: hidden;
          border: 1px solid var(--border-color, #e2e8f0);
          box-shadow: 0 1px 5px rgba(0,0,0,0.04);
          background: var(--bg-card, #fff);
        }
        .sp-dark-preview {
          width: 170px; flex-shrink: 0; padding: 12px;
          display: flex; flex-direction: column; gap: 8px;
          transition: background 0.4s ease;
        }
        .sp-dp-bar {
          height: 22px; border-radius: 7px; border: 1px solid;
          display: flex; align-items: center; padding: 0 7px; gap: 6px;
          transition: all 0.4s;
        }
        .sp-dp-cards { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .sp-dp-card {
          border-radius: 8px; border: 1px solid; padding: 8px;
          transition: all 0.4s;
        }
        .sp-dp-label { font-size: 10px; font-weight: 700; text-align: center; transition: color 0.4s; }

        .sp-dark-ctrl { flex: 1; padding: 18px 20px; display: flex; flex-direction: column; justify-content: center; }
        .sp-theme-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 9px; font-size: 12px; font-weight: 600;
          border: 1.5px solid var(--border-color, #e2e8f0);
          background: var(--bg-card, #fff); color: var(--text-secondary, #64748b);
          cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.2s;
        }
        .sp-theme-btn:hover { border-color: #054CC7; color: #054CC7; }
        .sp-theme-btn-active { border-color: #f59e0b !important; color: #f59e0b !important; background: rgba(245,158,11,0.08) !important; }
        .sp-theme-btn-dark   { border-color: #818cf8 !important; color: #818cf8 !important; background: rgba(129,140,248,0.1) !important; }

        /* ── Items ── */
        .sp-item { display: flex; align-items: center; padding: 13px 16px; gap: 13px; border-bottom: 1px solid var(--border-color, #f1f5f9); transition: background 0.15s; }
        .sp-item:last-child { border-bottom: none; }
        .sp-item:hover { background: var(--bg-hover, #f8fafc); }
        .sp-item-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sp-item-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .sp-item-label { font-size: 13px; font-weight: 600; color: var(--text-primary, #0f172a); }
        .sp-item-desc  { font-size: 11px; color: var(--text-secondary, #94a3b8); }

        /* ── Toggle ── */
        .sp-toggle {
          width: 44px; height: 24px; border-radius: 12px;
          background: #d1d5db; border: none; cursor: pointer;
          position: relative; flex-shrink: 0;
          transition: background 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-toggle-on { background: linear-gradient(135deg, #054CC7, #17C3CC); }
        .sp-toggle-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .sp-toggle-on .sp-toggle-thumb { left: 23px; }

        /* ── Font Size buttons ── */
        .sp-font-btn {
          width: 38px; height: 30px; border-radius: 8px;
          border: 1.5px solid var(--border-color, #e2e8f0);
          background: var(--bg-card, #fff); color: var(--text-secondary, #64748b);
          font-weight: 700; cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all 0.18s; line-height: 1;
        }
        .sp-font-btn:hover { border-color: #054CC7; color: #054CC7; }
        .sp-font-btn-active {
          background: linear-gradient(135deg, #054CC7, #17C3CC) !important;
          color: #fff !important; border-color: transparent !important;
        }

        /* ── Select ── */
        .sp-select {
          padding: 7px 10px; font-size: 12px; font-family: 'Poppins', sans-serif;
          border: 1.5px solid var(--border-color, #e2e8f0); border-radius: 8px;
          background: var(--bg-card, #fff); color: var(--text-primary, #0f172a);
          cursor: pointer; min-width: 130px; outline: none;
        }
        .sp-select:focus { border-color: #054CC7; }

        /* ── Badge coming soon ── */
        .sp-badge-coming { font-size: 10px; font-weight: 600; padding: 3px 9px; background: #f1f5f9; color: #94a3b8; border-radius: 20px; white-space: nowrap; }

        /* ── Preview box ── */
        .sp-preview-box { margin-top: 12px; background: linear-gradient(135deg,#eff6ff,#e0f7ff); border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px 16px; }

        /* ── Test button ── */
        .sp-test-btn { font-size: 11px; font-weight: 600; color: #054CC7; background: rgba(5,76,199,0.08); border: 1px solid rgba(5,76,199,0.2); border-radius: 7px; padding: 4px 10px; cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.2s; white-space: nowrap; }
        .sp-test-btn:hover { background: rgba(5,76,199,0.15); }

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
        .sp-pw-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 20px; background: linear-gradient(135deg,#054CC7,#17C3CC); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; transition: opacity 0.2s; }
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
        .sp-data-desc    { font-size: 12px; color: var(--text-secondary, #9ca3af); margin-bottom: 14px; }

        /* ── Action buttons ── */
        .sp-action-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.2s; border: 1px solid; }
        .sp-action-red { background: var(--bg-card, #fff); border-color: #fecdd3; color: #dc2626; }
        .sp-action-red:hover  { background: #fff1f2; }
        .sp-action-gray { background: var(--bg-card, #fff); border-color: var(--border-color, #e2e8f0); color: var(--text-primary, #374151); }
        .sp-action-gray:hover { background: var(--bg-hover, #f3f4f6); }

        /* ── Save bar ── */
        .sp-save-bar { margin-top: 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .sp-save-btn { display: flex; align-items: center; gap: 8px; padding: 12px 26px; background: linear-gradient(135deg,#054CC7,#17C3CC); color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; box-shadow: 0 4px 14px rgba(5,76,199,0.25); transition: all 0.25s; }
        .sp-save-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(5,76,199,0.35); }
        .sp-save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .sp-save-ok { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #10b981; font-weight: 600; }
        .sp-unsaved-hint { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #f59e0b; font-weight: 600; background: rgba(245,158,11,0.1); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(245,158,11,0.25); }
        .sp-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }

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
        body.dark-mode .sp-item        { border-color: #1e3050; }
        body.dark-mode .sp-item:hover  { background: #182336; }
        body.dark-mode .sp-item-label  { color: #e8f0fe; }
        body.dark-mode .sp-item-desc   { color: #8fa8c8; }
        body.dark-mode .sp-section-head h3 { color: #e8f0fe; }
        body.dark-mode .sp-section-head p  { color: #8fa8c8; }
        body.dark-mode .sp-select      { background: #0d1829; border-color: #1e3050; color: #e8f0fe; }
        body.dark-mode .sp-feature-card { background: #0f1c2e; border-color: #1e3050; }
        body.dark-mode .sp-dark-ctrl   { background: #0f1c2e; }
        body.dark-mode .sp-theme-btn   { background: #0d1829; border-color: #1e3050; color: #8fa8c8; }
        body.dark-mode .sp-font-btn    { background: #0d1829; border-color: #1e3050; color: #8fa8c8; }
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
        body.dark-mode .sp-data-desc      { color: #8fa8c8; }
        body.dark-mode .sp-action-red     { background: #0f1c2e; }
        body.dark-mode .sp-action-gray    { background: #0f1c2e; border-color: #1e3050; color: #c7d9f5; }
        body.dark-mode .sp-action-gray:hover { background: #182336; }
        body.dark-mode .sp-badge-coming   { background: #182336; color: #8fa8c8; }
        body.dark-mode .sp-preview-box    { background: linear-gradient(135deg,#0f1c2e,#09111f); border-color: #1e3050; }
        body.dark-mode .sp-preview-box span { color: #8fa8c8 !important; }
        body.dark-mode .sp-unsaved-hint   { color: #fbbf24; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .sp-layout { grid-template-columns: 1fr; }
          .sp-nav { flex-direction: row; overflow-x: auto; position: static; padding: 6px; }
          .sp-nav-btn { flex-shrink: 0; font-size: 12px; padding: 8px 12px; }
          .sp-nav-arrow { display: none; }
          .sp-dark-preview { width: 130px; }
          .sp-feature-card { flex-direction: column; }
          .sp-dark-preview { width: 100%; height: 100px; }
        }
      `}</style>
    </div>
  );
}
