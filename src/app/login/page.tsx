'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ROLES, type UserRole } from '@/config/rbac';
import {
  Eye, EyeOff, ChevronDown, ShoppingCart, Package, Cog, BarChart2,
  Factory, Warehouse, ChevronUp, UserPlus, LogIn, CheckCircle, Laptop, Wrench, Trash2
} from 'lucide-react';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart size={18} />,
  Warehouse: <Warehouse size={18} />,
  Factory: <Factory size={18} />,
  Wrench: <Wrench size={18} />,
  Cog: <Cog size={18} />,
};

// 3 AKUN BARU KITA
const DEFAULT_USERS: Array<{ full_name: string; email: string; password: string; role: string }> = [
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

  // Fungsi untuk memaksa reset data
  const handleHardReset = () => {
    if (!confirm('Yakin ingin mereset semua data akun lama?')) return;
    
    // Hapus sesi aktif
    logout();
    
    // Buat ulang 3 akun baru secara paksa
    const users = DEFAULT_USERS.map((u, i) => ({
      id: (i + 1).toString(),
      full_name: u.full_name,
      email: u.email,
      password: u.password,
      role: u.role,
      created_at: new Date().toISOString(),
    }));
    localStorage.setItem('erp_users', JSON.stringify(users));
    
    alert('✅ Berhasil! Data lama sudah dihapus. Silakan klik akun di Quick Login.');
    window.location.reload(); // Refresh halaman agar bersih total
  };

  useEffect(() => {
    // Generate default user jika benar-benar kosong
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('erp_users');
      if (!existing || existing === '[]') {
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
  }, []);
  
  useEffect(() => { 
    if (isAuthenticated && user) {
      router.push(getRedirectPath(user.role));
    } 
  }, [isAuthenticated, user, router]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<string>('admin_sales');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentRole = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  const handleRoleSelect = (role: string) => {
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
      await login(selectedRole as UserRole, email, password);
      router.push(getRedirectPath(selectedRole));
    } catch { setError('Pendaftaran gagal.'); } finally { setIsLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Harap isi email dan password'); return; }
    setIsLoading(true); setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) { 
        await login(user.role as UserRole, email, password); 
        router.push(getRedirectPath(user.role)); 
        return; 
      }
      setError('Email atau password salah');
    } catch { setError('Login gagal.'); } finally { setIsLoading(false); }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setIsLoading(true); setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) { 
        await login(user.role as UserRole, email, password); 
        router.push(getRedirectPath(user.role)); 
        return; 
      }
      setError(`Akun tidak ditemukan. Silakan klik tombol "Reset Data Lama" di bawah.`);
    } catch { setError('Login gagal'); } finally { setIsLoading(false); }
  };

  const features = [
    { icon: <ShoppingCart size={18} />, title: 'Modul Selling', desc: 'Kelola Customer, Order Laptop & Invoice' },
    { icon: <Package size={18} />, title: 'Modul Inventory', desc: 'Stok Komponen, Stock Entry & Delivery' },
    { icon: <Laptop size={18} />, title: 'Perakitan OEM', desc: 'BOM Laptop, Work Orders, Job Cards' },
    { icon: <BarChart2 size={18} />, title: 'Live Dashboard', desc: 'Target Bulanan Dinamis & Analitik' },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .login-wrapper { display: flex; min-height: 100vh; font-family: 'Poppins', sans-serif; }
        .login-left { width: 50%; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%); padding: 48px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .login-right { flex: 1; background: #f8f9fb; display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
        .login-form-wrap { width: 100%; max-width: 480px; }
        @media (max-width: 768px) {
          .login-wrapper { flex-direction: column; }
          .login-left { display: none; }
          .login-right { padding: 24px 16px; align-items: flex-start; min-height: 100vh; }
          .login-form-wrap { max-width: 100%; }
        }
        .role-btn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        @media (max-width: 640px) { .role-btn-grid { grid-template-columns: 1fr; } }
        input, select, textarea { font-size: 14px !important; font-family: 'Poppins', sans-serif; }
      `}</style>

      <div className="login-wrapper">
        <div className="login-left">
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Laptop size={26} color="white" /></div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '20px', letterSpacing: '0.02em' }}>NETRA VIDYA</div>
              <div style={{ color: '#bae6fd', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>OEM Assembler System</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'white', fontSize: '38px', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>Enterprise Resource<br /><span style={{ color: '#38bdf8' }}>Planning Workspace</span></h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.7, marginBottom: '40px', maxWidth: '400px' }}>Sistem ERP terisolasi untuk mengelola operasional fabrikasi perakitan Laptop, dari manajemen pesanan (Sales), stok komponen (Inventory), hingga perakitan (Manufacturing).</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {features.map((f) => (
                <div key={f.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ color: '#38bdf8', marginBottom: '8px' }}>{f.icon}</div>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrap">
            <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: mode === 'login' ? 'white' : 'transparent', color: mode === 'login' ? '#0066B3' : '#6B7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><LogIn size={16} /> Masuk</button>
              <button type="button" onClick={() => { setMode('register'); setError(''); }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: mode === 'register' ? 'white' : 'transparent', color: mode === 'register' ? '#0066B3' : '#6B7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><UserPlus size={16} /> Daftar</button>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>{mode === 'login' ? 'Masuk ke Workspace' : 'Daftar Akun Baru'}</h2>
              <p style={{ color: '#6B7280', fontSize: '13px' }}>Pilih salah satu akses cepat di bawah ini.</p>
            </div>

            {mode === 'login' && (
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px dashed #bae6fd' }}>
                <div className="role-btn-grid">
                  {DEFAULT_USERS.map(u => {
                    const roleData = ROLES.find(r => r.id === u.role);
                    return (
                      <button key={u.email} onClick={() => handleQuickLogin(u.email, u.password)} disabled={isLoading} style={{ padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ color: roleData?.color || '#0066B3', background: `${roleData?.color}15`, padding: '8px', borderRadius: '8px' }}>{roleData ? ROLE_ICONS[roleData.icon] : <Cog size={16} />}</div>
                        {u.full_name.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              {mode === 'register' && (
                <>
                  <div style={{ marginBottom: '14px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Nama Lengkap</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="cth: John Doe" className="erp-input" /></div>
                  <div style={{ marginBottom: '14px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Role</label>
                    <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="erp-input">
                      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div style={{ marginBottom: '14px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@netravidya.com" className="erp-input" /></div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="erp-input" style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              {mode === 'register' && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Konfirmasi Password</label><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="erp-input" /></div>}
              
              {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '14px', background: isLoading ? '#94b8d6' : '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}>{isLoading ? 'Memproses...' : (mode === 'login' ? 'Masuk Manual' : 'Daftar Sekarang')}</button>
            </form>

            {/* TOMBOL AJAIB PEMBERSIH CACHE */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #e5e7eb', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px' }}>Ada error atau role lama nyangkut?</p>
              <button 
                onClick={handleHardReset} 
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} /> Reset Data Lama
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}