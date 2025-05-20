
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      // Auth state change will be handled by onAuthStateChanged
      // router.push('/dashboard'); // Optional: redirect after sign-in
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      // Handle error (e.g., show toast)
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/'); // Redirect to landing page after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
