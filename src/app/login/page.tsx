'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ROLES, type UserRole } from '@/config/rbac';
import {
  Eye, EyeOff, ChevronDown, ShoppingCart, Package, Cog, BarChart2,
  Crown, Factory, Warehouse, ChevronUp, UserPlus, LogIn, CheckCircle
} from 'lucide-react';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  Crown: <Crown size={18} />,
  Factory: <Factory size={18} />,
  ShoppingCart: <ShoppingCart size={18} />,
  Warehouse: <Warehouse size={18} />,
  Cog: <Cog size={18} />,
};

const DEFAULT_USERS: Array<{ full_name: string; email: string; password: string; role: UserRole }> = [
  { full_name: 'Ahmad Wijaya', email: 'direktur@erp.com', password: 'password123', role: 'direktur' },
  { full_name: 'Budi Santoso', email: 'manajer@erp.com', password: 'password123', role: 'manajer_pabrik' },
  { full_name: 'Citra Dewi', email: 'sales@erp.com', password: 'password123', role: 'sales' },
  { full_name: 'Dedi Kurniawan', email: 'gudang@erp.com', password: 'password123', role: 'gudang' },
  { full_name: 'Eko Prasetyo', email: 'produksi@erp.com', password: 'password123', role: 'produksi' },
];

