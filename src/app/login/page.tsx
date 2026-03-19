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
    console.log('Default users seeded!');
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    seedDefaultUsers();
  }, []);

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

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const currentRole = ROLES.find(r => r.id === selectedRole)!;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowRoleDropdown(false);
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Harap isi semua data');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (!email.includes('@')) {
      setError('Email tidak valid');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      
      const existingUser = users.find((u: any) => u.email === email);
      if (existingUser) {
        setError('Email sudah terdaftar');
        setIsLoading(false);
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        full_name: fullName,
        email,
        password,
        role: selectedRole,
        created_at: new Date().toISOString(),
      };
      
      users.push(newUser);
      localStorage.setItem('erp_users', JSON.stringify(users));

      await login(selectedRole, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Harap isi email dan password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        await login(user.role as UserRole, email, password);
        router.push('/dashboard');
        return;
      }

      setError('Email atau password salah');
    } catch {
      setError('Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');
    try {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        await login(user.role as UserRole, email, password);
        router.push('/dashboard');
        return;
      }
      setError('Login gagal');
    } catch {
      setError('Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: <ShoppingCart size={18} />, title: 'Sales Management', desc: 'Sales Order, Database Pelanggan, Delivery Tracking' },
    { icon: <Package size={18} />, title: 'Inventory Control', desc: 'Stock Entry, Warehouse, BOM, Alerts' },
    { icon: <Cog size={18} />, title: 'Manufacturing', desc: 'Work Orders, Job Cards, Quality Inspection' },
    { icon: <BarChart2 size={18} />, title: 'Real-time Analytics', desc: 'Custom Charts, Production KPI' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ width: '48%', background: 'linear-gradient(135deg, #004d87 0%, #0066B3 40%, #0080dc 100%)', padding: '48px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-120px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <BarChart2 size={26} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '18px', letterSpacing: '0.02em' }}>ERP DASHBOARD</div>
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
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
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

      <div style={{ flex: 1, background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: mode === 'login' ? 'white' : 'transparent', color: mode === 'login' ? '#0066B3' : '#6B7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <LogIn size={16} /> Masuk
            </button>
            <button type="button" onClick={() => { setMode('register'); setError(''); }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: mode === 'register' ? 'white' : 'transparent', color: mode === 'register' ? '#0066B3' : '#6B7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <UserPlus size={16} /> Daftar
            </button>
          </div>

          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <img src="/logo.png" alt="ERP Logo" style={{ height: '60px', objectFit: 'contain' }} />
            </div>
            <div style={{ color: '#0066B3', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{mode === 'login' ? 'Masuk ke Dashboard' : 'Daftar Akun ERP'}</h2>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>{mode === 'login' ? 'Masukkan email dan password Anda' : 'Pilih departemen dan isi data Anda'}</p>
          </div>

          {mode === 'login' && (
            <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <p style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, marginBottom: '8px' }}>🚀 Quick Login (Demo)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {DEFAULT_USERS.map(u => (
                  <button key={u.email} onClick={() => handleQuickLogin(u.email, u.password)} disabled={isLoading} style={{ padding: '8px 10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {ROLE_ICONS[ROLES.find(r => r.id === u.role)!.icon]} {u.role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            {mode === 'register' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Nama Lengkap</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="cth: John Doe" className="erp-input" style={{ fontSize: '14px' }} />
              </div>
            )}

            {mode === 'register' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Departemen / Role</label>
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setShowRoleDropdown(!showRoleDropdown)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${currentRole.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentRole.color }}>
                        {ROLE_ICONS[currentRole.icon]}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        <button key={role.id} type="button" onClick={() => handleRoleSelect(role.id)} style={{ width: '100%', padding: '10px 14px', background: selectedRole === role.id ? '#eff6ff' : 'white', border: 'none', borderBottom: i < ROLES.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: `${role.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@anda.com" className="erp-input" style={{ fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="erp-input" style={{ paddingRight: '44px', fontSize: '14px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Konfirmasi Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ulangi password" className="erp-input" style={{ fontSize: '14px' }} />
              </div>
            )}

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '14px', background: isLoading ? '#94b8d6' : '#0066B3', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,102,179,0.3)' }}>
              {isLoading ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: '#9CA3AF' }}>
            © 2026 ERP Dashboard. Powered by <a href="http://34.101.192.135:8080" target="_blank" rel="noopener noreferrer" style={{ color: '#0066B3', fontWeight: 600, textDecoration: 'none' }}>Frappe/ERPNext</a>
          </div>
        </div>
      </div>
    </div>
  );
}