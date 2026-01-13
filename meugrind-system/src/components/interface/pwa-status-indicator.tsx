'use client';

import { usePWACapabilities } from '../../hooks/use-pwa-capabilities';

interface PWAStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function PWAStatusIndicator({ showDetails = false, className = '' }: PWAStatusIndicatorProps) {
  const {
    connectivity,
    syncStatus,
    isOnline,
    isOffline,
    connectionQuality,
    canInstall,
    isInstalled,
    showInstallPrompt
  } = usePWACapabilities();

  const getStatusColor = () => {
    if (isOffline) return 'text-red-500';
    if (connectivity?.status === 'limited') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (isOffline) return '📵';
    if (connectivity?.status === 'limited') return '📶';
    return '📡';
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline';
    if (connectivity?.status === 'limited') return 'Limited';
    return 'Online';
  };

  const handleInstallClick = async () => {
    try {
      await showInstallPrompt();
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        <span className="text-sm">{getStatusIcon()}</span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Sync Status */}
      {syncStatus && (syncStatus.queuedRequests > 0 || syncStatus.failedRequests > 0) && (
        <div className="flex items-center space-x-1">
          <span className="text-sm">
            {syncStatus.failedRequests > 0 ? '⚠️' : '🔄'}
          </span>
          <span className="text-xs text-gray-600">
            {syncStatus.queuedRequests > 0 && `${syncStatus.queuedRequests} pending`}
            {syncStatus.failedRequests > 0 && ` ${syncStatus.failedRequests} failed`}
          </span>
        </div>
      )}

      {/* Install Status */}
      {!isInstalled && canInstall && (
        <button
          onClick={handleInstallClick}
          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
        >
          📱 Install
        </button>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          {connectivity && (
            <div>
              Quality: {connectionQuality}%
              {connectivity.effectiveType && ` (${connectivity.effectiveType.toUpperCase()})`}
            </div>
          )}
          
          {syncStatus?.focusMode?.isActive && (
            <div className="text-purple-600">
              🎯 Focus mode active
            </div>
          )}
          
          {isInstalled && (
            <div className="text-green-600">
              ✅ App installed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for headers/toolbars
 */
export function PWAStatusBadge({ className = '' }: { className?: string }) {
  const { isOnline, isOffline, syncStatus, canInstall, isInstalled } = usePWACapabilities();

  const getBadgeColor = () => {
    if (isOffline) return 'bg-red-100 text-red-800';
    if (syncStatus?.failedRequests > 0) return 'bg-yellow-100 text-yellow-800';
    if (syncStatus?.queuedRequests > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getBadgeText = () => {
    if (isOffline) return 'Offline';
    if (syncStatus?.failedRequests > 0) return 'Sync Issues';
    if (syncStatus?.queuedRequests > 0) return 'Syncing';
    return 'Online';
  };

  const getBadgeIcon = () => {
    if (isOffline) return '📵';
    if (syncStatus?.failedRequests > 0) return '⚠️';
    if (syncStatus?.queuedRequests > 0) return '🔄';
    return '✅';
  };

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor()} ${className}`}>
      <span>{getBadgeIcon()}</span>
      <span>{getBadgeText()}</span>
      {!isInstalled && canInstall && (
        <span className="ml-1 text-blue-600">📱</span>
      )}
    </div>
  );
}