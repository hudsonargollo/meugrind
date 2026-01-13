'use client';

import { useEffect, useState } from 'react';
import { connectivityService, ConnectivityInfo } from '../../lib/connectivity-service';
import { serviceWorkerManager } from '../../lib/service-worker-manager';

interface OfflinePageProps {
  onRetry?: () => void;
}

export function OfflinePage({ onRetry }: OfflinePageProps) {
  const [connectivity, setConnectivity] = useState<ConnectivityInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Get initial connectivity status
    setConnectivity(connectivityService.getCurrentStatus());

    // Listen for connectivity changes
    const unsubscribe = connectivityService.addListener(setConnectivity);

    // Get sync status
    serviceWorkerManager.getSyncStatus().then(setSyncStatus).catch(console.error);

    return unsubscribe;
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Test connectivity
      const isConnected = await connectivityService.testConnectivity();
      
      if (isConnected) {
        // Trigger sync
        await serviceWorkerManager.forceSync();
        
        // Call parent retry handler
        if (onRetry) {
          onRetry();
        } else {
          // Reload the page
          window.location.reload();
        }
      } else {
        // Still offline, show message
        alert('Still no internet connection. Please check your network and try again.');
      }
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to reconnect. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  const getOfflineMessage = () => {
    if (!connectivity) return 'Checking connection...';
    
    switch (connectivity.status) {
      case 'offline':
        return 'You\'re currently offline';
      case 'limited':
        return 'Limited connectivity detected';
      default:
        return 'Connection restored';
    }
  };

  const getOfflineDescription = () => {
    if (!connectivity) return '';
    
    switch (connectivity.status) {
      case 'offline':
        return 'Don\'t worry! MEUGRIND works offline. Your changes are saved locally and will sync when you\'re back online.';
      case 'limited':
        return 'Your connection is slow or unstable. Some features may be limited, but you can continue working offline.';
      default:
        return 'Your connection has been restored. Syncing your changes now...';
    }
  };

  const getConnectionQuality = () => {
    if (!connectivity) return 0;
    return connectivityService.getQualityScore();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Connection Status Icon */}
        <div className="mb-6">
          {connectivity?.status === 'offline' ? (
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
              </svg>
            </div>
          ) : connectivity?.status === 'limited' ? (
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Status Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getOfflineMessage()}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {getOfflineDescription()}
        </p>

        {/* Connection Quality Indicator */}
        {connectivity && connectivity.status !== 'offline' && (
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Connection Quality</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getConnectionQuality() > 70 ? 'bg-green-500' :
                  getConnectionQuality() > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${getConnectionQuality()}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {getConnectionQuality()}% quality
            </div>
          </div>
        )}

        {/* Sync Status */}
        {syncStatus && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Sync Status</div>
            <div className="space-y-1 text-sm text-gray-600">
              {syncStatus.queuedRequests > 0 && (
                <div>📤 {syncStatus.queuedRequests} changes waiting to sync</div>
              )}
              {syncStatus.queuedNotifications > 0 && (
                <div>🔔 {syncStatus.queuedNotifications} notifications queued</div>
              )}
              {syncStatus.focusMode?.isActive && (
                <div>🎯 Focus mode active - notifications suppressed</div>
              )}
              {syncStatus.queuedRequests === 0 && syncStatus.queuedNotifications === 0 && (
                <div>✅ All changes synced</div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetrying ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking connection...
              </span>
            ) : (
              'Try Again'
            )}
          </button>

          {connectivity?.status === 'offline' && (
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Continue Offline
            </button>
          )}
        </div>

        {/* Offline Features */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Available Offline</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              View & Edit Tasks
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Pomodoro Timer
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Band Setlists
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Content Planning
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Solar Leads
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              PR Events
            </div>
          </div>
        </div>

        {/* Connection Details */}
        {connectivity && connectivity.effectiveType && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <div>Network: {connectivity.effectiveType.toUpperCase()}</div>
            {connectivity.downlink && (
              <div>Speed: {connectivity.downlink} Mbps</div>
            )}
            {connectivity.rtt && (
              <div>Latency: {connectivity.rtt}ms</div>
            )}
            <div>Last checked: {connectivity.lastChecked.toLocaleTimeString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}