'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { InterfaceContext } from '../types';

interface InterfaceContextType {
  context: InterfaceContext;
  setMode: (mode: 'manager' | 'personal' | 'performance') => void;
  isManager: boolean;
  isPersonal: boolean;
  isPerformance: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isOnline: boolean;
  isOffline: boolean;
  batteryLevel?: number;
}

const InterfaceContextContext = createContext<InterfaceContextType | undefined>(undefined);

interface InterfaceContextProviderProps {
  children: ReactNode;
}

export function InterfaceContextProvider({ children }: InterfaceContextProviderProps) {
  const [context, setContext] = useState<InterfaceContext>({
    mode: 'manager',
    deviceType: 'desktop',
    connectivity: 'online',
  });

  // Detect device type based on screen size
  const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  // Detect connectivity status
  const detectConnectivity = (): 'online' | 'offline' | 'limited' => {
    if (typeof navigator === 'undefined') return 'online';
    
    if (!navigator.onLine) return 'offline';
    
    // Check for limited connectivity (slow connection)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const slowTypes = ['slow-2g', '2g'];
      if (slowTypes.includes(connection.effectiveType)) {
        return 'limited';
      }
    }
    
    return 'online';
  };

  // Get battery level if available
  const getBatteryLevel = async (): Promise<number | undefined> => {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return undefined;
    
    try {
      const battery = await (navigator as any).getBattery();
      return Math.round(battery.level * 100);
    } catch {
      return undefined;
    }
  };

  // Update context based on environment changes
  const updateContext = async () => {
    const deviceType = detectDeviceType();
    const connectivity = detectConnectivity();
    const batteryLevel = await getBatteryLevel();

    setContext(prev => ({
      ...prev,
      deviceType,
      connectivity,
      batteryLevel,
    }));
  };

  // Set interface mode
  const setMode = (mode: 'manager' | 'personal' | 'performance') => {
    setContext(prev => ({
      ...prev,
      mode,
    }));
  };

  // Set up event listeners for dynamic updates
  useEffect(() => {
    const updateContextWrapper = async () => {
      const deviceType = detectDeviceType();
      const connectivity = detectConnectivity();
      const batteryLevel = await getBatteryLevel();

      setContext(prev => ({
        ...prev,
        deviceType,
        connectivity,
        batteryLevel,
      }));
    };

    updateContextWrapper();

    const handleResize = () => {
      const deviceType = detectDeviceType();
      setContext(prev => ({
        ...prev,
        deviceType,
      }));
    };

    const handleOnline = () => {
      setContext(prev => ({
        ...prev,
        connectivity: 'online',
      }));
    };

    const handleOffline = () => {
      setContext(prev => ({
        ...prev,
        connectivity: 'offline',
      }));
    };

    const handleConnectionChange = () => {
      const connectivity = detectConnectivity();
      setContext(prev => ({
        ...prev,
        connectivity,
      }));
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Battery level updates
    const updateBattery = async () => {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          const updateBatteryLevel = () => {
            setContext(prev => ({
              ...prev,
              batteryLevel: Math.round(battery.level * 100),
            }));
          };

          battery.addEventListener('levelchange', updateBatteryLevel);
          
          return () => {
            battery.removeEventListener('levelchange', updateBatteryLevel);
          };
        } catch {
          // Battery API not supported
        }
      }
    };

    updateBattery();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  const value: InterfaceContextType = {
    context,
    setMode,
    isManager: context.mode === 'manager',
    isPersonal: context.mode === 'personal',
    isPerformance: context.mode === 'performance',
    isMobile: context.deviceType === 'mobile',
    isTablet: context.deviceType === 'tablet',
    isDesktop: context.deviceType === 'desktop',
    isOnline: context.connectivity === 'online',
    isOffline: context.connectivity === 'offline',
    batteryLevel: context.batteryLevel,
  };

  return (
    <InterfaceContextContext.Provider value={value}>
      {children}
    </InterfaceContextContext.Provider>
  );
}

export function useInterfaceContext(): InterfaceContextType {
  const context = useContext(InterfaceContextContext);
  if (context === undefined) {
    throw new Error('useInterfaceContext must be used within an InterfaceContextProvider');
  }
  return context;
}