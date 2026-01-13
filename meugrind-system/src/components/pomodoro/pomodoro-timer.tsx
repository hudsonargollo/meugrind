'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Play, Pause, Square, Settings, Timer, Coffee } from 'lucide-react';
import { pomodoroService } from '../../lib/pomodoro-service';
import { PomodoroSession, PomodoroSettings } from '../../types/pomodoro';

interface PomodoroTimerProps {
  onSessionComplete?: (session: PomodoroSession) => void;
  onSessionStart?: (session: PomodoroSession) => void;
}

export function PomodoroTimer({ onSessionComplete, onSessionStart }: PomodoroTimerProps) {
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [taskCategory, setTaskCategory] = useState('');
  const [projectId, setProjectId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PomodoroSettings>(pomodoroService.getSettings());
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
  const [completedSessions, setCompletedSessions] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPaused && currentSession) {
      interval = setInterval(() => {
        const remaining = pomodoroService.getTimeRemaining();
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          handleSessionComplete();
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, currentSession]);

  // Load current session on mount
  useEffect(() => {
    const session = pomodoroService.getCurrentSession();
    if (session) {
      setCurrentSession(session);
      setIsRunning(true);
      setTimeRemaining(pomodoroService.getTimeRemaining());
      setTaskCategory(session.taskCategory);
      setProjectId(session.projectId || '');
    }
  }, []);

  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleStartSession = async () => {
    if (!taskCategory.trim()) {
      alert('Please enter a task category');
      return;
    }

    try {
      const session = await pomodoroService.startSession(
        taskCategory.trim(),
        projectId.trim() || undefined
      );
      
      setCurrentSession(session);
      setIsRunning(true);
      setIsPaused(false);
      setSessionType('work');
      setTimeRemaining(session.duration * 60 * 1000);
      
      onSessionStart?.(session);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Please try again.');
    }
  };

  const handlePauseSession = async () => {
    if (!currentSession) return;

    try {
      await pomodoroService.pauseSession();
      setIsPaused(true);
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  };

  const handleResumeSession = async () => {
    if (!currentSession) return;

    try {
      await pomodoroService.resumeSession();
      setIsPaused(false);
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  };

  const handleStopSession = async () => {
    if (!currentSession) return;

    try {
      await pomodoroService.cancelSession();
      resetTimer();
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const handleSessionComplete = async () => {
    if (!currentSession) return;

    try {
      const completedSession = await pomodoroService.completeSession();
      
      if (sessionType === 'work') {
        setCompletedSessions(prev => prev + 1);
        
        // Determine break type
        const newCompletedCount = completedSessions + 1;
        const isLongBreak = newCompletedCount % settings.sessionsUntilLongBreak === 0;
        const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
        
        if (settings.autoStartBreaks) {
          startBreak(breakDuration);
        } else {
          resetTimer();
          alert(`Work session complete! ${isLongBreak ? 'Long' : 'Short'} break time (${breakDuration} minutes)`);
        }
      } else {
        // Break completed
        if (settings.autoStartSessions) {
          resetTimer();
          // Auto-start next work session
          setTimeout(() => {
            if (taskCategory) {
              handleStartSession();
            }
          }, 1000);
        } else {
          resetTimer();
          alert('Break complete! Ready for next work session.');
        }
      }
      
      onSessionComplete?.(completedSession);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const startBreak = (duration: number) => {
    setSessionType('break');
    setTimeRemaining(duration * 60 * 1000);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentSession({
      ...currentSession!,
      duration,
      startTime: new Date()
    });
  };

  const resetTimer = () => {
    setCurrentSession(null);
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setSessionType('work');
  };

  const handleSettingsUpdate = (newSettings: Partial<PomodoroSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    pomodoroService.updateSettings(newSettings);
  };

  const getTimerColor = () => {
    if (sessionType === 'break') return 'text-green-600';
    if (timeRemaining < 5 * 60 * 1000) return 'text-red-600'; // Last 5 minutes
    return 'text-blue-600';
  };

  const getSessionIcon = () => {
    return sessionType === 'work' ? <Timer className="h-6 w-6" /> : <Coffee className="h-6 w-6" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSessionIcon()}
            Pomodoro Timer
            <Badge variant={sessionType === 'work' ? 'default' : 'secondary'}>
              {sessionType === 'work' ? 'Work Session' : 'Break Time'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
              {formatTime(timeRemaining)}
            </div>
            {currentSession && (
              <div className="text-sm text-gray-600 mt-2">
                {sessionType === 'work' ? currentSession.taskCategory : 'Break Time'}
              </div>
            )}
          </div>

          {/* Session Setup */}
          {!currentSession && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskCategory">Task Category *</Label>
                <Input
                  id="taskCategory"
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  placeholder="e.g., Development, Writing, Study"
                />
              </div>
              <div>
                <Label htmlFor="projectId">Project (Optional)</Label>
                <Input
                  id="projectId"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="e.g., Website Redesign, Blog Post"
                />
              </div>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex justify-center gap-2">
            {!currentSession ? (
              <Button onClick={handleStartSession} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Session
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button onClick={handleResumeSession} className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={handlePauseSession} variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleStopSession} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Session Stats */}
          <div className="flex justify-center gap-4 text-sm text-gray-600">
            <span>Sessions Today: {completedSessions}</span>
            <span>•</span>
            <span>Work: {settings.workDuration}min</span>
            <span>•</span>
            <span>Break: {settings.shortBreakDuration}min</span>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Timer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workDuration">Work Duration (minutes)</Label>
                <Input
                  id="workDuration"
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => handleSettingsUpdate({ workDuration: parseInt(e.target.value) || 25 })}
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <Label htmlFor="shortBreakDuration">Short Break (minutes)</Label>
                <Input
                  id="shortBreakDuration"
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => handleSettingsUpdate({ shortBreakDuration: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <Label htmlFor="longBreakDuration">Long Break (minutes)</Label>
                <Input
                  id="longBreakDuration"
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => handleSettingsUpdate({ longBreakDuration: parseInt(e.target.value) || 15 })}
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <Label htmlFor="sessionsUntilLongBreak">Sessions Until Long Break</Label>
                <Input
                  id="sessionsUntilLongBreak"
                  type="number"
                  value={settings.sessionsUntilLongBreak}
                  onChange={(e) => handleSettingsUpdate({ sessionsUntilLongBreak: parseInt(e.target.value) || 4 })}
                  min="2"
                  max="10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoStartBreaks"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => handleSettingsUpdate({ autoStartBreaks: e.target.checked })}
                />
                <Label htmlFor="autoStartBreaks">Auto-start breaks</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoStartSessions"
                  checked={settings.autoStartSessions}
                  onChange={(e) => handleSettingsUpdate({ autoStartSessions: e.target.checked })}
                />
                <Label htmlFor="autoStartSessions">Auto-start work sessions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingsUpdate({ notifications: e.target.checked })}
                />
                <Label htmlFor="notifications">Enable notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="soundEnabled"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleSettingsUpdate({ soundEnabled: e.target.checked })}
                />
                <Label htmlFor="soundEnabled">Enable sounds</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}