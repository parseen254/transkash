
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
  theme: ThemePreference; // This is the "desired" theme (light, dark, system)
  setTheme: (theme: ThemePreference) => void;
  resolvedTheme?: "dark" | "light"; // This is the actual theme applied (light or dark)
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

  // _theme is the internal React state for the desired theme (light, dark, or system)
  const [_theme, _setInternalTheme] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    return (localStorage.getItem(storageKey) as ThemePreference) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
     if (typeof window === 'undefined') return 'light'; 
     if (_theme === 'system') {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
     }
     return _theme;
  });

  // Updates local React state and localStorage. Called by Firestore sync or publicSetTheme.
  const setThemeFromSource = useCallback((newTheme: ThemePreference) => {
    _setInternalTheme(currentInternalTheme => {
      if (currentInternalTheme !== newTheme) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, newTheme);
        }
        return newTheme;
      }
      return currentInternalTheme; // No change needed
    });
  }, [storageKey]);

  // Firestore synchronization effect
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (user && db) {
      const userDocRef = doc(db, "users", user.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          if (userData.themePreference) {
            // Firestore has a preference. This is the source of truth for syncing.
            // Update local state (_setInternalTheme) and localStorage if they differ.
            setThemeFromSource(userData.themePreference);
          } else {
            // No themePreference field in Firestore.
            // This means AuthProvider/SignupPage should have set one.
            // If it's truly missing (e.g. old user, migration), write the current
            // local theme (from _theme, which was initialized from localStorage/default) to Firestore.
            console.warn(`ThemeProvider: themePreference missing for user ${user.uid}. Writing local/default theme '${_theme}' to Firestore.`);
            setDoc(userDocRef, { themePreference: _theme }, { merge: true })
              .catch(error => console.error("ThemeProvider: Error writing initial local theme to Firestore:", error));
          }
        } else {
          // Document doesn't exist yet. AuthProvider handles its creation, including default theme.
          // The onSnapshot listener will pick up the newly created document in a subsequent event.
          console.log(`ThemeProvider: User document for ${user.uid} does not exist yet. AuthProvider should create it.`);
        }
      }, (error) => {
        console.error("ThemeProvider: Firestore snapshot error:", error);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
    // This effect primarily reacts to `user` to set up/tear down the listener.
    // `setThemeFromSource` is memoized. `_theme` is included because it's used in the "write if missing" logic.
  }, [user, db, setThemeFromSource, _theme]);


  // Effect to apply theme to DOM and determine resolved theme based on _theme
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const currentIsDark = root.classList.contains("dark");
    let newThemeToApply: 'dark' | 'light';

    if (_theme === "system") {
      newThemeToApply = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      newThemeToApply = _theme;
    }
    
    if (resolvedTheme !== newThemeToApply) {
      setResolvedTheme(newThemeToApply);
    }

    if (newThemeToApply === 'dark' && !currentIsDark) {
        root.classList.add("dark");
    } else if (newThemeToApply === 'light' && currentIsDark) {
        root.classList.remove("dark");
    }
    
  }, [_theme, resolvedTheme]); // Re-run if desired theme (_theme) changes

  // Listener for system theme changes (only if current desired theme is "system")
  useEffect(() => {
    if (typeof window === 'undefined' || _theme !== 'system') return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
        const systemIsDark = mediaQuery.matches;
        const newResolved = systemIsDark ? "dark" : "light";
        setResolvedTheme(newResolved); // Update resolved theme
        const root = window.document.documentElement;
        if (systemIsDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [_theme]); // Re-run if desired theme (_theme) changes (e.g., from "dark" to "system")

  // Public setTheme function that updates local state, localStorage, AND Firestore
  const publicSetTheme = useCallback(async (newTheme: ThemePreference) => {
    setThemeFromSource(newTheme); // Update local React state (_setInternalTheme) and localStorage

    if (user && db) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { themePreference: newTheme }, { merge: true });
        console.log(`ThemeProvider: Updated Firestore themePreference to '${newTheme}' for user ${user.uid}`);
      } catch (error) {
        console.error("ThemeProvider: Error updating theme preference in Firestore:", error);
      }
    }
  }, [user, db, setThemeFromSource]);


  const value = {
    theme: _theme, // Expose the "desired" theme
    resolvedTheme, // Expose the "actual applied" theme
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
