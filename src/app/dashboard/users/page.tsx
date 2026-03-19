'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useUserData } from '@/hooks/useFrappeData';
import { useSync } from '@/hooks/useSync';
import { apiCreate, apiUpdate } from '@/lib/api';
import { addToSyncQueue } from '@/lib/sync-queue';
import {
  Users, Plus, Search, X, Edit2, Trash2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Cloud, CloudOff
} from 'lucide-react';
import type { FrappeUser } from '@/lib/frappe-types';
import { ROLES, type UserRole } from '@/config/rbac';

function CreateUserModal({ onClose, editingUser, onSuccess }: { onClose: () => void; editingUser?: FrappeUser | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    email: editingUser?.email || '',
    first_name: editingUser?.first_name || editingUser?.full_name?.split(' ')[0] || '',
    last_name: editingUser?.last_name || editingUser?.full_name?.split(' ').slice(1).join(' ') || '',
    enabled: editingUser?.enabled !== undefined ? editingUser.enabled : 1,
    role: editingUser ? getStoredRole(editingUser.email) : 'sales' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const currentRole = ROLES.find(r => r.id === form.role) || ROLES[2];

  function getStoredRole(email: string | undefined): UserRole {
    if (!email) return 'sales';
    const roleMap = JSON.parse(localStorage.getItem('erp_user_roles') || '{}');
    return roleMap[email] || 'sales';
  }

  function saveRoleMapping(email: string, role: UserRole) {
    const roleMap = JSON.parse(localStorage.getItem('erp_user_roles') || '{}');
    roleMap[email] = role;
    localStorage.setItem('erp_user_roles', JSON.stringify(roleMap));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.first_name) {
      setError('Harap isi email dan nama');
      return;
    }

    setIsLoading(true);
    setError('');

    let apiSuccess = false;
  let userNotInERP = false;
    
    // Try API first (but don't fail if API is down)
    try {
      if (editingUser) {
        await apiUpdate('User', editingUser.name, {
          first_name: form.first_name,
          last_name: form.last_name,
          enabled: form.enabled,
        });
      } else {
        await apiCreate<FrappeUser>('User', {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          enabled: form.enabled,
        } as any);
      }
      apiSuccess = true;
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || '';
      // Check if user not found in ERP - skip sync for this user
      if (errMsg.includes('not found') || errMsg.includes('404')) {
        console.warn('User tidak ada di ERP, hanya simpan ke localStorage');
        userNotInERP = true;
      } else {
        console.warn('API unavailable, will queue for sync:', apiErr?.message || apiErr);
      }
    }

    // Always save to localStorage + sync queue (for demo/offline mode)
    try {
      const existingUsers = JSON.parse(localStorage.getItem('erp_users') || '[]');
      
      if (editingUser) {
        const idx = existingUsers.findIndex((u: any) => u.email === editingUser.email);
        if (idx >= 0) {
          existingUsers[idx] = { 
            ...existingUsers[idx], 
            first_name: form.first_name, 
            last_name: form.last_name, 
            enabled: form.enabled,
            role: form.role 
          };
        }
        
        // Add to sync queue if API failed and user exists in ERP
        if (!apiSuccess && !userNotInERP) {
          addToSyncQueue({
            action: 'update',
            doctype: 'User',
            data: { name: editingUser.name, first_name: form.first_name, last_name: form.last_name, enabled: form.enabled },
          });
        }
      } else {
        const exists = existingUsers.find((u: any) => u.email === form.email);
        if (exists) {
          setError('Email sudah terdaftar!');
          setIsLoading(false);
          return;
        }
        existingUsers.push({
          id: Date.now().toString(),
          email: form.email,
          full_name: `${form.first_name} ${form.last_name}`.trim(),
          first_name: form.first_name,
          last_name: form.last_name,
          enabled: form.enabled,
          role: form.role,
          created_at: new Date().toISOString(),
        });

        // Add to sync queue if API failed and user was created successfully
        if (!apiSuccess && !userNotInERP) {
          addToSyncQueue({
            action: 'create',
            doctype: 'User',
            data: { email: form.email, first_name: form.first_name, last_name: form.last_name, enabled: form.enabled },
          });
        }
      }
      
      localStorage.setItem('erp_users', JSON.stringify(existingUsers));
      saveRoleMapping(form.email, form.role);
      
      if (apiSuccess) {
        alert('✅ User berhasil disimpan ke ERP!');
      } else if (userNotInERP) {
        alert('⚠️ User disimpan (local saja - tidak ada di ERP, hubungi admin untuk sinkronisasi manual)');
      } else {
        alert('⚠️ User berhasil disimpan! (Mode Offline - akan sync ke ERP saat koneksi tersedia)');
      }
      
      onSuccess();
      onClose();
    } catch (localErr: any) {
      setError('Gagal menyimpan: ' + (localErr?.message || 'Error tidak diketahui'));
    } finally {
      setIsLoading(false);
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    direktur: '#0066B3',
    manajer_pabrik: '#7c3aed',
    sales: '#059669',
    gudang: '#d97706',
    produksi: '#0891b2',
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '480px', maxHeight: '90vh', overflow: 'auto', animation: 'slideUp 0.2s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>{editingUser ? 'Edit User' : 'Tambah User Baru'}</h2>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{editingUser ? 'Perbarui data user' : 'Tambah user baru ke sistem'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Depan *</label>
              <input 
                type="text" 
                required 
                className="erp-input" 
                style={{ fontSize: '13px' }} 
                value={form.first_name} 
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} 
                placeholder="John"
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nama Belakang</label>
              <input 
                type="text" 
                className="erp-input" 
                style={{ fontSize: '13px' }} 
                value={form.last_name} 
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} 
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Status</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.enabled === 1}
                onChange={e => setForm(f => ({ ...f, enabled: e.target.checked ? 1 : 0 }))}
                style={{ width: '16px', height: '16px', accentColor: '#0066B3' }}
              />
              <span style={{ fontSize: '13px', color: '#374151' }}>Aktif</span>
            </label>
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
                    background: `${ROLE_COLORS[form.role]}15`, color: ROLE_COLORS[form.role],
                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 
                  }}>
                    {currentRole.badge}
                  </span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{currentRole.label}</span>
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
                        setForm(f => ({ ...f, role: role.id })); 
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
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Role menentukan menu dan fitur yang dapat diakses</p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '12px' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
            <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '10px', background: isLoading ? '#94b8d6' : '#0066B3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? 'Menyimpan...' : editingUser ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '400px', textAlign: 'center', animation: 'slideUp 0.2s ease-out' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
          <button onClick={onConfirm} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { can, canAccess } = useAuth();
  const { users, isLoading, error, refetch, deleteUser } = useUserData();
  const { pendingCount, isSyncing, syncAll } = useSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<FrappeUser | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<FrappeUser | null>(null);

  React.useEffect(() => {
    if (!canAccess('users')) {
      router.push('/dashboard');
    }
  }, [canAccess, router]);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteUserConfirm) return;
    try {
      await deleteUser(deleteUserConfirm.name);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
    setDeleteUserConfirm(null);
  };

  const stats = [
    { label: 'Total Users', value: users.length, color: '#0066B3', icon: <Users size={22} /> },
    { label: 'Active', value: users.filter(u => u.enabled === 1).length, color: '#059669', icon: <Users size={22} /> },
    { label: 'Inactive', value: users.filter(u => u.enabled === 0).length, color: '#6B7280', icon: <Users size={22} /> },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", animation: 'fadeIn 0.3s ease-out' }}>
      {/* Loading/Error State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
          Memuat data...
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #fde68a', 
          borderRadius: '8px', 
          padding: '12px 16px', 
          marginBottom: '16px',
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: '#92400e', 
          fontSize: '13px' 
        }}>
          <AlertCircle size={16} />
          Gagal memuat data: {error}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={() => refetch()} />}
      {editingUser && <CreateUserModal onClose={() => setEditingUser(null)} editingUser={editingUser} onSuccess={() => refetch()} />}
      {deleteUserConfirm && <ConfirmModal title="Hapus User" message={`Hapus user "${deleteUserConfirm.full_name || deleteUserConfirm.email}"?`} onConfirm={handleDelete} onCancel={() => setDeleteUserConfirm(null)} />}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>👥 Kelola User</h1>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Manajemen akun user dan role akses sistem</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Sync Status Indicator */}
            {pendingCount > 0 && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa',
                borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#c2410c'
              }}>
                <CloudOff size={14} />
                {pendingCount} pending sync
              </div>
            )}
            <button 
              onClick={() => syncAll()} 
              disabled={isSyncing || pendingCount === 0}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', background: pendingCount > 0 ? '#f97316' : 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600, 
                color: pendingCount > 0 ? 'white' : '#374151', 
                cursor: pendingCount > 0 ? 'pointer' : 'not-allowed',
                opacity: isSyncing ? 0.7 : 1
              }}
            >
              <Cloud size={14} /> {isSyncing ? 'Syncing...' : 'Sync ERP'}
            </button>
            <button 
              onClick={() => refetch()} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {can('create_user') && (
              <button 
                onClick={() => setShowCreateModal(true)} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '8px 16px', background: '#0066B3', color: 'white', 
                  border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' 
                }}
              >
                <Plus size={16} /> Tambah User
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>{s.label}</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>{s.value}</p>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative', maxWidth: '320px' }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari user..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ 
                padding: '8px 12px 8px 36px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                fontSize: '13px', 
                width: '100%',
                outline: 'none',
                fontFamily: "'Montserrat', sans-serif"
              }} 
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dibuat</th>
                <th style={{ textAlign: 'right', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.name} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: user.enabled === 1 ? 'linear-gradient(135deg, #0066B3, #0088e0)' : '#9CA3AF', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        fontSize: '14px', 
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {(user.first_name || user.full_name)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{user.full_name || user.first_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#6B7280', fontSize: '13px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    {(() => {
                      const roleMap = JSON.parse(localStorage.getItem('erp_user_roles') || '{}');
                      const userRole = roleMap[user.email] || 'sales';
                      const roleConfig = ROLES.find(r => r.id === userRole) || ROLES[2];
                      return (
                        <span style={{ 
                          background: `${roleConfig.color}15`, 
                          color: roleConfig.color,
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '11px', 
                          fontWeight: 700 
                        }}>
                          {roleConfig.badge} - {roleConfig.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: user.enabled === 1 ? '#d1fae5' : '#f3f4f6', 
                      color: user.enabled === 1 ? '#065f46' : '#6B7280', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '11px', 
                      fontWeight: 700 
                    }}>
                      {user.enabled === 1 ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#6B7280' }}>
                    {user.creation ? new Date(user.creation).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {can('edit_user') && (
                        <button 
                          onClick={() => setEditingUser(user)} 
                          style={{ 
                            background: '#eff6ff', 
                            border: 'none', 
                            borderRadius: '6px', 
                            padding: '8px', 
                            cursor: 'pointer', 
                            color: '#0066B3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }} 
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {can('delete_user') && (
                        <button 
                          onClick={() => setDeleteUserConfirm(user)} 
                          style={{ 
                            background: '#fee2e2', 
                            border: 'none', 
                            borderRadius: '6px', 
                            padding: '8px', 
                            cursor: 'pointer', 
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }} 
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    {searchQuery ? 'Tidak ada user yang sesuai' : 'Belum ada user'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        .erp-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          font-family: 'Montserrat', sans-serif;
        }
        .erp-input:focus {
          border-color: #0066B3;
          box-shadow: 0 0 0 3px rgba(0,102,179,0.1);
        }
        .erp-input:disabled {
          background: #f9fafb;
          color: #6B7280;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
