/**
 * Power Management Service for MEUGRIND System
 * Handles battery monitoring, eco mode activation, and resource optimization
 */

export interface PowerState {
  batteryLevel: number | null;
  isCharging: boolean;
  ecoModeActive: boolean;
  powerSavingLevel: 'none' | 'light' | 'aggressive';
}

export interface EcoModeSettings {
  batteryThreshold: number; // Percentage below which eco mode activates
  reduceAnimations: boolean;
  pauseBackgroundSync: boolean;
  reducedRefreshRate: boolean;
  compressImages: boolean;
  limitConcurrentOperations: boolean;
}

export interface PowerManagementConfig {
  ecoModeSettings: EcoModeSettings;
  criticalBatteryThreshold: number; // Emergency mode threshold
  enableAutomaticEcoMode: boolean;
}

class PowerManagementService {
  private powerState: PowerState = {
    batteryLevel: null,
    isCharging: false,
    ecoModeActive: false,
    powerSavingLevel: 'none'
  };

  private config: PowerManagementConfig = {
    ecoModeSettings: {
      batteryThreshold: 20,
      reduceAnimations: true,
      pauseBackgroundSync: true,
      reducedRefreshRate: true,
      compressImages: true,
      limitConcurrentOperations: true
    },
    criticalBatteryThreshold: 10,
    enableAutomaticEcoMode: true
  };

  private listeners: Array<(state: PowerState) => void> = [];
  private battery: any = null;
  private lastUpdateTime: number = Date.now();
  private initialized = false;

  /**
   * Initialize power management system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize battery API if available
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        this.battery = await (navigator as any).getBattery();
        this.updatePowerState();
        this.setupBatteryListeners();
      }

      // Set up periodic battery checks for browsers without battery API
      if (!this.battery) {
        this.setupFallbackMonitoring();
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Power management initialization failed:', error);
      // Continue without battery monitoring
      this.initialized = true;
    }
  }

  /**
   * Get current power state
   */
  getPowerState(): PowerState {
    return { ...this.powerState };
  }

  /**
   * Get current battery level as a percentage (0-100)
   */
  async getBatteryLevel(): Promise<number> {
    // Ensure we have the latest battery info
    if (this.battery) {
      this.updatePowerState();
    } else {
      this.fallbackPowerEstimation();
    }
    
    return this.powerState.batteryLevel || 50; // Default to 50% if unknown
  }

  /**
   * Fallback power estimation when battery API is not available
   */
  private fallbackPowerEstimation(): void {
    // Use a simple heuristic based on time and activity
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    // Estimate battery drain based on activity level
    const estimatedDrain = Math.min(timeSinceLastUpdate / (1000 * 60 * 60) * 5, 10); // 5% per hour, max 10%
    
    if (this.powerState.batteryLevel !== undefined && this.powerState.batteryLevel !== null) {
      this.powerState.batteryLevel = Math.max(0, this.powerState.batteryLevel - estimatedDrain);
    } else {
      this.powerState.batteryLevel = 50; // Default assumption
    }
    
    this.lastUpdateTime = now;
  }

  /**
   * Get current configuration
   */
  getConfig(): PowerManagementConfig {
    return { ...this.config };
  }

  /**
   * Update power management configuration
   */
  updateConfig(newConfig: Partial<PowerManagementConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.evaluatePowerSaving();
  }

  /**
   * Manually activate/deactivate eco mode
   */
  setEcoMode(active: boolean): void {
    const wasActive = this.powerState.ecoModeActive;
    this.powerState.ecoModeActive = active;
    
    if (active) {
      this.powerState.powerSavingLevel = this.determinePowerSavingLevel();
    } else {
      this.powerState.powerSavingLevel = 'none';
    }

    if (wasActive !== active) {
      this.notifyListeners();
      this.applyPowerSavingMeasures();
    }
  }

