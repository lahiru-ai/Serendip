import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role } from '../types';
import { api } from '../services/api';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  role: Role | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication state and login/logout actions across the app.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('serendip_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.id && (parsed as any).userId) {
          parsed.id = (parsed as any).userId;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('serendip_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('serendip_user');
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const resp = await api.login(email, pass);
      const authUser: AuthUser = {
        id: resp.userId,
        email: resp.email,
        fullName: resp.fullName,
        role: resp.role,
      };
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user ? user.role : null,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
