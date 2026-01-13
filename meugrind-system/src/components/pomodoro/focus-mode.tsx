'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { 
  Shield, 
  Bell, 
  BellOff, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX,
  Smartphone,
  Monitor,
  Settings
} from 'lucide-react';
import { pomodoroService } from '../../lib/pomodoro-service';
import { FocusMode as FocusModeType, PomodoroSession } from '../../types/pomodoro';

interface FocusModeProps {
  currentSession?: PomodoroSession | null;
  onFocusModeChange?: (isActive: boolean) => void;
}

export function FocusMode({ currentSession, onFocusModeChange }: FocusModeProps) {
  const [focusMode, setFocusMode] = useState<FocusModeType | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    allowUrgentNotifications: true,
    whitelistedContacts: [] as string[],
    breakReminders: true,
    ambientSounds: false,
    soundType: 'nature' as 'nature' | 'white_noise' | 'binaural' | 'silence',
    dimScreen: true,
    hideDistractions: true,
    blockSocialMedia: false
  });

  useEffect(() => {
    // Check current focus mode
    const currentFocusMode = pomodoroService.getFocusMode();
    setFocusMode(currentFocusMode);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Load focus mode settings
    loadSettings();
  }, []);

  useEffect(() => {
    // Update focus mode when session changes
    const currentFocusMode = pomodoroService.getFocusMode();
    setFocusMode(currentFocusMode);
    onFocusModeChange?.(currentFocusMode?.isActive || false);
  }, [currentSession, onFocusModeChange]);

  const loadSettings = () => {
    const saved = localStorage.getItem('focusModeSettings');
    if (saved) {
      setSettings({ ...settings, ...JSON.parse(saved) });
    }
  };

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('focusModeSettings', JSON.stringify(newSettings));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  const activateFocusMode = async () => {
    // Request notification permission if needed
    if (notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Notification permission is required for focus mode features');
        return;
      }
    }

    // Apply focus mode settings
    applyFocusSettings(true);

    // Show focus mode notification
    if (settings.allowUrgentNotifications) {
      new Notification('Focus Mode Activated', {
        body: 'Distractions will be minimized. Only urgent notifications will be shown.',
        icon: '/icon-192x192.png',
        tag: 'focus-mode'
      });
    }
  };

  const deactivateFocusMode = () => {
    // Remove focus mode settings
    applyFocusSettings(false);

    // Show deactivation notification
    if (notificationPermission === 'granted') {
      new Notification('Focus Mode Deactivated', {
        body: 'All notifications have been restored.',
        icon: '/icon-192x192.png',
        tag: 'focus-mode'
      });
    }
  };

  const applyFocusSettings = (activate: boolean) => {
    if (activate) {
      // Apply visual changes
      if (settings.dimScreen) {
        document.body.style.filter = 'brightness(0.8)';
      }

      if (settings.hideDistractions) {
        // Hide non-essential UI elements
        const distractionElements = document.querySelectorAll('[data-distraction="true"]');
        distractionElements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      }

      // Block social media (basic implementation)
      if (settings.blockSocialMedia) {
        blockSocialMediaSites();
      }

      // Start ambient sounds if enabled
      if (settings.ambientSounds) {
        playAmbientSounds(settings.soundType);
      }
    } else {
      // Restore normal settings
      document.body.style.filter = '';
      
      // Restore hidden elements
      const distractionElements = document.querySelectorAll('[data-distraction="true"]');
      distractionElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });

      // Stop ambient sounds
      stopAmbientSounds();
    }
  };

  const blockSocialMediaSites = () => {
    // This is a basic implementation - in a real app, you might use browser extensions or system-level blocking
    const socialMediaDomains = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'tiktok.com',
      'youtube.com',
      'reddit.com'
    ];

    // Show warning if user tries to navigate to social media
    const originalOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string) {
      if (url && socialMediaDomains.some(domain => url.toString().includes(domain))) {
        alert('Social media is blocked during focus mode');
        return null;
      }
      return originalOpen.call(window, url, target, features);
    };
  };

  const playAmbientSounds = (soundType: string) => {
    // In a real implementation, you would load and play audio files
    console.log(`Playing ${soundType} ambient sounds`);
  };

  const stopAmbientSounds = () => {
    // Stop any playing ambient sounds
    console.log('Stopping ambient sounds');
  };

  const handleBreakReminder = () => {
    if (settings.breakReminders && currentSession) {
      const timeRemaining = pomodoroService.getTimeRemaining();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeRemaining <= fiveMinutes && timeRemaining > 0) {
        new Notification('Break Reminder', {
          body: `${Math.ceil(timeRemaining / 60000)} minutes remaining in your focus session`,
          icon: '/icon-192x192.png',
          tag: 'break-reminder'
        });
      }
    }
  };

  // Set up break reminders
  useEffect(() => {
    if (focusMode?.isActive && settings.breakReminders) {
      const interval = setInterval(handleBreakReminder, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [focusMode, settings.breakReminders, currentSession]);

  const formatDuration = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Focus Mode Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Focus Mode
            {focusMode?.isActive && (
              <Badge variant="default" className="bg-green-600">
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {focusMode?.isActive ? (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Focus mode is active</span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Active for {formatDuration(focusMode.startTime)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {focusMode.suppressNotifications ? (
                    <BellOff className="h-4 w-4 text-red-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-green-600" />
                  )}
                  <span>
                    {focusMode.suppressNotifications ? 'Notifications suppressed' : 'Notifications allowed'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {settings.ambientSounds ? (
                    <Volume2 className="h-4 w-4 text-blue-600" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-gray-600" />
                  )}
                  <span>
                    {settings.ambientSounds ? `${settings.soundType} sounds` : 'No ambient sounds'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {settings.hideDistractions ? (
                    <EyeOff className="h-4 w-4 text-purple-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-600" />
                  )}
                  <span>
                    {settings.hideDistractions ? 'Distractions hidden' : 'Normal view'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {settings.blockSocialMedia ? (
                    <Smartphone className="h-4 w-4 text-red-600" />
                  ) : (
                    <Monitor className="h-4 w-4 text-gray-600" />
                  )}
                  <span>
                    {settings.blockSocialMedia ? 'Social media blocked' : 'All sites allowed'}
                  </span>
                </div>
              </div>

              <Button 
                onClick={deactivateFocusMode} 
                variant="outline" 
                className="w-full"
              >
                Deactivate Focus Mode
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-gray-600">
                Focus mode helps minimize distractions during your Pomodoro sessions.
              </div>

              {notificationPermission !== 'granted' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    Notification permission is required for focus mode features.
                  </div>
                  <Button 
                    onClick={requestNotificationPermission}
                    size="sm"
                    className="mt-2"
                  >
                    Grant Permission
                  </Button>
                </div>
              )}

              <Button 
                onClick={activateFocusMode} 
                className="w-full"
                disabled={!currentSession}
              >
                {currentSession ? 'Activate Focus Mode' : 'Start a session to enable focus mode'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Focus Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Focus Mode Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowUrgent">Allow urgent notifications</Label>
              <input
                type="checkbox"
                id="allowUrgent"
                checked={settings.allowUrgentNotifications}
                onChange={(e) => saveSettings({ 
                  ...settings, 
                  allowUrgentNotifications: e.target.checked 
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="breakReminders">Break reminders</Label>
              <input
                type="checkbox"
                id="breakReminders"
                checked={settings.breakReminders}
                onChange={(e) => saveSettings({ 
                  ...settings, 
                  breakReminders: e.target.checked 
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ambientSounds">Ambient sounds</Label>
              <input
                type="checkbox"
                id="ambientSounds"
                checked={settings.ambientSounds}
                onChange={(e) => saveSettings({ 
                  ...settings, 
                  ambientSounds: e.target.checked 
                })}
              />
            </div>

            {settings.ambientSounds && (
              <div className="ml-4">
                <Label htmlFor="soundType">Sound type</Label>
                <select
                  id="soundType"
                  value={settings.soundType}
                  onChange={(e) => saveSettings({ 
                    ...settings, 
                    soundType: e.target.value as any 
                  })}
                  className="w-full p-2 border rounded"
                >
                  <option value="nature">Nature sounds</option>
                  <option value="white_noise">White noise</option>
                  <option value="binaural">Binaural beats</option>
                  <option value="silence">Silence</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="dimScreen">Dim screen</Label>
              <input
                type="checkbox"
                id="dimScreen"
                checked={settings.dimScreen}
                onChange={(e) => saveSettings({ 
                  ...settings, 
                  dimScreen: e.target.checked 
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hideDistractions">Hide distractions</Label>
              <input
                type="checkbox"
                id="hideDistractions"
                checked={settings.hideDistractions}
                onChange={(e) => saveSettings({ 
                  ...settings, 
                  hideDistractions: e.target.checked 
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="blockSocialMedia">Block social media</Label>
              <input
                type="checkbox"
                id="blockSocialMedia"
                checked={settings.blockSocialMedia}
                onChange={(e) => saveSettings({ 
                  ...settings, 
                  blockSocialMedia: e.target.checked 
                })}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
            <strong>Focus Mode Features:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Suppresses non-urgent notifications</li>
              <li>• Dims screen to reduce eye strain</li>
              <li>• Hides distracting UI elements</li>
              <li>• Optional ambient sounds for concentration</li>
              <li>• Break reminders to maintain healthy work patterns</li>
              <li>• Social media blocking (basic implementation)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}