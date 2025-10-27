
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FurpUser } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: FurpUser | null;
  token: string | null;
  loading: boolean;
  initialLoadComplete: boolean;
  login: (token: string, userData: FurpUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  initialLoadComplete: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FurpUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          // You might want to verify the token with the backend here
          // For this prototype, we'll assume if it exists, it's valid
          // and we'll fetch user data. A real app would need a /users/me endpoint.
          // Since there is no /me, we'll decode it (INSECURE, FOR DEMO ONLY)
          const decodedToken: any = JSON.parse(atob(storedToken.split('.')[1]));
          
          // The API spec doesn't have a /users/me, so we can't reliably get the current user.
          // This is a significant limitation of the API for a real app.
          // As a workaround for the prototype, we'll store user data in local storage too.
          const storedUser = localStorage.getItem('authUser');
          if (storedUser) {
            const userData: FurpUser = JSON.parse(storedUser);
            setUser(userData);
            setToken(storedToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          } else {
            // Token exists but no user, clear state
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
          }
        } catch (error) {
          console.error("Failed to initialize auth state:", error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          setUser(null);
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
      setInitialLoadComplete(true);
    };

    initializeAuth();
  }, []);

  const login = useCallback((newToken: string, userData: FurpUser) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    // Here you might want to call a /auth/logout endpoint if it existed
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, initialLoadComplete, login, logout }}>
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
