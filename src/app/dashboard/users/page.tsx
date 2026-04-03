'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import {
  Users, Plus, Search, X, Edit2, Trash2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, UserCheck
} from 'lucide-react';
import { ROLES, type UserRole } from '@/config/rbac';

export type DbUser = {
  id?: string;
  full_name: string;
  email: string;
  role: string;
};

// --- KOMPONEN MODAL NOTIFIKASI ---
function NotificationModal({ show, title, message, type, onClose }: { show: boolean, title: string, message: string, type: 'success' | 'error', onClose: () => void }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'scaleIn 0.2s ease-out', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          {type === 'success' ? (
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={28} />
            </div>
          ) : (
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={28} />
            </div>
          )}
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', lineHeight: 1.5 }}>{message}</p>
        <button onClick={onClose} style={{ width: '100%', padding: '12px 16px', background: type === 'success' ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.9'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
          Tutup
        </button>
      </div>
    </div>
  );
}

// --- KOMPONEN MODAL CREATE/EDIT USER ---
function CreateUserModal({ onClose, editingUser, onSuccess }: { onClose: () => void; editingUser?: DbUser | null; onSuccess: (msg: string) => void }) {
  const [form, setForm] = useState({
    email: editingUser?.email || '',
    password: '',
    full_name: editingUser?.full_name || '',
    role: (editingUser?.role as UserRole) || 'admin_sales',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const currentRole = ROLES.find(r => r.id === form.role) || ROLES[2];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.full_name) {
      setError('Harap isi email dan nama lengkap');
      return;
    }
    
    if (!editingUser && form.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (editingUser) {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: editingUser.email,
            full_name: form.full_name,
            role: form.role,
            password: form.password ? form.password : undefined, 
          })
        });
        
        if (!res.ok) throw new Error('Gagal memperbarui user');
        onSuccess('Data user berhasil diperbarui di database PostgreSQL!');
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            full_name: form.full_name, 
            email: form.email, 
            password: form.password,
            role: form.role 
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Email sudah terdaftar!');
        }
        onSuccess('User baru berhasil ditambahkan ke PostgreSQL!');
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    administrator: '#dc2626',
    admin_sales: '#2563eb',
    admin_gudang: '#16a34a',
    manajer_produksi: '#d97706',
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto', animation: 'scaleIn 0.2s ease-out', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{editingUser ? 'Edit User' : 'Tambah User Baru'}</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{editingUser ? 'Perbarui data user di database' : 'Tambah user baru ke PostgreSQL'}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#111827'; }} onMouseOut={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#6B7280'; }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Lengkap *</label>
            <input 
              type="text" 
              required 
              className="erp-input" 
              style={{ fontSize: '13px' }} 
              value={form.full_name} 
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} 
              placeholder="John Doe"
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email *</label>
            <input 
              type="email" 
              required 
              className="erp-input" 
              style={{ fontSize: '13px' }} 
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
              placeholder="email@anda.com"
              disabled={!!editingUser}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password *'}
            </label>
            <input 
              type="password" 
              required={!editingUser} 
              className="erp-input" 
              style={{ fontSize: '13px' }} 
              value={form.password} 
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              placeholder={editingUser ? "Biarkan kosong jika tetap..." : "Masukkan password..."}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Role / Jabatan *</label>
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                style={{ 
                  width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', 
                  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    background: `${ROLE_COLORS[form.role] || '#6B7280'}15`, color: ROLE_COLORS[form.role] || '#6B7280',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 
                  }}>
                    {currentRole?.badge || 'U'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{currentRole?.label || form.role}</span>
                </div>
                {showRoleDropdown ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
              </button>
              
              {showRoleDropdown && (
                <div style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', 
                  border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 50, marginTop: '4px', overflow: 'hidden' 
                }}>
                  {ROLES.map((role) => (
                    <button 
                      key={role.id}
                      type="button"
                      onClick={() => { 
                        setForm(f => ({ ...f, role: role.id as UserRole })); 
                        setShowRoleDropdown(false); 
                      }}
                      style={{ 
                        width: '100%', padding: '10px 14px', background: form.role === role.id ? '#eff6ff' : 'white',
                        border: 'none', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <span style={{ 
                        background: `${role.color}15`, color: role.color,
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 
                      }}>
                        {role.badge}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{role.label}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{role.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}>Batal</button>
            <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '12px', background: isLoading ? '#94b8d6' : '#0066B3', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }} onMouseOver={e => { if (!isLoading) e.currentTarget.style.background = '#005494' }} onMouseOut={e => { if (!isLoading) e.currentTarget.style.background = '#0066B3' }}>
              {isLoading ? 'Menyimpan...' : editingUser ? 'Perbarui Data' : 'Simpan User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- KOMPONEN MODAL CONFIRM DELETE ---
function ConfirmModal({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'scaleIn 0.2s ease-out', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={28} />
          </div>
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}>Batal</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#dc2626'} onMouseOut={e => e.currentTarget.style.background = '#ef4444'}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { canAccess, user } = useAuth(); 
  
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<DbUser | null>(null);
  
  const [notification, setNotification] = useState<{show: boolean, title: string, message: string, type: 'success' | 'error'}>({ show: false, title: '', message: '', type: 'success' });

  const showNotification = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, title, message, type });
  };

  useEffect(() => {
    if (user?.role !== 'administrator' && !canAccess('users')) {
      router.push('/dashboard');
    }
  }, [canAccess, user, router]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Gagal mengambil data dari database');
      const data = await res.json();
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteUserConfirm) return;
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(deleteUserConfirm.email)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus user');
      
      showNotification('Berhasil!', `User ${deleteUserConfirm.full_name} berhasil dihapus dari sistem.`, 'success');
      fetchUsers(); 
    } catch (err) {
      console.error('Failed to delete user:', err);
      showNotification('Gagal!', 'Gagal menghapus user. Silakan coba lagi.', 'error');
    }
    setDeleteUserConfirm(null);
  };

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.role === 'administrator').length;
    const totalStaffs = totalUsers - totalAdmins;

    return { totalUsers, totalAdmins, totalStaffs };
  }, [users]);

  const MetricCard = ({ title, value, gradFrom, gradTo, icon }: any) => (
    <div className="metric-card" style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)` }}>
      <div className="metric-card-content">
        <div className="metric-card-header">
          <span className="metric-title">{title}</span>
        </div>
        <div className="metric-value">{value}</div>
      </div>
      <div className="metric-icon">
        {icon}
      </div>
    </div>
  );

  return (
    <div className="tw-root" style={{ animation: 'fadeIn 0.4s ease-out', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      
      {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>Memuat data dari PostgreSQL...</div>}

      {error && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '13px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Modals Kustom */}
      <NotificationModal show={notification.show} title={notification.title} message={notification.message} type={notification.type} onClose={() => setNotification({ ...notification, show: false })} />
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={(msg) => { fetchUsers(); showNotification('Berhasil!', msg, 'success'); }} />}
      {editingUser && <CreateUserModal onClose={() => setEditingUser(null)} editingUser={editingUser} onSuccess={(msg) => { fetchUsers(); showNotification('Berhasil!', msg, 'success'); }} />}
      {deleteUserConfirm && <ConfirmModal title="Konfirmasi Hapus" message={`Apakah Anda yakin ingin menghapus akses untuk pengguna "${deleteUserConfirm.full_name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteUserConfirm(null)} />}

      {/* HEADER */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Kelola User</h1>
          <p className="page-subtitle">Manajemen akun pengguna dan hak akses sistem ERP.</p>
        </div>
        <div className="realtime-badge">
          <CheckCircle2 size={14} />
          <span>Data Real-time</span>
        </div>
      </div>

      {/* ROW 1: WELCOME CARD & ILLUSTRATION */}
      <div className="frappe-welcome-card" style={{ marginBottom: '24px' }}>
          <div className="sell-welcome-content">
            <h1 className="sell-welcome-title">Halo, Administrator!</h1>
            <p className="sell-welcome-subtitle">
              Saat ini terdapat <strong>{stats.totalUsers}</strong> pengguna terdaftar di sistem. Kelola hak akses, perbarui data, atau tambahkan pengguna baru untuk memastikan kelancaran operasional perusahaan.
            </p>
            <div className="sell-welcome-action">
              <button className="btn-welcome-yellow" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Tambah User Baru
              </button>
            </div>
          </div>
          
          <div className="sell-welcome-ill-wrapper">
              <div className="sell-welcome-ill-box">
                <img src="/humans1.png" alt="Admin Illustration" />
              </div>
          </div>
      </div>

      {/* ROW 2: NUMBER CARDS METRICS */}
      <div className="metrics-grid-3">
        <MetricCard 
          title="Total Pengguna" 
          value={stats.totalUsers} 
          gradFrom="#054CC7" gradTo="#0B79C9" 
          icon={<Users size={24} />} 
        />
        <MetricCard 
          title="Administrator" 
          value={stats.totalAdmins} 
          gradFrom="#0B79C9" gradTo="#11A5CB" 
          icon={<ShieldCheck size={24} />} 
        />
        <MetricCard 
          title="Staff & Operator" 
          value={stats.totalStaffs} 
          gradFrom="#11A5CB" gradTo="#17C3CC" 
          icon={<UserCheck size={24} />} 
        />
      </div>

      {/* Table Section */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        
        {/* Table Header: Search & Refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Cari user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', width: '100%', outline: 'none' }} />
          </div>
          <button onClick={fetchUsers} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#054CC7'; }} onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#374151'; }}>
            <RefreshCw size={14} /> Segarkan Data
          </button>
        </div>

        {/* Tabel Data */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Nama Lengkap</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Role</th>
                <th style={{ textAlign: 'right', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.email} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #054CC7, #17C3CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                        {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{user.full_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#6B7280', fontSize: '13px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    {(() => {
                      const roleConfig = ROLES.find(r => r.id === user.role) || ROLES[2];
                      return (
                        <span style={{ background: `${roleConfig.color}15`, color: roleConfig.color, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          {roleConfig.badge} - {roleConfig.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingUser(user)} style={{ background: '#eff6ff', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#0066B3', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Edit Data" onMouseOver={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseOut={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.transform = 'scale(1)'; }}><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteUserConfirm(user)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Hapus Data" onMouseOver={e => { e.currentTarget.style.background = '#fecaca'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseOut={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1)'; }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !isLoading && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Tidak ada data pengguna</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        .erp-input { width: 100%; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; font-family: 'Montserrat', sans-serif; }
        .erp-input:focus { border-color: #0066B3; box-shadow: 0 0 0 3px rgba(0,102,179,0.1); }
        .erp-input:disabled { background: #f9fafb; color: #6B7280; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .tw-root {
           background-color: #EEF2F6; 
           min-height: calc(100vh - 80px);
           padding: 20px;
           border-radius: 16px;
           margin: -10px; 
           overflow-x: hidden; 
        }
        
        .page-header-row {
           display: flex; 
           align-items: center; 
           justify-content: space-between; 
           margin-bottom: 24px; 
           flex-wrap: wrap; 
           gap: 12px;
        }

        .page-title { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 4px 0; }
        .page-subtitle { font-size: 13px; color: #6B7280; margin: 0; }
        
        .realtime-badge {
           display: flex; align-items: center; gap: 6px; 
           font-size: 12px; font-weight: 600; color: #10b981; 
           background: #d1fae5; padding: 6px 12px; border-radius: 20px;
        }

        /* ── CSS KHUSUS CARD WELCOME ── */
        .frappe-welcome-card {
            background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
            border-radius: 16px;
            padding: 32px 40px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 30px rgba(5, 76, 199, 0.2);
            min-height: 160px;
        }

        .sell-welcome-content {
            position: relative;
            z-index: 2;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .sell-welcome-title {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 8px 0;
            letter-spacing: -0.02em;
        }

        .sell-welcome-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            line-height: 1.5;
            max-width: 85%;
        }

        .sell-welcome-action {
            margin-top: 20px;
            display: flex;
        }

        .btn-welcome-yellow {
            background: #FFB800;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(255, 184, 0, 0.3);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
        }
        
        .btn-welcome-yellow:hover {
            transform: translateY(-2px);
            background: #F5A623;
        }

        .sell-welcome-ill-wrapper {
            flex-shrink: 0;
            margin-left: 20px;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .sell-welcome-ill-box {
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .sell-welcome-ill-box img {
            position: absolute;
            width: 125%;
            height: 125%;
            object-fit: contain;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        /* ── CSS KHUSUS CARD KPI NUMBER ── */
        .metric-card {
          background: white; border-radius: 16px; border: none; padding: 24px;
          display: flex; align-items: center; justify-content: space-between;
          height: 100%; min-height: 100px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          color: white;
          transition: transform 0.2s;
        }
        .metric-card:hover { transform: translateY(-3px); }
        .metric-card-content { display: flex; flex-direction: column; width: calc(100% - 56px); }
        .metric-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .metric-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-value { font-size: 28px; font-weight: 800; line-height: 1.2; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(255,255,255,0.2); }

        /* ── GRID RESPONSIF ── */
        .metrics-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        
        @media (max-width: 1024px) {
          .metrics-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        
        /* ── FIX: MEDIA QUERY UNTUK MOBILE ── */
        @media (max-width: 640px) {
          .tw-root { 
            padding: 12px; 
            margin: 0; 
            border-radius: 0; 
          }
          
          .page-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .page-title { font-size: 20px; }
          .page-subtitle { font-size: 12px; }

          .metrics-grid-3 { grid-template-columns: 1fr; }
          
          .metric-card { padding: 20px; }
          .metric-value { font-size: 24px; }
          
          /* MEMPERBAIKI KOTAK GAMBAR DAN TEXT AGAR RATA KIRI */
          .frappe-welcome-card { 
            flex-direction: column; 
            align-items: flex-start; /* Teks Rata Kiri */
            text-align: left; /* Teks Rata Kiri */
            padding: 24px; 
            gap: 20px; 
            height: auto;
          }

          .sell-welcome-content {
            align-items: flex-start; /* Teks Rata Kiri */
            width: 100%;
          }
          
          .sell-welcome-title { font-size: 22px; }
          .sell-welcome-subtitle { max-width: 100%; font-size: 13px; margin-bottom: 0px; }
          
          .sell-welcome-action { 
            width: 100%; 
            margin-top: 20px; 
            display: flex;
            justify-content: flex-start; /* Tombol Rata Kiri */
          }
          
          .btn-welcome-yellow { 
            width: auto; /* Tombol tidak full width */
            padding: 10px 20px;
          }
          
          .sell-welcome-ill-wrapper { 
            width: 100%; 
            display: flex; 
            margin-left: 0; 
            margin-top: 8px; 
          }
          
          /* KOTAK BACKGROUND GAMBAR MENJADI PERSEGI PANJANG (FULL WIDTH) */
          .sell-welcome-ill-box { 
            width: 100%; 
            height: 130px; 
            border-radius: 16px;
          }

          .sell-welcome-ill-box img {
            height: 125%; /* Gambar sedikit membesar (menonjol) dari kotaknya */
            width: auto;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}