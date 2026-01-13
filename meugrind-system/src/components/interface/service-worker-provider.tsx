'use client';

import { useEffect, useState } from 'react';
import { serviceWorkerManager, ServiceWorkerStatus } from '../../lib/service-worker';
import { connectivityService, ConnectivityInfo } from '../../lib/connectivity-service';
import { pwaInstallationManager } from '../../lib/pwa-installation-manager';
import { PWAInstallPrompt } from './pwa-install-prompt';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus | null>(null);
  const [connectivity, setConnectivity] = useState<ConnectivityInfo | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Initialize service worker status
    serviceWorkerManager.getStatus().then(setSwStatus);

    // Initialize connectivity status
    const unsubscribe = connectivityService.addListener(setConnectivity);

    // Initialize PWA installation manager
    const installStatus = pwaInstallationManager.getInstallationStatus();
    if (installStatus.canInstall && !installStatus.isInstalled) {
      // Show installation onboarding after a delay
      setTimeout(() => {
        pwaInstallationManager.showInstallationOnboarding();
      }, 30000); // Show after 30 seconds
    }

    // Listen for service worker updates
    const handleServiceWorkerUpdate = (event: CustomEvent) => {
      setShowUpdatePrompt(true);
    };

    // Listen for background sync success
    const handleBackgroundSyncSuccess = (event: CustomEvent) => {
      console.log('Background sync completed successfully:', event.detail);
      // Show a subtle notification
      showSyncNotification('Changes synced successfully', 'success');
    };

    // Listen for background sync failure
    const handleBackgroundSyncFailure = (event: CustomEvent) => {
      console.log('Background sync failed:', event.detail);
      showSyncNotification('Some changes failed to sync', 'error');
    };

    // Listen for connectivity changes
    const handleConnectivityChange = (event: CustomEvent) => {
      const info = event.detail as ConnectivityInfo;
      setConnectivity(info);
      
      // Show connectivity status to user
      if (info.status === 'offline') {
        console.log('App is now offline - working in offline mode');
        showSyncNotification('Working offline - changes will sync when connected', 'info');
      } else if (info.status === 'limited') {
        console.log('Limited connectivity detected - sync may be slower');
        showSyncNotification('Limited connectivity - sync may be slower', 'warning');
      } else {
        console.log('Good connectivity - sync enabled');
        showSyncNotification('Connection restored - syncing changes', 'success');
      }
    };

    // Listen for PWA installation events
    const handleInstallAvailable = () => {
      setShowInstallPrompt(true);
    };

    const handleInstallCompleted = () => {
      setShowInstallPrompt(false);
      showSyncNotification('MEUGRIND installed successfully!', 'success');
    };

    window.addEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate as EventListener);
    window.addEventListener('backgroundSyncSuccess', handleBackgroundSyncSuccess as EventListener);
    window.addEventListener('backgroundSyncFailure', handleBackgroundSyncFailure as EventListener);
    window.addEventListener('connectivityChange', handleConnectivityChange as EventListener);

    pwaInstallationManager.on('install-available', handleInstallAvailable);
    pwaInstallationManager.on('install-completed', handleInstallCompleted);

    return () => {
      unsubscribe();
      window.removeEventListener('serviceWorkerUpdate', handleServiceWorkerUpdate as EventListener);
      window.removeEventListener('backgroundSyncSuccess', handleBackgroundSyncSuccess as EventListener);
      window.removeEventListener('backgroundSyncFailure', handleBackgroundSyncFailure as EventListener);
      window.removeEventListener('connectivityChange', handleConnectivityChange as EventListener);
      
      pwaInstallationManager.off('install-available', handleInstallAvailable);
      pwaInstallationManager.off('install-completed', handleInstallCompleted);
    };
  }, []);

  const handleUpdateApp = async () => {
    await serviceWorkerManager.updateServiceWorker();
    setShowUpdatePrompt(false);
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  const showSyncNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 text-white text-sm max-w-sm transition-all duration-300 ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' :
      type === 'warning' ? 'bg-yellow-600' :
      'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  // Track user interactions for PWA installation scoring
  const handleUserInteraction = () => {
    pwaInstallationManager.trackInteraction();
  };

  useEffect(() => {
    // Add interaction listeners
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  return (
    <>
      {children}
      
      {/* Service Worker Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">App Update Available</p>
              <p className="text-sm opacity-90">A new version is ready to install</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={dismissUpdate}
                className="px-3 py-1 text-sm bg-blue-700 rounded hover:bg-blue-800"
              >
                Later
              </button>
              <button
                onClick={handleUpdateApp}
                className="px-3 py-1 text-sm bg-white text-blue-600 rounded hover:bg-gray-100"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Installation Prompt */}
      <PWAInstallPrompt 
        onInstall={() => setShowInstallPrompt(false)}
        onDismiss={() => setShowInstallPrompt(false)}
      />

      {/* Connectivity Status Indicator */}
      {connectivity && connectivity.status !== 'online' && (
        <div className={`fixed top-0 left-0 right-0 p-2 text-center text-sm z-40 ${
          connectivity.status === 'offline' 
            ? 'bg-red-600 text-white' 
            : 'bg-yellow-600 text-white'
        }`}>
          {connectivity.status === 'offline' 
            ? '📱 Working offline - changes will sync when connected'
            : '🐌 Limited connectivity - sync may be slower'
          }
          {connectivity.effectiveType && (
            <span className="ml-2 opacity-75">
              ({connectivity.effectiveType.toUpperCase()})
            </span>
          )}
        </div>
      )}
    </>
  );
}