// Service Worker registration and management for MEUGRIND system

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  syncQueueStatus?: {
    queuedRequests: number;
    oldestRequest: number | null;
    isOnline: boolean;
  };
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Check if service workers are supported and enabled
    this.isEnabled = 'serviceWorker' in navigator && 
                    process.env.NEXT_PUBLIC_SW_ENABLED !== 'false';
    
    if (this.isEnabled) {
      this.initializeServiceWorker();
    }
  }

  /**
   * Initialize and register the service worker
   */
  private async initializeServiceWorker(): Promise<void> {
    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      // Listen for connectivity changes
      window.addEventListener('online', () => {
        this.handleConnectivityChange(true);
      });

      window.addEventListener('offline', () => {
        this.handleConnectivityChange(false);
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'sync-success':
        console.log('Background sync successful:', data);
        // Emit custom event for the app to handle
        window.dispatchEvent(new CustomEvent('backgroundSyncSuccess', { detail: data }));
        break;

      case 'connectivity-change':
        console.log('Connectivity changed:', data.online ? 'online' : 'offline');
        window.dispatchEvent(new CustomEvent('connectivityChange', { detail: data }));
        break;

      default:
        console.log('Unknown service worker message:', type, data);
    }
  }

  /**
   * Handle connectivity changes
   */
  private handleConnectivityChange(isOnline: boolean): void {
    console.log(`Connectivity changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // Trigger background sync when coming online
      this.triggerBackgroundSync();
    }
  }

  /**
   * Notify about service worker updates
   */
  private notifyUpdate(): void {
    // Emit custom event for the app to handle
    window.dispatchEvent(new CustomEvent('serviceWorkerUpdate', {
      detail: {
        message: 'A new version of the app is available',
        action: 'reload'
      }
    }));
  }

  /**
   * Update to the new service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (this.registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
    }
  }

  /**
   * Get service worker status
   */
  async getStatus(): Promise<ServiceWorkerStatus> {
    const status: ServiceWorkerStatus = {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      isActive: !!navigator.serviceWorker.controller
    };

    if (this.registration && navigator.serviceWorker.controller) {
      try {
        // Get sync queue status from service worker
        const syncStatus = await this.sendMessageToServiceWorker('GET_SYNC_STATUS');
        status.syncQueueStatus = syncStatus;
      } catch (error) {
        console.error('Failed to get sync status from service worker:', error);
      }
    }

    return status;
  }

  /**
   * Trigger background sync manually
   */
  async triggerBackgroundSync(): Promise<boolean> {
    if (!this.registration || !navigator.serviceWorker.controller) {
      console.warn('Service worker not available for background sync');
      return false;
    }

    try {
      // Register for background sync
      if ('sync' in this.registration) {
        await (this.registration as any).sync.register('meugrind-sync');
        console.log('Background sync registered');
        return true;
      } else {
        // Fallback: trigger sync directly
        const result = await this.sendMessageToServiceWorker('FORCE_SYNC');
        return result.success;
      }
    } catch (error) {
      console.error('Failed to trigger background sync:', error);
      return false;
    }
  }

  /**
   * Send message to service worker and wait for response
   */
  private sendMessageToServiceWorker(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('No active service worker'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(
        { type, data },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Service worker message timeout'));
      }, 5000);
    });
  }

  /**
   * Check if background sync is supported
   */
  isBackgroundSyncSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'sync' in window.ServiceWorkerRegistration.prototype;
  }

  /**
   * Unregister service worker (for testing/cleanup)
   */
  async unregister(): Promise<boolean> {
    if (this.registration) {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    }
    return false;
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();