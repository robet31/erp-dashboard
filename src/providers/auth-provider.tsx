'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserRole } from '@/config/rbac';
import { hasPermission, hasModuleAccess, getRoleConfig, getDashboardWidgets, type DashboardWidget } from '@/config/rbac';
import type { PermissionKey, ModuleKey } from '@/config/rbac';

interface AuthUser {
  name: string;
  email: string;
  full_name: string;
  role: UserRole;
  frappeUser?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (role: UserRole, email?: string, password?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  can: (permission: PermissionKey) => boolean;
  canAccess: (module: ModuleKey) => boolean;
  switchRole: (role: UserRole) => void;
  getWidgets: () => DashboardWidget[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    const STORAGE_VERSION = 'v2';
    const storedVersion = localStorage.getItem('erp_users_version');
    
    if (savedUser && storedVersion !== STORAGE_VERSION) {
      localStorage.removeItem('erp_user');
      setUser(null);
    } else if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (role: UserRole, _email?: string, _password?: string) => {
    setIsLoading(true);
    
    const roleConfig = getRoleConfig(role);
    
    let authUser: AuthUser;
    let finalRole = role;
    
    // If email provided, check role mapping from user management
    if (_email) {
      const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
      const foundUser = users.find((u: any) => u.email === _email);
      
      if (foundUser && foundUser.role) {
        finalRole = foundUser.role as UserRole;
        authUser = {
          name: foundUser.full_name,
          email: foundUser.email,
          full_name: foundUser.full_name,
          role: finalRole,
        };
      } else {
        authUser = {
          name: roleConfig.label,
          email: _email,
          full_name: roleConfig.label,
          role: finalRole,
        };
      }
    } else {
      authUser = {
        name: roleConfig.label,
        email: _email || '',
        full_name: roleConfig.label,
        role: finalRole,
      };
    }

    // Try to login to Frappe if credentials provided (optional)
    if (_email && _password) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usr: _email, pwd: _password }),
        });
        if (response.ok) {
          const data = await response.json();
          authUser.frappeUser = data.full_name || _email;
          const cookies = response.headers.get('set-cookie');
          if (cookies) {
            const sidMatch = cookies.match(/sid=([^;]+)/);
            if (sidMatch) {
              localStorage.setItem('frappe_sid', sidMatch[1]);
            }
          }
        }
      } catch {
        // Fallback - continue without Frappe auth
      }
    }

    setUser(authUser);
    localStorage.setItem('erp_user', JSON.stringify(authUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('frappe_sid');
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('erp_user', JSON.stringify(updated));
  }, [user]);

  const switchRole = useCallback((role: UserRole) => {
    if (!user) return;
    const roleConfig = getRoleConfig(role);
    const updated: AuthUser = { ...user, role, name: roleConfig.label, email: user.email || roleConfig.label.toLowerCase().replace(' ', '') + '@erp.com', full_name: roleConfig.label };
    setUser(updated);
    localStorage.setItem('erp_user', JSON.stringify(updated));
  }, [user]);

  const can = useCallback((permission: PermissionKey): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const canAccess = useCallback((module: ModuleKey): boolean => {
    if (!user) return false;
    return hasModuleAccess(user.role, module);
  }, [user]);

  const getWidgets = useCallback((): DashboardWidget[] => {
    if (!user) return [];
    return getDashboardWidgets(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      updateUser,
      can,
      canAccess,
      switchRole,
      getWidgets,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
