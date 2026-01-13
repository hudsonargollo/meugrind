'use client';

import React, { useState } from 'react';
import { useInterfaceContext } from '../../hooks/use-interface-context';
import { useAuth } from '../../hooks/use-auth';

// Import all module components
import { BandManagement } from '../band/band-management';
import { InfluencerManagement } from '../influencer/influencer-management';
import { SolarManagement } from '../solar/solar-management';
import { PomodoroManagement } from '../pomodoro/pomodoro-management';
import { PRManagement } from '../pr/pr-management';
import { PersonalDashboard } from '../personal/personal-dashboard';

export type ModuleId = 'dashboard' | 'band' | 'influencer' | 'solar' | 'pomodoro' | 'pr' | 'personal';

interface Module {
  id: ModuleId;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType;
  roles: ('manager' | 'personal')[];
  featured?: boolean;
}

const modules: Module[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: '🏠',
    description: 'Overview and quick actions',
    component: () => <div>Dashboard content will be rendered by parent</div>,
    roles: ['manager', 'personal'],
    featured: true,
  },
  {
    id: 'band',
    name: 'Band Management',
    icon: '🎵',
    description: 'Setlists, tech riders, and crew coordination',
    component: BandManagement,
    roles: ['manager', 'personal'],
    featured: true,
  },
  {
    id: 'influencer',
    name: 'Influencer CRM',
    icon: '📱',
    description: 'Brand deals, content pipeline, and campaigns',
    component: InfluencerManagement,
    roles: ['manager', 'personal'],
    featured: true,
  },
  {
    id: 'solar',
    name: 'Solar Business',
    icon: '☀️',
    description: 'Lead management and project tracking',
    component: SolarManagement,
    roles: ['manager', 'personal'],
    featured: true,
  },
  {
    id: 'pomodoro',
    name: 'Focus Timer',
    icon: '🍅',
    description: 'Pomodoro timer and productivity tracking',
    component: PomodoroManagement,
    roles: ['manager', 'personal'],
  },
  {
    id: 'pr',
    name: 'PR Management',
    icon: '📺',
    description: 'Appearance windows and PR events',
    component: PRManagement,
    roles: ['manager'],
  },
  {
    id: 'personal',
    name: 'Personal Space',
    icon: '👤',
    description: 'Personal tasks and study tracking',
    component: PersonalDashboard,
    roles: ['personal'],
  },
];

interface ModuleNavigationProps {
  activeModule: ModuleId;
  onModuleChange: (moduleId: ModuleId) => void;
  className?: string;
}

export function ModuleNavigation({ activeModule, onModuleChange, className = '' }: ModuleNavigationProps) {
  const { context, isManager, isPersonal, isPerformance, isMobile } = useInterfaceContext();
  const { user } = useAuth();

  // Filter modules based on user role
  const availableModules = modules.filter(module => 
    module.roles.includes(context.mode as 'manager' | 'personal')
  );

  // In performance mode, only show featured modules
  const visibleModules = isPerformance 
    ? availableModules.filter(module => module.featured)
    : availableModules;

  if (isMobile) {
    return (
      <MobileNavigation 
        modules={visibleModules}
        activeModule={activeModule}
        onModuleChange={onModuleChange}
        className={className}
      />
    );
  }

  return (
    <DesktopNavigation 
      modules={visibleModules}
      activeModule={activeModule}
      onModuleChange={onModuleChange}
      className={className}
    />
  );
}

interface NavigationProps {
  modules: Module[];
  activeModule: ModuleId;
  onModuleChange: (moduleId: ModuleId) => void;
  className?: string;
}

function DesktopNavigation({ modules, activeModule, onModuleChange, className }: NavigationProps) {
  const { isPerformance } = useInterfaceContext();

  return (
    <nav className={`desktop-navigation ${className}`}>
      <div className={`
        flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md
        ${isPerformance ? 'border-2 border-white' : ''}
      `}>
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200
              ${activeModule === module.id
                ? isPerformance 
                  ? 'bg-white text-black font-bold'
                  : 'bg-blue-600 text-white shadow-md'
                : isPerformance
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
              ${isPerformance ? 'text-lg' : 'text-sm'}
            `}
            title={module.description}
          >
            <span className={isPerformance ? 'text-2xl' : 'text-lg'}>{module.icon}</span>
            <div className="text-left">
              <div className={`font-medium ${isPerformance ? 'text-lg' : 'text-sm'}`}>
                {module.name}
              </div>
              {!isPerformance && (
                <div className="text-xs opacity-75">
                  {module.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}

function MobileNavigation({ modules, activeModule, onModuleChange, className }: NavigationProps) {
  const { isPerformance } = useInterfaceContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeModuleData = modules.find(m => m.id === activeModule);

  return (
    <nav className={`mobile-navigation ${className}`}>
      {/* Current module header */}
      <div className={`
        flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md
        ${isPerformance ? 'border-2 border-white' : ''}
      `}>
        <div className="flex items-center gap-3">
          <span className={isPerformance ? 'text-2xl' : 'text-lg'}>
            {activeModuleData?.icon}
          </span>
          <div>
            <div className={`font-medium ${isPerformance ? 'text-lg' : 'text-sm'}`}>
              {activeModuleData?.name}
            </div>
            {!isPerformance && (
              <div className="text-xs text-gray-500">
                {activeModuleData?.description}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            p-2 rounded-md transition-colors
            ${isPerformance 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          <span className={isPerformance ? 'text-xl' : 'text-lg'}>
            {isExpanded ? '✕' : '☰'}
          </span>
        </button>
      </div>

      {/* Expanded module list */}
      {isExpanded && (
        <div className={`
          mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md
          ${isPerformance ? 'border-2 border-white' : ''}
        `}>
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => {
                onModuleChange(module.id);
                setIsExpanded(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 mb-1
                ${activeModule === module.id
                  ? isPerformance 
                    ? 'bg-white text-black font-bold'
                    : 'bg-blue-600 text-white'
                  : isPerformance
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className={isPerformance ? 'text-xl' : 'text-lg'}>{module.icon}</span>
              <div className="text-left">
                <div className={`font-medium ${isPerformance ? 'text-base' : 'text-sm'}`}>
                  {module.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// Hook to get module component
export function useModuleComponent(moduleId: ModuleId): React.ComponentType | null {
  const foundModule = modules.find(m => m.id === moduleId);
  return foundModule?.component || null;
}

// Export modules for external use
export { modules };