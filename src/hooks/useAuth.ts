'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  onAuthStateChanged,
  signInWithGoogle,
  signOut,
} from '@/services/auth';

export function useAuth() {
  const { user, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, [setUser]);

  return {
    user,
    isLoading,
    signIn: signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
