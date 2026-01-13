// Event service for MEUGRIND system with visibility and privacy shield support
import { Event, User } from '../types';
import { authService } from './auth-service';

export interface EventVisibilityFilter {
  includeManagerOnly?: boolean;
  includeFyiOnly?: boolean;
  includeMandatory?: boolean;
  respectPrivacyShield?: boolean;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'gig' | 'brand_deal' | 'pr_event' | 'solar_appointment' | 'personal';
  visibility: 'manager_only' | 'fyi_only' | 'mandatory';
  moduleId?: string;
  moduleType?: 'band' | 'influencer' | 'solar' | 'pr';
  isPrivacyShielded?: boolean;
}

class EventService {
  
  /**
   * Filter events based on user role and visibility settings
   */
  filterEventsByVisibility(events: Event[], currentUser: User, targetUser?: User): Event[] {
    const isManager = currentUser.role === 'manager';
    const isPersonal = currentUser.role === 'personal';
    
    return events.filter(event => {
      // Manager can see all events they created
      if (isManager && event.createdBy === currentUser.id) {
        return true;
      }
      
      // Handle visibility rules
      switch (event.visibility) {
        case 'manager_only':
          // Only managers can see manager-only events
          return isManager;
          
        case 'fyi_only':
          // Personal accounts can see FYI events (read-only)
          return true;
          
        case 'mandatory':
          // Both roles can see mandatory events
          return true;
          
        default:
          return false;
      }
    }).map(event => {
      // Apply privacy shield if viewing someone else's personal events
      if (this.shouldApplyPrivacyShield(event, currentUser, targetUser)) {
        return this.applyPrivacyShield(event);
      }
      return event;
    });
  }

  /**
   * Check if privacy shield should be applied to an event
   */
  private shouldApplyPrivacyShield(event: Event, viewer: User, eventOwner?: User): boolean {
    // Privacy shield only applies to personal events
    if (event.type !== 'personal') {
      return false;
    }
    
    // Don't shield from the event owner
    if (event.createdBy === viewer.id) {
      return false;
    }
    
    // Check if event is marked as privacy shielded
    if (!event.isPrivacyShielded) {
      return false;
    }
    
    // Check if viewer is in allowed viewers list (if eventOwner preferences available)
    if (eventOwner?.preferences.privacyShield.enabled) {
      const allowedViewers = eventOwner.preferences.privacyShield.allowedViewers;
      if (allowedViewers.includes(viewer.id)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Apply privacy shield to an event (mask sensitive details)
   */
  private applyPrivacyShield(event: Event): Event {
    return {
      ...event,
      title: 'Busy',
      description: undefined,
      moduleId: undefined,
      moduleType: undefined,
    };
  }

  /**
   * Create a new event with proper visibility and privacy settings
   */
  createEvent(data: CreateEventData): Event {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to create events');
    }

    // Validate visibility permissions
    if (data.visibility === 'manager_only' && currentUser.role !== 'manager') {
      throw new Error('Only managers can create manager-only events');
    }

    const event: Event = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1,
      createdBy: currentUser.id,
      ...data,
    };

    return event;
  }

  /**
   * Update event visibility
   */
  updateEventVisibility(
    event: Event, 
    newVisibility: 'manager_only' | 'fyi_only' | 'mandatory'
  ): Event {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to update events');
    }

    // Only the creator or managers can update visibility
    if (event.createdBy !== currentUser.id && currentUser.role !== 'manager') {
      throw new Error('Insufficient permissions to update event visibility');
    }

    // Only managers can set manager-only visibility
    if (newVisibility === 'manager_only' && currentUser.role !== 'manager') {
      throw new Error('Only managers can set manager-only visibility');
    }

    return {
      ...event,
      visibility: newVisibility,
      updatedAt: new Date(),
      version: event.version + 1,
      syncStatus: 'pending',
    };
  }

  /**
   * Toggle privacy shield for personal events
   */
  togglePrivacyShield(event: Event): Event {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to update events');
    }

    // Only the creator can toggle privacy shield
    if (event.createdBy !== currentUser.id) {
      throw new Error('Only event creator can toggle privacy shield');
    }

    // Privacy shield only applies to personal events
    if (event.type !== 'personal') {
      throw new Error('Privacy shield only applies to personal events');
    }

    return {
      ...event,
      isPrivacyShielded: !event.isPrivacyShielded,
      updatedAt: new Date(),
      version: event.version + 1,
      syncStatus: 'pending',
    };
  }

  /**
   * Check if user can edit an event
   */
  canEditEvent(event: Event, user: User): boolean {
    // Managers can edit any event
    if (user.role === 'manager') {
      return true;
    }

    // Users can edit their own events
    if (event.createdBy === user.id) {
      return true;
    }

    // Personal accounts cannot edit manager-only events
    if (event.visibility === 'manager_only') {
      return false;
    }

    return false;
  }

  /**
   * Check if user can view event details (not just see it exists)
   */
  canViewEventDetails(event: Event, user: User): boolean {
    // Apply privacy shield check
    if (this.shouldApplyPrivacyShield(event, user)) {
      return false;
    }

    // Manager can view all event details
    if (user.role === 'manager') {
      return true;
    }

    // Users can view their own events
    if (event.createdBy === user.id) {
      return true;
    }

    // Personal accounts can view FYI and mandatory events
    if (event.visibility === 'fyi_only' || event.visibility === 'mandatory') {
      return true;
    }

    return false;
  }

  /**
   * Get events visible to a specific user role
   */
  getEventsForRole(events: Event[], role: 'manager' | 'personal'): Event[] {
    const mockUser: User = {
      id: 'current-user',
      email: 'user@example.com',
      role,
      permissions: [],
      preferences: {
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        notifications: { email: true, push: true, focusMode: false },
        privacyShield: {
          enabled: false,
          hidePersonalDetails: false,
          showAsBusy: false,
          allowedViewers: [],
        },
      },
    };

    return this.filterEventsByVisibility(events, mockUser);
  }
}

export const eventService = new EventService();