'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '../../hooks/use-auth';

interface PermissionGuardProps {
  resource: string;
  action: 'read' | 'write' | 'delete';
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  allowedRoles: ('manager' | 'personal')[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = null 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (!allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ManagerOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ManagerOnly({ children, fallback = null }: ManagerOnlyProps) {
  return (
    <RoleGuard allowedRoles={['manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

interface PersonalOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function PersonalOnly({ children, fallback = null }: PersonalOnlyProps) {
  return (
    <RoleGuard allowedRoles={['personal']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}