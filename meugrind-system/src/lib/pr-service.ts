import { db } from './database';
import { 
  AppearanceWindow, 
  PREvent, 
  TalkingPoint, 
  ApprovedNarrative, 
  MediaCoverage, 
  PRContract,
  WardrobeNotes,
  ContactInfo
} from '../types/pr';
import { Event } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PRService {
  // Appearance Window CRUD Operations
  async createAppearanceWindow(window: Omit<AppearanceWindow, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<AppearanceWindow> {
    const newWindow: AppearanceWindow = {
      ...window,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1,
    };

    await db.appearanceWindows.add(newWindow);
    return newWindow;
  }

  async getAppearanceWindow(id: string): Promise<AppearanceWindow | undefined> {
    return await db.appearanceWindows.get(id);
  }

  async getAllAppearanceWindows(): Promise<AppearanceWindow[]> {
    return await db.appearanceWindows.orderBy('startDate').toArray();
  }

  async getAppearanceWindowsByContract(contractId: string): Promise<AppearanceWindow[]> {
    return await db.appearanceWindows.where('contractId').equals(contractId).toArray();
  }

  async getActiveAppearanceWindows(date: Date = new Date()): Promise<AppearanceWindow[]> {
    return await db.appearanceWindows
      .where('startDate')
      .belowOrEqual(date)
      .and(window => window.endDate >= date)
      .toArray();
  }

  async updateAppearanceWindow(id: string, updates: Partial<AppearanceWindow>): Promise<void> {
    await db.appearanceWindows.update(id, {
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'pending',
    });
  }

  async deleteAppearanceWindow(id: string): Promise<void> {
    await db.appearanceWindows.delete(id);
  }

  // Check availability for a given date range
  async checkAvailability(startDate: Date, endDate: Date): Promise<{
    isAvailable: boolean;
    conflicts: AppearanceWindow[];
    restrictions: string[];
  }> {
    const conflictingWindows = await db.appearanceWindows
      .where('startDate')
      .belowOrEqual(endDate)
      .and(window => window.endDate >= startDate)
      .toArray();

    const blackoutWindows = conflictingWindows.filter(w => w.availabilityType === 'blackout');
    const restrictedWindows = conflictingWindows.filter(w => w.availabilityType === 'restricted');

    const restrictions: string[] = [];
    restrictedWindows.forEach(window => {
      if (window.restrictions) {
        restrictions.push(...window.restrictions);
      }
    });

    return {
      isAvailable: blackoutWindows.length === 0,
      conflicts: blackoutWindows,
      restrictions,
    };
  }

  // PR Event CRUD Operations
  async createPREvent(event: Omit<PREvent, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<PREvent> {
    const newEvent: PREvent = {
      ...event,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1,
    };

    await db.prEvents.add(newEvent);

    // Create corresponding calendar event
    await this.createCalendarEvent(newEvent);

    return newEvent;
  }

  async getPREvent(id: string): Promise<PREvent | undefined> {
    return await db.prEvents.get(id);
  }

  async getAllPREvents(): Promise<PREvent[]> {
    return await db.prEvents.orderBy('date').reverse().toArray();
  }

  async getPREventsByStatus(status: PREvent['status']): Promise<PREvent[]> {
    return await db.prEvents.where('status').equals(status).toArray();
  }

  async getPREventsByType(type: PREvent['type']): Promise<PREvent[]> {
    return await db.prEvents.where('type').equals(type).toArray();
  }

  async updatePREvent(id: string, updates: Partial<PREvent>): Promise<void> {
    await db.prEvents.update(id, {
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'pending',
    });

    // Update corresponding calendar event if it exists
    const calendarEvent = await db.events.where('moduleId').equals(id).first();
    if (calendarEvent && updates.title) {
      await db.events.update(calendarEvent.id, {
        title: updates.title,
        updatedAt: new Date(),
        syncStatus: 'pending',
      });
    }
  }

  async deletePREvent(id: string): Promise<void> {
    await db.prEvents.delete(id);
    
    // Delete corresponding calendar event
    const calendarEvent = await db.events.where('moduleId').equals(id).first();
    if (calendarEvent) {
      await db.events.delete(calendarEvent.id);
    }
  }

  // Link wardrobe notes to PR event
  async linkWardrobeNotes(eventId: string, wardrobeNotes: WardrobeNotes): Promise<void> {
    await this.updatePREvent(eventId, { wardrobeNotes });
  }

  // Create calendar event for PR event
  private async createCalendarEvent(prEvent: PREvent): Promise<void> {
    const calendarEvent: Event = {
      id: uuidv4(),
      title: prEvent.title,
      description: `${prEvent.type.toUpperCase()} - ${prEvent.location}`,
      startTime: prEvent.date,
      endTime: new Date(prEvent.date.getTime() + prEvent.duration * 60000),
      type: 'pr_event',
      visibility: 'manager_only',
      moduleId: prEvent.id,
      moduleType: 'pr',
      createdBy: 'system', // This should be the current user ID
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1,
    };

    await db.events.add(calendarEvent);
  }

  // Talking Points CRUD Operations
  async createTalkingPoint(point: Omit<TalkingPoint, 'id'>): Promise<TalkingPoint> {
    const newPoint: TalkingPoint = {
      ...point,
      id: uuidv4(),
    };

    await db.talkingPoints.add(newPoint);
    return newPoint;
  }

  async getTalkingPoint(id: string): Promise<TalkingPoint | undefined> {
    return await db.talkingPoints.get(id);
  }

  async getAllTalkingPoints(): Promise<TalkingPoint[]> {
    return await db.talkingPoints.orderBy('category').toArray();
  }

  async getTalkingPointsByCategory(category: string): Promise<TalkingPoint[]> {
    return await db.talkingPoints.where('category').equals(category).toArray();
  }

  async getApprovedTalkingPoints(): Promise<TalkingPoint[]> {
    const allPoints = await db.talkingPoints.toArray();
    return allPoints.filter(point => point.approved === true);
  }

  async updateTalkingPoint(id: string, updates: Partial<TalkingPoint>): Promise<void> {
    await db.talkingPoints.update(id, {
      ...updates,
      lastUpdated: new Date(),
    });
  }

  async deleteTalkingPoint(id: string): Promise<void> {
    await db.talkingPoints.delete(id);
  }

  async approveTalkingPoint(id: string): Promise<void> {
    await this.updateTalkingPoint(id, { 
      approved: true,
      lastUpdated: new Date(),
    });
  }

  // Approved Narratives CRUD Operations
  async createApprovedNarrative(narrative: Omit<ApprovedNarrative, 'id'>): Promise<ApprovedNarrative> {
    const newNarrative: ApprovedNarrative = {
      ...narrative,
      id: uuidv4(),
    };

    await db.approvedNarratives.add(newNarrative);
    return newNarrative;
  }

  async getApprovedNarrative(id: string): Promise<ApprovedNarrative | undefined> {
    return await db.approvedNarratives.get(id);
  }

  async getAllApprovedNarratives(): Promise<ApprovedNarrative[]> {
    return await db.approvedNarratives.orderBy('category').toArray();
  }

  async getApprovedNarrativesByCategory(category: ApprovedNarrative['category']): Promise<ApprovedNarrative[]> {
    return await db.approvedNarratives.where('category').equals(category).toArray();
  }

  async getActiveNarratives(): Promise<ApprovedNarrative[]> {
    const now = new Date();
    const allNarratives = await db.approvedNarratives.toArray();
    return allNarratives.filter(narrative => 
      narrative.approved === true && 
      (!narrative.expirationDate || narrative.expirationDate > now)
    );
  }

  async updateApprovedNarrative(id: string, updates: Partial<ApprovedNarrative>): Promise<void> {
    await db.approvedNarratives.update(id, updates);
  }

  async deleteApprovedNarrative(id: string): Promise<void> {
    await db.approvedNarratives.delete(id);
  }

  async markNarrativeAsUsed(id: string, outlet: string): Promise<void> {
    const narrative = await this.getApprovedNarrative(id);
    if (narrative) {
      const updatedOutlets = [...(narrative.mediaOutlets || []), outlet];
      await this.updateApprovedNarrative(id, {
        lastUsed: new Date(),
        mediaOutlets: updatedOutlets,
      });
    }
  }

  // PR Contract CRUD Operations
  async createPRContract(contract: Omit<PRContract, 'id'>): Promise<PRContract> {
    const newContract: PRContract = {
      ...contract,
      id: uuidv4(),
    };

    await db.prContracts.add(newContract);
    return newContract;
  }

  async getPRContract(id: string): Promise<PRContract | undefined> {
    return await db.prContracts.get(id);
  }

  async getAllPRContracts(): Promise<PRContract[]> {
    return await db.prContracts.orderBy('startDate').reverse().toArray();
  }

  async getActivePRContracts(): Promise<PRContract[]> {
    return await db.prContracts.where('status').equals('active').toArray();
  }

  async updatePRContract(id: string, updates: Partial<PRContract>): Promise<void> {
    await db.prContracts.update(id, updates);
  }

  async deletePRContract(id: string): Promise<void> {
    await db.prContracts.delete(id);
  }

  // Media Coverage CRUD Operations
  async createMediaCoverage(coverage: Omit<MediaCoverage, 'id'>): Promise<MediaCoverage> {
    const newCoverage: MediaCoverage = {
      ...coverage,
      id: uuidv4(),
    };

    await db.mediaCoverage.add(newCoverage);
    return newCoverage;
  }

  async getMediaCoverage(id: string): Promise<MediaCoverage | undefined> {
    return await db.mediaCoverage.get(id);
  }

  async getAllMediaCoverage(): Promise<MediaCoverage[]> {
    return await db.mediaCoverage.orderBy('publishDate').reverse().toArray();
  }

  async getMediaCoverageByEvent(prEventId: string): Promise<MediaCoverage[]> {
    return await db.mediaCoverage.where('prEventId').equals(prEventId).toArray();
  }

  async updateMediaCoverage(id: string, updates: Partial<MediaCoverage>): Promise<void> {
    await db.mediaCoverage.update(id, updates);
  }

  async deleteMediaCoverage(id: string): Promise<void> {
    await db.mediaCoverage.delete(id);
  }

  // Analytics and Reporting
  async getPRAnalytics(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    eventsByType: { [key: string]: number };
    totalReach: number;
    sentimentBreakdown: { [key: string]: number };
    topOutlets: string[];
  }> {
    const events = await db.prEvents
      .where('date')
      .between(startDate, endDate)
      .toArray();

    const coverage = await db.mediaCoverage
      .where('publishDate')
      .between(startDate, endDate)
      .toArray();

    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const totalReach = events.reduce((sum, event) => sum + (event.expectedReach || 0), 0);

    const sentimentBreakdown = coverage.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const outletCounts = coverage.reduce((acc, item) => {
      acc[item.outlet] = (acc[item.outlet] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topOutlets = Object.entries(outletCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([outlet]) => outlet);

    return {
      totalEvents: events.length,
      eventsByType,
      totalReach,
      sentimentBreakdown,
      topOutlets,
    };
  }
}

export const prService = new PRService();