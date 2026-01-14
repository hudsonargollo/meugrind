'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/use-auth';
import authService from '../../lib/supabase-auth-service';
import { useInterfaceContext } from '../../hooks/use-interface-context';
import { ModuleNavigation, ModuleId, useModuleComponent } from './module-navigation';
import { ContextSwitcher } from './context-switcher';
import { SyncStatusIndicator } from './sync-status-indicator';
import { PowerManagementIndicator } from './power-management-indicator';
import { ResponsiveDashboard } from './responsive-dashboard';

export function AppShell() {
  const { user } = useAuth();
  
  const handleSignOut = async () => {
    await authService.signOut();
  };
  const { context, isPerformance, isMobile } = useInterfaceContext();
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');

  // Get the component for the active module
  const ModuleComponent = useModuleComponent(activeModule);

  // Handle module changes
  const handleModuleChange = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
  };

  // Performance mode adjustments
  useEffect(() => {
    if (isPerformance) {
      document.body.classList.add('performance-mode');
    } else {
      document.body.classList.remove('performance-mode');
    }
    
    return () => {
      document.body.classList.remove('performance-mode');
    };
  }, [isPerformance]);

  return (
    <div className={`app-shell min-h-screen ${
      isPerformance 
        ? 'bg-black text-white' 
        : 'bg-gray-50 dark:bg-gray-900'
    }`}>
      {/* Header */}
      <header className={`
        sticky top-0 z-50 border-b
        ${isPerformance 
          ? 'bg-black border-white' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }
      `}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center gap-4">
              <h1 className={`font-bold ${
                isPerformance ? 'text-2xl' : 'text-xl'
              } text-gray-900 dark:text-gray-100`}>
                MEUGRIND
              </h1>
              
              {!isMobile && (
                <div className={`text-sm ${
                  isPerformance ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Offline-First Productivity System
                </div>
              )}
            </div>

            {/* User info and controls */}
            <div className="flex items-center gap-4">
              {!isPerformance && (
                <>
                  <SyncStatusIndicator />
                  <PowerManagementIndicator />
                </>
              )}
              
              <div className="flex items-center gap-2">
                <span className={`text-sm ${
                  isPerformance ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {user?.role === 'manager' ? '👑' : '👤'} {user?.email}
                </span>
                
                {!isPerformance && (
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Context switcher - only show when not in performance mode */}
      {!isPerformance && (
        <div className="container mx-auto px-4 py-2">
          <ContextSwitcher />
        </div>
      )}

      {/* Module navigation */}
      <div className="container mx-auto px-4 py-2">
        <ModuleNavigation 
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
        />
      </div>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-6">
        <div className={`
          ${isPerformance 
            ? 'bg-black text-white' 
            : 'bg-white dark:bg-gray-800'
          } 
          rounded-lg shadow-md min-h-[600px]
        `}>
          {activeModule === 'dashboard' ? (
            <div className="p-6">
              <ResponsiveDashboard />
            </div>
          ) : ModuleComponent ? (
            <div className="p-6">
              <ModuleComponent />
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                Module not found: {activeModule}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer - only show when not in performance mode */}
      {!isPerformance && (
        <footer className="container mx-auto px-4 py-6 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            MEUGRIND © 2024 - Offline-First Productivity System
          </div>
        </footer>
      )}
    </div>
  );
}