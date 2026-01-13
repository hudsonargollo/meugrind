// Core system types for MEUGRIND productivity system

export interface SyncableEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
}

export interface User {
  id: string;
  email: string;
  role: 'manager' | 'personal';
  permissions: Permission[];
  preferences: UserPreferences;
}

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacyShield: PrivacyShieldSettings;
}

export interface PrivacyShieldSettings {
  enabled: boolean;
  hidePersonalDetails: boolean;
  showAsBusy: boolean;
  allowedViewers: string[]; // User IDs who can see through privacy shield
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  focusMode: boolean;
}

export interface InterfaceContext {
  mode: 'manager' | 'personal' | 'performance';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectivity: 'online' | 'offline' | 'limited';
  batteryLevel?: number;
  location?: GeolocationCoordinates;
}

export interface SyncQueue {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface Event extends SyncableEntity {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'gig' | 'brand_deal' | 'pr_event' | 'solar_appointment' | 'personal';
  visibility: 'manager_only' | 'fyi_only' | 'mandatory';
  moduleId?: string;
  moduleType?: 'band' | 'influencer' | 'solar' | 'pr';
  createdBy: string; // User ID who created the event
  isPrivacyShielded?: boolean; // For personal account privacy shield
}

export interface Task extends SyncableEntity {
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  projectId?: string;
  category: string;
  estimatedMinutes?: number;
}