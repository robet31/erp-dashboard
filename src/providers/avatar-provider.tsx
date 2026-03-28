'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AVATAR_KEY = 'erp_profile_avatar';

interface AvatarContextType {
  avatarUrl: string | null;
  setAvatar: (url: string | null) => void;
  removeAvatar: () => void;
}

const AvatarContext = createContext<AvatarContextType>({
  avatarUrl: null,
  setAvatar: () => {},
  removeAvatar: () => {},
});

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AVATAR_KEY);
      if (saved) setAvatarUrl(saved);
    } catch {}
  }, []);

  const setAvatar = useCallback((url: string | null) => {
    setAvatarUrl(url);
    try {
      if (url) localStorage.setItem(AVATAR_KEY, url);
      else localStorage.removeItem(AVATAR_KEY);
    } catch {}
  }, []);

  const removeAvatar = useCallback(() => {
    setAvatarUrl(null);
    try { localStorage.removeItem(AVATAR_KEY); } catch {}
  }, []);

  return (
    <AvatarContext.Provider value={{ avatarUrl, setAvatar, removeAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  return useContext(AvatarContext);
}
