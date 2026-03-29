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

  // Restore session from localStorage (no version invalidation that causes logout on refresh)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('erp_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Validate minimal structure before restoring
        if (parsed && parsed.role && parsed.email) {
          setUser(parsed);
        }
      }
    } catch {
      // Corrupt data — clear it
      localStorage.removeItem('erp_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (role: UserRole, _email?: string, _password?: string) => {
    setIsLoading(true);
    
    let authUser: AuthUser | null = null;
    let finalRole = role;
    const roleConfig = getRoleConfig(role);

    if (_email && _password) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: _email, password: _password }),
        });
        
        if (response.ok) {
          const data = await response.json();
          finalRole = data.role as UserRole || role;
          
          authUser = {
            name: data.full_name || roleConfig.label,
            email: data.email || _email,
            full_name: data.full_name || roleConfig.label,
            role: finalRole,
            frappeUser: data.source === 'frappe' ? (data.full_name || _email) : undefined
          };

          const cookies = response.headers.get('set-cookie');
          if (cookies) {
            const sidMatch = cookies.match(/sid=([^;]+)/);
            if (sidMatch) {
              localStorage.setItem('frappe_sid', sidMatch[1]);
            }
          }
        } else {
          setIsLoading(false);
          throw new Error('Login failed');
        }
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    } else {
      authUser = {
        name: roleConfig.label,
        email: _email || '',
        full_name: roleConfig.label,
        role: finalRole,
      };
    }

    if (authUser) {
      setUser(authUser);
      localStorage.setItem('erp_user', JSON.stringify(authUser));
    }
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
