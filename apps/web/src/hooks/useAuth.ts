'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearTokens } from '@/lib/auth';
import type { JWTPayload } from '@payment/shared';

export function useAuth() {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    setLoading(false);

    if (!currentUser) {
      router.push('/login');
    }
  }, [router]);

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout };
}
