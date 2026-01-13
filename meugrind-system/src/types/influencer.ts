import { SyncableEntity } from './index';

export interface BrandDeal extends SyncableEntity {
  brandName: string;
  campaignName: string;
  status: 'pitch' | 'contract' | 'content' | 'posted' | 'paid';
  deliverables: Deliverable[];
  exclusivityClauses: string[];
  fee: number;
  deadline: Date;
  contractDate?: Date;
  paymentDate?: Date;
  notes?: string;
}

export interface Deliverable {
  id: string;
  type: 'story' | 'post' | 'reel' | 'video' | 'blog';
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'website';
  description: string;
  deadline: Date;
  completed: boolean;
  contentAssetId?: string;
}

export interface ContentAsset {
  id: string;
  type: 'story' | 'post' | 'reel' | 'video' | 'blog';
  platform: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  metrics: ContentMetrics;
  brandDealId?: string;
  publishedAt?: Date;
  status: 'draft' | 'review' | 'approved' | 'published';
}

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  reach?: number;
  impressions?: number;
  timestamp: Date;
}

export interface ContentPipeline {
  id: string;
  stage: 'ideation' | 'scripting' | 'filming' | 'approval' | 'posted' | 'invoice_sent';
  contentAssets: ContentAsset[];
  brandDealId?: string;
  notes?: string;
}

export interface Brand {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  exclusivityConflicts: string[];
  blacklisted: boolean;
  blacklistReason?: string;
  previousDeals: string[]; // BrandDeal IDs
}

export interface Script {
  id: string;
  title: string;
  content: string;
  brandDealId?: string;
  contentAssetId?: string;
  teleprompterSettings: TeleprompterSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeleprompterSettings {
  fontSize: number;
  scrollSpeed: number;
  backgroundColor: string;
  textColor: string;
  mirrorMode: boolean;
}