import { SyncableEntity } from './index';

export interface SolarLead extends SyncableEntity {
  contactInfo: ContactInfo;
  propertyType: 'domestic' | 'commercial';
  energyRequirements: EnergyRequirements;
  status: 'lead' | 'qualified' | 'assessment' | 'proposal' | 'contract' | 'installation' | 'customer';
  followupDate: Date;
  notes: string[];
  source: 'referral' | 'website' | 'social_media' | 'cold_call' | 'event' | 'other';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  preferredContact: 'email' | 'phone' | 'whatsapp';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface EnergyRequirements {
  monthlyUsage: number; // kWh
  currentBill: number; // currency
  roofType: 'tile' | 'metal' | 'concrete' | 'other';
  roofCondition: 'excellent' | 'good' | 'fair' | 'poor';
  shadingIssues: boolean;
  budgetRange: {
    min: number;
    max: number;
  };
}

export interface SolarProject extends SyncableEntity {
  leadId: string;
  customerId: string;
  systemSize: number; // kW
  estimatedProduction: number; // kWh/year
  installationDate: Date;
  completionDate?: Date;
  permitStatus: 'pending' | 'approved' | 'rejected';
  timeline: ProjectMilestone[];
  totalCost: number;
  paymentSchedule: PaymentSchedule[];
  equipment: Equipment[];
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description?: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  dependencies?: string[]; // other milestone IDs
}

export interface PaymentSchedule {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Equipment {
  id: string;
  type: 'panel' | 'inverter' | 'battery' | 'mounting' | 'other';
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
  warranty: number; // years
}

export interface FollowupTask {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'visit' | 'proposal' | 'contract';
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  outcome?: string;
  nextAction?: string;
}

export interface SalesReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalLeads: number;
    qualifiedLeads: number;
    proposalsSent: number;
    contractsSigned: number;
    conversionRate: number;
    pipelineValue: number;
    averageDealSize: number;
  };
  segmentBreakdown: {
    domestic: SalesMetrics;
    commercial: SalesMetrics;
  };
}

export interface SalesMetrics {
  leads: number;
  conversions: number;
  revenue: number;
  averageDealSize: number;
  conversionRate: number;
}