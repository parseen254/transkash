
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Load user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || userDoc.data()?.displayName,
          photoURL: firebaseUser.photoURL || userDoc.data()?.photoURL,
          emailVerified: firebaseUser.emailVerified,
          createdAt: userDoc.data()?.createdAt || new Date().toISOString(),
        };
        
        setUser(appUser);
        setFirebaseUser(firebaseUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      emailVerified: false,
    });

    // Send email verification
    await sendEmailVerification(userCredential.user);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (firebaseUser) {
      await sendEmailVerification(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signIn,
      signUp,
      signOutUser,
      resetPassword,
      sendVerificationEmail,
    }}>
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
