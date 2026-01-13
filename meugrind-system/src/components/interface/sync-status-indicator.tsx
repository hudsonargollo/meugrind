'use client';

import React, { useState, useEffect } from 'react';
import { useInterfaceContext } from '../../hooks/use-interface-context';
import { useOptimisticUpdates } from '../../hooks/use-optimistic-updates';
import { syncManager } from '../../lib/sync-manager';
import { isSupabaseConfigured } from '../../lib/supabase-config';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({ className = '', showDetails = false }: SyncStatusIndicatorProps) {
  const { context, isOnline, isOffline } = useInterfaceContext();
  const { state, getPendingActions, getFailedActions, clearCompleted } = useOptimisticUpdates();
  const [showDropdown, setShowDropdown] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const pendingActions = getPendingActions();
  const failedActions = getFailedActions();
  const hasActivity = pendingActions.length > 0 || failedActions.length > 0;

  // Get sync status from sync manager
  useEffect(() => {
    const updateSyncStatus = async () => {
      try {
        const status = await syncManager.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-hide dropdown when no activity
  useEffect(() => {
    if (!hasActivity && showDropdown) {
      const timer = setTimeout(() => setShowDropdown(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasActivity, showDropdown]);

  const getStatusIcon = () => {
    if (isOffline) return '🔴';
    if (pendingActions.length > 0) return '🟡';
    if (failedActions.length > 0) return '🟠';
    return '🟢';
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline';
    if (!isSupabaseConfigured()) return 'Local Only';
    if (syncStatus?.syncInProgress) return 'Syncing...';
    if (pendingActions.length > 0 || (syncStatus?.pendingOperations > 0)) {
      const total = pendingActions.length + (syncStatus?.pendingOperations || 0);
      return `Syncing (${total})`;
    }
    if (failedActions.length > 0 || (syncStatus?.conflicts > 0)) {
      const total = failedActions.length + (syncStatus?.conflicts || 0);
      return `${total} failed`;
    }
    return isSupabaseConfigured() ? 'Synced' : 'Local';
  };

  const getStatusColor = () => {
    if (isOffline) return 'text-red-600 dark:text-red-400';
    if (!isSupabaseConfigured()) return 'text-blue-600 dark:text-blue-400';
    if (syncStatus?.syncInProgress || pendingActions.length > 0 || (syncStatus?.pendingOperations > 0)) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    if (failedActions.length > 0 || (syncStatus?.conflicts > 0)) {
      return 'text-orange-600 dark:text-orange-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className={`sync-status-indicator relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${hasActivity ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
          ${getStatusColor()}
        `}
        title={`Sync Status: ${getStatusText()}`}
      >
        <span className={pendingActions.length > 0 ? 'animate-pulse' : ''}>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        
        {/* Progress indicator for pending actions */}
        {(pendingActions.length > 0 || syncStatus?.syncInProgress || (syncStatus?.pendingOperations > 0)) && (
          <div className="w-4 h-4 relative">
            <div className="absolute inset-0 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin"></div>
          </div>
        )}
      </button>

      {/* Detailed status dropdown */}
      {(showDropdown || showDetails) && hasActivity && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sync Activity</h3>
              {failedActions.length === 0 && pendingActions.length === 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Pending actions */}
            {pendingActions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  Syncing ({pendingActions.length})
                </h4>
                <div className="space-y-2">
                  {pendingActions.slice(0, 3).map(action => (
                    <SyncActionItem key={action.id} action={action} />
                  ))}
                  {pendingActions.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{pendingActions.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Failed actions */}
            {failedActions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  Failed ({failedActions.length})
                </h4>
                <div className="space-y-2">
                  {failedActions.slice(0, 3).map(action => (
                    <SyncActionItem key={action.id} action={action} />
                  ))}
                  {failedActions.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{failedActions.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connection status */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Connection:</span>
                <span className={`font-medium ${getStatusColor()}`}>
                  {context.connectivity.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">Backend:</span>
                <span className={`font-medium ${isSupabaseConfigured() ? 'text-green-600' : 'text-blue-600'}`}>
                  {isSupabaseConfigured() ? 'Supabase' : 'Local Only'}
                </span>
              </div>
              {syncStatus && (
                <>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">Queue:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {syncStatus.pendingOperations || 0} pending
                    </span>
                  </div>
                  {syncStatus.conflicts > 0 && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-500">Conflicts:</span>
                      <span className="font-medium text-orange-600">
                        {syncStatus.conflicts}
                      </span>
                    </div>
                  )}
                </>
              )}
              {context.batteryLevel !== undefined && (
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">Battery:</span>
                  <span className={`font-medium ${
                    context.batteryLevel < 20 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {context.batteryLevel}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SyncActionItemProps {
  action: any; // OptimisticAction type
}

function SyncActionItem({ action }: SyncActionItemProps) {
  const getActionIcon = () => {
    switch (action.type) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      default: return '📝';
    }
  };

  const getActionDescription = () => {
    const entityName = action.entityType.replace('_', ' ');
    return `${action.type} ${entityName}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
      <span className="text-sm">{getActionIcon()}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {getActionDescription()}
        </div>
        {action.status === 'error' && action.errorMessage && (
          <div className="text-xs text-red-600 dark:text-red-400 truncate">
            {action.errorMessage}
          </div>
        )}
      </div>
      
      {action.status === 'pending' && (
        <div className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      )}
      
      {action.status === 'error' && (
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      )}
    </div>
  );
}