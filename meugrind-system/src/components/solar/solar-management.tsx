'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SolarLeadManagement } from './solar-lead-management';
import { LeadCaptureForm } from './lead-capture-form';
import { FollowupTaskManagement } from './followup-task-management';
import { ProjectTracking } from './project-tracking';
import { SalesReporting } from './sales-reporting';
import { SolarLead } from '../../types/solar';

interface SolarManagementProps {
  className?: string;
}

type SolarView = 'dashboard' | 'leads' | 'capture' | 'followup' | 'projects' | 'reports';

export function SolarManagement({ className }: SolarManagementProps) {
  const [currentView, setCurrentView] = useState<SolarView>('dashboard');
  const [selectedLead, setSelectedLead] = useState<SolarLead | null>(null);

  const handleLeadCreated = (lead: SolarLead) => {
    setCurrentView('leads');
    // Optionally refresh the leads view
  };

  const handleViewLead = (lead: SolarLead) => {
    setSelectedLead(lead);
    setCurrentView('projects');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <SolarDashboard onNavigate={setCurrentView} />;
      case 'leads':
        return <SolarLeadManagement />;
      case 'capture':
        return (
          <LeadCaptureForm
            onLeadCreated={handleLeadCreated}
            onCancel={() => setCurrentView('leads')}
          />
        );
      case 'followup':
        return <FollowupTaskManagement />;
      case 'projects':
        return (
          <ProjectTracking
            leadId={selectedLead?.id}
          />
        );
      case 'reports':
        return <SalesReporting />;
      default:
        return <SolarDashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Solar Energy CRM</h1>
            <div className="flex items-center space-x-2">
              <Select value={currentView} onValueChange={(value) => setCurrentView(value as SolarView)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="leads">Lead Management</SelectItem>
                  <SelectItem value="capture">New Lead</SelectItem>
                  <SelectItem value="followup">Followup Tasks</SelectItem>
                  <SelectItem value="projects">Project Tracking</SelectItem>
                  <SelectItem value="reports">Sales Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current View */}
      {renderCurrentView()}
    </div>
  );
}

// Dashboard component
function SolarDashboard({ onNavigate }: { onNavigate: (view: SolarView) => void }) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('capture')}>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">+</div>
            <div className="font-medium">New Lead</div>
            <div className="text-sm text-gray-600">Capture new solar lead</div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('leads')}>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">📋</div>
            <div className="font-medium">Manage Leads</div>
            <div className="text-sm text-gray-600">View pipeline & leads</div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('followup')}>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">📞</div>
            <div className="font-medium">Followup Tasks</div>
            <div className="text-sm text-gray-600">Pending actions</div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('reports')}>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">📊</div>
            <div className="font-medium">Sales Reports</div>
            <div className="text-sm text-gray-600">Analytics & metrics</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <div className="mb-4">No recent leads</div>
              <Button onClick={() => onNavigate('capture')}>
                Create First Lead
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <div className="mb-4">No pending tasks</div>
              <Button onClick={() => onNavigate('followup')}>
                View All Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { stage: 'Lead', count: 0, color: 'bg-gray-100 text-gray-800' },
              { stage: 'Qualified', count: 0, color: 'bg-blue-100 text-blue-800' },
              { stage: 'Assessment', count: 0, color: 'bg-yellow-100 text-yellow-800' },
              { stage: 'Proposal', count: 0, color: 'bg-orange-100 text-orange-800' },
              { stage: 'Contract', count: 0, color: 'bg-green-100 text-green-800' },
              { stage: 'Installation', count: 0, color: 'bg-purple-100 text-purple-800' },
              { stage: 'Customer', count: 0, color: 'bg-emerald-100 text-emerald-800' },
            ].map((item) => (
              <div key={item.stage} className="text-center">
                <Badge className={`${item.color} text-lg px-3 py-2 mb-2`}>
                  {item.count}
                </Badge>
                <div className="text-sm font-medium">{item.stage}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button onClick={() => onNavigate('leads')}>
              View Full Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}