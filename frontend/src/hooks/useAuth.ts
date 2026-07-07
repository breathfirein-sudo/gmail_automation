import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearTokens } from '../lib/auth';
import type { JWTPayload } from '../lib/auth';

export function useAuth() {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const logout = () => {
    clearTokens();
    setUser(null);
    navigate('/login');
  };

  return { user, loading, logout };
}
