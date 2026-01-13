/**
 * React hooks for Supabase authentication
 * 
 * Provides easy-to-use React hooks for authentication state management
 * and user operations in the MEUGRIND system.
 */

import { useState, useEffect, useCallback } from 'react';
import authService, { 
  type AuthState, 
  type MeugrindUser, 
  type SignUpData, 
  type SignInData, 
  type PasswordResetData, 
  type UpdateProfileData 
} from '../lib/supabase-auth-service';

/**
 * Main authentication hook
 * Provides current auth state and loading status
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getCurrentAuthState());

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: authService.isAuthenticated(),
    hasPermission: authService.hasPermission.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    clearError: authService.clearError.bind(authService),
  };
}

/**
 * Hook for user authentication operations
 */
export function useAuthOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(async (data: SignUpData) => {
    setLoading(true);
    setError(null);
    
    const result = await authService.signUp(data);
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Sign up failed');
    }
    
    return result;
  }, []);

  const signIn = useCallback(async (data: SignInData) => {
    setLoading(true);
    setError(null);
    
    const result = await authService.signIn(data);
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Sign in failed');
    }
    
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await authService.signOut();
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Sign out failed');
    }
    
    return result;
  }, []);

  const resetPassword = useCallback(async (data: PasswordResetData) => {
    setLoading(true);
    setError(null);
    
    const result = await authService.resetPassword(data);
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Password reset failed');
    }
    
    return result;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setLoading(true);
    setError(null);
    
    const result = await authService.updatePassword(newPassword);
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Password update failed');
    }
    
    return result;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    loading,
    error,
    clearError,
  };
}

/**
 * Hook for user profile operations
 */
export function useUserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    setLoading(true);
    setError(null);
    
    const result = await authService.updateProfile(data);
    
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Profile update failed');
    }
    
    return result;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    updateProfile,
    loading,
    error,
    clearError,
  };
}

/**
 * Hook for role-based access control
 */
export function usePermissions() {
  const { user, hasPermission, hasRole } = useAuth();

  const canRead = useCallback((resource?: string) => {
    if (!user) return false;
    return hasPermission('read') || hasPermission(`read:${resource}`);
  }, [user, hasPermission]);

  const canWrite = useCallback((resource?: string) => {
    if (!user) return false;
    return hasPermission('write') || hasPermission(`write:${resource}`);
  }, [user, hasPermission]);

  const canDelete = useCallback((resource?: string) => {
    if (!user) return false;
    return hasPermission('delete') || hasPermission(`delete:${resource}`);
  }, [user, hasPermission]);

  const canAdmin = useCallback(() => {
    if (!user) return false;
    return hasPermission('admin') || hasRole('manager');
  }, [user, hasPermission, hasRole]);

  const isManager = useCallback(() => {
    return hasRole('manager');
  }, [hasRole]);

  const isPersonal = useCallback(() => {
    return hasRole('personal');
  }, [hasRole]);

  return {
    user,
    canRead,
    canWrite,
    canDelete,
    canAdmin,
    isManager,
    isPersonal,
    hasPermission,
    hasRole,
  };
}

/**
 * Hook for authentication guards
 */
export function useAuthGuard() {
  const { isAuthenticated, loading, user } = useAuth();

  const requireAuth = useCallback(() => {
    return isAuthenticated && !loading;
  }, [isAuthenticated, loading]);

  const requireRole = useCallback((role: 'manager' | 'personal') => {
    return requireAuth() && user?.role === role;
  }, [requireAuth, user]);

  const requirePermission = useCallback((permission: string) => {
    return requireAuth() && user?.permissions.includes(permission);
  }, [requireAuth, user]);

  return {
    requireAuth,
    requireRole,
    requirePermission,
    isAuthenticated,
    loading,
    user,
  };
}

/**
 * Hook for session management
 */
export function useSession() {
  const { session, loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const refreshSession = useCallback(async () => {
    setRefreshing(true);
    const result = await authService.refreshSession();
    setRefreshing(false);
    return result;
  }, []);

  const isSessionValid = useCallback(() => {
    if (!session) return false;
    
    const now = Date.now() / 1000;
    return session.expires_at ? session.expires_at > now : true;
  }, [session]);

  const getAccessToken = useCallback(() => {
    return session?.access_token || null;
  }, [session]);

  const getRefreshToken = useCallback(() => {
    return session?.refresh_token || null;
  }, [session]);

  return {
    session,
    loading,
    refreshing,
    refreshSession,
    isSessionValid,
    getAccessToken,
    getRefreshToken,
  };
}

/**
 * Hook for authentication status with automatic redirects
 */
export function useAuthRedirect(options: {
  requireAuth?: boolean;
  requireRole?: 'manager' | 'personal';
  redirectTo?: string;
  onUnauthorized?: () => void;
} = {}) {
  const { isAuthenticated, loading, user } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (loading) return;

    const { requireAuth = false, requireRole, onUnauthorized } = options;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      setShouldRedirect(true);
      onUnauthorized?.();
      return;
    }

    // Check role requirement
    if (requireRole && (!user || user.role !== requireRole)) {
      setShouldRedirect(true);
      onUnauthorized?.();
      return;
    }

    setShouldRedirect(false);
  }, [isAuthenticated, loading, user, options]);

  return {
    isAuthenticated,
    loading,
    user,
    shouldRedirect,
    canAccess: !shouldRedirect && !loading,
  };
}