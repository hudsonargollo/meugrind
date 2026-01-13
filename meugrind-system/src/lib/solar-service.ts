import { db } from './database';
import { SolarLead, SolarProject, FollowupTask, SalesReport, SalesMetrics } from '../types/solar';
import { v4 as uuidv4 } from 'uuid';

export class SolarService {
  // Lead Management
  async createLead(leadData: Omit<SolarLead, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<SolarLead> {
    const lead: SolarLead = {
      id: uuidv4(),
      ...leadData,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1,
    };

    await db.solarLeads.add(lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<SolarLead>): Promise<void> {
    await db.solarLeads.update(id, {
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'pending',
    });
  }

  async deleteLead(id: string): Promise<void> {
    await db.solarLeads.delete(id);
  }

  async getLead(id: string): Promise<SolarLead | undefined> {
    return await db.solarLeads.get(id);
  }

  async getAllLeads(): Promise<SolarLead[]> {
    return await db.solarLeads.orderBy('createdAt').reverse().toArray();
  }

  async getLeadsByStatus(status: SolarLead['status']): Promise<SolarLead[]> {
    return await db.solarLeads.where('status').equals(status).toArray();
  }

  async getLeadsByPropertyType(propertyType: 'domestic' | 'commercial'): Promise<SolarLead[]> {
    return await db.solarLeads.where('propertyType').equals(propertyType).toArray();
  }

  async getLeadsByPriority(priority: 'low' | 'medium' | 'high'): Promise<SolarLead[]> {
    return await db.solarLeads.where('priority').equals(priority).toArray();
  }

  // Pipeline Management
  async moveLeadToNextStage(leadId: string): Promise<void> {
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error('Lead not found');

    const stageProgression: Record<SolarLead['status'], SolarLead['status']> = {
      'lead': 'qualified',
      'qualified': 'assessment',
      'assessment': 'proposal',
      'proposal': 'contract',
      'contract': 'installation',
      'installation': 'customer',
      'customer': 'customer', // Final stage
    };

    const nextStatus = stageProgression[lead.status];
    await this.updateLead(leadId, { status: nextStatus });

    // Generate automatic actions based on stage transition
    await this.generateStageTransitionActions(leadId, lead.status, nextStatus);

    // Schedule automatic followup based on new stage
    await this.scheduleAutomaticFollowup(leadId, nextStatus);
  }

  // Generate automatic actions when moving between stages
  async generateStageTransitionActions(leadId: string, fromStatus: SolarLead['status'], toStatus: SolarLead['status']): Promise<void> {
    const actionTemplates: Record<SolarLead['status'], { type: FollowupTask['type']; description: string; days: number }[]> = {
      'qualified': [
        { type: 'call', description: 'Conduct qualification interview', days: 0 },
        { type: 'email', description: 'Send qualification questionnaire', days: 1 },
      ],
      'assessment': [
        { type: 'visit', description: 'Schedule site assessment visit', days: 2 },
        { type: 'email', description: 'Send site assessment preparation checklist', days: 1 },
      ],
      'proposal': [
        { type: 'proposal', description: 'Prepare and send detailed proposal', days: 3 },
        { type: 'email', description: 'Send financing options information', days: 4 },
      ],
      'contract': [
        { type: 'contract', description: 'Prepare contract documents', days: 1 },
        { type: 'call', description: 'Schedule contract signing meeting', days: 2 },
      ],
      'installation': [
        { type: 'call', description: 'Coordinate installation schedule', days: 1 },
        { type: 'email', description: 'Send installation preparation guide', days: 0 },
      ],
      'customer': [
        { type: 'call', description: 'Post-installation satisfaction call', days: 7 },
        { type: 'email', description: 'Send system monitoring setup instructions', days: 1 },
      ],
      'lead': [], // No automatic actions for initial lead stage
    };

    const actions = actionTemplates[toStatus] || [];
    
    for (const action of actions) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + action.days);

      const followupTask: FollowupTask = {
        id: uuidv4(),
        leadId,
        type: action.type,
        description: action.description,
        scheduledDate,
      };

      await db.followupTasks.add(followupTask);
    }
  }

