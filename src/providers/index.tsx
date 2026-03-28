'use client';

import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { SettingsProvider } from './settings-provider';
import { AvatarProvider } from './avatar-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SettingsProvider>
        <AvatarProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AvatarProvider>
      </SettingsProvider>
    </QueryProvider>
  );
}
