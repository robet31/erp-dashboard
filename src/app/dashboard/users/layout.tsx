'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      {children}
    </div>
  );
}