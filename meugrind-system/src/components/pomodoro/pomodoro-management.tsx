'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Timer, BarChart3, Link, Shield, Play, Pause } from 'lucide-react';
import { PomodoroTimer } from './pomodoro-timer';
import { SessionTracker } from './session-tracker';
import { ProjectLinker } from './project-linker';
import { FocusMode } from './focus-mode';
import { pomodoroService } from '../../lib/pomodoro-service';
import { PomodoroSession } from '../../types/pomodoro';

export function PomodoroManagement() {
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState('timer');

  useEffect(() => {
    // Load current session on mount
    const session = pomodoroService.getCurrentSession();
    setCurrentSession(session);

    // Check focus mode status
    const focusMode = pomodoroService.getFocusMode();
    setFocusModeActive(focusMode?.isActive || false);
  }, []);

  const handleSessionStart = (session: PomodoroSession) => {
    setCurrentSession(session);
  };

  const handleSessionComplete = (session: PomodoroSession) => {
    setCurrentSession(null);
    // Optionally switch to tracker tab to show completed session
    setActiveTab('tracker');
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleFocusModeChange = (isActive: boolean) => {
    setFocusModeActive(isActive);
  };

  const getStatusBadge = () => {
    if (currentSession) {
      return (
        <Badge variant="default" className="bg-green-600">
          <Play className="h-3 w-3 mr-1" />
          Active Session
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Pause className="h-3 w-3 mr-1" />
        No Active Session
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-6 w-6" />
              Pomodoro & Focus Management
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {focusModeActive && (
                <Badge variant="outline" className="border-purple-600 text-purple-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Focus Mode
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Manage your productivity with the Pomodoro Technique. Track sessions, link to projects, 
            and use focus mode to minimize distractions during work periods.
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="focus" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Focus Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-6">
          <PomodoroTimer
            onSessionStart={handleSessionStart}
            onSessionComplete={handleSessionComplete}
          />
          
          {/* Quick project selection for timer */}
          {selectedProject && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Link className="h-4 w-4" />
                  <span>Selected project: <strong>{selectedProject}</strong></span>
                  <Button
                    onClick={() => setSelectedProject('')}
                    variant="ghost"
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tracker" className="space-y-6">
          <SessionTracker onProjectSelect={handleProjectSelect} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <ProjectLinker
            currentSession={currentSession}
            onProjectSelect={handleProjectSelect}
          />
        </TabsContent>

        <TabsContent value="focus" className="space-y-6">
          <FocusMode
            currentSession={currentSession}
            onFocusModeChange={handleFocusModeChange}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions (always visible) */}
      {currentSession && (
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Current Session</div>
                <div className="text-sm text-gray-600">
                  {currentSession.taskCategory}
                  {currentSession.projectId && ` • ${currentSession.projectId}`}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveTab('timer')}
                  variant="outline"
                  size="sm"
                >
                  View Timer
                </Button>
                {!focusModeActive && (
                  <Button
                    onClick={() => setActiveTab('focus')}
                    variant="outline"
                    size="sm"
                  >
                    Enable Focus
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}