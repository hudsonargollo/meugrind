// Connectivity detection and management service for MEUGRIND system

export type ConnectivityStatus = 'online' | 'offline' | 'limited';

export interface ConnectivityInfo {
  status: ConnectivityStatus;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // Round trip time in ms
  saveData?: boolean; // User has data saver enabled
  lastChecked: Date;
}

export interface ConnectivityListener {
  (info: ConnectivityInfo): void;
}

export class ConnectivityService {
  private listeners: Set<ConnectivityListener> = new Set();
  private currentStatus: ConnectivityInfo;
  private checkInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    this.currentStatus = {
      status: navigator.onLine ? 'online' : 'offline',
      lastChecked: new Date()
    };

    this.initializeConnectivityMonitoring();
  }

  /**
   * Initialize connectivity monitoring
   */
  private initializeConnectivityMonitoring(): void {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;
    
    // Listen for basic online/offline events
    window.addEventListener('online', () => {
      this.updateConnectivityStatus();
    });

    window.addEventListener('offline', () => {
      this.updateConnectivityStatus();
    });

    // Listen for network information changes (if supported)
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        this.updateConnectivityStatus();
      });
    }

    // Start periodic connectivity checks
    this.startMonitoring();
  }

  /**
   * Start monitoring connectivity
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Check connectivity every 30 seconds
    this.checkInterval = setInterval(() => {
      this.performConnectivityCheck();
    }, 30000);

    // Initial check
    this.performConnectivityCheck();
  }

  /**
   * Stop monitoring connectivity
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Perform a connectivity check
   */
  private async performConnectivityCheck(): Promise<void> {
    try {
      // Basic online check
      if (!navigator.onLine) {
        this.updateStatus('offline');
        return;
      }

      // Try to fetch a small resource to test actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/icon.svg', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Check if connection is limited based on response time
        const responseTime = performance.now();
        const isLimited = responseTime > 3000; // Consider > 3s as limited
        
        this.updateStatus(isLimited ? 'limited' : 'online');
      } else {
        this.updateStatus('limited');
      }
    } catch (error) {
      // Network error or timeout
      this.updateStatus(navigator.onLine ? 'limited' : 'offline');
    }
  }

  /**
   * Update connectivity status
   */
  private updateConnectivityStatus(): void {
    const newStatus: ConnectivityInfo = {
      status: navigator.onLine ? 'online' : 'offline',
      lastChecked: new Date()
    };

    // Add network information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      newStatus.effectiveType = connection.effectiveType;
      newStatus.downlink = connection.downlink;
      newStatus.rtt = connection.rtt;
      newStatus.saveData = connection.saveData;

      // Determine status based on connection quality
      if (navigator.onLine) {
        if (connection.effectiveType === 'slow-2g' || connection.downlink < 0.5) {
          newStatus.status = 'limited';
        } else if (connection.rtt > 2000) {
          newStatus.status = 'limited';
        }
      }
    }

    // Only notify if status actually changed
    if (this.hasStatusChanged(newStatus)) {
      this.currentStatus = newStatus;
      this.notifyListeners(newStatus);
    }
  }

  /**
   * Update status with a specific value
   */
  private updateStatus(status: ConnectivityStatus): void {
    const newStatus: ConnectivityInfo = {
      ...this.currentStatus,
      status,
      lastChecked: new Date()
    };

    if (this.hasStatusChanged(newStatus)) {
      this.currentStatus = newStatus;
      this.notifyListeners(newStatus);
    }
  }

  /**
   * Check if status has changed
   */
  private hasStatusChanged(newStatus: ConnectivityInfo): boolean {
    return this.currentStatus.status !== newStatus.status ||
           this.currentStatus.effectiveType !== newStatus.effectiveType;
  }

  /**
   * Notify all listeners about connectivity changes
   */
  private notifyListeners(info: ConnectivityInfo): void {
    this.listeners.forEach(listener => {
      try {
        listener(info);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });

    // Also emit a global event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('connectivityChange', {
        detail: info
      }));
    }
  }

  /**
   * Add a connectivity listener
   */
  addListener(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current status
    listener(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a connectivity listener
   */
  removeListener(listener: ConnectivityListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Get current connectivity status
   */
  getCurrentStatus(): ConnectivityInfo {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus.status === 'online';
  }

  /**
   * Check if connectivity is limited
   */
  isLimited(): boolean {
    return this.currentStatus.status === 'limited';
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return this.currentStatus.status === 'offline';
  }

  /**
   * Get connection quality score (0-100)
   */
  getQualityScore(): number {
    const { status, effectiveType, downlink, rtt } = this.currentStatus;
    
    if (status === 'offline') return 0;
    if (status === 'limited') return 25;
    
    let score = 100;
    
    // Adjust based on effective type
    if (effectiveType) {
      switch (effectiveType) {
        case 'slow-2g': score = 20; break;
        case '2g': score = 40; break;
        case '3g': score = 70; break;
        case '4g': score = 100; break;
      }
    }
    
    // Adjust based on downlink speed
    if (downlink !== undefined) {
      if (downlink < 0.5) score = Math.min(score, 30);
      else if (downlink < 1.5) score = Math.min(score, 60);
      else if (downlink < 5) score = Math.min(score, 80);
    }
    
    // Adjust based on RTT
    if (rtt !== undefined) {
      if (rtt > 2000) score = Math.min(score, 30);
      else if (rtt > 1000) score = Math.min(score, 60);
      else if (rtt > 500) score = Math.min(score, 80);
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Test connectivity with a specific endpoint
   */
  async testConnectivity(url: string = '/icon.svg', timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
  }
}

// Export singleton instance
export const connectivityService = new ConnectivityService();