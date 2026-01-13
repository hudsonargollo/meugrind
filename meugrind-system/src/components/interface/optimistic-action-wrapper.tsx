'use client';

import React, { ReactNode, useState } from 'react';
import { useOptimisticUpdates } from '../../hooks/use-optimistic-updates';

interface OptimisticActionWrapperProps {
  children: ReactNode;
  entityType: string;
  entityId: string;
  actionType: 'create' | 'update' | 'delete';
  onAction: () => Promise<void>;
  optimisticData?: any;
  className?: string;
  disabled?: boolean;
}

export function OptimisticActionWrapper({
  children,
  entityType,
  entityId,
  actionType,
  onAction,
  optimisticData,
  className = '',
  disabled = false,
}: OptimisticActionWrapperProps) {
  const { addOptimisticAction, updateActionStatus, isActionPending } = useOptimisticUpdates();
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const isPending = isActionPending(entityType, entityId);
  const isLoading = isLocalLoading || isPending;

  const handleAction = async () => {
    if (disabled || isLoading) return;

    setIsLocalLoading(true);
    
    // Add optimistic action
    const actionId = addOptimisticAction({
      type: actionType,
      entityType,
      entityId,
      optimisticData,
    });

    try {
      // Execute the actual action
      await onAction();
      
      // Mark as successful
      updateActionStatus(actionId, 'success');
    } catch (error) {
      // Mark as failed
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      updateActionStatus(actionId, 'error', errorMessage);
    } finally {
      setIsLocalLoading(false);
    }
  };

  return (
    <div 
      className={`optimistic-action-wrapper relative ${className} ${
        isLoading ? 'pointer-events-none' : ''
      }`}
      onClick={handleAction}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-md flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Success feedback */}
      {!isLoading && (
        <div className={`transition-all duration-200 ${
          isLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
}

// Higher-order component for optimistic buttons
interface OptimisticButtonProps {
  children: ReactNode;
  onClick: () => Promise<void>;
  entityType: string;
  entityId: string;
  actionType: 'create' | 'update' | 'delete';
  optimisticData?: any;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function OptimisticButton({
  children,
  onClick,
  entityType,
  entityId,
  actionType,
  optimisticData,
  className = '',
  disabled = false,
  variant = 'primary',
}: OptimisticButtonProps) {
  const { addOptimisticAction, updateActionStatus, isActionPending } = useOptimisticUpdates();
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const isPending = isActionPending(entityType, entityId);
  const isLoading = isLocalLoading || isPending;

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLocalLoading(true);
    
    const actionId = addOptimisticAction({
      type: actionType,
      entityType,
      entityId,
      optimisticData,
    });

    try {
      await onClick();
      updateActionStatus(actionId, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      updateActionStatus(actionId, 'error', errorMessage);
    } finally {
      setIsLocalLoading(false);
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 relative';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400`;
      case 'secondary':
        return `${baseClasses} bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400`;
      default:
        return baseClasses;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${getVariantClasses()} ${className} ${
        isLoading ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Toast notification component for action feedback
interface ActionToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function ActionToast({ 
  message, 
  type, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}: ActionToastProps) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm
      ${getTypeClasses()}
      animate-in slide-in-from-right duration-300
    `}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{getIcon()}</span>
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-current hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}