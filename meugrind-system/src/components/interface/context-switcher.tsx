'use client';

import React from 'react';
import { useInterfaceContext } from '../../hooks/use-interface-context';
import { useAuth } from '../../hooks/use-auth';

interface ContextSwitcherProps {
  className?: string;
}

export function ContextSwitcher({ className = '' }: ContextSwitcherProps) {
  const { context, setMode, isManager, isPersonal, isPerformance } = useInterfaceContext();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const modes = [
    {
      id: 'manager' as const,
      label: 'Manager',
      description: 'Full business dashboard with financials and contracts',
      icon: '👔',
      active: isManager,
    },
    {
      id: 'personal' as const,
      label: 'Personal',
      description: 'Execution-focused view with task management',
      icon: '🎯',
      active: isPersonal,
    },
    {
      id: 'performance' as const,
      label: 'Performance',
      description: 'High-contrast mode for stage and live events',
      icon: '🎤',
      active: isPerformance,
    },
  ];

  return (
    <div className={`context-switcher ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 sm:mr-4 flex items-center">
          Interface Mode:
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${mode.active
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
              title={mode.description}
            >
              <span className="text-lg">{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Device and connectivity indicators */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span>📱</span>
          <span className="capitalize">{context.deviceType}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className={context.connectivity === 'online' ? '🟢' : context.connectivity === 'offline' ? '🔴' : '🟡'}>
          </span>
          <span className="capitalize">{context.connectivity}</span>
        </div>
        
        {context.batteryLevel !== undefined && (
          <div className="flex items-center gap-1">
            <span>🔋</span>
            <span>{context.batteryLevel}%</span>
          </div>
        )}
      </div>
    </div>
  );
}