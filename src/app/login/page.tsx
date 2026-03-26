'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ROLES, type UserRole } from '@/config/rbac';
import { Eye, EyeOff, ShoppingCart, Package, Cog, BarChart2, Factory, Warehouse, UserPlus, LogIn, Laptop, Wrench, Trash2 } from 'lucide-react';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart size={18} />, Warehouse: <Warehouse size={18} />, Factory: <Factory size={18} />, Wrench: <Wrench size={18} />, Cog: <Cog size={18} />,
};

const DEFAULT_USERS = [
  { full_name: 'Siska (Sales)', email: 'sales@erp.com', password: 'password123', role: 'admin_sales' },
  { full_name: 'Dedi (Gudang)', email: 'gudang@erp.com', password: 'password123', role: 'admin_gudang' },
  { full_name: 'Budi (Produksi)', email: 'produksi@erp.com', password: 'password123', role: 'manajer_produksi' },
];

const getRedirectPath = (role: string) => {
  if (role === 'admin_sales') return '/dashboard/selling/home';
  if (role === 'admin_gudang') return '/dashboard/stock/home';
  if (role === 'manajer_produksi' || role === 'operator') return '/dashboard/manufacturing/home';
  return '/dashboard'; 
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, logout } = useAuth();

  const handleHardReset = () => {
    if (!confirm('Yakin ingin mereset semua data akun lama?')) return;
    logout();
    const users = DEFAULT_USERS.map((u, i) => ({ id: (i + 1).toString(), full_name: u.full_name, email: u.email, password: u.password, role: u.role, created_at: new Date().toISOString() }));
    localStorage.setItem('erp_users', JSON.stringify(users));
    alert('✅ Berhasil! Data lama sudah dihapus.'); window.location.reload();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('erp_users');
      if (!existing || existing === '[]') {
        const users = DEFAULT_USERS.map((u, i) => ({ id: (i + 1).toString(), full_name: u.full_name, email: u.email, password: u.password, role: u.role, created_at: new Date().toISOString() }));
        localStorage.setItem('erp_users', JSON.stringify(users));
      }
    }
  }, []);
  
  useEffect(() => { if (isAuthenticated && user) router.push(getRedirectPath(user.role)); }, [isAuthenticated, user, router]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<string>('admin_sales');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); if (!email || !password) { setError('Harap isi email dan password'); return; }
    setIsLoading(true); setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) { await login(user.role as UserRole, email, password); router.push(getRedirectPath(user.role)); return; }
      setError('Email atau password salah');
    } catch { setError('Login gagal.'); } finally { setIsLoading(false); }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setIsLoading(true); setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) { await login(user.role as UserRole, email, password); router.push(getRedirectPath(user.role)); return; }
      setError(`Akun tidak ditemukan. Klik tombol "Reset Data Lama".`);
    } catch { setError('Login gagal'); } finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .login-wrapper { display: flex; min-height: 100vh; font-family: 'Poppins', sans-serif; }
        /* BACKGROUND GRADIENT BARU #054CC7 dan #17C3CC */
        .login-left { width: 50%; background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%); padding: 48px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .login-right { flex: 1; background: #f8f9fb; display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
        .login-form-wrap { width: 100%; max-width: 440px; }
        @media (max-width: 768px) { .login-wrapper { flex-direction: column; } .login-left { display: none; } .login-right { padding: 24px 16px; align-items: flex-start; min-height: 100vh; } .login-form-wrap { max-width: 100%; } }
        .role-btn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 640px) { .role-btn-grid { grid-template-columns: 1fr; } }
        input, select, textarea { font-size: 14px !important; font-family: 'Poppins', sans-serif; }
      `}</style>

      <div className="login-wrapper">
        <div className="login-left">
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}><Laptop size={32} color="white" /></div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '24px', letterSpacing: '0.02em', lineHeight: 1 }}>NETRA VIDYA</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>OEM Assembler System</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' }}>Enterprise Resource<br />Planning Workspace</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', lineHeight: 1.7, marginBottom: '40px', maxWidth: '420px' }}>Sistem ERP terisolasi untuk mengelola operasional fabrikasi perakitan Laptop, dari manajemen pesanan, stok komponen, hingga proses perakitan.</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrap">
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #054CC7 0%, #17C3CC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '24px', margin: '0 auto 16px' }}>N</div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Masuk ke Workspace</h2>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>Pilih salah satu role akses cepat di bawah ini.</p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div className="role-btn-grid">
                {DEFAULT_USERS.map(u => {
                  const roleData = ROLES.find(r => r.id === u.role);
                  return (
                    <button key={u.email} onClick={() => handleQuickLogin(u.email, u.password)} disabled={isLoading} 
                      style={{ padding: '16px 12px', background: 'white', border: '2px solid transparent', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#17C3CC'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ color: '#054CC7', background: '#eff6ff', padding: '12px', borderRadius: '12px' }}>{roleData ? ROLE_ICONS[roleData.icon] : <Cog size={20} />}</div>
                      {u.full_name.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Atau Login Manual</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@netravidya.com" className="erp-input" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none' }} onFocus={e => e.target.style.borderColor='#17C3CC'} onBlur={e => e.target.style.borderColor='#d1d5db'} /></div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="erp-input" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none' }} onFocus={e => e.target.style.borderColor='#17C3CC'} onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              
              {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#991b1b', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>{error}</div>}

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '14px', background: isLoading ? '#93c5fd' : '#054CC7', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(5, 76, 199, 0.3)' }} onMouseEnter={e => { if(!isLoading) e.currentTarget.style.background = '#043b9c' }} onMouseLeave={e => { if(!isLoading) e.currentTarget.style.background = '#054CC7' }}>{isLoading ? 'Memproses...' : 'Masuk Manual'}</button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button onClick={handleHardReset} style={{ background: 'none', color: '#dc2626', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'underline' }}>
                <Trash2 size={14} /> Reset Data Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}