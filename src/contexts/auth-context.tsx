
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
        // Optionally check/create user document in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // This might happen if user was created but doc creation failed,
          // or for users who existed before Firestore user docs were implemented.
          // For new sign-ups, this doc is usually created during the signup process.
          try {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            }, { merge: true });
          } catch (error) {
            console.error("Error creating user document on auth state change:", error);
          }
        } else {
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
