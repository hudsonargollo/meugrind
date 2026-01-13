import { prService } from '../pr-service';
import { db } from '../database';

// Mock the database
jest.mock('../database', () => ({
  db: {
    appearanceWindows: {
      add: jest.fn(),
      get: jest.fn(),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
        belowOrEqual: jest.fn(() => ({
          and: jest.fn(() => ({
            toArray: jest.fn(),
          })),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    prEvents: {
      add: jest.fn(),
      get: jest.fn(),
      orderBy: jest.fn(() => ({
        reverse: jest.fn(() => ({
          toArray: jest.fn(),
        })),
        toArray: jest.fn(),
      })),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
        between: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    talkingPoints: {
      add: jest.fn(),
      get: jest.fn(),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    approvedNarratives: {
      add: jest.fn(),
      get: jest.fn(),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          and: jest.fn(() => ({
            toArray: jest.fn(),
          })),
          toArray: jest.fn(),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    events: {
      add: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          first: jest.fn(),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    prContracts: {
      orderBy: jest.fn(() => ({
        reverse: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
    },
    mediaCoverage: {
      add: jest.fn(),
      get: jest.fn(),
      orderBy: jest.fn(() => ({
        reverse: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
        between: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('PRService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Appearance Windows', () => {
    it('should create an appearance window', async () => {
      const mockWindow = {
        contractId: 'contract-1',
        showName: 'Test Show',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        availabilityType: 'available' as const,
      };

      (db.appearanceWindows.add as jest.Mock).mockResolvedValue(undefined);

      const result = await prService.createAppearanceWindow(mockWindow);

      expect(db.appearanceWindows.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockWindow,
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          syncStatus: 'pending',
          version: 1,
        })
      );
      expect(result).toMatchObject(mockWindow);
    });

    it('should check availability for a date range', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');

      const mockConflictingWindows = [
        {
          id: '1',
          availabilityType: 'blackout',
          startDate: new Date('2024-06-15'),
          endDate: new Date('2024-06-20'),
        },
        {
          id: '2',
          availabilityType: 'restricted',
          startDate: new Date('2024-06-25'),
          endDate: new Date('2024-06-28'),
          restrictions: ['No competing shows'],
        },
      ];

      (db.appearanceWindows.where as jest.Mock).mockReturnValue({
        belowOrEqual: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockConflictingWindows),
          }),
        }),
      });

      const result = await prService.checkAvailability(startDate, endDate);

      expect(result.isAvailable).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.restrictions).toContain('No competing shows');
    });
  });

  describe('PR Events', () => {
    it('should create a PR event with calendar integration', async () => {
      const mockEvent = {
        title: 'Test Interview',
        type: 'interview' as const,
        date: new Date('2024-06-15T10:00:00'),
        location: 'Studio A',
        duration: 60,
        contactPerson: {
          name: 'John Doe',
          role: 'Producer',
          email: 'john@example.com',
          phone: '555-1234',
          company: 'Test Network',
        },
        talkingPoints: ['Point 1', 'Point 2'],
        status: 'scheduled' as const,
        mediaOutlets: ['Test Network'],
      };

      (db.prEvents.add as jest.Mock).mockResolvedValue(undefined);
      (db.events.add as jest.Mock).mockResolvedValue(undefined);

      const result = await prService.createPREvent(mockEvent);

      expect(db.prEvents.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockEvent,
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          syncStatus: 'pending',
          version: 1,
        })
      );

      // Should also create a calendar event
      expect(db.events.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockEvent.title,
          type: 'pr_event',
          moduleType: 'pr',
          startTime: mockEvent.date,
          endTime: expect.any(Date),
        })
      );

      expect(result).toMatchObject(mockEvent);
    });
  });

  describe('Talking Points', () => {
    it('should create a talking point', async () => {
      const mockPoint = {
        category: 'Career',
        topic: 'Recent Projects',
        keyMessage: 'Focus on growth and learning',
        supportingFacts: ['Fact 1', 'Fact 2'],
        doNotMention: ['Sensitive topic'],
        approved: false,
        lastUpdated: new Date(),
      };

      (db.talkingPoints.add as jest.Mock).mockResolvedValue(undefined);

      const result = await prService.createTalkingPoint(mockPoint);

      expect(db.talkingPoints.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockPoint,
          id: expect.any(String),
        })
      );
      expect(result).toMatchObject(mockPoint);
    });

    it('should approve a talking point', async () => {
      const pointId = 'point-1';
      (db.talkingPoints.update as jest.Mock).mockResolvedValue(undefined);

      await prService.approveTalkingPoint(pointId);

      expect(db.talkingPoints.update).toHaveBeenCalledWith(pointId, {
        approved: true,
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('Approved Narratives', () => {
    it('should create an approved narrative', async () => {
      const mockNarrative = {
        title: 'My Journey',
        category: 'personal_story' as const,
        narrative: 'This is my story...',
        keyPoints: ['Point 1', 'Point 2'],
        variations: ['Short version', 'Long version'],
        mediaOutlets: [],
        approved: false,
        approvedBy: 'user-1',
      };

      (db.approvedNarratives.add as jest.Mock).mockResolvedValue(undefined);

      const result = await prService.createApprovedNarrative(mockNarrative);

      expect(db.approvedNarratives.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockNarrative,
          id: expect.any(String),
        })
      );
      expect(result).toMatchObject(mockNarrative);
    });

    it('should mark narrative as used', async () => {
      const narrativeId = 'narrative-1';
      const outlet = 'Test Magazine';
      const mockNarrative = {
        id: narrativeId,
        mediaOutlets: ['Previous Outlet'],
      };

      (db.approvedNarratives.get as jest.Mock).mockResolvedValue(mockNarrative);
      (db.approvedNarratives.update as jest.Mock).mockResolvedValue(undefined);

      await prService.markNarrativeAsUsed(narrativeId, outlet);

      expect(db.approvedNarratives.update).toHaveBeenCalledWith(narrativeId, {
        lastUsed: expect.any(Date),
        mediaOutlets: ['Previous Outlet', outlet],
      });
    });
  });
});