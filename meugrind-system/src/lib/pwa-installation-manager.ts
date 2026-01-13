/**
 * PWA Installation Manager for MEUGRIND System
 * Handles app installation prompts, onboarding, and PWA capabilities
 */

export interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallationStatus {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  installMethod: 'beforeinstallprompt' | 'manual' | 'none';
}

export interface InstallationMetrics {
  promptShown: number;
  promptAccepted: number;
  promptDismissed: number;
  installCompleted: number;
  uninstallDetected: number;
  lastPromptDate?: Date;
  installDate?: Date;
}

class PWAInstallationManager {
  private deferredPrompt: InstallPromptEvent | null = null;
  private installationStatus: PWAInstallationStatus;
  private metrics: InstallationMetrics;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private onboardingShown: boolean = false;

  constructor() {
    this.installationStatus = this.detectInstallationStatus();
    this.metrics = this.loadMetrics();
    this.initializeInstallationHandling();
  }

  /**
   * Initialize PWA installation handling
   */
  private initializeInstallationHandling(): void {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.updateInstallationStatus();
      this.emit('install-available');
      
      // Show installation prompt after a delay if conditions are met
      this.scheduleInstallationPrompt();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      this.metrics.installCompleted++;
      this.metrics.installDate = new Date();
      this.saveMetrics();
      this.updateInstallationStatus();
      this.emit('install-completed');
    });

    // Detect if app was launched in standalone mode
    if (this.isStandalone()) {
      this.emit('standalone-launch');
    }

    // Check for iOS installation
    this.detectIOSInstallation();

    // Monitor for uninstallation (when app is no longer in standalone mode)
    this.monitorUninstallation();
  }

  /**
   * Detect current installation status
   */
  private detectInstallationStatus(): PWAInstallationStatus {
    // Default status for SSR
    if (typeof window === 'undefined') {
      return {
        canInstall: false,
        isInstalled: false,
        isStandalone: false,
        platform: 'unknown',
        installMethod: 'none'
      };
    }
    
    const isStandalone = this.isStandalone();
    const platform = this.detectPlatform();
    
    return {
      canInstall: false, // Will be updated when beforeinstallprompt fires
      isInstalled: isStandalone,
      isStandalone,
      platform,
      installMethod: this.getInstallMethod(platform)
    };
  }

  /**
   * Detect the platform
   */
  private detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      return 'desktop';
    }
    
    return 'unknown';
  }

  /**
   * Get installation method for platform
   */
  private getInstallMethod(platform: string): 'beforeinstallprompt' | 'manual' | 'none' {
    switch (platform) {
      case 'android':
      case 'desktop':
        return 'beforeinstallprompt';
      case 'ios':
        return 'manual';
      default:
        return 'none';
    }
  }

  /**
   * Check if app is running in standalone mode
   */
  private isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  /**
   * Detect iOS installation status
   */
  private detectIOSInstallation(): void {
    if (this.installationStatus.platform === 'ios') {
      // On iOS, we can only detect if the app is in standalone mode
      const wasStandalone = localStorage.getItem('pwa-was-standalone') === 'true';
      const isCurrentlyStandalone = this.isStandalone();
      
      if (!wasStandalone && isCurrentlyStandalone) {
        // App was just installed on iOS
        this.metrics.installCompleted++;
        this.metrics.installDate = new Date();
        this.saveMetrics();
        this.emit('install-completed');
      }
      
      localStorage.setItem('pwa-was-standalone', isCurrentlyStandalone.toString());
    }
  }

  /**
   * Monitor for app uninstallation
   */
  private monitorUninstallation(): void {
    // Check periodically if app is still installed
    setInterval(() => {
      const currentlyStandalone = this.isStandalone();
      const wasInstalled = this.installationStatus.isInstalled;
      
      if (wasInstalled && !currentlyStandalone) {
        // App was uninstalled
        this.metrics.uninstallDetected++;
        this.saveMetrics();
        this.updateInstallationStatus();
        this.emit('uninstall-detected');
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Schedule installation prompt based on user behavior
   */
  private scheduleInstallationPrompt(): void {
    // Don't show prompt if already shown recently
    const lastPrompt = this.metrics.lastPromptDate;
    if (lastPrompt && Date.now() - lastPrompt.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return; // Wait at least 7 days between prompts
    }

    // Don't show if user has dismissed too many times
    if (this.metrics.promptDismissed >= 3) {
      return; // Stop showing after 3 dismissals
    }

    // Show prompt after user has interacted with the app for a while
    setTimeout(() => {
      if (this.shouldShowInstallPrompt()) {
        this.showInstallationPrompt();
      }
    }, 60000); // Wait 1 minute after page load
  }

  /**
   * Check if installation prompt should be shown
   */
  private shouldShowInstallPrompt(): boolean {
    return this.deferredPrompt !== null &&
           !this.installationStatus.isInstalled &&
           !this.onboardingShown &&
           this.getUserEngagementScore() > 0.5;
  }

  /**
   * Get user engagement score (0-1)
   */
  private getUserEngagementScore(): number {
    // Simple engagement scoring based on time spent and interactions
    const timeSpent = performance.now() / 1000; // seconds
    const interactions = this.getInteractionCount();
    
    const timeScore = Math.min(timeSpent / 300, 1); // Max score at 5 minutes
    const interactionScore = Math.min(interactions / 10, 1); // Max score at 10 interactions
    
    return (timeScore + interactionScore) / 2;
  }

  /**
   * Get interaction count (clicks, taps, etc.)
   */
  private getInteractionCount(): number {
    // This would be tracked by the app - for now return a placeholder
    return parseInt(sessionStorage.getItem('user-interactions') || '0');
  }

  /**
   * Show installation prompt
   */
  async showInstallationPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.metrics.promptShown++;
      this.metrics.lastPromptDate = new Date();
      this.saveMetrics();

      // Show the prompt
      await this.deferredPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.metrics.promptAccepted++;
        this.emit('install-accepted');
        console.log('User accepted the install prompt');
        return true;
      } else {
        this.metrics.promptDismissed++;
        this.emit('install-dismissed');
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
      this.saveMetrics();
    }
  }

  /**
   * Show custom installation onboarding
   */
  showInstallationOnboarding(): void {
    if (this.onboardingShown) return;
    
    this.onboardingShown = true;
    this.emit('onboarding-show', {
      platform: this.installationStatus.platform,
      installMethod: this.installationStatus.installMethod,
      canInstall: this.canInstall()
    });
  }

  /**
   * Show platform-specific installation instructions
   */
  showInstallationInstructions(): string[] {
    const platform = this.installationStatus.platform;
    
    switch (platform) {
      case 'ios':
        return [
          'Tap the Share button at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install MEUGRIND on your home screen'
        ];
      case 'android':
        return [
          'Tap the menu button (three dots) in your browser',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Add" to install MEUGRIND'
        ];
      case 'desktop':
        return [
          'Click the install button in your browser\'s address bar',
          'Or use the browser menu and select "Install MEUGRIND"',
          'The app will be added to your desktop and start menu'
        ];
      default:
        return [
          'Use your browser\'s menu to add MEUGRIND to your home screen',
          'Look for "Add to Home Screen" or "Install App" options'
        ];
    }
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null || 
           (this.installationStatus.platform === 'ios' && !this.installationStatus.isInstalled);
  }

  /**
   * Get installation status
   */
  getInstallationStatus(): PWAInstallationStatus {
    return { ...this.installationStatus };
  }

  /**
   * Get installation metrics
   */
  getMetrics(): InstallationMetrics {
    return { ...this.metrics };
  }

  /**
   * Update installation status
   */
  private updateInstallationStatus(): void {
    this.installationStatus = {
      ...this.installationStatus,
      canInstall: this.canInstall(),
      isInstalled: this.isStandalone(),
      isStandalone: this.isStandalone()
    };
  }

  /**
   * Load metrics from storage
   */
  private loadMetrics(): InstallationMetrics {
    try {
      // Only access localStorage in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return {
          promptShown: 0,
          promptAccepted: 0,
          promptDismissed: 0,
          installCompleted: 0,
          uninstallDetected: 0,
          lastPromptDate: undefined,
          installDate: undefined
        };
      }
      
      const stored = localStorage.getItem('pwa-installation-metrics');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          lastPromptDate: parsed.lastPromptDate ? new Date(parsed.lastPromptDate) : undefined,
          installDate: parsed.installDate ? new Date(parsed.installDate) : undefined
        };
      }
    } catch (error) {
      console.error('Failed to load installation metrics:', error);
    }

    return {
      promptShown: 0,
      promptAccepted: 0,
      promptDismissed: 0,
      installCompleted: 0,
      uninstallDetected: 0
    };
  }

  /**
   * Save metrics to storage
   */
  private saveMetrics(): void {
    try {
      // Only access localStorage in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      
      localStorage.setItem('pwa-installation-metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save installation metrics:', error);
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in PWA installation listener:', error);
        }
      });
    }
  }

  /**
   * Track user interaction (to be called by the app)
   */
  trackInteraction(): void {
    const current = parseInt(sessionStorage.getItem('user-interactions') || '0');
    sessionStorage.setItem('user-interactions', (current + 1).toString());
  }

  /**
   * Reset installation prompt eligibility (for testing)
   */
  resetPromptEligibility(): void {
    this.metrics.promptDismissed = 0;
    this.metrics.lastPromptDate = undefined;
    this.saveMetrics();
  }
}

// Singleton instance
export const pwaInstallationManager = new PWAInstallationManager();
export default pwaInstallationManager;