function seedDefaultUsers() {
  if (typeof window === 'undefined') return;
  const existingUsers = JSON.parse(localStorage.getItem('erp_users') || '[]');
  if (existingUsers.length === 0) {
    const users = DEFAULT_USERS.map((u, i) => ({
      id: (i + 1).toString(),
      full_name: u.full_name,
      email: u.email,
      password: u.password,
      role: u.role,
      created_at: new Date().toISOString(),
    }));
    localStorage.setItem('erp_users', JSON.stringify(users));
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => { seedDefaultUsers(); }, []);
  useEffect(() => { if (isAuthenticated) router.push('/dashboard'); }, [isAuthenticated, router]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('sales');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentRole = ROLES.find(r => r.id === selectedRole)!;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowRoleDropdown(false);
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) { setError('Harap isi semua data'); return; }
    if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
    if (password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (!email.includes('@')) { setError('Email tidak valid'); return; }
    setIsLoading(true); setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      if (users.find((u: any) => u.email === email)) { setError('Email sudah terdaftar'); return; }
      users.push({ id: Date.now().toString(), full_name: fullName, email, password, role: selectedRole, created_at: new Date().toISOString() });
      localStorage.setItem('erp_users', JSON.stringify(users));
      await login(selectedRole, email, password);
      router.push('/dashboard');
    } catch { setError('Pendaftaran gagal. Silakan coba lagi.'); } finally { setIsLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Harap isi email dan password'); return; }
    setIsLoading(true); setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) { await login(user.role as UserRole, email, password); router.push('/dashboard'); return; }
      setError('Email atau password salah');
    } catch { setError('Login gagal. Periksa email dan password Anda.'); } finally { setIsLoading(false); }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setIsLoading(true); setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) { await login(user.role as UserRole, email, password); router.push('/dashboard'); return; }
      setError('Login gagal');
    } catch { setError('Login gagal'); } finally { setIsLoading(false); }
  };

  const features = [
    { icon: <ShoppingCart size={18} />, title: 'Sales Management', desc: 'Sales Order, Database Pelanggan, Delivery' },
    { icon: <Package size={18} />, title: 'Inventory Control', desc: 'Stock Entry, Warehouse, BOM, Alerts' },
    { icon: <Cog size={18} />, title: 'Manufacturing', desc: 'Work Orders, Job Cards, Quality Check' },
    { icon: <BarChart2 size={18} />, title: 'Real-time Analytics', desc: 'Custom Charts, Production KPI' },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          font-family: 'Montserrat', sans-serif;
        }
        .login-left {
          width: 48%;
          background: linear-gradient(135deg, #004d87 0%, #0066B3 40%, #0080dc 100%);
          padding: 48px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .login-right {
          flex: 1;
          background: #f8f9fb;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
        }
        .login-form-wrap {
          width: 100%;
          max-width: 420px;
        }
        @media (max-width: 768px) {
          .login-wrapper { flex-direction: column; }
          .login-left { display: none; }
          .login-right {
            padding: 24px 16px;
            align-items: flex-start;
            min-height: 100vh;
          }
          .login-form-wrap { max-width: 100%; }
        }
        .role-btn-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        @media (max-width: 360px) {
          .role-btn-grid { grid-template-columns: 1fr; }
        }
        /* Prevent zoom on input focus iOS */
        input, select, textarea {
          font-size: 16px !important;
        }
        @media (min-width: 640px) {
          input, select, textarea {
            font-size: 14px !important;
          }
        }
      `}</style>

      <div className="login-wrapper">
        {/* LEFT PANEL - desktop only */}
        <div className="login-left">
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-120px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={26} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>ERP DASHBOARD</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Manufacturing System</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
              Enterprise Resource<br />
              <span style={{ color: '#7dd3fc' }}>Planning Dashboard</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.7, marginBottom: '40px', maxWidth: '380px' }}>
              Sistem terintegrasi untuk mengelola operasional manufaktur dari sales order hingga pengiriman barang ke customer.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {features.map((f) => (
                <div key={f.title} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ color: '#7dd3fc', marginBottom: '8px' }}>{f.icon}</div>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {['Selling', 'Stock', 'Manufacturing'].map(m => (
              <div key={m} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px', color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600 }}>{m}</div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - form */}
        <div className="login-right">
          <div className="login-form-wrap">
            {/* Mobile Logo (only visible on mobile) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <img src="/logo.png" alt="ERP Logo" style={{ height: '36px', objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>ERP DASHBOARD</div>
                <div style={{ fontSize: '10px', color: '#6B7280' }}>Manufacturing System</div>
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setMode('login'); setError(''); }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: mode === 'login' ? 'white' : 'transparent', color: mode === 'login' ? '#0066B3' : '#6B7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: "'Montserrat', sans-serif" }}>
                <LogIn size={16} /> Masuk
              </button>
              <button type="button" onClick={() => { setMode('register'); setError(''); }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: mode === 'register' ? 'white' : 'transparent', color: mode === 'register' ? '#0066B3' : '#6B7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: "'Montserrat', sans-serif" }}>
                <UserPlus size={16} /> Daftar
              </button>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ color: '#0066B3', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                {mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
                {mode === 'login' ? 'Masuk ke Dashboard' : 'Daftar Akun ERP'}
              </h2>
              <p style={{ color: '#6B7280', fontSize: '13px' }}>
                {mode === 'login' ? 'Masukkan email dan password Anda' : 'Pilih departemen dan isi data Anda'}
              </p>
            </div>

            {/* Quick Login */}
            {mode === 'login' && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <p style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, marginBottom: '8px' }}>🚀 Quick Login (Demo)</p>
                <div className="role-btn-grid">
                  {DEFAULT_USERS.map(u => (
                    <button key={u.email} onClick={() => handleQuickLogin(u.email, u.password)} disabled={isLoading}
                      style={{ padding: '8px 10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Montserrat', sans-serif" }}>
                      {ROLE_ICONS[ROLES.find(r => r.id === u.role)!.icon]} {u.role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              {mode === 'register' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Nama Lengkap</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="cth: John Doe" className="erp-input" />
                </div>
              )}

              {mode === 'register' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Departemen / Role</label>
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${currentRole.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentRole.color }}>
                          {ROLE_ICONS[currentRole.icon]}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{currentRole.label}</span>
                            <span style={{ background: `${currentRole.color}15`, color: currentRole.color, padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>{currentRole.badge}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>{currentRole.description}</div>
                        </div>
                      </div>
                      {showRoleDropdown ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
                    </button>

                    {showRoleDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, marginTop: '4px', overflow: 'hidden' }}>
                        {ROLES.map((role, i) => (
                          <button key={role.id} type="button" onClick={() => handleRoleSelect(role.id)}
                            style={{ width: '100%', padding: '10px 14px', background: selectedRole === role.id ? '#eff6ff' : 'white', border: 'none', borderBottom: i < ROLES.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: `${role.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, flexShrink: 0 }}>
                              {ROLE_ICONS[role.icon]}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{role.label}</span>
                                <span style={{ background: `${role.color}15`, color: role.color, padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 700 }}>{role.badge}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>{role.description}</div>
                            </div>
                            {selectedRole === role.id && <CheckCircle size={16} color="#0066B3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@anda.com" className="erp-input" />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="erp-input" style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 0 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Konfirmasi Password</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="erp-input" />
                </div>
              )}

              {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '13px', marginBottom: '14px' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                style={{ width: '100%', padding: '14px', background: isLoading ? '#94b8d6' : '#0066B3', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,102,179,0.3)', fontFamily: "'Montserrat', sans-serif" }}>
                {isLoading ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#9CA3AF' }}>
              © 2026 ERP Dashboard. Powered by{' '}
              <a href="http://34.101.192.135:8080" target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', fontWeight: 600, textDecoration: 'none' }}>
                Frappe/ERPNext
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}