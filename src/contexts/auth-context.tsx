
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
        
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            // User exists in Auth, but no Firestore doc. Create it.
            // Typically for first Google Sign-In or if signup process was interrupted.
            const displayName = firebaseUser.displayName || "";
            const email = firebaseUser.email;
            const photoURL = firebaseUser.photoURL;
            const providerId = firebaseUser.providerData.length > 0 ? firebaseUser.providerData[0].providerId : 'unknown';

            const newUserProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: email,
              displayName: displayName,
              firstName: displayName.split(' ')[0] || '',
              lastName: displayName.split(' ').slice(1).join(' ') || '',
              photoURL: photoURL,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              provider: providerId,
              themePreference: 'system', // Default theme on CREATION
            };
            await setDoc(userRef, newUserProfile);
            console.log("AuthProvider: Created new user document with default theme 'system' for UID:", firebaseUser.uid);
          } else {
            // User document exists. Only update lastLoginAt.
            // ThemeProvider will handle theme sync for existing users.
            await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          }
        } catch (error) {
          console.error("AuthProvider: Error handling user document:", error);
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
