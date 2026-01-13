/**
 * Service Worker Manager for MEUGRIND System
 * Provides interface for interacting with the enhanced service worker
 */

export interface SyncStatus {
  queuedRequests: number;
  pendingRetries: number;
  failedRequests: number;
  queuedNotifications: number;
  oldestRequest: number | null;
  nextRetryTime: number | null;
  focusMode: {
    isActive: boolean;
    sessionId: string;
    suppressNotifications: boolean;
  } | null;
  isOnline: boolean;
  lastSync: number;
  error?: string;
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: 'general' | 'pomodoro' | 'reminder' | 'sync';
  scheduledTime?: number;
}

export interface FocusModeData {
  isActive: boolean;
  sessionId: string;
  suppressNotifications: boolean;
  allowUrgentNotifications?: boolean;
  whitelistedContacts?: string[];
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * Initialize the service worker manager
   */
  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration.scope);

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        this.emit('update-available');
      });

      // Check if service worker is waiting
      if (this.registration.waiting) {
        this.emit('update-ready');
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Get sync status from service worker
   */
  async getSyncStatus(): Promise<SyncStatus> {
    return this.sendMessage('GET_SYNC_STATUS');
  }

  /**
   * Force sync of queued requests
   */
  async forceSync(): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage('FORCE_SYNC');
  }

  /**
   * Update focus mode status
   */
  async updateFocusMode(focusMode: FocusModeData): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage('UPDATE_FOCUS_MODE', focusMode);
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(notification: NotificationData): Promise<{ success: boolean; error?: string }> {
    return this.sendMessage('SCHEDULE_NOTIFICATION', notification);
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidPublicKey: string): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
    if (!('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    return this.sendMessage('SUBSCRIBE_PUSH', { vapidPublicKey });
  }

  /**
   * Skip waiting service worker
   */
  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.sendMessage('SKIP_WAITING');
    }
  }

  /**
   * Check if app is running in standalone mode (PWA)
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return 'beforeinstallprompt' in window;
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Send message to service worker
   */
  private async sendMessage(type: string, data?: any): Promise<any> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      const activeWorker = this.registration!.active;
      if (activeWorker) {
        activeWorker.postMessage({ type, data }, [messageChannel.port2]);
      } else {
        reject(new Error('No active service worker'));
      }
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'sync-success':
        this.emit('sync-success', data);
        break;
      case 'sync-failed':
        this.emit('sync-failed', data);
        break;
      case 'connectivity-change':
        this.emit('connectivity-change', data);
        break;
      default:
        console.log('Unknown service worker message:', type, data);
    }
  }

  /**
   * Get cache usage information
   */
  async getCacheUsage(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;