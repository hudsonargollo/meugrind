'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { SolarProject, ProjectMilestone, PaymentSchedule, Equipment } from '../../types/solar';
import { solarService } from '../../lib/solar-service';

interface ProjectTrackingProps {
  projectId?: string;
  leadId?: string;
  className?: string;
}

const MILESTONE_STATUS_COLORS: Record<ProjectMilestone['status'], string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
  'delayed': 'bg-red-100 text-red-800',
};

const PERMIT_STATUS_COLORS: Record<SolarProject['permitStatus'], string> = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_COLORS: Record<PaymentSchedule['status'], string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'paid': 'bg-green-100 text-green-800',
  'overdue': 'bg-red-100 text-red-800',
};

export function ProjectTracking({ projectId, leadId, className }: ProjectTrackingProps) {
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SolarProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    systemSize: '',
    estimatedProduction: '',
    installationDate: '',
    totalCost: '',
    permitStatus: 'pending' as SolarProject['permitStatus'],
  });

  useEffect(() => {
    loadProjects();
  }, [projectId, leadId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      if (projectId) {
        const project = await solarService.getProject(projectId);
        if (project) {
          setProjects([project]);
          setSelectedProject(project);
        }
      } else if (leadId) {
        const leadProjects = await solarService.getProjectsByLead(leadId);
        setProjects(leadProjects);
        if (leadProjects.length > 0) {
          setSelectedProject(leadProjects[0]);
        }
      } else {
        // Load all projects - would need to implement this in service
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!leadId) return;

    try {
      const projectData: Omit<SolarProject, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'> = {
        leadId,
        customerId: leadId, // Assuming lead becomes customer
        systemSize: parseFloat(newProjectData.systemSize),
        estimatedProduction: parseFloat(newProjectData.estimatedProduction),
        installationDate: new Date(newProjectData.installationDate),
        permitStatus: newProjectData.permitStatus,
        timeline: generateDefaultMilestones(new Date(newProjectData.installationDate)),
        totalCost: parseFloat(newProjectData.totalCost),
        paymentSchedule: generateDefaultPaymentSchedule(parseFloat(newProjectData.totalCost)),
        equipment: [],
      };

      const newProject = await solarService.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setSelectedProject(newProject);
      setShowCreateForm(false);
      setNewProjectData({
        systemSize: '',
        estimatedProduction: '',
        installationDate: '',
        totalCost: '',
        permitStatus: 'pending',
      });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const generateDefaultMilestones = (installationDate: Date): ProjectMilestone[] => {
    const milestones: Omit<ProjectMilestone, 'id'>[] = [
      {
        name: 'Site Assessment',
        description: 'Complete technical site assessment',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
      },
      {
        name: 'Permit Application',
        description: 'Submit permits to local authorities',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'pending',
      },
      {
        name: 'Equipment Procurement',
        description: 'Order solar panels and equipment',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        status: 'pending',
      },
      {
        name: 'Installation',
        description: 'Install solar system',
        dueDate: installationDate,
        status: 'pending',
      },
      {
        name: 'Inspection',
        description: 'Final inspection and grid connection',
        dueDate: new Date(installationDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after installation
        status: 'pending',
      },
    ];

    return milestones.map(milestone => ({
      ...milestone,
      id: `milestone-${Date.now()}-${Math.random()}`,
    }));
  };

  const generateDefaultPaymentSchedule = (totalCost: number): PaymentSchedule[] => {
    const schedules: Omit<PaymentSchedule, 'id'>[] = [
      {
        description: 'Contract Signing (30%)',
        amount: totalCost * 0.3,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'pending',
      },
      {
        description: 'Equipment Delivery (40%)',
        amount: totalCost * 0.4,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        status: 'pending',
      },
      {
        description: 'Installation Complete (30%)',
        amount: totalCost * 0.3,
        dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        status: 'pending',
      },
    ];

    return schedules.map(schedule => ({
      ...schedule,
      id: `payment-${Date.now()}-${Math.random()}`,
    }));
  };

  const updateMilestoneStatus = async (milestoneId: string, status: ProjectMilestone['status']) => {
    if (!selectedProject) return;

    try {
      const updatedTimeline = selectedProject.timeline.map(milestone =>
        milestone.id === milestoneId
          ? {
              ...milestone,
              status,
              completedDate: status === 'completed' ? new Date() : undefined,
            }
          : milestone
      );

      await solarService.updateProject(selectedProject.id, { timeline: updatedTimeline });
      
      setSelectedProject(prev => prev ? { ...prev, timeline: updatedTimeline } : null);
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id ? { ...p, timeline: updatedTimeline } : p
      ));
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const updatePermitStatus = async (status: SolarProject['permitStatus']) => {
    if (!selectedProject) return;

    try {
      await solarService.updateProject(selectedProject.id, { permitStatus: status });
      
      setSelectedProject(prev => prev ? { ...prev, permitStatus: status } : null);
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id ? { ...p, permitStatus: status } : p
      ));
    } catch (error) {
      console.error('Error updating permit status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Tracking</h2>
        {leadId && (
          <Button onClick={() => setShowCreateForm(true)}>
            Create Project
          </Button>
        )}
      </div>

      {/* Project Selection */}
      {projects.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <Select 
              value={selectedProject?.id || ''} 
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value);
                setSelectedProject(project || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.systemSize}kW System - {formatDate(project.installationDate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Create Project Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="systemSize">System Size (kW) *</Label>
                <Input
                  id="systemSize"
                  type="number"
                  value={newProjectData.systemSize}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, systemSize: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="estimatedProduction">Estimated Production (kWh/year) *</Label>
                <Input
                  id="estimatedProduction"
                  type="number"
                  value={newProjectData.estimatedProduction}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, estimatedProduction: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="installationDate">Installation Date *</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={newProjectData.installationDate}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, installationDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalCost">Total Cost (R$) *</Label>
                <Input
                  id="totalCost"
                  type="number"
                  value={newProjectData.totalCost}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, totalCost: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreateProject} className="flex-1">
                Create Project
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Details */}
      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">System Size</div>
                  <div className="font-medium">{selectedProject.systemSize} kW</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Production</div>
                  <div className="font-medium">{selectedProject.estimatedProduction} kWh/year</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Installation Date</div>
                  <div className="font-medium">{formatDate(selectedProject.installationDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                  <div className="font-medium">{formatCurrency(selectedProject.totalCost)}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-2">Permit Status</div>
                <div className="flex items-center space-x-2">
                  <Badge className={PERMIT_STATUS_COLORS[selectedProject.permitStatus]}>
                    {selectedProject.permitStatus.charAt(0).toUpperCase() + selectedProject.permitStatus.slice(1)}
                  </Badge>
                  <Select 
                    value={selectedProject.permitStatus} 
                    onValueChange={(value) => updatePermitStatus(value as SolarProject['permitStatus'])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedProject.timeline.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{milestone.name}</div>
                      {milestone.description && (
                        <div className="text-sm text-gray-600">{milestone.description}</div>
                      )}
                      <div className="text-sm text-gray-600">
                        Due: {formatDate(milestone.dueDate)}
                        {milestone.completedDate && (
                          <span> • Completed: {formatDate(milestone.completedDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={MILESTONE_STATUS_COLORS[milestone.status]}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                      <Select 
                        value={milestone.status} 
                        onValueChange={(value) => updateMilestoneStatus(milestone.id, value as ProjectMilestone['status'])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedProject.paymentSchedule.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{payment.description}</div>
                      <div className="text-sm text-gray-600">
                        Due: {formatDate(payment.dueDate)}
                        {payment.paidDate && (
                          <span> • Paid: {formatDate(payment.paidDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                      <Badge className={PAYMENT_STATUS_COLORS[payment.status]}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Projects State */}
      {projects.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">No projects found</div>
            {leadId && (
              <Button onClick={() => setShowCreateForm(true)}>
                Create First Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}