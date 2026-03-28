'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useSettings } from '@/providers/settings-provider';
import { useAvatar } from '@/providers/avatar-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials, shortenName } from '@/lib/utils';
import {
  User, Mail, Shield, Save, Camera, Edit2, Check, X,
  Key, Clock, Calendar, AlertCircle, RefreshCw, Trash2
} from 'lucide-react';

const MAX_NAME_LENGTH = 30;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t, settings } = useSettings();
  const { avatarUrl, setAvatar, removeAvatar } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({ full_name: user.full_name || '', email: user.email || '' });
    }
  }, [user]);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(formData.full_name || user.full_name);
  const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const loginDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await updateUser({ full_name: formData.full_name, email: formData.email });
      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({ full_name: user.full_name || '', email: user.email || '' });
    setIsEditing(false);
    setSaveStatus('idle');
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG, PNG, WebP, dll.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);   // syncs to all components via context
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    if (!confirm('Hapus foto profil?')) return;
    removeAvatar();  // syncs to all components via context
  };

  return (
    <div className="pp-root">
      {/* Header */}
      <div className="pp-header">
        <div>
          <h1 className="pp-title">{t.myProfile}</h1>
          <p className="pp-subtitle">{t.profileSubtitle}</p>
        </div>
      </div>

      <div className="pp-layout">
        {/* Left — Profile Card */}
        <div className="pp-left">
          {/* Cover */}
          <div className="pp-card pp-profile-card">
            <div className="pp-cover" />
            <div className="pp-profile-body">
              {/* Avatar */}
              <div className="pp-avatar-section">
                <div className="pp-avatar-wrap">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto profil" className="pp-avatar-img" />
                  ) : (
                    <div className="pp-avatar-initials" style={{ background: roleConfig.color }}>
                      {initials}
                    </div>
                  )}
                  <button className="pp-avatar-btn" onClick={handleAvatarClick} title="Ganti foto profil">
                    {isUploading ? (
                      <div className="pp-spinner-sm" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="pp-avatar-info">
                  <h2 className="pp-user-name">{shortenName(formData.full_name || user.full_name, 20)}</h2>
                  <span className="pp-user-role" style={{ background: `${roleConfig.color}18`, color: roleConfig.color }}>
                    <Shield size={11} />
                    {roleConfig.label}
                  </span>
                  {avatarUrl && (
                    <button className="pp-remove-photo" onClick={handleRemoveAvatar}>
                      <Trash2 size={11} /> Hapus foto
                    </button>
                  )}
                </div>
              </div>

              <div className="pp-divider" />

              {/* Account Info */}
              <div className="pp-info-list">
                <div className="pp-info-row">
                  <div className="pp-info-icon-wrap" style={{ background: '#eff6ff' }}>
                    <Mail size={15} color="#3b82f6" />
                  </div>
                  <div>
                    <div className="pp-info-label">Email</div>
                    <div className="pp-info-value">{user.email}</div>
                  </div>
                </div>
                <div className="pp-info-row">
                  <div className="pp-info-icon-wrap" style={{ background: '#ecfdf5' }}>
                    <Clock size={15} color="#10b981" />
                  </div>
                  <div>
                    <div className="pp-info-label">Login Terakhir</div>
                    <div className="pp-info-value">{loginTime} · {loginDate}</div>
                  </div>
                </div>
                <div className="pp-info-row">
                  <div className="pp-info-icon-wrap" style={{ background: '#f5f3ff' }}>
                    <Shield size={15} color="#8b5cf6" />
                  </div>
                  <div>
                    <div className="pp-info-label">Status Akun</div>
                    <div className="pp-info-value" style={{ color: '#10b981', fontWeight: 700 }}>● Aktif</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload hint */}
          <div className="pp-upload-hint">
            <AlertCircle size={13} color="#94a3b8" />
            <span>Klik ikon kamera pada foto untuk menggantinya. Format: JPG, PNG, WebP. Maks 5MB.</span>
          </div>
        </div>

        {/* Right — Edit Form */}
        <div className="pp-right">
          <div className="pp-card">
            <div className="pp-form-header">
              <div>
                <h3 className="pp-form-title">{t.accountInfo}</h3>
                <p className="pp-form-sub">{t.profileSubtitle}</p>
              </div>
              {!isEditing && (
                <button className="pp-edit-toggle" onClick={() => setIsEditing(true)}>
                  <Edit2 size={14} /> {t.editProfile}
                </button>
              )}
            </div>

            <div className="pp-form">
              {/* Full Name */}
              <div className="pp-form-group">
                <label className="pp-label">
                  <User size={14} /> {t.fullName}
                </label>
                <div className="pp-input-wrap">
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className={`pp-input ${!isEditing ? 'pp-input-disabled' : ''}`}
                    placeholder="Masukkan nama lengkap"
                    maxLength={MAX_NAME_LENGTH}
                  />
                  {isEditing && (
                    <span className="pp-char-count">{formData.full_name.length}/{MAX_NAME_LENGTH}</span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="pp-form-group">
                <label className="pp-label">
                  <Mail size={14} /> {t.email}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className={`pp-input ${!isEditing ? 'pp-input-disabled' : ''}`}
                  placeholder="Masukkan email"
                />
              </div>

              {/* Role (read-only) */}
              <div className="pp-form-group">
                <label className="pp-label">
                  <Shield size={14} /> {t.role}
                </label>
                <input
                  type="text"
                  value={roleConfig.label}
                  disabled
                  className="pp-input pp-input-disabled"
                  readOnly
                />
                <p className="pp-field-hint">Role tidak dapat diubah. Hubungi Administrator.</p>
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="pp-form-actions">
                  <button className="pp-btn-cancel" onClick={handleCancel}>
                    <X size={15} /> {t.cancel}
                  </button>
                  <button
                    className="pp-btn-save"
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                  >
                    {saveStatus === 'saving' ? (
                      <><div className="pp-spinner-sm pp-spinner-white" /> {settings.language === 'id' ? 'Menyimpan...' : 'Saving...'}</>
                    ) : (
                      <><Save size={15} /> {t.saveChanges}</>
                    )}
                  </button>
                </div>
              )}

              {/* Status messages */}
              {saveStatus === 'saved' && (
                <div className="pp-alert pp-alert-success">
                  <Check size={16} /> {t.profileUpdated}
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="pp-alert pp-alert-error">
                  <AlertCircle size={16} /> {t.saveFailed}
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pp-card pp-danger-card">
            <h3 className="pp-danger-title">Zona Berbahaya</h3>
            <p className="pp-danger-sub">Tindakan berikut bersifat permanen dan tidak dapat dibatalkan.</p>
            <div className="pp-danger-actions">
              <button className="pp-danger-btn" onClick={() => {
                if (confirm('Reset semua data sesi? Anda akan di-logout.')) {
                  localStorage.clear();
                  window.location.href = '/login';
                }
              }}>
                <RefreshCw size={14} /> Reset Data Sesi
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pp-root { font-family: 'Poppins', sans-serif; animation: fadeSlideUp 0.4s ease-out; }

        .pp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .pp-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .pp-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }

        .pp-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }

        .pp-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .pp-profile-card {}

        .pp-cover {
          height: 80px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
        }

        .pp-profile-body { padding: 0 20px 20px; }

        .pp-avatar-section {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          margin-top: -28px;
          margin-bottom: 16px;
        }

        .pp-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .pp-avatar-img {
          width: 80px; height: 80px;
          border-radius: 16px;
          object-fit: cover;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .pp-avatar-initials {
          width: 80px; height: 80px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          font-size: 26px;
          font-weight: 800;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .pp-avatar-btn {
          position: absolute;
          bottom: -4px; right: -4px;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: #054CC7;
          border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(5,76,199,0.3);
        }
        .pp-avatar-btn:hover { background: #3b82f6; transform: scale(1.1); }

        .pp-avatar-info { flex: 1; padding-top: 30px; min-width: 0; }
        .pp-user-name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-user-role { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .pp-remove-photo { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 11px; color: #ef4444; background: none; border: none; cursor: pointer; padding: 0; font-family: 'Poppins', sans-serif; }
        .pp-remove-photo:hover { text-decoration: underline; }

        .pp-divider { height: 1px; background: #f1f5f9; margin: 16px 0; }

        .pp-info-list { display: flex; flex-direction: column; gap: 14px; }
        .pp-info-row { display: flex; align-items: center; gap: 12px; }
        .pp-info-icon-wrap { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pp-info-label { font-size: 10.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .pp-info-value { font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 1px; }

        .pp-upload-hint {
          display: flex; align-items: flex-start; gap: 6px;
          margin-top: 10px;
          font-size: 11px; color: #94a3b8; line-height: 1.4;
        }

        /* Form */
        .pp-right { display: flex; flex-direction: column; gap: 16px; }

        .pp-form-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 20px 20px 0;
          margin-bottom: 20px;
        }
        .pp-form-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .pp-form-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }

        .pp-edit-toggle {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          font-size: 12px; font-weight: 600; color: #054CC7;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .pp-edit-toggle:hover { background: #dbeafe; }

        .pp-form { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 18px; }

        .pp-form-group { display: flex; flex-direction: column; gap: 6px; }

        .pp-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600; color: #374151;
        }

        .pp-input-wrap { position: relative; }

        .pp-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #0f172a;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .pp-input:focus { outline: none; border-color: #054CC7; box-shadow: 0 0 0 3px rgba(5,76,199,0.08); }
        .pp-input-disabled { background: #f8fafc; color: #6b7280; cursor: default; }

        .pp-char-count {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          font-size: 10px; color: #9ca3af; font-weight: 500;
        }

        .pp-field-hint { font-size: 11px; color: #9ca3af; margin: 0; }

        .pp-form-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }

        .pp-btn-cancel, .pp-btn-save {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }
        .pp-btn-cancel { background: white; border: 1px solid #e5e7eb; color: #374151; }
        .pp-btn-cancel:hover { background: #f3f4f6; }
        .pp-btn-save { background: linear-gradient(135deg, #054CC7, #17C3CC); border: none; color: white; }
        .pp-btn-save:hover { opacity: 0.9; transform: translateY(-1px); }
        .pp-btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .pp-spinner-sm {
          width: 14px; height: 14px;
          border: 2px solid rgba(5,76,199,0.2);
          border-top-color: #054CC7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        .pp-spinner-white {
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
        }

        .pp-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
        }
        .pp-alert-success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; }
        .pp-alert-error { background: #fff1f2; border: 1px solid #fecdd3; color: #dc2626; }

        /* Danger Zone */
        .pp-danger-card { padding: 20px; border-color: #fecdd3; }
        .pp-danger-title { font-size: 14px; font-weight: 700; color: #dc2626; margin-bottom: 4px; }
        .pp-danger-sub { font-size: 12px; color: #9ca3af; margin-bottom: 14px; }
        .pp-danger-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .pp-danger-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px;
          background: white; border: 1px solid #fecdd3;
          border-radius: 8px;
          font-size: 12px; font-weight: 600; color: #dc2626;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }
        .pp-danger-btn:hover { background: #fff1f2; }

        @media (max-width: 900px) {
          .pp-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
