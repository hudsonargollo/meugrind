/**
 * Authentication Provider Component
 * 
 * Provides authentication context and initialization for the entire application.
 * Handles auth state management and provides auth-related UI components.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import type { MeugrindUser } from '../../lib/supabase-auth-service';

interface AuthContextType {
  user: MeugrindUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Authentication Guard Component
 * Protects routes and components that require authentication
 */
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireRole?: 'manager' | 'personal';
  requirePermission?: string;
}

export function AuthGuard({ 
  children, 
  fallback = <AuthRequired />, 
  requireRole,
  requirePermission 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuthContext();

  if (loading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (requireRole && user?.role !== requireRole) {
    return <UnauthorizedAccess requiredRole={requireRole} userRole={user?.role} />;
  }

  // Check permission requirement
  if (requirePermission && !user?.permissions.includes(requirePermission)) {
    return <UnauthorizedAccess requiredPermission={requirePermission} />;
  }

  return <>{children}</>;
}

/**
 * Loading component for authentication state
 */
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading authentication...</p>
      </div>
    </div>
  );
}

/**
 * Component shown when authentication is required
 */
function AuthRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to access the MEUGRIND system
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </button>
          <button
            onClick={() => window.location.href = '/auth/signup'}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component shown when user lacks required permissions
 */
interface UnauthorizedAccessProps {
  requiredRole?: string;
  userRole?: string;
  requiredPermission?: string;
}

function UnauthorizedAccess({ requiredRole, userRole, requiredPermission }: UnauthorizedAccessProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {requiredRole && (
              <>You need {requiredRole} role access. Current role: {userRole || 'none'}</>
            )}
            {requiredPermission && (
              <>You need {requiredPermission} permission to access this resource.</>
            )}
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Role Badge Component
 * Shows the current user's role
 */
export function RoleBadge() {
  const { user } = useAuthContext();

  if (!user) return null;

  const roleColors = {
    manager: 'bg-purple-100 text-purple-800',
    personal: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
    </span>
  );
}

/**
 * User Avatar Component
 */
export function UserAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { user } = useAuthContext();

  if (!user) return null;

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const initials = user.profile.firstName && user.profile.lastName
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`
    : user.email[0].toUpperCase();

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-600 flex items-center justify-center text-white font-medium`}>
      {user.profile.avatar ? (
        <img
          src={user.profile.avatar}
          alt={`${user.profile.firstName} ${user.profile.lastName}`}
          className="rounded-full"
        />
      ) : (
        initials
      )}
    </div>
  );
}

/**
 * User Menu Component
 */
export function UserMenu() {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <UserAvatar />
        <span className="hidden md:block text-gray-700">
          {user.profile.firstName || user.email}
        </span>
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">{user.profile.firstName} {user.profile.lastName}</div>
            <div className="text-gray-500">{user.email}</div>
            <RoleBadge />
          </div>
          <a
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Profile Settings
          </a>
          <a
            href="/preferences"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Preferences
          </a>
          <button
            onClick={() => {
              setIsOpen(false);
              // Sign out logic would go here
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}