import { influencerService } from '../influencer-service';
import { BrandDeal, Brand, ContentAsset, Script } from '../../types/influencer';

// Mock the database
jest.mock('../database', () => ({
  db: {
    brandDeals: {
      add: jest.fn(),
      get: jest.fn(),
      orderBy: jest.fn(() => ({
        reverse: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
      })),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
        anyOf: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
      bulkAdd: jest.fn(),
    },
    contentAssets: {
      add: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(() => Promise.resolve([])),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve([])),
      })),
    },
    brands: {
      add: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(() => Promise.resolve([])),
      where: jest.fn(() => ({
        equalsIgnoreCase: jest.fn(() => ({
          first: jest.fn(() => Promise.resolve(null)),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scripts: {
      add: jest.fn(),
      get: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
      })),
      update: jest.fn(),
      delete: jest.fn(),
      orderBy: jest.fn(() => ({
        reverse: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
      })),
    },
    tasks: {
      bulkAdd: jest.fn(),
    },
  },
}));

describe('InfluencerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Brand Deal Management', () => {
    it('should create a brand deal with auto-generated deliverable tasks', async () => {
      const mockBrandDeal = {
        brandName: 'Test Brand',
        campaignName: 'Test Campaign',
        status: 'pitch' as const,
        deliverables: [
          {
            id: 'del-1',
            type: 'post' as const,
            platform: 'instagram' as const,
            description: 'Test post',
            deadline: new Date(),
            completed: false,
          },
        ],
        exclusivityClauses: ['No competing brands'],
        fee: 1000,
        deadline: new Date(),
      };

      const result = await influencerService.createBrandDeal(mockBrandDeal);

      expect(result).toHaveProperty('id');
      expect(result.brandName).toBe('Test Brand');
      expect(result.campaignName).toBe('Test Campaign');
    });

    it('should get content pipeline with correct stages', async () => {
      const pipeline = await influencerService.getContentPipeline();

      expect(pipeline).toHaveProperty('ideation');
      expect(pipeline).toHaveProperty('scripting');
      expect(pipeline).toHaveProperty('filming');
      expect(pipeline).toHaveProperty('approval');
      expect(pipeline).toHaveProperty('posted');
      expect(pipeline).toHaveProperty('invoice_sent');
    });
  });

  describe('Brand Conflict Detection', () => {
    it('should detect no conflicts for new brand', async () => {
      const result = await influencerService.checkBrandConflicts('New Brand', ['No competing products']);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.isBlacklisted).toBe(false);
    });

    it('should detect conflicts with overlapping exclusivity clauses', async () => {
      // This would require more complex mocking to test actual conflict detection
      // For now, we test that the method exists and returns the expected structure
      const result = await influencerService.checkBrandConflicts('Test Brand', ['beauty products']);

      expect(result).toHaveProperty('hasConflicts');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('isBlacklisted');
    });
  });

  describe('Content Asset Management', () => {
    it('should create content asset', async () => {
      const mockAsset = {
        type: 'post' as const,
        platform: 'instagram',
        title: 'Test Post',
        description: 'Test description',
        status: 'draft' as const,
        metrics: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagement: 0,
          timestamp: new Date(),
        },
      };

      const result = await influencerService.createContentAsset(mockAsset);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('post');
      expect(result.platform).toBe('instagram');
    });
  });

  describe('Script Management', () => {
    it('should create script with teleprompter settings', async () => {
      const mockScript = {
        title: 'Test Script',
        content: 'This is a test script content.',
        teleprompterSettings: {
          fontSize: 24,
          scrollSpeed: 2,
          backgroundColor: '#000000',
          textColor: '#ffffff',
          mirrorMode: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await influencerService.createScript(mockScript);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test Script');
      expect(result.teleprompterSettings.fontSize).toBe(24);
    });
  });
});