/**
 * PWA Capabilities Hook
 * Provides easy access to PWA installation and capabilities
 */

import { useEffect, useState } from 'react';
import { pwaInstallationManager, PWAInstallationStatus, InstallationMetrics } from '../lib/pwa-installation-manager';
import { connectivityService, ConnectivityInfo } from '../lib/connectivity-service';
import { serviceWorkerManager } from '../lib/service-worker-manager';

export interface PWACapabilities {
  // Installation status
  installStatus: PWAInstallationStatus | null;
  metrics: InstallationMetrics | null;
  
  // Connectivity
  connectivity: ConnectivityInfo | null;
  isOnline: boolean;
  isOffline: boolean;
  connectionQuality: number;
  
  // Service worker
  syncStatus: any;
  
  // Actions
  showInstallPrompt: () => Promise<boolean>;
  showInstallInstructions: () => void;
  forceSync: () => Promise<void>;
  testConnectivity: () => Promise<boolean>;
  
  // State
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  needsUpdate: boolean;
}

export function usePWACapabilities(): PWACapabilities {
  const [installStatus, setInstallStatus] = useState<PWAInstallationStatus | null>(null);
  const [metrics, setMetrics] = useState<InstallationMetrics | null>(null);
  const [connectivity, setConnectivity] = useState<ConnectivityInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    // Initialize installation status
    setInstallStatus(pwaInstallationManager.getInstallationStatus());
    setMetrics(pwaInstallationManager.getMetrics());

    // Initialize connectivity
    setConnectivity(connectivityService.getCurrentStatus());
    const unsubscribeConnectivity = connectivityService.addListener(setConnectivity);

    // Initialize sync status
    serviceWorkerManager.getSyncStatus().then(setSyncStatus).catch(console.error);

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setInstallStatus(pwaInstallationManager.getInstallationStatus());
    };

    const handleInstallCompleted = () => {
      setInstallStatus(pwaInstallationManager.getInstallationStatus());
      setMetrics(pwaInstallationManager.getMetrics());
    };

    const handleUpdateAvailable = () => {
      setNeedsUpdate(true);
    };

    const handleSyncStatusChange = (status: any) => {
      setSyncStatus(status);
    };

    // Add event listeners
    pwaInstallationManager.on('install-available', handleInstallAvailable);
    pwaInstallationManager.on('install-completed', handleInstallCompleted);
    
    serviceWorkerManager.on('update-available', handleUpdateAvailable);
    serviceWorkerManager.on('sync-status-change', handleSyncStatusChange);

    // Periodic sync status updates
    const syncInterval = setInterval(async () => {
      try {
        const status = await serviceWorkerManager.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => {
      unsubscribeConnectivity();
      clearInterval(syncInterval);
      
      pwaInstallationManager.off('install-available', handleInstallAvailable);
      pwaInstallationManager.off('install-completed', handleInstallCompleted);
      
      serviceWorkerManager.off('update-available', handleUpdateAvailable);
      serviceWorkerManager.off('sync-status-change', handleSyncStatusChange);
    };
  }, []);

  const showInstallPrompt = async (): Promise<boolean> => {
    return pwaInstallationManager.showInstallationPrompt();
  };

  const showInstallInstructions = (): void => {
    pwaInstallationManager.showInstallationOnboarding();
  };

  const forceSync = async (): Promise<void> => {
    const result = await serviceWorkerManager.forceSync();
    if (result.success) {
      // Update sync status
      const status = await serviceWorkerManager.getSyncStatus();
      setSyncStatus(status);
    } else {
      throw new Error(result.error || 'Sync failed');
    }
  };

  const testConnectivity = async (): Promise<boolean> => {
    return connectivityService.testConnectivity();
  };

  return {
    // Status
    installStatus,
    metrics,
    connectivity,
    syncStatus,
    
    // Computed values
    isOnline: connectivity?.status === 'online',
    isOffline: connectivity?.status === 'offline',
    connectionQuality: connectivity ? connectivityService.getQualityScore() : 0,
    canInstall: installStatus?.canInstall || false,
    isInstalled: installStatus?.isInstalled || false,
    isStandalone: installStatus?.isStandalone || false,
    needsUpdate,
    
    // Actions
    showInstallPrompt,
    showInstallInstructions,
    forceSync,
    testConnectivity
  };
}

/**
 * Hook for PWA installation status only
 */
export function usePWAInstallation() {
  const { installStatus, metrics, canInstall, isInstalled, isStandalone, showInstallPrompt, showInstallInstructions } = usePWACapabilities();
  
  return {
    installStatus,
    metrics,
    canInstall,
    isInstalled,
    isStandalone,
    showInstallPrompt,
    showInstallInstructions
  };
}

/**
 * Hook for connectivity status only
 */
export function useConnectivity() {
  const { connectivity, isOnline, isOffline, connectionQuality, testConnectivity } = usePWACapabilities();
  
  return {
    connectivity,
    isOnline,
    isOffline,
    connectionQuality,
    testConnectivity
  };
}

/**
 * Hook for sync status only
 */
export function useSyncStatus() {
  const { syncStatus, forceSync } = usePWACapabilities();
  
  return {
    syncStatus,
    forceSync,
    hasPendingSync: syncStatus?.queuedRequests > 0,
    hasFailedSync: syncStatus?.failedRequests > 0,
    isOnline: syncStatus?.isOnline || false
  };
}