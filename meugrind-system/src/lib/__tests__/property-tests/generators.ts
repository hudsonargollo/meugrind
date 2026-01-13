/**
 * Property-based test generators for MEUGRIND system
 * These generators create realistic test data that respects business rules and constraints
 */

import * as fc from 'fast-check';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Event,
  Task,
  SyncQueue,
  SyncableEntity,
  InterfaceContext,
} from '../../types';
import {
  Song,
  Setlist,
  TechRider,
  Contractor,
  Gig,
  CallSheet,
} from '../../types/band';
import {
  BrandDeal,
  ContentAsset,
  Brand,
  Script,
} from '../../types/influencer';
import {
  SolarLead,
  SolarProject,
  FollowupTask,
} from '../../types/solar';
import {
  PomodoroSession,
  PomodoroStats,
  StudyTracker,
} from '../../types/pomodoro';
import {
  AppearanceWindow,
  PREvent,
  TalkingPoint,
  ApprovedNarrative,
} from '../../types/pr';

// Base generators for common types
export const generators = {
  // Basic types
  id: () => fc.constant(uuidv4()),
  email: () => fc.emailAddress(),
  date: () => fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  pastDate: () => fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  futureDate: () => fc.date({ min: new Date(), max: new Date('2030-12-31') }),
  url: () => fc.webUrl(),
  phoneNumber: () => fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^\d+$/.test(s)),
  
  // Sync status
  syncStatus: () => fc.constantFrom('synced', 'pending', 'conflict'),
  
  // User roles and permissions
  userRole: () => fc.constantFrom('manager', 'personal'),
  permission: () => fc.record({
    resource: fc.constantFrom('events', 'tasks', 'band', 'influencer', 'solar', 'pr', 'pomodoro', 'financials', 'contracts', 'settings'),
    actions: fc.array(fc.constantFrom('read', 'write', 'delete'), { minLength: 1, maxLength: 3 })
  }),
  
  // Interface context
  interfaceMode: () => fc.constantFrom('manager', 'personal', 'performance'),
  deviceType: () => fc.constantFrom('mobile', 'tablet', 'desktop'),
  connectivity: () => fc.constantFrom('online', 'offline', 'limited'),
  batteryLevel: () => fc.integer({ min: 0, max: 100 }),
  
  // Core entities
  user: () => fc.record({
    id: generators.id(),
    email: generators.email(),
    role: generators.userRole(),
    permissions: fc.array(generators.permission(), { minLength: 1, maxLength: 10 }),
    preferences: fc.record({
      theme: fc.constantFrom('light', 'dark', 'auto'),
      language: fc.constantFrom('en', 'pt', 'es'),
      timezone: fc.constantFrom('America/Sao_Paulo', 'UTC', 'America/New_York'),
      notifications: fc.record({
        email: fc.boolean(),
        push: fc.boolean(),
        focusMode: fc.boolean(),
      }),
      privacyShield: fc.record({
        enabled: fc.boolean(),
        hidePersonalDetails: fc.boolean(),
        showAsBusy: fc.boolean(),
        allowedViewers: fc.array(fc.string(), { maxLength: 5 }),
      }),
    }),
  }),
  
  event: () => fc.record({
    id: generators.id(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 })),
    startTime: generators.date(),
    endTime: generators.futureDate(),
    type: fc.constantFrom('gig', 'meeting', 'content', 'solar', 'pr', 'personal'),
    visibility: fc.constantFrom('public', 'private', 'fyi_only', 'mandatory'),
    moduleType: fc.constantFrom('band', 'influencer', 'solar', 'pr', 'personal'),
    createdAt: generators.pastDate(),
    updatedAt: generators.date(),
    syncStatus: generators.syncStatus(),
    version: fc.integer({ min: 1, max: 100 }),
  }),
  
  task: () => fc.record({
    id: generators.id(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 1000 })),
    completed: fc.boolean(),
    priority: fc.constantFrom('low', 'medium', 'high', 'urgent'),
    dueDate: fc.option(generators.futureDate()),
    category: fc.constantFrom('work', 'personal', 'band', 'content', 'solar', 'pr'),
    projectId: fc.option(fc.string()),
    createdAt: generators.pastDate(),
    updatedAt: generators.date(),
    syncStatus: generators.syncStatus(),
    version: fc.integer({ min: 1, max: 100 }),
  }),
  
  // Band management entities
  song: () => fc.record({
    id: generators.id(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    artist: fc.string({ minLength: 1, maxLength: 100 }),
    key: fc.constantFrom('C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'),
    bpm: fc.integer({ min: 60, max: 200 }),
    duration: fc.integer({ min: 60, max: 600 }), // seconds
    genre: fc.constantFrom('reggae', 'rock', 'pop', 'jazz', 'blues'),
    techRequirements: fc.array(fc.record({
      type: fc.constantFrom('vocal_mic', 'instrument_input', 'monitor', 'effect'),
      description: fc.string({ minLength: 1, maxLength: 100 }),
      required: fc.boolean(),
    }), { maxLength: 10 }),
  }),
  
  setlist: () => fc.record({
    id: generators.id(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    songs: fc.array(generators.song(), { minLength: 1, maxLength: 20 }),
    gigId: fc.option(fc.string()),
    notes: fc.string({ maxLength: 500 }),
    createdAt: generators.pastDate(),
    updatedAt: generators.date(),
    syncStatus: generators.syncStatus(),
    version: fc.integer({ min: 1, max: 100 }),
  }),
  
  contractor: () => fc.record({
    id: generators.id(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    role: fc.constantFrom('sound_engineer', 'lighting_tech', 'roadie', 'stage_manager'),
    phone: generators.phoneNumber(),
    email: generators.email(),
    hourlyRate: fc.option(fc.float({ min: 20, max: 200 })),
    availability: fc.array(fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  }),
  
  // Influencer CRM entities
  brandDeal: () => fc.record({
    id: generators.id(),
    brandName: fc.string({ minLength: 1, maxLength: 100 }),
    campaignName: fc.string({ minLength: 1, maxLength: 100 }),
    status: fc.constantFrom('pitch', 'contract', 'content', 'posted', 'paid'),
    deliverables: fc.array(fc.record({
      type: fc.constantFrom('post', 'story', 'reel', 'video'),
      platform: fc.constantFrom('instagram', 'tiktok', 'youtube', 'facebook'),
      deadline: generators.futureDate(),
      completed: fc.boolean(),
    }), { minLength: 1, maxLength: 10 }),
    exclusivityClauses: fc.array(fc.string({ minLength: 1, maxLength: 200 }), { maxLength: 5 }),
    fee: fc.float({ min: 100, max: 50000 }),
    deadline: generators.futureDate(),
    createdAt: generators.pastDate(),
    updatedAt: generators.date(),
    syncStatus: generators.syncStatus(),
    version: fc.integer({ min: 1, max: 100 }),
  }),
  
  brand: () => fc.record({
    id: generators.id(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    blacklisted: fc.boolean(),
    exclusivityConflicts: fc.array(fc.string(), { maxLength: 5 }),
    contactInfo: fc.record({
      email: generators.email(),
      phone: fc.option(generators.phoneNumber()),
      website: fc.option(generators.url()),
    }),
  }),
  
  // Solar CRM entities
  solarLead: () => fc.record({
    id: generators.id(),
    contactInfo: fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      email: generators.email(),
      phone: generators.phoneNumber(),
      address: fc.string({ minLength: 10, maxLength: 200 }),
    }),
    propertyType: fc.constantFrom('domestic', 'commercial'),
    energyRequirements: fc.record({
      currentBill: fc.float({ min: 50, max: 5000 }),
      roofType: fc.constantFrom('tile', 'metal', 'flat', 'shingle'),
      roofCondition: fc.constantFrom('excellent', 'good', 'fair', 'poor'),
      shadingIssues: fc.boolean(),
    }),
    status: fc.constantFrom('lead', 'qualified', 'assessment', 'proposal', 'contract', 'installation', 'customer'),
    followupDate: generators.futureDate(),
    source: fc.constantFrom('website', 'referral', 'social_media', 'cold_call', 'event'),
    priority: fc.constantFrom('low', 'medium', 'high'),
    notes: fc.array(fc.string({ maxLength: 500 }), { maxLength: 10 }),
    createdAt: generators.pastDate(),
    updatedAt: generators.date(),
    syncStatus: generators.syncStatus(),
    version: fc.integer({ min: 1, max: 100 }),
  }),
  
  // Pomodoro entities
  pomodoroSession: () => fc.record({
    id: generators.id(),
    duration: fc.constantFrom(15, 25, 30, 45, 60), // minutes
    breakDuration: fc.constantFrom(5, 10, 15, 20), // minutes
    projectId: fc.option(fc.string()),
    taskCategory: fc.constantFrom('work', 'study', 'creative', 'admin', 'personal'),
    startTime: generators.pastDate(),
    endTime: fc.option(generators.date()),
    completed: fc.boolean(),
    notes: fc.option(fc.string({ maxLength: 500 })),
    createdAt: generators.pastDate(),
    updatedAt: generators.date(),
    syncStatus: generators.syncStatus(),
    version: fc.integer({ min: 1, max: 100 }),
  }),
  
  // Interface context
  interfaceContext: () => fc.record({
    mode: generators.interfaceMode(),
    deviceType: generators.deviceType(),
    connectivity: generators.connectivity(),
    batteryLevel: fc.option(generators.batteryLevel()),
    location: fc.option(fc.record({
      latitude: fc.float({ min: -90, max: 90 }),
      longitude: fc.float({ min: -180, max: 180 }),
    })),
  }),
  
  // Sync queue
  syncQueue: () => fc.record({
    id: generators.id(),
    entityType: fc.constantFrom('event', 'task', 'song', 'setlist', 'brandDeal', 'solarLead', 'pomodoroSession'),
    entityId: fc.string(),
    operation: fc.constantFrom('create', 'update', 'delete'),
    data: fc.object(), // Generic object for sync data
    timestamp: generators.pastDate(),
    retryCount: fc.integer({ min: 0, max: 10 }),
  }),
};

// Helper functions for creating arrays of entities
export const createEntities = {
  users: (count: number = 5) => fc.array(generators.user(), { minLength: count, maxLength: count }),
  events: (count: number = 10) => fc.array(generators.event(), { minLength: count, maxLength: count }),
  tasks: (count: number = 15) => fc.array(generators.task(), { minLength: count, maxLength: count }),
  songs: (count: number = 20) => fc.array(generators.song(), { minLength: count, maxLength: count }),
  setlists: (count: number = 5) => fc.array(generators.setlist(), { minLength: count, maxLength: count }),
  brandDeals: (count: number = 8) => fc.array(generators.brandDeal(), { minLength: count, maxLength: count }),
  solarLeads: (count: number = 12) => fc.array(generators.solarLead(), { minLength: count, maxLength: count }),
  pomodoroSessions: (count: number = 25) => fc.array(generators.pomodoroSession(), { minLength: count, maxLength: count }),
};

// Edge case generators for boundary testing
export const edgeCases = {
  // Empty or minimal data
  emptyString: () => fc.constant(''),
  emptyArray: () => fc.constant([]),
  minimalUser: () => fc.record({
    id: generators.id(),
    email: generators.email(),
    role: generators.userRole(),
    permissions: fc.constant([]),
    preferences: fc.record({
      theme: fc.constant('auto'),
      language: fc.constant('en'),
      timezone: fc.constant('UTC'),
      notifications: fc.record({
        email: fc.constant(true),
        push: fc.constant(true),
        focusMode: fc.constant(false),
      }),
      privacyShield: fc.record({
        enabled: fc.constant(false),
        hidePersonalDetails: fc.constant(true),
        showAsBusy: fc.constant(true),
        allowedViewers: fc.constant([]),
      }),
    }),
  }),
  
  // Boundary values
  lowBattery: () => fc.integer({ min: 0, max: 20 }),
  criticalBattery: () => fc.integer({ min: 0, max: 5 }),
  maxRetryCount: () => fc.constant(10),
  
  // Invalid or problematic data
  invalidEmail: () => fc.constantFrom('invalid-email', '@domain.com', 'user@', ''),
  invalidDate: () => fc.constantFrom(new Date('invalid'), new Date(NaN)),
  
  // Large datasets for performance testing
  largeDataset: (entityGenerator: any, size: number = 1000) => 
    fc.array(entityGenerator, { minLength: size, maxLength: size }),
};

// Constraint validators to ensure generated data respects business rules
export const validators = {
  isValidUser: (user: any): boolean => {
    return user.id && user.email && user.role && Array.isArray(user.permissions);
  },
  
  isValidEvent: (event: any): boolean => {
    return event.id && event.title && event.startTime && event.endTime && 
           new Date(event.startTime) <= new Date(event.endTime);
  },
  
  isValidSong: (song: any): boolean => {
    return song.id && song.title && song.artist && song.key && 
           song.bpm >= 60 && song.bpm <= 200 && song.duration > 0;
  },
  
  isValidBrandDeal: (deal: any): boolean => {
    return deal.id && deal.brandName && deal.campaignName && 
           deal.fee > 0 && Array.isArray(deal.deliverables) && deal.deliverables.length > 0;
  },
  
  isValidSolarLead: (lead: any): boolean => {
    return lead.id && lead.contactInfo && lead.contactInfo.email && 
           lead.propertyType && lead.status && lead.energyRequirements;
  },
  
  isValidPomodoroSession: (session: any): boolean => {
    return session.id && session.duration > 0 && session.breakDuration > 0 && 
           session.taskCategory && session.startTime;
  },
};