'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { ROLES, type UserRole } from '@/config/rbac';
import {
  Eye, EyeOff, ChevronDown, ChevronUp, CheckCircle, Trash2, Cog, Laptop
} from 'lucide-react';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  ShoppingCart: <Cog size={15} />,
  Warehouse: <Cog size={15} />,
  Factory: <Cog size={15} />,
  Wrench: <Cog size={15} />,
  Cog: <Cog size={15} />,
};

const DEFAULT_USERS: Array<{ full_name: string; email: string; password: string; role: string }> = [
  { full_name: 'Citra Dewi (Sales)', email: 'sales@erp.com', password: 'password123', role: 'admin_sales' },
  { full_name: 'Dedi Kurniawan (Gudang)', email: 'gudang@erp.com', password: 'password123', role: 'admin_gudang' },
  { full_name: 'Eko Prasetyo (Produksi)', email: 'produksi@erp.com', password: 'password123', role: 'manajer_produksi' },
  { full_name: 'Administrator', email: 'admin@erp.com', password: 'password123', role: 'administrator' },
];

const ALLOWED_REGISTER_ROLES = ['admin_sales', 'admin_gudang', 'manajer_produksi'];

const getRedirectPath = (role: string) => {
  if (role === 'admin_sales') return '/dashboard/selling/home';
  if (role === 'admin_gudang') return '/dashboard/stock/home';
  if (role === 'manajer_produksi' || role === 'operator') return '/dashboard/manufacturing/home';
  if (role === 'administrator') return '/dashboard/users';
  return '/dashboard';
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, logout } = useAuth();

  const handleHardReset = () => {
    if (!confirm('Yakin ingin mereset semua data dan logout?')) return;
    localStorage.clear();
    alert('✅ Berhasil! Semua data dihapus. Silakan login ulang.');
    window.location.reload();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const STORAGE_VERSION = 'v3';
      const storedVersion = localStorage.getItem('erp_users_version');
      const existing = localStorage.getItem('erp_users');
      let users = [];
      
      if (!existing || existing === '[]' || storedVersion !== STORAGE_VERSION) {
        users = DEFAULT_USERS.map((u, i) => ({
          id: (i + 1).toString(),
          full_name: u.full_name,
          email: u.email,
          password: u.password,
          role: u.role,
          created_at: new Date().toISOString(),
        }));
        localStorage.setItem('erp_users', JSON.stringify(users));
        localStorage.setItem('erp_users_version', STORAGE_VERSION);
        console.log('Initialized users:', users);
      } else {
        try {
          users = JSON.parse(existing);
          if (users.length !== DEFAULT_USERS.length) {
            users = DEFAULT_USERS.map((u, i) => ({
              id: (i + 1).toString(),
              full_name: u.full_name,
              email: u.email,
              password: u.password,
              role: u.role,
              created_at: new Date().toISOString(),
            }));
            localStorage.setItem('erp_users', JSON.stringify(users));
            localStorage.setItem('erp_users_version', STORAGE_VERSION);
            console.log('Reset users:', users);
          }
        } catch(e) {}
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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const currentRole = ROLES.find(r => r.id === selectedRole) || ROLES.find(r => r.id === 'admin_sales');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) { setError('Harap isi semua data'); return; }
    if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
    if (password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (!agreeTerms) { setError('Harap setuju');
    return; }
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Poppins', sans-serif;
          overflow: hidden;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 50%, #054CC7 100%);
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .lp-glow-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          border-radius: 50%;
          top: -200px;
          left: -200px;
          animation: floatGlow 10s ease-in-out infinite;
          pointer-events: none;
        }

        .lp-glow-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -150px;
          right: -150px;
          animation: floatGlow 12s ease-in-out infinite reverse;
          pointer-events: none;
        }

        @keyframes floatGlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }

        .lp-floating-shapes {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .lp-shape {
          position: absolute;
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          animation: floatShape 15s linear infinite;
        }

        .lp-shape-1 { width: 100px; height: 100px; top: 10%; left: 10%; animation-delay: 0s; }
        .lp-shape-2 { width: 60px; height: 60px; top: 60%; left: 5%; animation-delay: -3s; }
        .lp-shape-3 { width: 80px; height: 80px; top: 20%; right: 10%; animation-delay: -5s; }
        .lp-shape-4 { width: 120px; height: 120px; bottom: 20%; right: 15%; animation-delay: -7s; }
        .lp-shape-5 { width: 40px; height: 40px; top: 40%; right: 30%; animation-delay: -2s; background: rgba(255,255,255,0.05); }

        @keyframes floatShape {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.6; }
          100% { transform: translateY(0) rotate(360deg); opacity: 0.3; }
        }

        /* LOADING OVERLAY */
        .lp-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .lp-loading-content {
          text-align: center;
        }

        .lp-loader-anim {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          position: relative;
        }

        .lp-loader-anim::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 4px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .lp-loader-anim::after {
          content: '';
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          border: 3px solid rgba(255,255,255,0.2);
          border-bottom-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite reverse;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .lp-loading-text {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }

        .lp-loading-dots::after {
          content: '...';
          animation: dots 1.5s steps(3, end) infinite;
        }

        @keyframes dots {
          0% { content: ''; }
          33% { content: '.'; }
          66% { content: '..'; }
        }

        /* CARD */
        .lp-card {
          display: flex;
          width: 100%;
          max-width: 1000px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          z-index: 10;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
        }

        /* LEFT PANEL */
        .lp-left {
          width: 45%;
          background: linear-gradient(135deg, #054CC7 0%, #0a3a8a 100%);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .lp-left::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
        }

        .lp-left-decor {
          position: absolute;
          width: 300px;
          height: 300px;
          border: 2px solid rgba(255,255,255,0.05);
          border-radius: 50%;
          bottom: -100px;
          right: -100px;
          animation: rotateSlow 30s linear infinite;
        }

        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .lp-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;
          margin-bottom: 40px;
        }

        .lp-logo-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lp-logo-text {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .lp-logo-sub {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.8;
          margin-top: 2px;
        }

        .lp-slogan {
          position: relative;
          z-index: 2;
          flex: 1;
        }

        .lp-slogan h1 {
          font-size: 32px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 16px;
          animation: slideUp 0.8s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lp-slogan p {
          font-size: 14px;
          line-height: 1.7;
          opacity: 0.9;
          animation: slideUp 0.8s ease-out 0.1s both;
        }

        .lp-features {
          margin-top: 32px;
          display: flex;
          gap: 16px;
          position: relative;
          z-index: 2;
          animation: slideUp 0.8s ease-out 0.2s both;
        }

        .lp-feature {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 14px 18px;
          flex: 1;
          transition: all 0.3s ease;
          cursor: default;
        }

        .lp-feature:hover {
          background: rgba(255,255,255,0.15);
          transform: translateY(-3px);
        }

        .lp-feature-num {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .lp-feature-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }

        /* RIGHT PANEL */
        .lp-right {
          flex: 1;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .lp-right::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border: 1px solid rgba(5, 76, 199, 0.03);
          border-radius: 50%;
          top: -100px;
          right: -100px;
          animation: float 8s ease-in-out infinite;
        }

        .lp-right::after {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          border: 1px solid rgba(23, 195, 204, 0.03);
          border-radius: 50%;
          bottom: -80px;
          left: -80px;
          animation: float 10s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes floatIllus {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .lp-right-content {
          position: relative;
          z-index: 2;
        }

        .lp-heading {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 8px;
          text-align: center;
        }

        .lp-subheading {
          font-size: 14px;
          color: #64748b;
          text-align: center;
          margin-bottom: 32px;
        }

        .lp-field-group {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }

        .lp-field-group:focus-within {
          border-color: #17C3CC;
          box-shadow: 0 0 0 3px rgba(23, 195, 204, 0.1);
          background: white;
        }

        .lp-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .lp-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          font-family: 'Poppins', sans-serif;
        }

        .lp-input::placeholder {
          color: #cbd5e1;
        }

        .lp-pw-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .lp-pw-eye {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          transition: color 0.2s;
        }

        .lp-pw-eye:hover {
          color: #054CC7;
        }

        .lp-role-wrap {
          position: relative;
        }

        .lp-role-btn {
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
        }

        .lp-role-dd {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          z-index: 60;
          overflow: hidden;
          animation: dropdownFade 0.2s ease;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lp-role-opt {
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: background 0.2s;
        }

        .lp-role-opt:hover {
          background: #f0fdfa;
        }

        .lp-extras {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 8px 0 20px;
        }

        .lp-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
          cursor: pointer;
          font-weight: 500;
        }

        .lp-remember input {
          accent-color: #054CC7;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .lp-forgot {
          font-size: 13px;
          color: #054CC7;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .lp-forgot:hover {
          color: #0a3a8a;
          text-decoration: underline;
        }

        .lp-submit {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(5, 76, 199, 0.25);
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
        }

        .lp-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(5, 76, 199, 0.35);
        }

        .lp-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .lp-switch {
          text-align: center;
          font-size: 14px;
          color: #64748b;
          margin-top: 24px;
        }

        .lp-switch-lnk {
          color: #054CC7;
          font-weight: 700;
          cursor: pointer;
          margin-left: 4px;
          transition: color 0.2s;
        }

        .lp-switch-lnk:hover {
          color: #0a3a8a;
          text-decoration: underline;
        }

        .lp-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 16px;
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 16px;
          font-weight: 500;
          animation: shake 0.5s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .lp-hard-reset {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 20px;
          transition: color 0.2s;
        }

        .lp-hard-reset:hover {
          color: #dc2626;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .lp-card {
            flex-direction: column;
            max-width: 440px;
          }
          .lp-left {
            width: 100%;
            padding: 32px 24px;
            min-height: 180px;
            text-align: center;
          }
          .lp-left-decor {
            display: none;
          }
          .lp-logo {
            justify-content: center;
            margin-bottom: 16px;
          }
          .lp-slogan {
            display: none;
          }
          .lp-right {
            padding: 32px 24px;
          }
          .lp-features {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .lp-root {
            padding: 16px;
            align-items: center;
            justify-content: center;
          }
          .lp-card {
            max-width: 100%;
            border-radius: 20px;
          }
          .lp-left {
            padding: 24px 20px;
            border-radius: 20px 20px 0 0;
            min-height: 140px;
          }
          .lp-logo-icon {
            width: 40px;
            height: 40px;
          }
          .lp-logo-text {
            font-size: 16px;
          }
          .lp-right {
            padding: 24px 20px;
            border-radius: 0 0 20px 20px;
          }
          .lp-heading {
            font-size: 22px;
            margin-bottom: 20px;
          }
          .lp-input-wrap {
            margin-bottom: 16px;
          }
          .lp-label {
            font-size: 12px;
            margin-bottom: 6px;
          }
          .lp-input {
            font-size: 14px;
            padding: 12px 14px;
          }
          .lp-submit {
            padding: 14px;
            font-size: 14px;
            margin-top: 8px;
          }
          .lp-switch {
            font-size: 13px;
            margin-top: 16px;
          }
          .lp-hard-reset {
            font-size: 12px;
            padding: 8px 12px;
            margin-top: 16px;
          }
          .lp-remember {
            font-size: 12px;
            margin: 12px 0;
          }
          .lp-role-btn {
            padding: 12px 14px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="lp-root">
        {/* Animated Background */}
        <div className="lp-glow-1"></div>
        <div className="lp-glow-2"></div>
        
        <div className="lp-floating-shapes">
          <div className="lp-shape lp-shape-1"></div>
          <div className="lp-shape lp-shape-2"></div>
          <div className="lp-shape lp-shape-3"></div>
          <div className="lp-shape lp-shape-4"></div>
          <div className="lp-shape lp-shape-5"></div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="lp-loading-overlay">
            <div className="lp-loading-content">
              <div className="lp-loader-anim"></div>
              <div className="lp-loading-text">Mohon Tunggu<span className="lp-loading-dots"></span></div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '8px' }}>Sedang memproses data Anda</div>
            </div>
          </div>
        )}

        <div className="lp-card">
          {/* Left Panel */}
          <div className="lp-left">
            <div className="lp-left-decor"></div>
            
            <div className="lp-logo">
              <Image 
                src="/logoartawhite.png" 
                alt="Logo Artavista" 
                width={140} 
                height={40} 
                style={{ objectFit: 'contain' }}
              />
            </div>

            <div className="lp-slogan">
              <h1>Sistem Enterprise<br/>Terintegrasi</h1>
              <p>Kelola seluruh operasional bisnis perusahaan secara efisien dengan sistem ERP modern.</p>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
              <Image 
                src="/freepik__background__4862.png" 
                alt="Artavista Illustration" 
                width={280} 
                height={280} 
                style={{ objectFit: 'contain', animation: 'floatIllus 4s ease-in-out infinite' }}
                priority
              />
            </div>

            <div className="lp-features">
              <div className="lp-feature">
                <div className="lp-feature-num">500+</div>
                <div className="lp-feature-label">Transaksi/Hari</div>
              </div>
              <div className="lp-feature">
                <div className="lp-feature-num">99%</div>
                <div className="lp-feature-label">Akurasi Data</div>
              </div>
              <div className="lp-feature">
                <div className="lp-feature-num">24/7</div>
                <div className="lp-feature-label">Akses System</div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lp-right">
            <div className="lp-right-content">
              <h2 className="lp-heading">{mode === 'login' ? 'Selamat Datang' : 'Buat Akun'}</h2>
              <p className="lp-subheading">
                {mode === 'login' ? 'Masuk untuk mengakses dashboard' : 'Daftar untuk memulai'}
              </p>

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                {mode === 'register' && (
                  <>
                    <div className="lp-field-group">
                      <label className="lp-label">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                        placeholder="Ahmad Wijaya" 
                        className="lp-input" 
                      />
                    </div>

                    <div className="lp-field-group lp-role-wrap">
                      <label className="lp-label">Department</label>
                      <button 
                        type="button" 
                        className="lp-role-btn" 
                        onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      >
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>
                          {currentRole?.label || 'Pilih Role'}
                        </span>
                        {showRoleDropdown ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                      </button>
                      {showRoleDropdown && (
                        <div className="lp-role-dd">
                          {ROLES
                            .filter(role => ALLOWED_REGISTER_ROLES.includes(role.id))
                            .map(role => (
                              <button 
                                key={role.id} 
                                type="button" 
                                className="lp-role-opt" 
                                onClick={() => { setSelectedRole(role.id); setShowRoleDropdown(false); }}
                              >
                                <Cog size={16} color={role.color} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', flex: 1, textAlign: 'left' }}>
                                  {role.label}
                                </span>
                                {selectedRole === role.id && <CheckCircle size={16} color="#054CC7" />}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="lp-field-group">
                  <label className="lp-label">Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="email@perusahaan.com" 
                    className="lp-input" 
                  />
                </div>

                <div className="lp-field-group">
                  <label className="lp-label">Password</label>
                  <div className="lp-pw-wrap">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="Masukkan password" 
                      className="lp-input" 
                      style={{ paddingRight: 30 }} 
                    />
                    <button 
                      type="button" 
                      className="lp-pw-eye" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="lp-field-group">
                    <label className="lp-label">Konfirmasi Password</label>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="Ulangi password" 
                      className="lp-input" 
                    />
                  </div>
                )}

                {error && <div className="lp-error">{error}</div>}

                {mode === 'login' ? (
                  <div className="lp-extras">
                    <label className="lp-remember">
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={e => setRememberMe(e.target.checked)} 
                      />
                      Ingat saya
                    </label>
                    <a href="#" className="lp-forgot">Lupa password?</a>
                  </div>
                ) : (
                  <div className="lp-extras">
                    <label className="lp-remember">
                      <input 
                        type="checkbox" 
                        checked={agreeTerms} 
                        onChange={e => setAgreeTerms(e.target.checked)} 
                      />
                      Saya setuju dengan Syarat & Ketentuan
                    </label>
                  </div>
                )}

                <button type="submit" className="lp-submit" disabled={isLoading}>
                  {isLoading ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Buat Akun')}
                </button>
              </form>

              <div className="lp-switch">
                {mode === 'login' ? (
                  <>Belum punya akun? <span className="lp-switch-lnk" onClick={() => { setMode('register'); setError(''); }}>Daftar Sekarang</span></>
                ) : (
                  <>Sudah punya akun? <span className="lp-switch-lnk" onClick={() => { setMode('login'); setError(''); }}>Masuk</span></>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={handleHardReset} className="lp-hard-reset">
                  <Trash2 size={14} />
                  Reset Data Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
