'use client';

import React, { useState, useEffect } from 'react';
import { useInterfaceContext } from '../../hooks/use-interface-context';
import { useAuth } from '../../hooks/use-auth';
import { useUnifiedData } from '../../hooks/use-unified-data';
import { OptimisticButton } from './optimistic-action-wrapper';

interface DashboardWidget {
  id: string;
  title: string;
  content: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  roles: ('manager' | 'personal')[];
  deviceTypes: ('mobile' | 'tablet' | 'desktop')[];
}

export function ResponsiveDashboard() {
  const { context, isManager, isPersonal, isPerformance, isMobile, isTablet } = useInterfaceContext();
  const { user } = useAuth();

  // Define dashboard widgets
  const widgets: DashboardWidget[] = [
    {
      id: 'my-grind',
      title: 'My Grind',
      content: <MyGrindWidget />,
      priority: 'high',
      roles: ['personal'],
      deviceTypes: ['mobile', 'tablet', 'desktop'],
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      content: <QuickActionsWidget />,
      priority: 'high',
      roles: ['manager', 'personal'],
      deviceTypes: ['mobile', 'tablet', 'desktop'],
    },
    {
      id: 'upcoming-events',
      title: 'Upcoming Events',
      content: <UpcomingEventsWidget />,
      priority: 'high',
      roles: ['manager', 'personal'],
      deviceTypes: ['tablet', 'desktop'],
    },
    {
      id: 'sync-status',
      title: 'Sync Status',
      content: <SyncStatusWidget />,
      priority: 'medium',
      roles: ['manager', 'personal'],
      deviceTypes: ['desktop'],
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      content: <PerformanceMetricsWidget />,
      priority: 'medium',
      roles: ['manager'],
      deviceTypes: ['tablet', 'desktop'],
    },
    {
      id: 'financial-overview',
      title: 'Financial Overview',
      content: <FinancialOverviewWidget />,
      priority: 'low',
      roles: ['manager'],
      deviceTypes: ['desktop'],
    },
  ];

  // Filter widgets based on current context
  const visibleWidgets = widgets.filter(widget => {
    // Check role permissions
    if (!widget.roles.includes(context.mode as 'manager' | 'personal')) {
      return false;
    }

    // Check device compatibility
    if (!widget.deviceTypes.includes(context.deviceType)) {
      return false;
    }

    // Performance mode only shows critical widgets
    if (isPerformance && widget.priority !== 'high') {
      return false;
    }

    return true;
  });

  // Sort widgets by priority
  const sortedWidgets = visibleWidgets.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Determine grid layout based on device and mode
  const getGridClasses = () => {
    if (isPerformance) {
      return 'grid-cols-1 gap-4';
    }
    
    if (isMobile) {
      return 'grid-cols-1 gap-3';
    }
    
    if (isTablet) {
      return 'grid-cols-2 gap-4';
    }
    
    // Desktop
    return isManager ? 'grid-cols-3 gap-6' : 'grid-cols-2 gap-4';
  };

  return (
    <div className="responsive-dashboard">
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className={`font-bold ${isPerformance ? 'text-3xl' : 'text-2xl'} text-gray-900 dark:text-gray-100`}>
          {isManager && 'Manager Dashboard'}
          {isPersonal && 'Personal Workspace'}
          {isPerformance && 'PERFORMANCE MODE'}
        </h1>
        
        {user && (
          <p className={`${isPerformance ? 'text-lg' : 'text-sm'} text-gray-600 dark:text-gray-400 mt-1`}>
            Welcome back, {user.email}
          </p>
        )}
      </div>

      {/* Widget grid */}
      <div className={`grid ${getGridClasses()}`}>
        {sortedWidgets.map(widget => (
          <div
            key={widget.id}
            className={`
              widget bg-white dark:bg-gray-800 rounded-lg shadow-md p-4
              ${isPerformance ? 'border-2 border-white' : ''}
            `}
          >
            <h3 className={`font-semibold ${isPerformance ? 'text-xl' : 'text-lg'} mb-3 text-gray-900 dark:text-gray-100`}>
              {widget.title}
            </h3>
            {widget.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget components
function MyGrindWidget() {
  const { isPerformance } = useInterfaceContext();
  const { getDashboardData } = useUnifiedData();
  const { user } = useAuth();
  const [nextActions, setNextActions] = useState<string[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user?.role) {
        try {
          const data = await getDashboardData(user.role);
          if (data?.tasks) {
            const actionTexts = data.tasks.slice(0, 3).map(task => task.title);
            setNextActions(actionTexts);
          }
        } catch (error) {
          console.error('Failed to load dashboard data:', error);
          // Fallback to static data
          setNextActions([
            'Review setlist for tonight\'s gig',
            'Upload content for Brand X campaign',
            'Follow up with solar lead - John Smith',
          ]);
        }
      }
    };

    loadDashboardData();
  }, [getDashboardData, user?.role]);

  return (
    <div className="space-y-2">
      <p className={`${isPerformance ? 'text-lg' : 'text-sm'} text-gray-600 dark:text-gray-400 mb-3`}>
        Next 3 immediate actions:
      </p>
      {nextActions.map((action, index) => (
        <div
          key={index}
          className={`
            flex items-center gap-2 p-2 rounded-md
            ${isPerformance ? 'bg-gray-800 text-white' : 'bg-gray-50 dark:bg-gray-700'}
          `}
        >
          <span className="text-blue-600 font-bold">{index + 1}.</span>
          <span className={isPerformance ? 'text-lg' : 'text-sm'}>{action}</span>
        </div>
      ))}
    </div>
  );
}

function QuickActionsWidget() {
  const { isPerformance, isMobile } = useInterfaceContext();
  
  const actions = [
    { 
      icon: '➕', 
      label: 'Add Event', 
      action: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Event added');
      }
    },
    { 
      icon: '📝', 
      label: 'New Task', 
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('Task created');
      }
    },
    { 
      icon: '🍅', 
      label: 'Start Pomodoro', 
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Pomodoro started');
      }
    },
    { 
      icon: '📊', 
      label: 'View Reports', 
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        console.log('Reports loaded');
      }
    },
  ];

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
      {actions.map((action, index) => (
        <OptimisticButton
          key={index}
          onClick={action.action}
          entityType="quick_action"
          entityId={`action_${index}`}
          actionType="create"
          className={`
            flex flex-col items-center gap-1 p-3 rounded-md transition-colors
            ${isPerformance 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }
          `}
          variant="secondary"
        >
          <span className={isPerformance ? 'text-2xl' : 'text-xl'}>{action.icon}</span>
          <span className={`${isPerformance ? 'text-sm' : 'text-xs'} font-medium`}>
            {action.label}
          </span>
        </OptimisticButton>
      ))}
    </div>
  );
}

