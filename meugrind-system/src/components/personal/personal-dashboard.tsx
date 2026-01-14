'use client';

import React from 'react';
import { MyGrindWidget } from './my-grind-widget';
import { StudyTracker } from './study-tracker';
import { useAuth } from '../../hooks/use-auth';
import { useInterfaceContext } from '../../hooks/use-interface-context';

interface PersonalDashboardProps {
  className?: string;
}

export function PersonalDashboard({ className }: PersonalDashboardProps) {
  const { user, hasRole } = useAuth();
  const isPersonal = hasRole('personal');
  const { isMobile, isTablet } = useInterfaceContext();

  if (!isPersonal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Personal dashboard is only available for Personal accounts.</p>
      </div>
    );
  }

  // Responsive layout based on device type
  const gridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 xl:grid-cols-2';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Personal Dashboard</h1>
        <p className="text-gray-600">
          Your focused workspace for immediate actions and learning progress.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className={`grid ${gridCols} gap-6`}>
        {/* My Grind Widget - Always first on mobile, left side on larger screens */}
        <div className="order-1">
          <MyGrindWidget />
        </div>

        {/* Study Tracker - Second on mobile, right side on larger screens */}
        <div className="order-2">
          <StudyTracker />
        </div>
      </div>

      {/* Additional widgets can be added here in the future */}
      <div className="grid grid-cols-1 gap-6">
        {/* Placeholder for future widgets like:
            - Quick Pomodoro Timer
            - Recent Activity Feed
            - Upcoming Events (filtered for Personal view)
            - Weekly Goals Summary
        */}
      </div>
    </div>
  );
}