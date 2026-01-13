import { eventService } from '../event-service';
import { Event, User } from '../../types';

describe('EventService', () => {
  const mockManagerUser: User = {
    id: 'manager-1',
    email: 'manager@example.com',
    role: 'manager',
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

  const mockPersonalUser: User = {
    id: 'personal-1',
    email: 'personal@example.com',
    role: 'personal',
    permissions: [],
    preferences: {
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      notifications: { email: true, push: true, focusMode: false },
      privacyShield: {
        enabled: true,
        hidePersonalDetails: true,
        showAsBusy: true,
        allowedViewers: [],
      },
    },
  };

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Manager Only Meeting',
      startTime: new Date(),
      endTime: new Date(),
      type: 'personal',
      visibility: 'manager_only',
      createdBy: 'manager-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
      version: 1,
    },
    {
      id: '2',
      title: 'FYI Event',
      startTime: new Date(),
      endTime: new Date(),
      type: 'gig',
      visibility: 'fyi_only',
      createdBy: 'manager-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
      version: 1,
    },
    {
      id: '3',
      title: 'Mandatory Meeting',
      startTime: new Date(),
      endTime: new Date(),
      type: 'brand_deal',
      visibility: 'mandatory',
      createdBy: 'manager-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
      version: 1,
    },
    {
      id: '4',
      title: 'Personal Time',
      startTime: new Date(),
      endTime: new Date(),
      type: 'personal',
      visibility: 'mandatory',
      createdBy: 'personal-1',
      isPrivacyShielded: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
      version: 1,
    },
  ];

  describe('filterEventsByVisibility', () => {
    it('should allow manager to see all events', () => {
      const filtered = eventService.filterEventsByVisibility(mockEvents, mockManagerUser);
      expect(filtered).toHaveLength(4);
    });

    it('should filter manager-only events for personal users', () => {
      const filtered = eventService.filterEventsByVisibility(mockEvents, mockPersonalUser);
      expect(filtered).toHaveLength(3);
      expect(filtered.find(e => e.id === '1')).toBeUndefined(); // Manager-only event filtered out
    });

    it('should apply privacy shield to personal events', () => {
      const filtered = eventService.filterEventsByVisibility(mockEvents, mockManagerUser);
      const privacyShieldedEvent = filtered.find(e => e.id === '4');
      expect(privacyShieldedEvent?.title).toBe('Busy');
      expect(privacyShieldedEvent?.description).toBeUndefined();
    });
  });

  describe('canEditEvent', () => {
    it('should allow managers to edit any event', () => {
      const canEdit = eventService.canEditEvent(mockEvents[0], mockManagerUser);
      expect(canEdit).toBe(true);
    });

    it('should allow users to edit their own events', () => {
      const canEdit = eventService.canEditEvent(mockEvents[3], mockPersonalUser);
      expect(canEdit).toBe(true);
    });

    it('should not allow personal users to edit manager-only events', () => {
      const canEdit = eventService.canEditEvent(mockEvents[0], mockPersonalUser);
      expect(canEdit).toBe(false);
    });
  });

  describe('canViewEventDetails', () => {
    it('should allow viewing details for non-privacy-shielded events', () => {
      const canView = eventService.canViewEventDetails(mockEvents[1], mockPersonalUser);
      expect(canView).toBe(true);
    });

    it('should not allow viewing details for privacy-shielded events from other users', () => {
      const canView = eventService.canViewEventDetails(mockEvents[3], mockManagerUser);
      expect(canView).toBe(false);
    });
  });
});