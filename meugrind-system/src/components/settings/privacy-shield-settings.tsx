'use client';

import React, { useState } from 'react';
import { PrivacyShieldSettings } from '../../types';

interface PrivacyShieldSettingsProps {
  settings: PrivacyShieldSettings;
  onChange: (settings: PrivacyShieldSettings) => void;
  disabled?: boolean;
}

export function PrivacyShieldSettingsComponent({ 
  settings, 
  onChange, 
  disabled = false 
}: PrivacyShieldSettingsProps) {
  const [newViewerEmail, setNewViewerEmail] = useState('');

  const handleToggle = (field: keyof PrivacyShieldSettings, value: boolean) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  const handleAddViewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newViewerEmail.trim() && !settings.allowedViewers.includes(newViewerEmail.trim())) {
      onChange({
        ...settings,
        allowedViewers: [...settings.allowedViewers, newViewerEmail.trim()],
      });
      setNewViewerEmail('');
    }
  };

  const handleRemoveViewer = (email: string) => {
    onChange({
      ...settings,
      allowedViewers: settings.allowedViewers.filter(viewer => viewer !== email),
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🛡️</span>
        <h3 className="text-lg font-semibold text-gray-900">Privacy Shield Settings</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Control how your personal events appear to other users, especially Manager accounts.
      </p>

      <div className="space-y-4">
        {/* Enable Privacy Shield */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Enable Privacy Shield</h4>
            <p className="text-sm text-gray-500">
              When enabled, personal events can be hidden from other users
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleToggle('enabled', e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className={`
              relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
              peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full 
              peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
              after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `} />
          </label>
        </div>

        {settings.enabled && (
          <>
            {/* Hide Personal Details */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Hide Personal Details</h4>
                <p className="text-sm text-gray-500">
                  Hide event titles and descriptions from other users
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.hidePersonalDetails}
                  onChange={(e) => handleToggle('hidePersonalDetails', e.target.checked)}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className={`
                  relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                  peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full 
                  peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                  after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                  after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `} />
              </label>
            </div>

            {/* Show as Busy */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Show as Busy</h4>
                <p className="text-sm text-gray-500">
                  Display shielded events as &quot;Busy&quot; instead of hiding them completely
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showAsBusy}
                  onChange={(e) => handleToggle('showAsBusy', e.target.checked)}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className={`
                  relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                  peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full 
                  peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                  after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                  after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `} />
              </label>
            </div>

            {/* Allowed Viewers */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Allowed Viewers</h4>
              <p className="text-sm text-gray-500 mb-4">
                Users who can see through your privacy shield
              </p>
              
              <form onSubmit={handleAddViewer} className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newViewerEmail}
                  onChange={(e) => setNewViewerEmail(e.target.value)}
                  placeholder="Enter email address"
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={disabled || !newViewerEmail.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              {settings.allowedViewers.length > 0 ? (
                <div className="space-y-2">
                  {settings.allowedViewers.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        onClick={() => handleRemoveViewer(email)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No allowed viewers added yet
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}