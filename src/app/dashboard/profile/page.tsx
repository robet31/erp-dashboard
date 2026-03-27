'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getRoleConfig } from '@/config/rbac';
import { getInitials, truncate, shortenName } from '@/lib/utils';
import { User, Mail, Shield, Save, Camera, Edit2, Check, X, Upload, Key, Clock } from 'lucide-react';

const MAX_NAME_LENGTH = 25;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const displayName = shortenName(formData.full_name, MAX_NAME_LENGTH);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  const initials = getInitials(user.full_name);

  const handleSave = () => {
    updateUser({
      full_name: formData.full_name,
      email: formData.email,
    });
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        alert('Foto profil berhasil diperbarui!');
      }, 1000);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title-text">Profil Saya</h1>
        <p className="page-subtitle-text">Kelola informasi profil dan akun Anda</p>
      </div>

      <div className="profile-layout">
        {/* Profile Card - Left */}
        <div className="profile-card-main">
          <div className="profile-cover"></div>
          
          <div className="profile-main-content">
            <div className="avatar-section">
              <div className="avatar-wrapper" style={{ background: roleConfig.color }}>
                <span className="avatar-initials">{initials}</span>
                <button className="avatar-overlay" onClick={handleAvatarClick}>
                  {isUploading ? (
                    <div className="avatar-spinner" />
                  ) : (
                    <Camera size={16} />
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
              <div className="avatar-info">
                <h2 className="user-name">{displayName}</h2>
                {formData.full_name.length > MAX_NAME_LENGTH && (
                  <span className="full-name-tooltip" title={formData.full_name}>(nama lengkap)</span>
                )}
                <span className="user-role" style={{ color: roleConfig.color, background: `${roleConfig.color}15` }}>
                  <Shield size={12} />
                  {roleConfig.label}
                </span>
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <Clock size={16} />
                <div>
                  <span className="stat-value">Terakhir login</span>
                  <span className="stat-label">Hari ini, 09:30</span>
                </div>
              </div>
              <div className="stat-item">
                <Key size={16} />
                <div>
                  <span className="stat-value">Status akun</span>
                  <span className="stat-label">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form - Right */}
        <div className="profile-form-card">
          <div className="form-header">
            <h3>Informasi Akun</h3>
            <p>Kelola data profil Anda</p>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Nama Lengkap
              </label>
              <div className="form-input-wrapper">
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className="form-input"
                  placeholder="Masukkan nama lengkap"
                />
                {!isEditing && (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={16} />
                Email
              </label>
              <div className="form-input-wrapper">
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="form-input"
                  placeholder="Masukkan email"
                />
                {!isEditing && (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Shield size={16} />
                Role / Jabatan
              </label>
              <div className="form-input-wrapper">
                <input 
                  type="text" 
                  value={roleConfig.label}
                  disabled
                  className="form-input disabled"
                  readOnly
                />
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                  <X size={16} />
                  Batal
                </button>
                <button className="btn-save" onClick={handleSave}>
                  <Save size={16} />
                  Simpan Perubahan
                </button>
              </div>
            )}

            {saved && (
              <div className="save-success">
                <Check size={16} />
                Perubahan berhasil disimpan!
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
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

        .profile-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }
        }

        .profile-card-main {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .profile-cover {
          height: 80px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
        }

        .profile-main-content {
          padding: 24px;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .avatar-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: 800;
          position: relative;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .avatar-overlay {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #054CC7;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }

        .avatar-overlay:hover {
          background: #043b9c;
          transform: scale(1.1);
        }

        .avatar-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .avatar-info {
          flex: 1;
        }

        .user-name {
          font-size: 18px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 2px;
        }

        .full-name-tooltip {
          font-size: 11px;
          color: #9CA3AF;
          font-weight: 400;
          display: block;
          margin-bottom: 4px;
        }

        .user-role {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .profile-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #6B7280;
        }

        .stat-item > div {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .stat-label {
          font-size: 12px;
          color: #9CA3AF;
        }

        .profile-form-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .form-header {
          margin-bottom: 24px;
        }

        .form-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .form-header p {
          font-size: 13px;
          color: #6B7280;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .form-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #054CC7;
          box-shadow: 0 0 0 3px rgba(5, 76, 199, 0.1);
        }

        .form-input.disabled {
          background: #f9fafb;
          color: #6B7280;
        }

        .edit-btn {
          position: absolute;
          right: 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          color: #6B7280;
          transition: all 0.2s;
        }

        .edit-btn:hover {
          background: #e5e7eb;
          color: #054CC7;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 8px;
        }

        .btn-cancel, .btn-save {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
        }

        .btn-cancel {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        .btn-cancel:hover {
          background: #f9fafb;
        }

        .btn-save {
          background: #054CC7;
          border: none;
          color: white;
        }

        .btn-save:hover {
          background: #043b9c;
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
