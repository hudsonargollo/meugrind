'use client';

import React from 'react';
import { usePowerManagement } from '../../hooks/use-power-management';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface PowerManagementIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function PowerManagementIndicator({ 
  showDetails = false, 
  className = '' 
}: PowerManagementIndicatorProps) {
  const { 
    powerState, 
    toggleEcoMode, 
    isCriticalPower,
    isInitialized 
  } = usePowerManagement();

  if (!isInitialized) {
    return null;
  }

  const { batteryLevel, isCharging, ecoModeActive, powerSavingLevel } = powerState;

  // Don't show if battery info is not available and eco mode is not active
  if (batteryLevel === null && !ecoModeActive) {
    return null;
  }

  const getBatteryIcon = () => {
    if (isCharging) return '🔌';
    if (batteryLevel === null) return '🔋';
    if (batteryLevel <= 10) return '🪫';
    if (batteryLevel <= 20) return '🔋';
    if (batteryLevel <= 50) return '🔋';
    return '🔋';
  };

  const getBatteryColor = () => {
    if (isCharging) return 'text-green-600';
    if (batteryLevel === null) return 'text-gray-500';
    if (batteryLevel <= 10) return 'text-red-600';
    if (batteryLevel <= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getEcoModeLabel = () => {
    if (!ecoModeActive) return null;
    
    switch (powerSavingLevel) {
      case 'aggressive':
        return 'Eco Mode: Aggressive';
      case 'light':
        return 'Eco Mode: Light';
      default:
        return 'Eco Mode';
    }
  };

  if (showDetails) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={getBatteryColor()}>{getBatteryIcon()}</span>
            {batteryLevel !== null && (
              <span className={`text-sm font-medium ${getBatteryColor()}`}>
                {batteryLevel}%
              </span>
            )}
            {isCharging && (
              <Badge variant="outline" className="text-xs">
                Charging
              </Badge>
            )}
          </div>
          
          <Button
            variant={ecoModeActive ? "default" : "outline"}
            size="sm"
            onClick={toggleEcoMode}
            className="text-xs"
          >
            {ecoModeActive ? 'Eco On' : 'Eco Off'}
          </Button>
        </div>
        
        {ecoModeActive && (
          <div className="text-xs text-muted-foreground">
            {getEcoModeLabel()} - Reduced animations and background sync
          </div>
        )}
        
        {isCriticalPower && (
          <div className="text-xs text-red-600 font-medium">
            ⚠️ Critical battery level - Consider charging soon
          </div>
        )}
      </div>
    );
  }

  // Compact indicator
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {batteryLevel !== null && (
        <>
          <span className={getBatteryIcon()}></span>
          <span className={`text-xs ${getBatteryColor()}`}>
            {batteryLevel}%
          </span>
        </>
      )}
      
      {ecoModeActive && (
        <Badge 
          variant={powerSavingLevel === 'aggressive' ? 'destructive' : 'secondary'}
          className="text-xs px-1 py-0"
        >
          ECO
        </Badge>
      )}
      
      {isCriticalPower && (
        <span className="text-red-600 text-xs">⚠️</span>
      )}
    </div>
  );
}

/**
 * Full-screen power saving notification for critical states
 */
export function PowerSavingNotification() {
  const { powerState, isCriticalPower } = usePowerManagement();

  if (!isCriticalPower || !powerState.ecoModeActive) {
    return null;
  }

  return (
    <div className="power-saving-indicator critical">
      ⚠️ Critical Battery - Power Saving Active
    </div>
  );
}