  /**
   * Subscribe to power state changes
   */
  subscribe(listener: (state: PowerState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if eco mode should be active based on current conditions
   */
  shouldActivateEcoMode(): boolean {
    if (!this.config.enableAutomaticEcoMode) return false;
    
    const { batteryLevel, isCharging } = this.powerState;
    
    // Don't activate eco mode if charging
    if (isCharging) return false;
    
    // Activate if battery is below threshold
    if (batteryLevel !== null && batteryLevel <= this.config.ecoModeSettings.batteryThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Get recommended resource optimization settings
   */
  getResourceOptimizations(): {
    maxConcurrentOperations: number;
    syncInterval: number;
    imageQuality: number;
    animationDuration: number;
    cacheSize: number;
  } {
    const { powerSavingLevel } = this.powerState;

    switch (powerSavingLevel) {
      case 'aggressive':
        return {
          maxConcurrentOperations: 1,
          syncInterval: 300000, // 5 minutes
          imageQuality: 0.6,
          animationDuration: 0,
          cacheSize: 50 * 1024 * 1024 // 50MB
        };
      
      case 'light':
        return {
          maxConcurrentOperations: 2,
          syncInterval: 120000, // 2 minutes
          imageQuality: 0.8,
          animationDuration: 150,
          cacheSize: 100 * 1024 * 1024 // 100MB
        };
      
      default:
        return {
          maxConcurrentOperations: 5,
          syncInterval: 30000, // 30 seconds
          imageQuality: 0.9,
          animationDuration: 300,
          cacheSize: 200 * 1024 * 1024 // 200MB
        };
    }
  }

  /**
   * Check if device is in critical power state
   */
  isCriticalPowerState(): boolean {
    const { batteryLevel, isCharging } = this.powerState;
    return !isCharging && batteryLevel !== null && batteryLevel <= this.config.criticalBatteryThreshold;
  }

  private setupBatteryListeners(): void {
    if (!this.battery) return;

    const updateHandler = () => this.updatePowerState();
    
    this.battery.addEventListener('levelchange', updateHandler);
    this.battery.addEventListener('chargingchange', updateHandler);
    this.battery.addEventListener('chargingtimechange', updateHandler);
    this.battery.addEventListener('dischargingtimechange', updateHandler);
  }

  private setupFallbackMonitoring(): void {
    // For browsers without battery API, check periodically
    setInterval(() => {
      // Estimate power state based on performance and other indicators
      this.estimatePowerState();
    }, 60000); // Check every minute
  }

  private updatePowerState(): void {
    if (!this.battery) return;

    const newBatteryLevel = Math.round(this.battery.level * 100);
    const newIsCharging = this.battery.charging;

    const stateChanged = 
      this.powerState.batteryLevel !== newBatteryLevel ||
      this.powerState.isCharging !== newIsCharging;

    this.powerState.batteryLevel = newBatteryLevel;
    this.powerState.isCharging = newIsCharging;

    if (stateChanged) {
      this.evaluatePowerSaving();
      this.notifyListeners();
    }
  }

  private estimatePowerState(): void {
    // Fallback estimation for browsers without battery API
    // This is a simplified approach - in reality, you might use other indicators
    
    // Check if device seems to be under power constraints
    const performanceNow = performance.now();
    const memoryInfo = (performance as any).memory;
    
    let estimatedLevel = this.powerState.batteryLevel || 50;
    
    // If memory is constrained, assume lower battery
    if (memoryInfo && memoryInfo.usedJSHeapSize > memoryInfo.totalJSHeapSize * 0.8) {
      estimatedLevel = Math.max(15, estimatedLevel - 5);
    }

    this.powerState.batteryLevel = estimatedLevel;
    this.evaluatePowerSaving();
  }

  private evaluatePowerSaving(): void {
    const shouldActivate = this.shouldActivateEcoMode();
    const wasActive = this.powerState.ecoModeActive;

    if (shouldActivate && !wasActive) {
      this.powerState.ecoModeActive = true;
      this.powerState.powerSavingLevel = this.determinePowerSavingLevel();
      this.applyPowerSavingMeasures();
    } else if (!shouldActivate && wasActive && this.config.enableAutomaticEcoMode) {
      this.powerState.ecoModeActive = false;
      this.powerState.powerSavingLevel = 'none';
      this.applyPowerSavingMeasures();
    }
  }

  private determinePowerSavingLevel(): 'none' | 'light' | 'aggressive' {
    const { batteryLevel } = this.powerState;
    
    if (batteryLevel === null) return 'light';
    
    if (batteryLevel <= this.config.criticalBatteryThreshold) {
      return 'aggressive';
    } else if (batteryLevel <= this.config.ecoModeSettings.batteryThreshold) {
      return 'light';
    }
    
    return 'none';
  }

  private applyPowerSavingMeasures(): void {
    const { ecoModeActive, powerSavingLevel } = this.powerState;
    
    if (ecoModeActive) {
      // Apply CSS class for reduced animations
      if (this.config.ecoModeSettings.reduceAnimations) {
        document.documentElement.classList.add('eco-mode');
        if (powerSavingLevel === 'aggressive') {
          document.documentElement.classList.add('eco-mode-aggressive');
        }
      }
      
      // Dispatch custom event for other services to respond
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ecoModeChanged', {
          detail: { active: true, level: powerSavingLevel }
        }));
      }
    } else {
      // Remove eco mode classes
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('eco-mode', 'eco-mode-aggressive');
      }
      
      // Dispatch custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ecoModeChanged', {
          detail: { active: false, level: 'none' }
        }));
      }
    }
  }

  private notifyListeners(): void {
    const state = this.getPowerState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in power state listener:', error);
      }
    });
  }
}

// Create singleton instance
export const powerManager = new PowerManagementService();

// Initialize on module load if in browser environment
if (typeof window !== 'undefined') {
  powerManager.initialize().catch(console.error);
}

export default powerManager;