function UpcomingEventsWidget() {
  const { isPerformance } = useInterfaceContext();
  
  return (
    <div className="space-y-2">
      <div className={`p-2 rounded-md ${isPerformance ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
        <div className="flex justify-between items-center">
          <span className={`font-medium ${isPerformance ? 'text-lg' : 'text-sm'}`}>
            Band Rehearsal
          </span>
          <span className={`${isPerformance ? 'text-base' : 'text-xs'} text-gray-500`}>
            Today 7:00 PM
          </span>
        </div>
      </div>
      
      <div className={`p-2 rounded-md ${isPerformance ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
        <div className="flex justify-between items-center">
          <span className={`font-medium ${isPerformance ? 'text-lg' : 'text-sm'}`}>
            Content Review Call
          </span>
          <span className={`${isPerformance ? 'text-base' : 'text-xs'} text-gray-500`}>
            Tomorrow 2:00 PM
          </span>
        </div>
      </div>
    </div>
  );
}

function SyncStatusWidget() {
  const { context } = useInterfaceContext();
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${
        context.connectivity === 'online' ? 'bg-green-500' : 
        context.connectivity === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
      }`}></div>
      <span className="text-sm">
        {context.connectivity === 'online' ? 'All synced' : 
         context.connectivity === 'offline' ? 'Offline mode' : 'Limited connectivity'}
      </span>
    </div>
  );
}

function PerformanceMetricsWidget() {
  const { getDashboardData } = useUnifiedData();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    contentViews: '4.2M today',
    engagementRate: '8.5%',
    solarLeads: '12 this week',
  });

  useEffect(() => {
    const loadMetrics = async () => {
      if (user?.role === 'manager') {
        try {
          const data = await getDashboardData('manager');
          if (data?.stats) {
            setMetrics({
              contentViews: `${data.stats.modules.influencer.activeCampaigns} active campaigns`,
              engagementRate: `${data.stats.tasks.completed}/${data.stats.tasks.total} tasks done`,
              solarLeads: `${data.stats.modules.solar.activeProjects} active projects`,
            });
          }
        } catch (error) {
          console.error('Failed to load performance metrics:', error);
        }
      }
    };

    loadMetrics();
  }, [getDashboardData, user?.role]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Content Views</span>
        <span className="font-semibold">{metrics.contentViews}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</span>
        <span className="font-semibold">{metrics.engagementRate}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Solar Leads</span>
        <span className="font-semibold">{metrics.solarLeads}</span>
      </div>
    </div>
  );
}

function FinancialOverviewWidget() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</span>
        <span className="font-semibold text-green-600">$45,200</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Pending Invoices</span>
        <span className="font-semibold text-orange-600">$12,800</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Expenses</span>
        <span className="font-semibold text-red-600">$8,400</span>
      </div>
    </div>
  );
}