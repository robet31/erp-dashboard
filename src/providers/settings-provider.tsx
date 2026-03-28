'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppLanguage = 'id' | 'en';
export type FontSize = 'sm' | 'md' | 'lg';

export interface AppSettings {
  language: AppLanguage;
  darkMode: boolean;
  compactMode: boolean;
  fontSize: FontSize;
  notifications: boolean;
  emailNotifications: boolean;
  soundNotifications: boolean;
  autoLogout: string;
  twoFactor: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'id',
  darkMode: false,
  compactMode: false,
  fontSize: 'md',
  notifications: true,
  emailNotifications: true,
  soundNotifications: false,
  autoLogout: '30',
  twoFactor: false,
};

const SETTINGS_KEY = 'erp_user_settings';

// ─── Translations ─────────────────────────────────────────────────────────────
export const TRANSLATIONS = {
  id: {
    dashboard: 'Dashboard',
    selling: 'Penjualan',
    inventory: 'Inventaris',
    manufacturing: 'Produksi',
    users: 'Pengguna',
    profile: 'Profil Saya',
    settings: 'Pengaturan',
    logout: 'Keluar',
    search: 'Cari menu atau data...',
    notifications: 'Notifikasi',
    markAllRead: 'Tandai semua',
    unreadCount: (n: number) => `${n} belum dibaca`,
    home: 'Beranda',
    analytics: 'Analitik',
    data: 'Data',
    // Settings page
    appearance: 'Tampilan',
    notifSection: 'Notifikasi',
    security: 'Keamanan',
    accountInfo: 'Info Akun',
    darkMode: 'Mode Gelap',
    darkModeDesc: 'Aktifkan tema gelap untuk mengurangi ketegangan mata',
    compactMode: 'Mode Kompak',
    compactModeDesc: 'Tampilkan lebih banyak data dengan spacing lebih kecil',
    language: 'Bahasa Antarmuka',
    languageDesc: 'Pilih bahasa yang digunakan di sistem',
    fontSize: 'Ukuran Font',
    fontSizeDesc: 'Sesuaikan ukuran teks antarmuka',
    saveSettings: 'Simpan Pengaturan',
    settingsSaved: 'Pengaturan berhasil disimpan!',
    // Profile
    myProfile: 'Profil Saya',
    profileSubtitle: 'Kelola informasi profil dan akun Anda',
    fullName: 'Nama Lengkap',
    email: 'Email',
    role: 'Role / Jabatan',
    editProfile: 'Edit',
    saveChanges: 'Simpan Perubahan',
    cancel: 'Batal',
    profileUpdated: 'Profil berhasil diperbarui!',
    saveFailed: 'Gagal menyimpan. Coba lagi.',
    // Font size labels
    fontSm: 'Kecil (13px)',
    fontMd: 'Normal (14px)',
    fontLg: 'Besar (16px)',
    // Language options
    langId: '🇮🇩 Bahasa Indonesia',
    langEn: '🇺🇸 English',
    // Notification settings
    pushNotif: 'Notifikasi Push',
    pushNotifDesc: 'Terima pemberitahuan langsung di browser',
    emailNotif: 'Notifikasi Email',
    emailNotifDesc: 'Laporan dan alert dikirim ke email Anda',
    soundNotif: 'Suara Notifikasi',
    soundNotifDesc: 'Putar suara saat notifikasi masuk',
    mobileNotif: 'Notifikasi Mobile',
    mobileNotifDesc: 'Aktifkan untuk perangkat mobile (PWA)',
    comingSoon: 'Segera Hadir',
    // Security
    changePassword: 'Ganti Password',
    currentPassword: 'Password Saat Ini',
    newPassword: 'Password Baru',
    confirmPassword: 'Konfirmasi Password Baru',
    savePassword: '🔒 Simpan Password Baru',
    passwordSaved: 'Password berhasil diperbarui!',
    passwordMismatch: 'Password baru tidak cocok.',
    passwordError: 'Isi semua field (min. 6 karakter).',
    twoFactor: 'Two-Factor Authentication',
    twoFactorDesc: 'Verifikasi 2 langkah via Google Authenticator',
    autoLogout: 'Auto Logout',
    autoLogoutDesc: 'Logout otomatis setelah tidak aktif',
    // Data Management
    dataManagement: 'Manajemen Data',
    dataManagementDesc: 'Reset atau kelola data lokal aplikasi.',
    resetSession: 'Reset Data Sesi',
    resetSettings: 'Reset Pengaturan',
    // Account
    lastLogin: 'Login Terakhir',
    joinDate: 'Bergabung',
    accountStatus: 'Status Akun',
    accountActive: '● Akun Aktif',
    accessModule: 'Modul Akses',
    // Search
    searchResults: 'Hasil Pencarian',
    searchNoResult: 'Tidak ada hasil untuk',
    searchHint: 'Coba cari: selling, stok, produksi, user...',
    goTo: 'Pergi ke',
    // Breadcrumb routes
    bcDashboard: 'Dashboard',
    bcSelling: 'Penjualan',
    bcInventory: 'Inventaris',
    bcManufacturing: 'Produksi',
    bcHome: 'Beranda',
    bcAnalytics: 'Analitik',
    bcData: 'Data',
    bcProfile: 'Profil',
    bcSettings: 'Pengaturan',
    bcUsers: 'Pengguna',
  },
  en: {
    dashboard: 'Dashboard',
    selling: 'Selling',
    inventory: 'Inventory',
    manufacturing: 'Manufacturing',
    users: 'Users',
    profile: 'My Profile',
    settings: 'Settings',
    logout: 'Logout',
    search: 'Search menu or data...',
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    unreadCount: (n: number) => `${n} unread`,
    home: 'Home',
    analytics: 'Analytics',
    data: 'Data',
    // Settings page
    appearance: 'Appearance',
    notifSection: 'Notifications',
    security: 'Security',
    accountInfo: 'Account Info',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Enable dark theme to reduce eye strain',
    compactMode: 'Compact Mode',
    compactModeDesc: 'Show more data with smaller spacing',
    language: 'Interface Language',
    languageDesc: 'Choose the language used in the system',
    fontSize: 'Font Size',
    fontSizeDesc: 'Adjust the interface text size',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved successfully!',
    // Profile
    myProfile: 'My Profile',
    profileSubtitle: 'Manage your profile and account information',
    fullName: 'Full Name',
    email: 'Email',
    role: 'Role / Position',
    editProfile: 'Edit',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    profileUpdated: 'Profile updated successfully!',
    saveFailed: 'Failed to save. Please try again.',
    // Font size labels
    fontSm: 'Small (13px)',
    fontMd: 'Normal (14px)',
    fontLg: 'Large (16px)',
    // Language options
    langId: '🇮🇩 Bahasa Indonesia',
    langEn: '🇺🇸 English',
    // Notification settings
    pushNotif: 'Push Notifications',
    pushNotifDesc: 'Receive notifications directly in browser',
    emailNotif: 'Email Notifications',
    emailNotifDesc: 'Reports and alerts sent to your email',
    soundNotif: 'Sound Notifications',
    soundNotifDesc: 'Play sound when notifications arrive',
    mobileNotif: 'Mobile Notifications',
    mobileNotifDesc: 'Enable for mobile devices (PWA)',
    comingSoon: 'Coming Soon',
    // Security
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    savePassword: '🔒 Save New Password',
    passwordSaved: 'Password updated successfully!',
    passwordMismatch: 'New passwords do not match.',
    passwordError: 'Fill all fields (min. 6 characters).',
    twoFactor: 'Two-Factor Authentication',
    twoFactorDesc: 'Two-step verification via Google Authenticator',
    autoLogout: 'Auto Logout',
    autoLogoutDesc: 'Automatically logout after inactivity',
    // Data Management
    dataManagement: 'Data Management',
    dataManagementDesc: 'Reset or manage local application data.',
    resetSession: 'Reset Session Data',
    resetSettings: 'Reset Settings',
    // Account
    lastLogin: 'Last Login',
    joinDate: 'Joined',
    accountStatus: 'Account Status',
    accountActive: '● Account Active',
    accessModule: 'Module Access',
    // Search
    searchResults: 'Search Results',
    searchNoResult: 'No results for',
    searchHint: 'Try searching: selling, stock, production, users...',
    goTo: 'Go to',
    // Breadcrumb routes
    bcDashboard: 'Dashboard',
    bcSelling: 'Selling',
    bcInventory: 'Inventory',
    bcManufacturing: 'Manufacturing',
    bcHome: 'Home',
    bcAnalytics: 'Analytics',
    bcData: 'Data',
    bcProfile: 'Profile',
    bcSettings: 'Settings',
    bcUsers: 'Users',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS['id'];

interface SettingsContextType {
  /** Applied settings — these are what the whole app uses */
  settings: AppSettings;
  /** Draft / pending settings — only changed in settings page before Save */
  draft: AppSettings;
  /** Update draft only (no visual change to the rest of the app yet) */
  updateDraft: (updates: Partial<AppSettings>) => void;
  /** Apply draft → settings, persist to localStorage, apply CSS */
  saveSettings: () => void;
  /** Translation helper based on APPLIED language */
  t: typeof TRANSLATIONS[AppLanguage];
}

const SettingsContext = createContext<SettingsContextType | null>(null);

/** Apply CSS variables and body classes from a settings object */
function applySettingsToDOM(s: AppSettings) {
  const root = document.documentElement;

  // ── Font size: apply to <html> so rem units cascade everywhere ──
  const fontMap: Record<FontSize, string> = { sm: '13px', md: '14px', lg: '16px' };
  const fs = fontMap[s.fontSize];
  root.style.fontSize = fs;
  root.style.setProperty('--app-font-size', fs);

  // ── Dark mode ──
  if (s.darkMode) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    // CSS custom properties for manual usage
    root.style.setProperty('--bg-main',      '#09111f');
    root.style.setProperty('--bg-card',      '#0f1c2e');
    root.style.setProperty('--bg-sidebar',   '#07101e');
    root.style.setProperty('--bg-hover',     '#182336');
    root.style.setProperty('--text-primary', '#e8f0fe');
    root.style.setProperty('--text-secondary','#8fa8c8');
    root.style.setProperty('--border-color', '#1e3050');
    root.style.setProperty('--input-bg',     '#0d1829');
    root.style.setProperty('--topbar-bg',    '#07101e');
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    root.style.setProperty('--bg-main',      '#f4f6fb');
    root.style.setProperty('--bg-card',      '#ffffff');
    root.style.setProperty('--bg-sidebar',   '#ffffff');
    root.style.setProperty('--bg-hover',     '#f1f5f9');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-secondary','#64748b');
    root.style.setProperty('--border-color', '#e2e8f0');
    root.style.setProperty('--input-bg',     '#f8fafc');
    root.style.setProperty('--topbar-bg',    '#ffffff');
  }

  // ── Compact mode ──
  if (s.compactMode) {
    document.body.classList.add('compact-mode');
    root.style.setProperty('--spacing-md',   '10px');
    root.style.setProperty('--spacing-lg',   '14px');
    root.style.setProperty('--card-padding', '10px');
  } else {
    document.body.classList.remove('compact-mode');
    root.style.setProperty('--spacing-md',   '16px');
    root.style.setProperty('--spacing-lg',   '24px');
    root.style.setProperty('--card-padding', '20px');
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft]       = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load saved settings on mount and immediately apply
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        setSettings(parsed);
        setDraft(parsed);
        applySettingsToDOM(parsed);
      } else {
        applySettingsToDOM(DEFAULT_SETTINGS);
      }
    } catch {
      applySettingsToDOM(DEFAULT_SETTINGS);
    }
  }, []);

  /** Only mutates the draft — no DOM changes until saveSettings() */
  const updateDraft = useCallback((updates: Partial<AppSettings>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  /** Copy draft → applied settings, run DOM update, persist */
  const saveSettings = useCallback(() => {
    setDraft(currentDraft => {
      setSettings(currentDraft);
      applySettingsToDOM(currentDraft);
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentDraft)); } catch {}
      return currentDraft;
    });
  }, []);

  const t = TRANSLATIONS[settings.language];

  return (
    <SettingsContext.Provider value={{ settings, draft, updateDraft, saveSettings, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
