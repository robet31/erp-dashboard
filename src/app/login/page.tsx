'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { ROLES, type UserRole } from '@/config/rbac';
import {
  Eye, EyeOff, ChevronDown, ChevronUp, CheckCircle, Trash2, Cog
} from 'lucide-react';

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
  const { login, isAuthenticated, user } = useAuth();

  const handleHardReset = () => {
    if (!confirm('Yakin ingin mereset semua data dan logout?')) return;
    localStorage.clear();
    alert('✅ Berhasil! Semua data dihapus. Silakan login ulang.');
    window.location.reload();
  };

  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const seeded = localStorage.getItem('erp_database_seeded');
        if (!seeded) {
          await fetch('/api/auth/seed', { method: 'POST' });
          localStorage.setItem('erp_database_seeded', 'true');
        }
      } catch (err) {
        console.error('Failed to seed database:', err);
      }
    };
    seedDatabase();
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
    if (!agreeTerms) { setError('Harap setuju dengan syarat & ketentuan'); return; }
    if (!email.includes('@')) { setError('Email tidak valid'); return; }
    setIsLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role: selectedRole })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Pendaftaran gagal');
      }
      await login(selectedRole as UserRole, email, password);
      router.push(getRedirectPath(selectedRole));
    } catch (err: any) {
      setError(err.message || 'Pendaftaran gagal.');
    } finally { setIsLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Harap isi email dan password'); return; }
    setIsLoading(true); setError('');
    try {
      await login(selectedRole as UserRole, email, password);
      const localSession = JSON.parse(localStorage.getItem('erp_user') || '{}');
      const loggedRole = localSession.role || selectedRole;
      router.push(getRedirectPath(loggedRole));
    } catch (error: any) {
      setError(error.message || 'Email atau password salah');
    } finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body { height: 100%; overflow: hidden; }

        /* ── ROOT: locked to viewport, no scroll ── */
        .lp-root {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0; left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          overflow: hidden;
          background: linear-gradient(135deg, #dbeafe 0%, #cffafe 50%, #ecfdf5 100%);
        }

        /* ── ANIMATED BACKGROUND BLOBS ── */
        .lp-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.5;
        }
        .lp-blob-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #054CC7 0%, #17C3CC 100%);
          top: -180px; left: -180px;
          animation: blobFloat1 12s ease-in-out infinite;
        }
        .lp-blob-2 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, #17C3CC 0%, #054CC7 100%);
          bottom: -130px; right: -90px;
          animation: blobFloat2 15s ease-in-out infinite;
        }
        .lp-blob-3 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(23,195,204,0.5) 0%, transparent 70%);
          top: 35%; right: 18%;
          animation: blobFloat1 18s ease-in-out infinite reverse;
        }
        @keyframes blobFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(40px,-40px) scale(1.08); }
          66%  { transform: translate(-30px,30px) scale(0.95); }
        }
        @keyframes blobFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%  { transform: translate(-50px,-30px) scale(1.12); }
          70%  { transform: translate(30px,40px) scale(0.92); }
        }

        /* ── RISING PARTICLES ── */
        .lp-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .lp-particle {
          position: absolute; border-radius: 50%; opacity: 0;
          animation: particleRise linear infinite;
          bottom: -20px;
        }
        .lp-particle:nth-child(1)  { width:6px;  height:6px;  left:8%;   background:#054CC7; animation-duration:8s;  animation-delay:0s;   }
        .lp-particle:nth-child(2)  { width:10px; height:10px; left:18%;  background:#17C3CC; animation-duration:11s; animation-delay:1s;   }
        .lp-particle:nth-child(3)  { width:4px;  height:4px;  left:30%;  background:#054CC7; animation-duration:7s;  animation-delay:2s;   }
        .lp-particle:nth-child(4)  { width:8px;  height:8px;  left:45%;  background:#17C3CC; animation-duration:13s; animation-delay:0.5s; }
        .lp-particle:nth-child(5)  { width:5px;  height:5px;  left:60%;  background:#054CC7; animation-duration:9s;  animation-delay:3s;   }
        .lp-particle:nth-child(6)  { width:12px; height:12px; left:72%;  background:#17C3CC; animation-duration:14s; animation-delay:1.5s; }
        .lp-particle:nth-child(7)  { width:6px;  height:6px;  left:82%;  background:#054CC7; animation-duration:10s; animation-delay:2.5s; }
        .lp-particle:nth-child(8)  { width:4px;  height:4px;  left:92%;  background:#17C3CC; animation-duration:12s; animation-delay:4s;   }
        .lp-particle:nth-child(9)  { width:8px;  height:8px;  left:25%;  background:rgba(5,76,199,0.4); animation-duration:16s; animation-delay:0.8s; }
        .lp-particle:nth-child(10) { width:6px;  height:6px;  left:55%;  background:rgba(23,195,204,0.4); animation-duration:9s; animation-delay:3.5s; }
        @keyframes particleRise {
          0%   { transform: translateY(0) scale(0); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.35; }
          100% { transform: translateY(-110vh) scale(1.2); opacity: 0; }
        }

        /* ── LOADING OVERLAY ── */
        .lp-loading-overlay {
          position: fixed; inset: 0;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        .lp-loading-content { text-align: center; }
        .lp-loader-anim { width:80px; height:80px; margin:0 auto 24px; position:relative; }
        .lp-loader-anim::before {
          content:''; position:absolute; inset:0;
          border:4px solid rgba(255,255,255,0.2); border-top-color:white;
          border-radius:50%; animation:spin 1s linear infinite;
        }
        .lp-loader-anim::after {
          content:''; position:absolute; top:10px;left:10px;right:10px;bottom:10px;
          border:3px solid rgba(255,255,255,0.2); border-bottom-color:white;
          border-radius:50%; animation:spin 0.8s linear infinite reverse;
        }
        @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        .lp-loading-text { font-size:18px; font-weight:700; color:white; margin-bottom:8px; }
        .lp-loading-dots::after { content:''; animation:dots 1.5s steps(3,end) infinite; }
        @keyframes dots { 0%{content:'';} 33%{content:'.';} 66%{content:'..';} }

        /* ── CARD ── */
        .lp-card {
          display: flex;
          width: 100%;
          max-width: 900px;
          max-height: calc(100vh - 40px);
          background: white;
          border-radius: 28px;
          overflow: hidden;
          position: relative;
          z-index: 10;
          box-shadow: 0 32px 100px rgba(5,76,199,0.22), 0 0 0 1px rgba(255,255,255,0.7);
          animation: cardIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes cardIn {
          from { opacity:0; transform:scale(0.92) translateY(24px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }

        /* ── LEFT PANEL: #054CC7 → #17C3CC diagonal ── */
        .lp-left {
          width: 42%;
          background: linear-gradient(150deg, #054CC7 0%, #0a6ed1 40%, #17C3CC 100%);
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          color: white;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .lp-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 22px 22px;
          pointer-events: none;
        }
        .lp-left-decor {
          position: absolute;
          width: 320px; height: 320px;
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 50%;
          bottom: -110px; right: -110px;
          animation: rotateSlow 30s linear infinite;
        }
        .lp-left-decor::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          border: 2px solid rgba(255,255,255,0.05);
          border-radius: 50%;
          top: 60px; left: 60px;
          animation: rotateSlow 20s linear infinite reverse;
        }
        @keyframes rotateSlow { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        .lp-left-accent {
          position: absolute;
          width: 120px; height: 120px;
          background: rgba(255,255,255,0.06);
          border-radius: 50%;
          top: -40px; right: 20px;
          pointer-events: none;
        }
        .lp-logo {
          display: flex; align-items: center; gap: 12px;
          position: relative; z-index: 2; margin-bottom: 28px;
        }
        .lp-slogan { position: relative; z-index: 2; }
        .lp-slogan h1 {
          font-size: 32px; font-weight: 800; line-height: 1.25;
          margin-bottom: 12px;
          animation: slideUp 0.8s ease-out;
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .lp-slogan p {
          font-size: 13px; line-height: 1.7; opacity: 0.88;
          animation: slideUp 0.8s ease-out 0.1s both;
        }
        .lp-illus-wrap {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 2;
          min-height: 0;
        }
        @keyframes floatIllus {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50%      { transform: translateY(-12px) rotate(1deg); }
        }
        .lp-features {
          display: flex; gap: 10px;
          position: relative; z-index: 2;
          animation: slideUp 0.8s ease-out 0.2s both;
          margin-top: 16px;
        }
        .lp-feature {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 12px;
          padding: 12px 14px; flex: 1;
          transition: all 0.3s ease; cursor: default;
        }
        .lp-feature:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .lp-feature-num { font-size: 20px; font-weight: 800; margin-bottom: 3px; }
        .lp-feature-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; opacity: 0.82; }

        /* ── RIGHT PANEL ── */
        .lp-right {
          flex: 1;
          padding: 40px 44px;
          display: flex; flex-direction: column; justify-content: center;
          background: #ffffff;
          position: relative;
          overflow-y: auto; overflow-x: hidden;
        }
        .lp-right::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(23,195,204,0.07) 0%, transparent 70%);
          top: -70px; right: -70px;
          pointer-events: none;
        }
        .lp-right-content { position: relative; z-index: 2; }
        .lp-heading {
          font-size: 26px; font-weight: 800;
          color: #1e293b; margin-bottom: 6px; text-align: center;
        }
        .lp-subheading {
          font-size: 13px; color: #64748b;
          text-align: center; margin-bottom: 28px;
        }

        /* ── FORM FIELDS ── */
        .lp-field-group {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 16px; margin-bottom: 14px;
          transition: all 0.2s ease;
        }
        .lp-field-group:focus-within {
          border-color: #17C3CC;
          box-shadow: 0 0 0 3px rgba(23,195,204,0.12);
          background: white;
        }
        .lp-label {
          display: block; font-size: 10px; font-weight: 700;
          color: #64748b; margin-bottom: 5px;
          text-transform: uppercase; letter-spacing: 0.09em;
        }
        .lp-input {
          width: 100%; border: none; outline: none;
          background: transparent; font-size: 14px;
          font-weight: 500; color: #1e293b;
          font-family: 'Poppins', sans-serif;
        }
        .lp-input::placeholder { color: #cbd5e1; }
        .lp-pw-wrap { position: relative; display: flex; align-items: center; }
        .lp-pw-eye {
          position: absolute; right: 0; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 4px; transition: color 0.2s;
        }
        .lp-pw-eye:hover { color: #054CC7; }
        .lp-role-wrap { position: relative; }
        .lp-role-btn {
          width: 100%; border: none; background: transparent;
          outline: none; display: flex; align-items: center;
          justify-content: space-between; cursor: pointer;
          font-family: 'Poppins', sans-serif;
        }
        .lp-role-dd {
          position: absolute; top: calc(100% + 8px);
          left: 0; right: 0;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          z-index: 60; overflow: hidden;
          animation: dropdownFade 0.2s ease;
        }
        @keyframes dropdownFade {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .lp-role-opt {
          width: 100%; padding: 11px 16px;
          background: none; border: none;
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; font-family: 'Poppins', sans-serif;
          transition: background 0.15s;
        }
        .lp-role-opt:hover { background: #f0fdfa; }

        /* ── EXTRAS ── */
        .lp-extras {
          display: flex; align-items: center;
          justify-content: space-between;
          margin: 6px 0 18px;
        }
        .lp-remember {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: #64748b; cursor: pointer; font-weight: 500;
        }
        .lp-remember input { accent-color: #054CC7; width: 15px; height: 15px; cursor: pointer; }
        .lp-forgot {
          font-size: 13px; color: #054CC7;
          font-weight: 600; text-decoration: none; transition: color 0.2s;
        }
        .lp-forgot:hover { color: #0a3a8a; text-decoration: underline; }

        /* ── SUBMIT BUTTON with ripple ── */
        .lp-submit {
          width: 100%; padding: 15px;
          background: linear-gradient(135deg, #054CC7 0%, #17C3CC 100%);
          color: white; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          box-shadow: 0 6px 20px rgba(5,76,199,0.28);
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          position: relative; overflow: hidden;
        }
        .lp-submit::after {
          content: '';
          position: absolute; top: 50%; left: 50%;
          width: 0; height: 0;
          background: rgba(255,255,255,0.25);
          border-radius: 50%;
          transform: translate(-50%,-50%);
          transition: width 0.5s ease, height 0.5s ease;
        }
        .lp-submit:hover:not(:disabled)::after { width: 360px; height: 360px; }
        .lp-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(5,76,199,0.38);
        }
        .lp-submit:active:not(:disabled) { transform: translateY(0); }
        .lp-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── SWITCH ── */
        .lp-switch { text-align: center; font-size: 13.5px; color: #64748b; margin-top: 20px; }
        .lp-switch-lnk {
          font-weight: 700; cursor: pointer; margin-left: 4px;
          transition: color 0.2s;
          background: linear-gradient(135deg, #054CC7, #17C3CC);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-switch-lnk:hover { text-decoration: underline; }

        /* ── ERROR ── */
        .lp-error {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 11px 16px;
          color: #dc2626; font-size: 13px;
          margin-bottom: 14px; font-weight: 500;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%,100%{transform:translateX(0);}
          25%{transform:translateX(-5px);}
          75%{transform:translateX(5px);}
        }

        /* ── HARD RESET ── */
        .lp-hard-reset {
          background: none; border: none;
          color: #94a3b8; font-size: 12px;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 18px; transition: color 0.2s;
        }
        .lp-hard-reset:hover { color: #dc2626; }

        /* ── RESPONSIVE ── */

        /* Tablet → stacked */
        @media (max-width: 820px) {
          .lp-card {
            flex-direction: column;
            max-width: 420px;
            width: calc(100% - 32px);
            border-radius: 24px;
            /* fit content, no forced height */
            max-height: calc(100vh - 40px);
            overflow-y: auto;
          }
          .lp-left {
            width: 100%;
            padding: 18px 22px;
            flex-direction: row;
            align-items: center;
            gap: 14px;
            flex-shrink: 0;
          }
          .lp-left-decor, .lp-left-accent { display: none; }
          .lp-logo { margin-bottom: 0; flex-shrink: 0; }
          .lp-slogan, .lp-illus-wrap, .lp-features { display: none; }
          .lp-right {
            padding: 24px 26px 28px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .lp-heading { font-size: 22px; margin-bottom: 4px; }
          .lp-subheading { margin-bottom: 20px; }
          .lp-field-group { margin-bottom: 12px; }
        }

        /* Mobile (<480px) — compact card, no full-height stretch */
        @media (max-width: 480px) {
          .lp-root {
            align-items: center;   /* keep centered */
            padding: 16px;
          }
          .lp-card {
            max-width: 100%;
            width: 100%;
            border-radius: 20px;
            /* CRITICAL: do NOT force min-height — let content dictate */
            max-height: calc(100vh - 32px);
            overflow-y: auto;
          }
          .lp-left {
            padding: 14px 18px;
            border-radius: 20px 20px 0 0;
          }
          .lp-right {
            padding: 20px 18px 24px;
          }
          .lp-heading { font-size: 20px; }
          .lp-subheading { font-size: 12px; margin-bottom: 16px; }
          .lp-field-group {
            padding: 10px 13px;
            margin-bottom: 10px;
            border-radius: 10px;
          }
          .lp-label { font-size: 9px; margin-bottom: 3px; }
          .lp-input { font-size: 13px; }
          .lp-submit { padding: 13px; font-size: 14px; border-radius: 10px; }
          .lp-extras { margin: 4px 0 13px; }
          .lp-remember, .lp-forgot { font-size: 12px; }
          .lp-switch { font-size: 12px; margin-top: 14px; }
          .lp-hard-reset { font-size: 11px; margin-top: 12px; }
          .lp-error { font-size: 12px; padding: 9px 13px; margin-bottom: 12px; }
        }

        /* Very small (≤360px) */
        @media (max-width: 360px) {
          .lp-root { padding: 10px; }
          .lp-card { border-radius: 16px; }
          .lp-left { padding: 12px 14px; }
          .lp-right { padding: 16px 14px 20px; }
          .lp-heading { font-size: 18px; }
          .lp-field-group { padding: 9px 11px; }
        }
      `}</style>

      <div className="lp-root">
        {/* Animated blobs */}
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />

        {/* Rising particles */}
        <div className="lp-particles">
          {[...Array(10)].map((_, i) => <div key={i} className="lp-particle" />)}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="lp-loading-overlay">
            <div className="lp-loading-content">
              <div className="lp-loader-anim" />
              <div className="lp-loading-text">Mohon Tunggu<span className="lp-loading-dots" /></div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '8px' }}>
                Sedang memproses data Anda
              </div>
            </div>
          </div>
        )}

        <div className="lp-card">
          {/* Left Panel */}
          <div className="lp-left">
            <div className="lp-left-decor" />
            <div className="lp-left-accent" />

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
              <h1>Sistem Enterprise<br />Terintegrasi</h1>
              <p>Kelola seluruh operasional bisnis perusahaan secara efisien dengan sistem ERP modern.</p>
            </div>

            <div className="lp-illus-wrap">
              <Image
                src="/humans1.png"
                alt="Artavista Illustration"
                width={300}
                height={300}
                style={{ objectFit: 'contain', animation: 'floatIllus 4s ease-in-out infinite', maxWidth: '100%', maxHeight: '100%' }}
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
                    <button type="button" className="lp-pw-eye" onClick={() => setShowPassword(!showPassword)}>
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
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                      Ingat saya
                    </label>
                    <a href="#" className="lp-forgot">Lupa password?</a>
                  </div>
                ) : (
                  <div className="lp-extras">
                    <label className="lp-remember">
                      <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                      Saya setuju dengan Syarat &amp; Ketentuan
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
