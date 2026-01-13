'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FollowupTask, SolarLead } from '../../types/solar';
import { solarService } from '../../lib/solar-service';

interface FollowupTaskManagementProps {
  leadId?: string;
  className?: string;
}

const TASK_TYPE_LABELS: Record<FollowupTask['type'], string> = {
  'call': 'Phone Call',
  'email': 'Email',
  'visit': 'Site Visit',
  'proposal': 'Send Proposal',
  'contract': 'Contract Review',
};

const TASK_TYPE_COLORS: Record<FollowupTask['type'], string> = {
  'call': 'bg-blue-100 text-blue-800',
  'email': 'bg-green-100 text-green-800',
  'visit': 'bg-purple-100 text-purple-800',
  'proposal': 'bg-orange-100 text-orange-800',
  'contract': 'bg-red-100 text-red-800',
};

export function FollowupTaskManagement({ leadId, className }: FollowupTaskManagementProps) {
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [leads, setLeads] = useState<SolarLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<FollowupTask | null>(null);
  const [completionData, setCompletionData] = useState({
    outcome: '',
    nextAction: '',
  });

  useEffect(() => {
    loadData();
  }, [leadId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (leadId) {
        // Load tasks for specific lead
        const leadTasks = await solarService.getFollowupTasks(leadId);
        setTasks(leadTasks);
      } else {
        // Load all pending tasks
        const allLeads = await solarService.getAllLeads();
        setLeads(allLeads);
        
        const allTasks: FollowupTask[] = [];
        for (const lead of allLeads) {
          const leadTasks = await solarService.getFollowupTasks(lead.id);
          allTasks.push(...leadTasks);
        }
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('Error loading followup tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task: FollowupTask) => {
    try {
      await solarService.completeFollowupTask(
        task.id,
        completionData.outcome,
        completionData.nextAction || undefined
      );
      
      setSelectedTask(null);
      setCompletionData({ outcome: '', nextAction: '' });
      await loadData();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getLeadForTask = (taskLeadId: string): SolarLead | undefined => {
    return leads.find(lead => lead.id === taskLeadId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const isOverdue = (date: Date) => {
    return new Date(date) < new Date();
  };

  const pendingTasks = tasks.filter(task => !task.completedDate);
  const completedTasks = tasks.filter(task => task.completedDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading followup tasks...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {leadId ? 'Lead Followup Tasks' : 'All Followup Tasks'}
        </h2>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary">
            {pendingTasks.length} Pending
          </Badge>
          <Badge variant="outline">
            {completedTasks.length} Completed
          </Badge>
        </div>
      </div>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No pending followup tasks
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map((task) => {
                const lead = getLeadForTask(task.leadId);
                const overdue = isOverdue(task.scheduledDate);
                
                return (
                  <Card key={task.id} className={`p-4 ${overdue ? 'border-red-200 bg-red-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={TASK_TYPE_COLORS[task.type]}>
                            {TASK_TYPE_LABELS[task.type]}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium">{task.description}</div>
                          {lead && (
                            <div className="text-sm text-gray-600">
                              {lead.contactInfo.firstName} {lead.contactInfo.lastName} - {lead.contactInfo.email}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          Scheduled: {formatDate(task.scheduledDate)}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                        variant={overdue ? "destructive" : "default"}
                      >
                        Complete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTasks.slice(0, 10).map((task) => {
                const lead = getLeadForTask(task.leadId);
                
                return (
                  <Card key={task.id} className="p-4 bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={TASK_TYPE_COLORS[task.type]}>
                          {TASK_TYPE_LABELS[task.type]}
                        </Badge>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                      
                      <div>
                        <div className="font-medium">{task.description}</div>
                        {lead && (
                          <div className="text-sm text-gray-600">
                            {lead.contactInfo.firstName} {lead.contactInfo.lastName}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Completed: {task.completedDate && formatDate(task.completedDate)}
                      </div>
                      
                      {task.outcome && (
                        <div className="text-sm">
                          <span className="font-medium">Outcome:</span> {task.outcome}
                        </div>
                      )}
                      
                      {task.nextAction && (
                        <div className="text-sm">
                          <span className="font-medium">Next Action:</span> {task.nextAction}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Completion Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">{selectedTask.description}</div>
                <div className="text-sm text-gray-600">
                  {TASK_TYPE_LABELS[selectedTask.type]} - {formatDate(selectedTask.scheduledDate)}
                </div>
              </div>
              
              <div>
                <Label htmlFor="outcome">Outcome *</Label>
                <Textarea
                  id="outcome"
                  value={completionData.outcome}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, outcome: e.target.value }))}
                  placeholder="Describe what happened during this followup..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="nextAction">Next Action</Label>
                <Textarea
                  id="nextAction"
                  value={completionData.nextAction}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, nextAction: e.target.value }))}
                  placeholder="What should be done next? (optional)"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleCompleteTask(selectedTask)}
                  disabled={!completionData.outcome.trim()}
                  className="flex-1"
                >
                  Complete Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTask(null);
                    setCompletionData({ outcome: '', nextAction: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}