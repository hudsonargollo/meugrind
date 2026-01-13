'use client';

import React from 'react';
import { useAuth } from '../../hooks/use-auth';

interface EventVisibilitySelectorProps {
  value: 'manager_only' | 'fyi_only' | 'mandatory';
  onChange: (visibility: 'manager_only' | 'fyi_only' | 'mandatory') => void;
  disabled?: boolean;
}

export function EventVisibilitySelector({ 
  value, 
  onChange, 
  disabled = false 
}: EventVisibilitySelectorProps) {
  const { isManager } = useAuth();

  const visibilityOptions = [
    {
      value: 'mandatory' as const,
      label: 'Mandatory',
      description: 'Visible to both Manager and Personal accounts',
      icon: '🔴',
      available: true,
    },
    {
      value: 'fyi_only' as const,
      label: 'FYI Only',
      description: 'Visible to Personal account (read-only)',
      icon: '🔵',
      available: true,
    },
    {
      value: 'manager_only' as const,
      label: 'Manager Only',
      description: 'Only visible to Manager account',
      icon: '👑',
      available: isManager(),
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Event Visibility
      </label>
      <div className="space-y-2">
        {visibilityOptions.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-center p-3 border rounded-lg cursor-pointer transition-colors
              ${option.available 
                ? 'hover:bg-gray-50 border-gray-200' 
                : 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
              }
              ${value === option.value && option.available
                ? 'border-blue-500 bg-blue-50'
                : ''
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value as any)}
              disabled={disabled || !option.available}
              className="sr-only"
            />
            <span className="text-lg mr-3">{option.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-500">{option.description}</div>
              {!option.available && (
                <div className="text-xs text-red-500 mt-1">
                  Manager account required
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}