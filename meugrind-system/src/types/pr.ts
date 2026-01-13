import { SyncableEntity } from './index';

export interface AppearanceWindow extends SyncableEntity {
  contractId: string;
  showName: string;
  startDate: Date;
  endDate: Date;
  availabilityType: 'available' | 'blackout' | 'restricted';
  restrictions?: string[];
  notes?: string;
}

export interface PREvent extends SyncableEntity {
  title: string;
  type: 'interview' | 'appearance' | 'photoshoot' | 'event' | 'podcast';
  date: Date;
  location: string;
  duration: number; // minutes
  contactPerson: ContactInfo;
  talkingPoints: string[];
  wardrobeNotes?: WardrobeNotes;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  mediaOutlets: string[];
  expectedReach?: number;
}

export interface ContactInfo {
  name: string;
  role: string;
  email: string;
  phone: string;
  company: string;
}

export interface WardrobeNotes {
  outfit: string;
  colors: string[];
  style: string;
  accessories: string[];
  makeup?: string;
  hair?: string;
  notes?: string;
  photos?: string[]; // URLs to reference photos
}

export interface TalkingPoint {
  id: string;
  category: string;
  topic: string;
  keyMessage: string;
  supportingFacts: string[];
  doNotMention: string[];
  approved: boolean;
  lastUpdated: Date;
}

export interface ApprovedNarrative {
  id: string;
  title: string;
  category: 'personal_story' | 'career_highlight' | 'future_plans' | 'controversy_response';
  narrative: string;
  keyPoints: string[];
  variations: string[]; // different ways to tell the same story
  mediaOutlets: string[]; // where this has been used
  expirationDate?: Date; // when this narrative should be retired
  approved: boolean;
  approvedBy: string;
  lastUsed?: Date;
}

export interface MediaCoverage {
  id: string;
  prEventId?: string;
  outlet: string;
  type: 'article' | 'video' | 'podcast' | 'social_post';
  title: string;
  url?: string;
  publishDate: Date;
  reach?: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyMentions: string[];
  notes?: string;
}

export interface PRContract {
  id: string;
  showName: string;
  network: string;
  startDate: Date;
  endDate: Date;
  obligations: ContractObligation[];
  restrictions: ContractRestriction[];
  compensation: number;
  status: 'active' | 'expired' | 'terminated';
}

export interface ContractObligation {
  type: 'appearance' | 'social_media' | 'exclusivity' | 'availability';
  description: string;
  frequency?: string;
  deadline?: Date;
  completed: boolean;
}

export interface ContractRestriction {
  type: 'media_blackout' | 'topic_restriction' | 'competitor_exclusion';
  description: string;
  startDate?: Date;
  endDate?: Date;
  severity: 'minor' | 'major' | 'breach';
}