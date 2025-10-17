import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  reloadAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://evmarket-api-staging.onrender.com/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://evmarket-api-staging.onrender.com/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
      setUser(data.data.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (token) {
        await fetch('https://evmarket-api-staging.onrender.com/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://evmarket-api-staging.onrender.com/api/v1/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      await AsyncStorage.setItem('accessToken', data.data.accessToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const reloadAuthStatus = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    showLoginPrompt,
    setShowLoginPrompt,
    login,
    register,
    logout,
    refreshToken,
    reloadAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}