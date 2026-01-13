import { SyncableEntity } from './index';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  key: string;
  bpm: number;
  duration: number; // in seconds
  techRequirements: TechRequirement[];
  notes?: string;
}

export interface TechRequirement {
  id: string;
  type: 'input' | 'output' | 'special';
  description: string;
  required: boolean;
}

export interface Setlist extends SyncableEntity {
  name: string;
  songs: Song[];
  gigId?: string;
  notes: string;
  totalDuration: number; // calculated field
}

export interface TechRider {
  id: string;
  setlistId: string;
  inputList: AudioInput[];
  stagePlot?: string; // Base64 image or URL
  specialRequirements: string[];
  generatedAt: Date;
}

export interface AudioInput {
  channel: number;
  instrument: string;
  micType?: string;
  diRequired: boolean;
  notes?: string;
}

export interface Contractor {
  id: string;
  name: string;
  role: 'sound_engineer' | 'lighting_tech' | 'roadie' | 'security';
  phone: string;
  email?: string;
  rate?: number;
  availability: string[];
}

export interface Gig extends SyncableEntity {
  venue: string;
  date: Date;
  loadInTime: Date;
  soundCheckTime: Date;
  showTime: Date;
  setlistId?: string;
  contractors: ContractorAssignment[];
  fee: number;
  status: 'booked' | 'confirmed' | 'completed' | 'cancelled';
}

export interface ContractorAssignment {
  contractorId: string;
  role: string;
  confirmed: boolean;
  callTime: Date;
}

export interface CallSheet {
  gigId: string;
  contractorId: string;
  venue: string;
  date: Date;
  callTime: Date;
  loadInTime: Date;
  soundCheckTime: Date;
  showTime: Date;
  contactInfo: string;
  specialInstructions?: string;
}