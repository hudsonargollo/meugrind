'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SolarLead } from '../../types/solar';
import { solarService } from '../../lib/solar-service';

interface SolarLeadManagementProps {
  className?: string;
}

const STAGE_LABELS: Record<SolarLead['status'], string> = {
  'lead': 'Lead',
  'qualified': 'Qualified Prospect',
  'assessment': 'Site Assessment',
  'proposal': 'Proposal Sent',
  'contract': 'Contract Signed',
  'installation': 'Installation',
  'customer': 'Customer',
};

const STAGE_COLORS: Record<SolarLead['status'], string> = {
  'lead': 'bg-gray-100 text-gray-800',
  'qualified': 'bg-blue-100 text-blue-800',
  'assessment': 'bg-yellow-100 text-yellow-800',
  'proposal': 'bg-orange-100 text-orange-800',
  'contract': 'bg-green-100 text-green-800',
  'installation': 'bg-purple-100 text-purple-800',
  'customer': 'bg-emerald-100 text-emerald-800',
};

const PRIORITY_COLORS: Record<SolarLead['priority'], string> = {
  'low': 'bg-gray-100 text-gray-600',
  'medium': 'bg-yellow-100 text-yellow-700',
  'high': 'bg-red-100 text-red-700',
};

export function SolarLeadManagement({ className }: SolarLeadManagementProps) {
  const [kanbanData, setKanbanData] = useState<Record<SolarLead['status'], SolarLead[]>>({
    'lead': [],
    'qualified': [],
    'assessment': [],
    'proposal': [],
    'contract': [],
    'installation': [],
    'customer': [],
  });
  const [selectedPipeline, setSelectedPipeline] = useState<'all' | 'domestic' | 'commercial'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKanbanData();
  }, [selectedPipeline]);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      let data;
      
      switch (selectedPipeline) {
        case 'domestic':
          data = await solarService.getDomesticKanbanData();
          break;
        case 'commercial':
          data = await solarService.getCommercialKanbanData();
          break;
        default:
          data = await solarService.getKanbanData();
      }
      
      setKanbanData(data);
    } catch (error) {
      console.error('Error loading kanban data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToNextStage = async (leadId: string) => {
    try {
      await solarService.moveLeadToNextStage(leadId);
      await loadKanbanData();
    } catch (error) {
      console.error('Error moving lead to next stage:', error);
    }
  };

  const handleMoveToPreviousStage = async (leadId: string) => {
    try {
      await solarService.moveLeadToPreviousStage(leadId);
      await loadKanbanData();
    } catch (error) {
      console.error('Error moving lead to previous stage:', error);
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
        <div className="text-lg">Loading solar leads...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Solar Lead Management</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedPipeline} onValueChange={(value) => setSelectedPipeline(value as 'all' | 'domestic' | 'commercial')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="domestic">Domestic Pipeline</SelectItem>
              <SelectItem value="commercial">Commercial Pipeline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(STAGE_LABELS).map(([status, label]) => {
          const count = kanbanData[status as SolarLead['status']].length;
          return (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600">{label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto">
        {Object.entries(STAGE_LABELS).map(([status, label]) => {
          const leads = kanbanData[status as SolarLead['status']];
          
          return (
            <div key={status} className="min-w-80 lg:min-w-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{label}</span>
                    <Badge variant="secondary" className={STAGE_COLORS[status as SolarLead['status']]}>
                      {leads.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {leads.map((lead) => (
                    <Card key={lead.id} className="p-3 hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        {/* Lead Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {lead.contactInfo.firstName} {lead.contactInfo.lastName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {lead.contactInfo.email}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={PRIORITY_COLORS[lead.priority]}
                          >
                            {lead.priority}
                          </Badge>
                        </div>

                        {/* Lead Details */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="capitalize">{lead.propertyType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Usage:</span>
                            <span>{lead.energyRequirements.monthlyUsage} kWh</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Budget:</span>
                            <span>
                              {formatCurrency(lead.energyRequirements.budgetRange.min)} - 
                              {formatCurrency(lead.energyRequirements.budgetRange.max)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Follow-up:</span>
                            <span>{formatDate(lead.followupDate)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-1 pt-2">
                          {status !== 'lead' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 h-6"
                              onClick={() => handleMoveToPreviousStage(lead.id)}
                            >
                              ←
                            </Button>
                          )}
                          {status !== 'customer' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 h-6 flex-1"
                              onClick={() => handleMoveToNextStage(lead.id)}
                            >
                              Next Stage →
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {leads.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No leads in this stage
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}