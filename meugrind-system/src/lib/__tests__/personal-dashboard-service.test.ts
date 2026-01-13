import { personalDashboardService } from '../personal-dashboard-service';
import { db } from '../database';
import { Task, Event } from '../../types';

// Mock the database
jest.mock('../database', () => ({
  db: {
    tasks: {
      where: jest.fn(),
      add: jest.fn(),
      toArray: jest.fn(),
    },
    events: {
      where: jest.fn(),
    },
    studyTrackers: {
      where: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      toArray: jest.fn(),
    },
  },
}));

describe('PersonalDashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getImmediateActions', () => {
    it('should return next 3 immediate actions prioritized correctly', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task1',
          title: 'Urgent Task',
          completed: false,
          priority: 'urgent',
          category: 'work',
          dueDate: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'synced',
          version: 1,
        },
        {
          id: 'task2',
          title: 'High Priority Task',
          completed: false,
          priority: 'high',
          category: 'personal',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'synced',
          version: 1,
        },
      ];

      const mockEvents: Event[] = [
        {
          id: 'event1',
          title: 'Important Meeting',
          startTime: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes from now
          endTime: new Date(Date.now() + 1000 * 60 * 90), // 90 minutes from now
          type: 'personal',
          visibility: 'mandatory',
          createdBy: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'synced',
          version: 1,
        },
      ];

      // Mock the database queries
      (db.tasks.where as jest.Mock).mockImplementation((field: string) => ({
        equals: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            sortBy: jest.fn().mockResolvedValue(mockTasks.filter(t => t.priority === 'urgent')),
          }),
        }),
      }));

      (db.events.where as jest.Mock).mockImplementation((field: string) => ({
        between: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            sortBy: jest.fn().mockResolvedValue(mockEvents),
          }),
        }),
      }));

      const actions = await personalDashboardService.getImmediateActions();

      expect(actions).toHaveLength(2);
      expect(actions[0].priority).toBe('urgent');
      expect(actions[0].type).toBe('task');
      expect(actions[1].priority).toBe('high');
      expect(actions[1].type).toBe('event');
    });

    it('should limit results to 3 actions maximum', async () => {
      const mockTasks: Task[] = Array.from({ length: 5 }, (_, i) => ({
        id: `task${i}`,
        title: `Task ${i}`,
        completed: false,
        priority: 'urgent' as const,
        category: 'work',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * i),
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced' as const,
        version: 1,
      }));

      (db.tasks.where as jest.Mock).mockImplementation(() => ({
        equals: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            sortBy: jest.fn().mockResolvedValue(mockTasks),
          }),
        }),
      }));

      (db.events.where as jest.Mock).mockImplementation(() => ({
        between: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            sortBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      }));

      const actions = await personalDashboardService.getImmediateActions();

      expect(actions).toHaveLength(3);
    });
  });

  describe('getStudyCategories', () => {
    it('should return predefined study categories', () => {
      const categories = personalDashboardService.getStudyCategories();

      expect(categories).toHaveLength(6);
      expect(categories[0].name).toBe('Music Production');
      expect(categories[0].subcategories).toContain('Recording');
      expect(categories[0].color).toBeDefined();
      expect(categories[0].icon).toBeDefined();
    });

    it('should include all expected categories', () => {
      const categories = personalDashboardService.getStudyCategories();
      const categoryNames = categories.map(c => c.name);

      expect(categoryNames).toContain('Music Production');
      expect(categoryNames).toContain('Business & Marketing');
      expect(categoryNames).toContain('Technology');
      expect(categoryNames).toContain('Creative Skills');
      expect(categoryNames).toContain('Personal Development');
      expect(categoryNames).toContain('Industry Knowledge');
    });
  });

  describe('logStudyTime', () => {
    it('should create new study entry when none exists for today', async () => {
      const mockAdd = jest.fn().mockResolvedValue('new-id');
      (db.studyTrackers.where as jest.Mock).mockImplementation(() => ({
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(null),
        }),
      }));
      (db.studyTrackers.add as jest.Mock) = mockAdd;

      await personalDashboardService.logStudyTime(
        'Music Production',
        'Recording',
        60,
        'Learned about microphone placement',
        ['https://example.com/tutorial']
      );

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Music Production',
          subcategory: 'Recording',
          timeSpent: 60,
          notes: 'Learned about microphone placement',
          resources: ['https://example.com/tutorial'],
        })
      );
    });

    it('should update existing study entry when one exists for today', async () => {
      const existingEntry = {
        id: 'existing-id',
        category: 'Music Production',
        timeSpent: 30,
        notes: 'Previous notes',
        resources: ['https://old-resource.com'],
      };

      const mockUpdate = jest.fn().mockResolvedValue(1);
      (db.studyTrackers.where as jest.Mock).mockImplementation(() => ({
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(existingEntry),
        }),
      }));
      (db.studyTrackers.update as jest.Mock) = mockUpdate;

      await personalDashboardService.logStudyTime(
        'Music Production',
        'Mixing',
        45,
        'New notes',
        ['https://new-resource.com']
      );

      expect(mockUpdate).toHaveBeenCalledWith('existing-id', {
        timeSpent: 75, // 30 + 45
        subcategory: 'Mixing',
        notes: 'Previous notes\nNew notes',
        resources: ['https://old-resource.com', 'https://new-resource.com'],
      });
    });
  });

  describe('getStudyStatistics', () => {
    it('should calculate correct statistics from study data', async () => {
      const mockStudyEntries = [
        {
          id: '1',
          category: 'Music Production',
          timeSpent: 60,
          date: new Date(),
        },
        {
          id: '2',
          category: 'Technology',
          timeSpent: 90,
          date: new Date(),
        },
        {
          id: '3',
          category: 'Music Production',
          timeSpent: 30,
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        },
      ];

      (db.studyTrackers.toArray as jest.Mock).mockResolvedValue(mockStudyEntries);

      const stats = await personalDashboardService.getStudyStatistics();

      expect(stats.totalHours).toBe(3); // 180 minutes = 3 hours
      expect(stats.categoriesStudied).toBe(2); // Music Production and Technology
      expect(stats.thisWeekHours).toBeGreaterThan(0);
    });
  });
});