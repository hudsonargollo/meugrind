'use client';

import { useEffect, useState } from 'react';
import { powerManager, PowerState } from '../lib/power-management';

/**
 * React hook for power management functionality
 */
export function usePowerManagement() {
  const [powerState, setPowerState] = useState<PowerState>(powerManager.getPowerState());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize power manager
    powerManager.initialize().then(() => {
      setIsInitialized(true);
      setPowerState(powerManager.getPowerState());
    });

    // Subscribe to power state changes
    const unsubscribe = powerManager.subscribe((newState) => {
      setPowerState(newState);
    });

    return unsubscribe;
  }, []);

  const toggleEcoMode = () => {
    powerManager.setEcoMode(!powerState.ecoModeActive);
  };

  const getResourceOptimizations = () => {
    return powerManager.getResourceOptimizations();
  };

  const updateConfig = (config: Parameters<typeof powerManager.updateConfig>[0]) => {
    powerManager.updateConfig(config);
  };

  return {
    powerState,
    isInitialized,
    toggleEcoMode,
    getResourceOptimizations,
    updateConfig,
    isCriticalPower: powerManager.isCriticalPowerState(),
    shouldActivateEcoMode: powerManager.shouldActivateEcoMode(),
    config: powerManager.getConfig()
  };
}

/**
 * Hook for components that need to respond to eco mode changes
 */
export function useEcoMode() {
  const { powerState, getResourceOptimizations } = usePowerManagement();
  const optimizations = getResourceOptimizations();

  return {
    isEcoMode: powerState.ecoModeActive,
    powerSavingLevel: powerState.powerSavingLevel,
    optimizations,
    shouldReduceAnimations: optimizations.animationDuration === 0,
    shouldLimitOperations: optimizations.maxConcurrentOperations <= 2,
    imageQuality: optimizations.imageQuality
  };
}