  async moveLeadToPreviousStage(leadId: string): Promise<void> {
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error('Lead not found');

    const stageRegression: Record<SolarLead['status'], SolarLead['status']> = {
      'customer': 'installation',
      'installation': 'contract',
      'contract': 'proposal',
      'proposal': 'assessment',
      'assessment': 'qualified',
      'qualified': 'lead',
      'lead': 'lead', // First stage
    };

    const previousStatus = stageRegression[lead.status];
    await this.updateLead(leadId, { status: previousStatus });
  }

  // Kanban Board Data
  async getKanbanData(): Promise<Record<SolarLead['status'], SolarLead[]>> {
    const allLeads = await this.getAllLeads();
    
    const kanbanData: Record<SolarLead['status'], SolarLead[]> = {
      'lead': [],
      'qualified': [],
      'assessment': [],
      'proposal': [],
      'contract': [],
      'installation': [],
      'customer': [],
    };

    allLeads.forEach(lead => {
      kanbanData[lead.status].push(lead);
    });

    return kanbanData;
  }

  async getDomesticKanbanData(): Promise<Record<SolarLead['status'], SolarLead[]>> {
    const domesticLeads = await this.getLeadsByPropertyType('domestic');
    
    const kanbanData: Record<SolarLead['status'], SolarLead[]> = {
      'lead': [],
      'qualified': [],
      'assessment': [],
      'proposal': [],
      'contract': [],
      'installation': [],
      'customer': [],
    };

    domesticLeads.forEach(lead => {
      kanbanData[lead.status].push(lead);
    });

    return kanbanData;
  }

  async getCommercialKanbanData(): Promise<Record<SolarLead['status'], SolarLead[]>> {
    const commercialLeads = await this.getLeadsByPropertyType('commercial');
    
    const kanbanData: Record<SolarLead['status'], SolarLead[]> = {
      'lead': [],
      'qualified': [],
      'assessment': [],
      'proposal': [],
      'contract': [],
      'installation': [],
      'customer': [],
    };

    commercialLeads.forEach(lead => {
      kanbanData[lead.status].push(lead);
    });

    return kanbanData;
  }

  // Followup Task Management
  async scheduleAutomaticFollowup(leadId: string, status: SolarLead['status']): Promise<void> {
    const followupSchedule: Record<SolarLead['status'], { days: number; type: FollowupTask['type']; description: string }> = {
      'lead': { days: 1, type: 'call', description: 'Initial qualification call' },
      'qualified': { days: 3, type: 'visit', description: 'Schedule site assessment' },
      'assessment': { days: 5, type: 'proposal', description: 'Send detailed proposal' },
      'proposal': { days: 7, type: 'call', description: 'Follow up on proposal' },
      'contract': { days: 14, type: 'call', description: 'Check installation readiness' },
      'installation': { days: 30, type: 'call', description: 'Post-installation check-in' },
      'customer': { days: 90, type: 'call', description: 'Customer satisfaction survey' },
    };

    const schedule = followupSchedule[status];
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + schedule.days);

    const followupTask: FollowupTask = {
      id: uuidv4(),
      leadId,
      type: schedule.type,
      description: schedule.description,
      scheduledDate,
    };

