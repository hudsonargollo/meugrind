'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { authService, AuthCredentials, SignUpData } from '../lib/auth-service';
import { configureAmplify } from '../lib/auth-config';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (resource: string, action: 'read' | 'write' | 'delete') => boolean;
  isManager: () => boolean;
  isPersonal: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configure Amplify on mount
    configureAmplify();
    
    // Check for existing session
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const session = await authService.getAuthSession();
      setUser(session.user);
    } catch (error) {
      console.error('Auth state check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (credentials: AuthCredentials) => {
    try {
      setIsLoading(true);
      const user = await authService.signIn(credentials);
      setUser(user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      setIsLoading(true);
      await authService.signUp(data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      await authService.confirmSignUp(email, code);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (resource: string, action: 'read' | 'write' | 'delete'): boolean => {
    return authService.hasPermission(resource, action);
  };

  const isManager = (): boolean => {
    return authService.isManager();
  };

  const isPersonal = (): boolean => {
    return authService.isPersonal();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    hasPermission,
    isManager,
    isPersonal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}