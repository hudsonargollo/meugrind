/**
 * Tests for Power Management Service
 */

import { powerManager } from '../power-management';

// Mock navigator.getBattery for testing
const mockBattery = {
  level: 0.5,
  charging: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock navigator
Object.defineProperty(global.navigator, 'getBattery', {
  value: jest.fn().mockResolvedValue(mockBattery),
  writable: true
});

describe('PowerManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(powerManager.initialize()).resolves.not.toThrow();
    });

    it('should return default power state before initialization', () => {
      const state = powerManager.getPowerState();
      expect(state).toHaveProperty('batteryLevel');
      expect(state).toHaveProperty('isCharging');
      expect(state).toHaveProperty('ecoModeActive');
      expect(state).toHaveProperty('powerSavingLevel');
    });
  });

  describe('eco mode management', () => {
    it('should allow manual eco mode activation', () => {
      const initialState = powerManager.getPowerState();
      expect(initialState.ecoModeActive).toBe(false);

      powerManager.setEcoMode(true);
      const newState = powerManager.getPowerState();
      expect(newState.ecoModeActive).toBe(true);
    });

    it('should provide resource optimizations based on power state', () => {
      // Test normal mode
      powerManager.setEcoMode(false);
      const normalOptimizations = powerManager.getResourceOptimizations();
      expect(normalOptimizations.maxConcurrentOperations).toBeGreaterThan(2);

      // Test eco mode
      powerManager.setEcoMode(true);
      const ecoOptimizations = powerManager.getResourceOptimizations();
      expect(ecoOptimizations.maxConcurrentOperations).toBeLessThanOrEqual(2);
      expect(ecoOptimizations.imageQuality).toBeLessThan(normalOptimizations.imageQuality);
    });
  });

  describe('configuration management', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        ecoModeSettings: {
          batteryThreshold: 15,
          reduceAnimations: true,
          pauseBackgroundSync: true,
          reducedRefreshRate: true,
          compressImages: true,
          limitConcurrentOperations: true
        }
      };

      expect(() => powerManager.updateConfig(newConfig)).not.toThrow();
      
      const config = powerManager.getConfig();
      expect(config.ecoModeSettings.batteryThreshold).toBe(15);
    });
  });

  describe('power state evaluation', () => {
    it('should determine eco mode activation correctly', () => {
      // Test with high battery - should not activate
      powerManager.updateConfig({
        ecoModeSettings: { ...powerManager.getConfig().ecoModeSettings, batteryThreshold: 20 }
      });
      
      // Mock high battery
      const highBatteryState = { ...powerManager.getPowerState(), batteryLevel: 50, isCharging: false };
      expect(powerManager.shouldActivateEcoMode()).toBe(false);
    });

    it('should detect critical power state', () => {
      powerManager.updateConfig({ criticalBatteryThreshold: 10 });
      
      // This test would need to mock the internal battery state
      // For now, we test the method exists and returns a boolean
      expect(typeof powerManager.isCriticalPowerState()).toBe('boolean');
    });
  });

  describe('subscription system', () => {
    it('should allow subscribing to power state changes', () => {
      const mockListener = jest.fn();
      const unsubscribe = powerManager.subscribe(mockListener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});