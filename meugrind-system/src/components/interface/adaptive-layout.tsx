'use client';

import React, { ReactNode } from 'react';
import { useInterfaceContext } from '../../hooks/use-interface-context';
import { ContextSwitcher } from './context-switcher';
import { SyncStatusIndicator } from './sync-status-indicator';

interface AdaptiveLayoutProps {
  children: ReactNode;
  showContextSwitcher?: boolean;
}

export function AdaptiveLayout({ children, showContextSwitcher = true }: AdaptiveLayoutProps) {
  const { 
    context, 
    isManager, 
    isPersonal, 
    isPerformance, 
    isMobile, 
    isTablet, 
    isDesktop 
  } = useInterfaceContext();

  // Performance mode styles - high contrast, larger text
  const performanceModeClasses = isPerformance ? 
    'bg-black text-white text-lg font-bold contrast-125' : 
    'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100';

  // Device-specific layout classes
  const deviceClasses = {
    mobile: 'px-2 py-2',
    tablet: 'px-4 py-3',
    desktop: 'px-6 py-4',
  };

  // Mode-specific layout configurations
  const layoutConfig = {
    manager: {
      sidebar: true,
      fullWidth: false,
      showMetrics: true,
      showFinancials: true,
    },
    personal: {
      sidebar: false,
      fullWidth: true,
      showMetrics: false,
      showFinancials: false,
    },
    performance: {
      sidebar: false,
      fullWidth: true,
      showMetrics: false,
      showFinancials: false,
    },
  };

  const config = layoutConfig[context.mode];

  return (
    <div className={`adaptive-layout min-h-screen ${performanceModeClasses}`}>
      {/* Context switcher and sync status */}
      {showContextSwitcher && !isPerformance && (
        <div className={`sticky top-0 z-50 ${deviceClasses[context.deviceType]}`}>
          <div className="flex justify-between items-start gap-4">
            <ContextSwitcher />
            <SyncStatusIndicator />
          </div>
        </div>
      )}

      {/* Performance mode sync status */}
      {isPerformance && (
        <div className="fixed top-4 left-4 z-50">
          <SyncStatusIndicator className="bg-black/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Main layout */}
      <div className={`flex ${config.sidebar ? 'gap-6' : ''} ${deviceClasses[context.deviceType]}`}>
        {/* Sidebar for Manager mode */}
        {config.sidebar && isDesktop && (
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <nav className="space-y-2">
                <NavItem icon="📊" label="Dashboard" active />
                <NavItem icon="📅" label="Calendar" />
                <NavItem icon="🎵" label="Band Management" />
                <NavItem icon="📱" label="Influencer CRM" />
                <NavItem icon="☀️" label="Solar Business" />
                <NavItem icon="🍅" label="Pomodoro Timer" />
                <NavItem icon="📺" label="PR Management" />
                {config.showFinancials && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <NavItem icon="💰" label="Financials" />
                    <NavItem icon="📋" label="Contracts" />
                  </>
                )}
              </nav>
            </div>
          </aside>
        )}

        {/* Main content area */}
        <main className={`flex-1 ${config.fullWidth ? 'w-full' : 'max-w-4xl'}`}>
          {children}
        </main>
      </div>

      {/* Performance mode overlay for critical info */}
      {isPerformance && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-bold">PERFORMANCE MODE</div>
          <div className="text-xs">Notifications suppressed</div>
        </div>
      )}

      {/* Mobile navigation for non-performance modes */}
      {isMobile && !isPerformance && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex justify-around">
            <MobileNavItem icon="📊" label="Home" />
            <MobileNavItem icon="📅" label="Calendar" />
            <MobileNavItem icon="🎵" label="Band" />
            <MobileNavItem icon="📱" label="Social" />
            <MobileNavItem icon="⚙️" label="Settings" />
          </div>
        </nav>
      )}
    </div>
  );
}

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${active
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors
        ${active
          ? 'text-blue-600'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}