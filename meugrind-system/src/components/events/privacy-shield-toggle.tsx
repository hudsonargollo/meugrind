'use client';

import React from 'react';

interface PrivacyShieldToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  eventType?: string;
}

export function PrivacyShieldToggle({ 
  enabled, 
  onChange, 
  disabled = false,
  eventType 
}: PrivacyShieldToggleProps) {
  const isPersonalEvent = eventType === 'personal';

  if (!isPersonalEvent) {
    return null; // Privacy shield only applies to personal events
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <h3 className="font-medium text-gray-900">Privacy Shield</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          When enabled, this personal time block will appear as &quot;Busy&quot; to Manager account
        </p>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`
          relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
          peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer 
          dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
          after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
          after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
          after:transition-all dark:border-gray-600 peer-checked:bg-blue-600
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `} />
      </label>
    </div>
  );
}