import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType } from '../types';
import { api, apiPost, ApiError } from '../lib/api';

interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  mobile_no?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api<{ user: User }>('/api/auth/me');
      if (response.ok && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Not authenticated
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiPost<{ user: User }>('/api/auth/login', {
        username: email,
        password
      });
      
      if (response.ok && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    apiPost('/api/auth/logout').finally(() => {
      setUser(null);
      setIsAuthenticated(false);
    });
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};