'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Plus, Link, Clock, Target, Trash2 } from 'lucide-react';
import { pomodoroService } from '../../lib/pomodoro-service';
import { PomodoroSession } from '../../types/pomodoro';

interface Project {
  id: string;
  name: string;
  category: string;
  description?: string;
  totalTime: number; // minutes
  sessionCount: number;
  createdAt: Date;
  isActive: boolean;
}

interface ProjectLinkerProps {
  currentSession?: PomodoroSession | null;
  onProjectSelect?: (projectId: string) => void;
}

export function ProjectLinker({ currentSession, onProjectSelect }: ProjectLinkerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    category: '',
    description: ''
  });
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  useEffect(() => {
    loadProjects();
    loadSessions();
  }, []);

  const loadProjects = async () => {
    try {
      // Get all sessions to calculate project stats
      const allSessions = await pomodoroService.getSessionHistory(1000);
      const projectMap = new Map<string, Project>();

      // Group sessions by project
      allSessions.forEach(session => {
        if (session.projectId && session.completed) {
          const projectId = session.projectId;
          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
              id: projectId,
              name: projectId, // Use projectId as name for now
              category: session.taskCategory,
              totalTime: 0,
              sessionCount: 0,
              createdAt: session.createdAt,
              isActive: true
            });
          }

          const project = projectMap.get(projectId)!;
          project.totalTime += session.duration;
          project.sessionCount += 1;
        }
      });

      // Load saved projects from localStorage
      const savedProjects = localStorage.getItem('pomodoroProjects');
      if (savedProjects) {
        const parsed: Project[] = JSON.parse(savedProjects);
        parsed.forEach(saved => {
          if (projectMap.has(saved.id)) {
            // Update with saved metadata
            const existing = projectMap.get(saved.id)!;
            projectMap.set(saved.id, {
              ...existing,
              name: saved.name,
              description: saved.description,
              isActive: saved.isActive
            });
          } else {
            // Add saved project even if no sessions yet
            projectMap.set(saved.id, saved);
          }
        });
      }

      setProjects(Array.from(projectMap.values()).sort((a, b) => 
        b.totalTime - a.totalTime
      ));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const sessionHistory = await pomodoroService.getSessionHistory(100);
      setSessions(sessionHistory);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const saveProjects = (updatedProjects: Project[]) => {
    localStorage.setItem('pomodoroProjects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const handleCreateProject = () => {
    if (!newProject.name.trim() || !newProject.category.trim()) {
      alert('Please enter project name and category');
      return;
    }

    const project: Project = {
      id: `project-${Date.now()}`,
      name: newProject.name.trim(),
      category: newProject.category.trim(),
      description: newProject.description.trim(),
      totalTime: 0,
      sessionCount: 0,
      createdAt: new Date(),
      isActive: true
    };

    const updatedProjects = [...projects, project];
    saveProjects(updatedProjects);

    setNewProject({ name: '', category: '', description: '' });
    setShowCreateForm(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This will not delete associated sessions.')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      saveProjects(updatedProjects);
    }
  };

  const handleToggleActive = (projectId: string) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, isActive: !p.isActive } : p
    );
    saveProjects(updatedProjects);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    onProjectSelect?.(projectId);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProjectSessions = (projectId: string) => {
    return sessions.filter(s => s.projectId === projectId && s.completed);
  };

  const activeProjects = projects.filter(p => p.isActive);
  const inactiveProjects = projects.filter(p => !p.isActive);

  return (
    <div className="space-y-6">
      {/* Current Session Project */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Category:</strong> {currentSession.taskCategory}</div>
              {currentSession.projectId && (
                <div><strong>Project:</strong> {currentSession.projectId}</div>
              )}
              <div><strong>Duration:</strong> {formatDuration(currentSession.duration)}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Selection for New Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project for Next Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="projectSelect">Choose Project</Label>
            <Select value={selectedProject} onValueChange={handleProjectSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Project</SelectItem>
                {activeProjects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => setShowCreateForm(true)} 
            variant="outline" 
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </CardContent>
      </Card>

      {/* Create Project Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g., Website Redesign, Mobile App"
              />
            </div>
            <div>
              <Label htmlFor="projectCategory">Category *</Label>
              <Input
                id="projectCategory"
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                placeholder="e.g., Development, Design, Marketing"
              />
            </div>
            <div>
              <Label htmlFor="projectDescription">Description</Label>
              <Input
                id="projectDescription"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief description of the project"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateProject}>Create Project</Button>
              <Button 
                onClick={() => setShowCreateForm(false)} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.map(project => (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{project.name}</h3>
                        <Badge variant="secondary">{project.category}</Badge>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(project.totalTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {project.sessionCount} sessions
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleToggleActive(project.id)}
                        variant="outline"
                        size="sm"
                      >
                        Archive
                      </Button>
                      <Button
                        onClick={() => handleDeleteProject(project.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Recent sessions for this project */}
                  {getProjectSessions(project.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Recent Sessions:</div>
                      <div className="space-y-1">
                        {getProjectSessions(project.id).slice(0, 3).map(session => (
                          <div key={session.id} className="text-xs text-gray-600 flex justify-between">
                            <span>{session.startTime.toLocaleDateString()}</span>
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Projects */}
      {inactiveProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archived Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveProjects.map(project => (
                <div key={project.id} className="p-4 border rounded-lg opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{project.name}</h3>
                        <Badge variant="outline">{project.category}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatDuration(project.totalTime)}</span>
                        <span>{project.sessionCount} sessions</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleToggleActive(project.id)}
                      variant="outline"
                      size="sm"
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500 mb-4">No projects created yet</div>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}