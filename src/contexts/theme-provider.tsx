
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { ThemePreference, UserProfile } from '@/lib/types';


interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  resolvedTheme?: "dark" | "light";
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "pesix-ui-theme",
  ...props
}: ThemeProviderProps) {
  const { user } = useAuth();
  const [theme, _setTheme] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    return (localStorage.getItem(storageKey) as ThemePreference) || defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
     if (typeof window === 'undefined') return 'light'; // Default for SSR
     if (theme === 'system') {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
     }
     return theme;
  });

  // Internal theme setter to avoid Firestore write-back loops from snapshot
  const setThemeFromSource = useCallback((newTheme: ThemePreference, updateLocalStorage: boolean = true) => {
    _setTheme(newTheme);
    if (updateLocalStorage && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }
  }, [storageKey]);

  // Effect for Firestore synchronization
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (user && db) {
      const userDocRef = doc(db, "users", user.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          if (userData.themePreference && userData.themePreference !== theme) {
            // Update local theme if Firestore has a different one
            setThemeFromSource(userData.themePreference);
          } else if (!userData.themePreference) {
            // If no theme preference in Firestore, set the current theme (or default) there.
            // This handles initial setup for users who didn't have a preference saved.
            setDoc(userDocRef, { themePreference: theme }, { merge: true })
              .catch(error => console.error("Error setting default theme in Firestore:", error));
          }
        }
      }, (error) => {
        console.error("Error listening to theme preference:", error);
      });
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, theme, setThemeFromSource]);


  // Effect to apply theme to DOM and determine resolved theme
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const currentIsDark = root.classList.contains("dark");
    let newThemeToApply: 'dark' | 'light';

    if (theme === "system") {
      newThemeToApply = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      newThemeToApply = theme;
    }
    
    setResolvedTheme(newThemeToApply);

    if (newThemeToApply === 'dark' && !currentIsDark) {
        root.classList.add("dark");
    } else if (newThemeToApply === 'light' && currentIsDark) {
        root.classList.remove("dark");
    }
    
  }, [theme]);

  // Listener for system theme changes (only if current theme is "system")
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
        const systemIsDark = mediaQuery.matches;
        setResolvedTheme(systemIsDark ? "dark" : "light");
        const root = window.document.documentElement;
        if (systemIsDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Public setTheme function that also updates Firestore
  const publicSetTheme = useCallback(async (newTheme: ThemePreference) => {
    setThemeFromSource(newTheme); // Update local state and localStorage immediately

    if (user && db) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { themePreference: newTheme }, { merge: true });
      } catch (error) {
        console.error("Error updating theme preference in Firestore:", error);
        // Optionally, revert local state or show error to user
      }
    }
  }, [user, setThemeFromSource]);


  const value = {
    theme,
    resolvedTheme,
    setTheme: publicSetTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
