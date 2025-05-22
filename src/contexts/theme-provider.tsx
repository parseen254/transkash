
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
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
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
     if (typeof window === 'undefined') return 'light'; // Default for SSR
     if (theme === 'system') {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
     }
     return theme;
  });


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

  // Listener for system theme changes
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


  const value = {
    theme,
    resolvedTheme,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
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
