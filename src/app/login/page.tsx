  // 'use client';

  // import { useState, useEffect } from 'react';
  // import { useRouter } from 'next/navigation';
  // import { useAuth } from '@/providers/auth-provider';
  // import { ROLES, type UserRole } from '@/config/rbac';
  // import { Eye, EyeOff, ShoppingCart, Package, Cog, BarChart2, Factory, Warehouse, UserPlus, LogIn, Laptop, Wrench, Trash2 } from 'lucide-react';

  // const ROLE_ICONS: Record<string, React.ReactNode> = {
  //   ShoppingCart: <ShoppingCart size={18} />, Warehouse: <Warehouse size={18} />, Factory: <Factory size={18} />, Wrench: <Wrench size={18} />, Cog: <Cog size={18} />,
  // };

  // const DEFAULT_USERS = [
  //   { full_name: 'Siska (Sales)', email: 'sales@erp.com', password: 'password123', role: 'admin_sales' },
  //   { full_name: 'Dedi (Gudang)', email: 'gudang@erp.com', password: 'password123', role: 'admin_gudang' },
  //   { full_name: 'Budi (Produksi)', email: 'produksi@erp.com', password: 'password123', role: 'manajer_produksi' },
  // ];

  // const getRedirectPath = (role: string) => {
  //   if (role === 'admin_sales') return '/dashboard/selling/home';
  //   if (role === 'admin_gudang') return '/dashboard/stock/home';
  //   if (role === 'manajer_produksi' || role === 'operator') return '/dashboard/manufacturing/home';
  //   return '/dashboard'; 
  // };

  // export default function LoginPage() {
  //   const router = useRouter();
  //   const { login, isAuthenticated, user, logout } = useAuth();

  //   const handleHardReset = () => {
  //     if (!confirm('Yakin ingin mereset semua data akun lama?')) return;
  //     logout();
  //     const users = DEFAULT_USERS.map((u, i) => ({ id: (i + 1).toString(), full_name: u.full_name, email: u.email, password: u.password, role: u.role, created_at: new Date().toISOString() }));
  //     localStorage.setItem('erp_users', JSON.stringify(users));
  //     alert('✅ Berhasil! Data lama sudah dihapus.'); window.location.reload();
  //   };

  //   useEffect(() => {
  //     if (typeof window !== 'undefined') {
  //       const existing = localStorage.getItem('erp_users');
  //       if (!existing || existing === '[]') {
  //         const users = DEFAULT_USERS.map((u, i) => ({ id: (i + 1).toString(), full_name: u.full_name, email: u.email, password: u.password, role: u.role, created_at: new Date().toISOString() }));
  //         localStorage.setItem('erp_users', JSON.stringify(users));
  //       }
  //     }
  //   }, []);
    
  //   useEffect(() => { if (isAuthenticated && user) router.push(getRedirectPath(user.role)); }, [isAuthenticated, user, router]);

  //   const [mode, setMode] = useState<'login' | 'register'>('login');
  //   const [selectedRole, setSelectedRole] = useState<string>('admin_sales');
  //   const [fullName, setFullName] = useState('');
  //   const [email, setEmail] = useState('');
  //   const [password, setPassword] = useState('');
  //   const [confirmPassword, setConfirmPassword] = useState('');
  //   const [showPassword, setShowPassword] = useState(false);
  //   const [isLoading, setIsLoading] = useState(false);
  //   const [error, setError] = useState('');

  //   const handleLogin = async (e: React.FormEvent) => {
  //     e.preventDefault(); if (!email || !password) { setError('Harap isi email dan password'); return; }
  //     setIsLoading(true); setError('');
  //     try {
  //       const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
  //       const user = users.find((u: any) => u.email === email && u.password === password);
  //       if (user) { await login(user.role as UserRole, email, password); router.push(getRedirectPath(user.role)); return; }
  //       setError('Email atau password salah');
  //     } catch { setError('Login gagal.'); } finally { setIsLoading(false); }
  //   };

  //   const handleQuickLogin = async (email: string, password: string) => {
  //     setIsLoading(true); setError('');
  //     try {
  //       const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
  //       const user = users.find((u: any) => u.email === email && u.password === password);
  //       if (user) { await login(user.role as UserRole, email, password); router.push(getRedirectPath(user.role)); return; }
  //       setError(`Akun tidak ditemukan. Klik tombol "Reset Data Lama".`);
  //     } catch { setError('Login gagal'); } finally { setIsLoading(false); }
  //   };

  //   return (
  //     <>
  //       <style>{`
  //         * { box-sizing: border-box; }
  //         .login-wrapper { display: flex; min-height: 100vh; font-family: 'Poppins', sans-serif; }
  //         /* BACKGROUND GRADIENT BARU #054CC7 dan #17C3CC */
  //         .login-left { width: 50%; background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%); padding: 48px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
  //         .login-right { flex: 1; background: #f8f9fb; display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
  //         .login-form-wrap { width: 100%; max-width: 440px; }
  //         @media (max-width: 768px) { .login-wrapper { flex-direction: column; } .login-left { display: none; } .login-right { padding: 24px 16px; align-items: flex-start; min-height: 100vh; } .login-form-wrap { max-width: 100%; } }
  //         .role-btn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  //         @media (max-width: 640px) { .role-btn-grid { grid-template-columns: 1fr; } }
  //         input, select, textarea { font-size: 14px !important; font-family: 'Poppins', sans-serif; }
  //       `}</style>

  //       <div className="login-wrapper">
  //         <div className="login-left">
  //           <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
  //           <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
  //             <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}><Laptop size={32} color="white" /></div>
  //             <div>
  //               <div style={{ color: 'white', fontWeight: 800, fontSize: '24px', letterSpacing: '0.02em', lineHeight: 1 }}>NETRA VIDYA</div>
  //               <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>OEM Assembler System</div>
  //             </div>
  //           </div>
  //           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
  //             <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px' }}>Enterprise Resource<br />Planning Workspace</h1>
  //             <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', lineHeight: 1.7, marginBottom: '40px', maxWidth: '420px' }}>Sistem ERP terisolasi untuk mengelola operasional fabrikasi perakitan Laptop, dari manajemen pesanan, stok komponen, hingga proses perakitan.</p>
  //           </div>
  //         </div>

  //         <div className="login-right">
  //           <div className="login-form-wrap">
  //             <div style={{ marginBottom: '32px', textAlign: 'center' }}>
  //               <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #054CC7 0%, #17C3CC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '24px', margin: '0 auto 16px' }}>N</div>
  //               <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Masuk ke Workspace</h2>
  //               <p style={{ color: '#6B7280', fontSize: '14px' }}>Pilih salah satu role akses cepat di bawah ini.</p>
  //             </div>

  //             <div style={{ marginBottom: '32px' }}>
  //               <div className="role-btn-grid">
  //                 {DEFAULT_USERS.map(u => {
  //                   const roleData = ROLES.find(r => r.id === u.role);
  //                   return (
  //                     <button key={u.email} onClick={() => handleQuickLogin(u.email, u.password)} disabled={isLoading} 
  //                       style={{ padding: '16px 12px', background: 'white', border: '2px solid transparent', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.2s' }}
  //                       onMouseEnter={e => e.currentTarget.style.borderColor = '#17C3CC'}
  //                       onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
  //                     >
  //                       <div style={{ color: '#054CC7', background: '#eff6ff', padding: '12px', borderRadius: '12px' }}>{roleData ? ROLE_ICONS[roleData.icon] : <Cog size={20} />}</div>
  //                       {u.full_name.split(' ')[0]}
  //                     </button>
  //                   )
  //                 })}
  //               </div>
  //             </div>

  //             <form onSubmit={handleLogin}>
  //               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
  //                 <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
  //                 <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Atau Login Manual</span>
  //                 <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
  //               </div>

  //               <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@netravidya.com" className="erp-input" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none' }} onFocus={e => e.target.style.borderColor='#17C3CC'} onBlur={e => e.target.style.borderColor='#d1d5db'} /></div>
  //               <div style={{ marginBottom: '24px' }}>
  //                 <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Password</label>
  //                 <div style={{ position: 'relative' }}>
  //                   <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" className="erp-input" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none' }} onFocus={e => e.target.style.borderColor='#17C3CC'} onBlur={e => e.target.style.borderColor='#d1d5db'} />
  //                   <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
  //                 </div>
  //               </div>
                
  //               {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#991b1b', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>{error}</div>}

  //               <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '14px', background: isLoading ? '#93c5fd' : '#054CC7', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(5, 76, 199, 0.3)' }} onMouseEnter={e => { if(!isLoading) e.currentTarget.style.background = '#043b9c' }} onMouseLeave={e => { if(!isLoading) e.currentTarget.style.background = '#054CC7' }}>{isLoading ? 'Memproses...' : 'Masuk Manual'}</button>
  //             </form>

  //             <div style={{ marginTop: '32px', textAlign: 'center' }}>
  //               <button onClick={handleHardReset} style={{ background: 'none', color: '#dc2626', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'underline' }}>
  //                 <Trash2 size={14} /> Reset Data Akun
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </>
  //   );
  // }


  'use client';

  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import Image from 'next/image';
  import { useAuth } from '@/providers/auth-provider';
  import { ROLES, type UserRole } from '@/config/rbac';
  import {
    Eye, EyeOff, ChevronDown, ShoppingCart, Cog,
    Factory, Warehouse, ChevronUp, CheckCircle, Trash2, Wrench
  } from 'lucide-react';

  const ROLE_ICONS: Record<string, React.ReactNode> = {
    ShoppingCart: <ShoppingCart size={15} />,
    Warehouse: <Warehouse size={15} />,
    Factory: <Factory size={15} />,
    Wrench: <Wrench size={15} />,
    Cog: <Cog size={15} />,
  };

  // 3 AKUN BARU KITA DARI LOGIC PERTAMA
  const DEFAULT_USERS: Array<{ full_name: string; email: string; password: string; role: string }> = [
    { full_name: 'Siska (Sales)', email: 'sales@erp.com', password: 'password123', role: 'admin_sales' },
    { full_name: 'Dedi (Gudang)', email: 'gudang@erp.com', password: 'password123', role: 'admin_gudang' },
    { full_name: 'Budi (Produksi)', email: 'produksi@erp.com', password: 'password123', role: 'manajer_produksi' },
  ];

  // Role yang diizinkan untuk didaftarkan secara manual
  const ALLOWED_REGISTER_ROLES = ['admin_sales', 'admin_gudang', 'manajer_produksi'];

  const getRedirectPath = (role: string) => {
    if (role === 'admin_sales') return '/dashboard/selling/home';
    if (role === 'admin_gudang') return '/dashboard/stock/home';
    if (role === 'manajer_produksi' || role === 'operator') return '/dashboard/manufacturing/home';
    return '/dashboard'; 
  };

  /* ─────────────────────────────────────── */
  export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user, logout } = useAuth();

    // Fungsi untuk memaksa reset data (Logic Pertama)
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
      
      alert('✅ Berhasil! Data lama sudah dihapus.');
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
      // Redirect logic dari kode pertama
      if (isAuthenticated && user) {
        router.push(getRedirectPath(user.role));
      } 
    }, [isAuthenticated, user, router]);

    const [mode, setMode]         = useState<'login' | 'register'>('login');
    const [selectedRole, setSelectedRole] = useState<string>('admin_sales');
    const [fullName, setFullName]         = useState('');
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword]       = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]         = useState('');
    const [agreeTerms, setAgreeTerms]   = useState(false);
    const [rememberMe, setRememberMe]   = useState(false);

    const currentRole = ROLES.find(r => r.id === selectedRole) || ROLES.find(r => r.id === 'admin_sales');

    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!fullName || !email || !password || !confirmPassword) { setError('Harap isi semua data'); return; }
      if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
      if (password.length < 6) { setError('Password minimal 6 karakter'); return; }
      if (!agreeTerms) { setError('Harap setujui Syarat & Ketentuan'); return; }
      if (!email.includes('@')) { setError('Email tidak valid'); return; }
      
      setIsLoading(true); setError('');
      try {
        const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
        if (users.find((u: any) => u.email === email)) { setError('Email sudah terdaftar'); setIsLoading(false); return; }
        
        const newUser = { id: Date.now().toString(), full_name: fullName, email, password, role: selectedRole, created_at: new Date().toISOString() };
        users.push(newUser);
        localStorage.setItem('erp_users', JSON.stringify(users));
        
        await login(selectedRole as UserRole, email, password);
        router.push(getRedirectPath(selectedRole));
      } catch { setError('Pendaftaran gagal.'); }
      finally { setIsLoading(false); }
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
      } catch { setError('Login gagal.'); }
      finally { setIsLoading(false); }
    };

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          .lp-root {
            min-height: 100vh;
            background: linear-gradient(135deg, #f0f4fd 0%, #e4eefe 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: 'Poppins', sans-serif;
            overflow: hidden;
          }

          .lp-root::before, .lp-root::after {
            content: '';
            position: absolute;
            border-radius: 50%;
            filter: blur(90px);
            z-index: 0;
            opacity: 0.4;
            pointer-events: none;
          }
          .lp-root::before {
            width: 500px; height: 500px; background: #17C3CC;
            top: -150px; left: -100px; animation: pulseGlow 8s ease-in-out infinite alternate;
          }
          .lp-root::after {
            width: 600px; height: 600px; background: #054CC7;
            bottom: -200px; right: -150px; animation: pulseGlow 10s ease-in-out infinite alternate-reverse;
          }

          @keyframes pulseGlow {
            0% { transform: scale(1) translate(0, 0); opacity: 0.3; }
            100% { transform: scale(1.1) translate(20px, -20px); opacity: 0.5; }
          }

          .lp-card {
            display: flex;
            flex-direction: row;
            width: 100%;
            max-width: 1024px;
            height: 640px; 
            background: white;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            z-index: 10;
            box-shadow: 0 25px 50px rgba(5, 76, 199, 0.15), 0 0 0 1px rgba(255,255,255,0.5);
          }

          /* PANEL KIRI */
          .lp-left {
            width: 45%;
            background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
            padding: 40px;
            display: flex;
            flex-direction: column;
            color: white;
            position: relative;
            overflow: hidden;
          }
          .lp-left::after {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 20px 20px; opacity: 0.5; pointer-events: none;
          }
          .lp-logo { display: flex; align-items: center; gap: 12px; position: relative; z-index: 2; }
          
          .lp-slogan { margin-top: 40px; margin-bottom: 20px; position: relative; z-index: 2; }
          .lp-slogan h1 { font-size: 24px; font-weight: 800; line-height: 1.3; margin-bottom: 10px; }
          .lp-slogan p { font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); }

          .lp-illus {
            margin: auto 0; display: flex; align-items: center; justify-content: center;
            animation: float 4s ease-in-out infinite; position: relative; z-index: 2;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50%      { transform: translateY(-10px); }
          }
          .lp-left-spacer { margin-top: auto; }

          /* PANEL KANAN (Form) */
          .lp-right {
            flex: 1;
            padding: 30px 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #ffffff;
            overflow: hidden;
            position: relative;
            z-index: 2;
          }

          .lp-heading { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 20px; text-align: left; }

          /* Input Box */
          .lp-field-group {
            background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;
            padding: 6px 14px;
            margin-bottom: 10px;
            transition: all 0.2s;
          }
          .lp-field-group:focus-within {
            border-color: #17C3CC; box-shadow: 0 0 0 3px rgba(23, 195, 204, 0.1);
          }
          
          .lp-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 2px; }
          .lp-input {
            width: 100%; border: none; outline: none; background: transparent;
            font-size: 13px; font-weight: 500; color: #334155; font-family: 'Poppins', sans-serif;
          }
          .lp-input::placeholder { color: #cbd5e1; font-weight: 400; }

          .lp-pw-wrap { position: relative; display: flex; align-items: center; }
          .lp-pw-eye {
            position: absolute; right: 0; top: 50%; transform: translateY(-50%);
            background: none; border: none; cursor: pointer; color: #cbd5e1;
          }
          .lp-pw-eye:hover { color: #054CC7; }

          .lp-role-btn {
            width: 100%; border: none; background: transparent; outline: none;
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer; font-family: 'Poppins', sans-serif; padding: 2px 0;
          }
          .lp-role-dd {
            position: absolute; top: calc(100% + 5px); left: 0; right: 0;
            background: white; border: 1px solid #e2e8f0; border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 60; overflow: hidden;
          }
          .lp-role-opt {
            width: 100%; padding: 10px 14px; background: none; border: none;
            display: flex; align-items: center; gap: 10px; cursor: pointer;
            font-family: 'Poppins', sans-serif; border-bottom: 1px solid #f8fafc;
          }
          .lp-role-opt:hover { background: #f0fdfa; }

          /* Extras & Submit */
          .lp-extras { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 16px; }
          .lp-remember { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; cursor: pointer; font-weight: 500; }
          .lp-remember input { accent-color: #054CC7; width: 14px; height: 14px; cursor: pointer; border-radius: 4px; border: 1px solid #cbd5e1; }
          .lp-forgot { font-size: 12px; color: #054CC7; font-weight: 700; text-decoration: none; }
          .lp-forgot:hover { text-decoration: underline; }

          .lp-submit {
            width: 100%; padding: 14px;
            background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
            color: white; border: none; border-radius: 10px;
            font-size: 14px; font-weight: 700; cursor: pointer;
            box-shadow: 0 8px 20px rgba(5,76,199,0.25); transition: all 0.2s;
            margin-bottom: 16px; font-family: 'Poppins', sans-serif;
          }
          .lp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(5,76,199,0.35); }
          .lp-submit:disabled { opacity: 0.7; cursor: not-allowed; }

          .lp-switch { text-align: center; font-size: 12px; color: #64748b; font-weight: 500; }
          .lp-switch-lnk { color: #054CC7; font-weight: 700; cursor: pointer; margin-left: 5px; }
          .lp-switch-lnk:hover { text-decoration: underline; }

          .lp-error { color: #ef4444; font-size: 12px; margin-bottom: 10px; text-align: left; font-weight: 500; }

          .lp-hard-reset {
            background: none; border: none; color: #94a3b8; font-size: 11px; font-family: 'Poppins', sans-serif;
            cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: color 0.2s;
          }
          .lp-hard-reset:hover { color: #ef4444; }

          /* ═══════════════════════════════
            RESPONSIVE
          ═══════════════════════════════ */
          @media (max-width: 850px) {
            .lp-card { flex-direction: column; max-width: 500px; height: auto; min-height: 600px; }
            .lp-left { width: 100%; padding: 30px; min-height: 250px; border-radius: 20px 20px 0 0; }
            .lp-right { padding: 40px 30px; border-radius: 0 0 20px 20px; overflow: visible; }
          }
          @media (max-width: 500px) {
            .lp-right { padding: 30px 20px; }
            .lp-left { padding: 30px 20px; }
          }
        `}</style>

        <div className="lp-root">
          <div className="lp-card">

            {/* ══════════ KIRI: VISUAL (Gradasi Biru) ══════════ */}
            <div className="lp-left">
              <div className="lp-logo">
                <Image 
                  src="/logoartawhite.png" 
                  alt="Logo Perusahaan" 
                  width={150} 
                  height={40} 
                  style={{ objectFit: 'contain' }} 
                />
              </div>

              <div className="lp-slogan">
                <h1>Sistem Manajemen<br/>Enterprise Terpadu</h1>
                <p>Kelola seluruh proses bisnis, sumber daya, dan operasional perusahaan secara terintegrasi dan efisien.</p>
              </div>

              <div className="lp-illus">
                <Image
                  src="/3d.png"
                  alt="Artavista Illustration"
                  width={260}
                  height={260}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
              
              <div className="lp-left-spacer"></div>
            </div>

            {/* ══════════ KANAN: FORM ══════════ */}
            <div className="lp-right">
              <h2 className="lp-heading">{mode === 'login' ? 'Login' : 'Register'}</h2>

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                
                {/* Nama */}
                {mode === 'register' && (
                  <div className="lp-field-group">
                    <label className="lp-label">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ahmad Wijaya" className="lp-input" />
                  </div>
                )}

                {/* Role / Departemen */}
                {mode === 'register' && (
                  <div className="lp-field-group" style={{ position: 'relative' }}>
                    <label className="lp-label">Department</label>
                    <button type="button" className="lp-role-btn" onClick={() => setShowRoleDropdown(!showRoleDropdown)}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{currentRole?.label || 'Pilih Role'}</span>
                      {showRoleDropdown ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </button>
                    {showRoleDropdown && (
                      <div className="lp-role-dd">
                        {ROLES
                          .filter(role => ALLOWED_REGISTER_ROLES.includes(role.id)) // <-- Filter diaplikasikan disini
                          .map(role => (
                          <button key={role.id} type="button" className="lp-role-opt" onClick={() => { setSelectedRole(role.id); setShowRoleDropdown(false); }}>
                            <span style={{ color: role.color }}>
                              {ROLE_ICONS[role.icon] ? ROLE_ICONS[role.icon] : <Cog size={15}/>}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', flex: 1, textAlign: 'left' }}>{role.label}</span>
                            {selectedRole === role.id && <CheckCircle size={14} color="#054CC7" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="lp-field-group">
                  <label className="lp-label">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@perusahaan.com" className="lp-input" />
                </div>

                {/* Password */}
                <div className="lp-field-group">
                  <label className="lp-label">Password</label>
                  <div className="lp-pw-wrap">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="lp-input" style={{ paddingRight: 30 }} />
                    <button type="button" className="lp-pw-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password */}
                {mode === 'register' && (
                  <div className="lp-field-group">
                    <label className="lp-label">Confirm Password</label>
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••••••" className="lp-input" />
                  </div>
                )}

                {/* Error Message */}
                {error && <div className="lp-error">{error}</div>}

                {/* Checkbox Options */}
                {mode === 'login' ? (
                  <div className="lp-extras">
                    <label className="lp-remember">
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                      Remember me
                    </label>
                    <a href="#" className="lp-forgot">Forgot password?</a>
                  </div>
                ) : (
                  <div className="lp-extras">
                    <label className="lp-remember">
                      <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                      I agree to the Terms & Conditions
                    </label>
                  </div>
                )}

                {/* Submit Button */}
                <button type="submit" className="lp-submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create Account')}
                </button>

              </form>

              {/* Mode Switcher */}
              <div className="lp-switch">
                {mode === 'login' ? (
                  <>Don't have an account? <span className="lp-switch-lnk" onClick={() => { setMode('register'); setError(''); }}>Create Account</span></>
                ) : (
                  <>Already have an account? <span className="lp-switch-lnk" onClick={() => { setMode('login'); setError(''); }}>Login</span></>
                )}
              </div>

              {/* Tombol Hard Reset (Samar di paling bawah) */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button type="button" onClick={handleHardReset} className="lp-hard-reset">
                  <Trash2 size={12} />
                  <span>Reset Data Akun Lama</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </>
    );
  }