    await db.followupTasks.add(followupTask);
  }

  async getFollowupTasks(leadId: string): Promise<FollowupTask[]> {
    return await db.followupTasks.where('leadId').equals(leadId).toArray();
  }

  async completeFollowupTask(taskId: string, outcome: string, nextAction?: string): Promise<void> {
    await db.followupTasks.update(taskId, {
      completedDate: new Date(),
      outcome,
      nextAction,
    });
  }

  // Project Management
  async createProject(projectData: Omit<SolarProject, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<SolarProject> {
    const project: SolarProject = {
      id: uuidv4(),
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1,
    };

    await db.solarProjects.add(project);
    return project;
  }

  async updateProject(id: string, updates: Partial<SolarProject>): Promise<void> {
    await db.solarProjects.update(id, {
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'pending',
    });
  }

  async getProject(id: string): Promise<SolarProject | undefined> {
    return await db.solarProjects.get(id);
  }

  async getProjectsByLead(leadId: string): Promise<SolarProject[]> {
    return await db.solarProjects.where('leadId').equals(leadId).toArray();
  }

  // Sales Reporting and Analytics
  async generateSalesReport(startDate: Date, endDate: Date): Promise<SalesReport> {
    const leads = await db.solarLeads
      .where('createdAt')
      .between(startDate, endDate)
      .toArray();

    const domesticLeads = leads.filter(lead => lead.propertyType === 'domestic');
    const commercialLeads = leads.filter(lead => lead.propertyType === 'commercial');

    const calculateMetrics = (segmentLeads: SolarLead[]): SalesMetrics => {
      const totalLeads = segmentLeads.length;
      const qualifiedLeads = segmentLeads.filter(lead => 
        ['qualified', 'assessment', 'proposal', 'contract', 'installation', 'customer'].includes(lead.status)
      ).length;
      const conversions = segmentLeads.filter(lead => lead.status === 'customer').length;
      
      // For revenue calculation, we'd need to get associated projects
      // This is a simplified calculation
      const revenue = conversions * 15000; // Average deal size placeholder
      const averageDealSize = conversions > 0 ? revenue / conversions : 0;
      const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

      return {
        leads: totalLeads,
        conversions,
        revenue,
        averageDealSize,
        conversionRate,
      };
    };

    const domesticMetrics = calculateMetrics(domesticLeads);
    const commercialMetrics = calculateMetrics(commercialLeads);

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(lead => 
      ['qualified', 'assessment', 'proposal', 'contract', 'installation', 'customer'].includes(lead.status)
    ).length;
    const proposalsSent = leads.filter(lead => 
      ['proposal', 'contract', 'installation', 'customer'].includes(lead.status)
    ).length;
    const contractsSigned = leads.filter(lead => 
      ['contract', 'installation', 'customer'].includes(lead.status)
    ).length;
    const conversionRate = totalLeads > 0 ? (contractsSigned / totalLeads) * 100 : 0;
    const pipelineValue = domesticMetrics.revenue + commercialMetrics.revenue;
    const averageDealSize = contractsSigned > 0 ? pipelineValue / contractsSigned : 0;

    return {
      period: { start: startDate, end: endDate },
      metrics: {
        totalLeads,
        qualifiedLeads,
        proposalsSent,
        contractsSigned,
        conversionRate,
        pipelineValue,
        averageDealSize,
      },
      segmentBreakdown: {
        domestic: domesticMetrics,
        commercial: commercialMetrics,
      },
    };
  }

  async getConversionRates(): Promise<{ domestic: number; commercial: number; overall: number }> {
    const allLeads = await this.getAllLeads();
    const domesticLeads = allLeads.filter(lead => lead.propertyType === 'domestic');
    const commercialLeads = allLeads.filter(lead => lead.propertyType === 'commercial');

    const calculateConversionRate = (leads: SolarLead[]): number => {
      const totalLeads = leads.length;
      const conversions = leads.filter(lead => lead.status === 'customer').length;
      return totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
    };

    return {
      domestic: calculateConversionRate(domesticLeads),
      commercial: calculateConversionRate(commercialLeads),
      overall: calculateConversionRate(allLeads),
    };
  }

  async getPipelineValue(): Promise<{ domestic: number; commercial: number; total: number }> {
    const allLeads = await this.getAllLeads();
    const domesticLeads = allLeads.filter(lead => lead.propertyType === 'domestic');
    const commercialLeads = allLeads.filter(lead => lead.propertyType === 'commercial');

    // Simplified pipeline value calculation
    // In a real system, this would be based on actual project values
    const calculatePipelineValue = (leads: SolarLead[]): number => {
      const activeLeads = leads.filter(lead => 
        ['qualified', 'assessment', 'proposal', 'contract', 'installation'].includes(lead.status)
      );
      return activeLeads.length * 15000; // Average deal size placeholder
    };

    const domesticValue = calculatePipelineValue(domesticLeads);
    const commercialValue = calculatePipelineValue(commercialLeads);

    return {
      domestic: domesticValue,
      commercial: commercialValue,
      total: domesticValue + commercialValue,
    };
  }
}

// Export singleton instance
export const solarService = new SolarService();