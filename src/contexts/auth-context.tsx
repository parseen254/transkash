
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialLoadComplete: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initialLoadComplete: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists() && firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
          // Create profile if Google sign-in and no doc exists
           const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            provider: 'google.com',
          };
          try {
            await setDoc(userRef, newUserProfile);
          } catch (error) {
            console.error("Error creating user document for Google user on auth state change:", error);
          }
        } else if (userSnap.exists()) {
           try {
            await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          } catch (error) {
            console.error("Error updating last login time:", error);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      setInitialLoadComplete(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, initialLoadComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
