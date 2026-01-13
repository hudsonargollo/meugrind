import { bandService } from '../band-service';
import { Song, Contractor } from '../../types/band';

// Mock the database
jest.mock('../database', () => ({
  db: {
    songs: {
      add: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contractors: {
      add: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('BandService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Song Management', () => {
    it('should create a song with all required fields', async () => {
      const songData = {
        title: 'Test Song',
        artist: 'Test Artist',
        key: 'C',
        bpm: 120,
        duration: 180,
        techRequirements: [],
        notes: 'Test notes'
      };

      const mockSong = { id: 'test-id', ...songData };
      
      // Mock the database add method
      const { db } = require('../database');
      db.songs.add.mockResolvedValue(mockSong);

      const result = await bandService.createSong(songData);

      expect(db.songs.add).toHaveBeenCalledWith(expect.objectContaining({
        ...songData,
        id: expect.any(String)
      }));
      expect(result).toEqual(expect.objectContaining(songData));
    });

    it('should search songs by title, artist, and key', async () => {
      const mockSongs: Song[] = [
        {
          id: '1',
          title: 'Reggae Song',
          artist: 'Bob Marley',
          key: 'A',
          bpm: 120,
          duration: 180,
          techRequirements: []
        },
        {
          id: '2',
          title: 'Rock Song',
          artist: 'The Beatles',
          key: 'C',
          bpm: 140,
          duration: 200,
          techRequirements: []
        }
      ];

      const { db } = require('../database');
      db.songs.toArray.mockResolvedValue(mockSongs);

      // Test search by title
      const titleResults = await bandService.searchSongs('reggae');
      expect(titleResults).toHaveLength(1);
      expect(titleResults[0].title).toBe('Reggae Song');

      // Test search by artist
      const artistResults = await bandService.searchSongs('marley');
      expect(artistResults).toHaveLength(1);
      expect(artistResults[0].artist).toBe('Bob Marley');

      // Test search by key
      const keyResults = await bandService.searchSongs('c');
      expect(keyResults).toHaveLength(1);
      expect(keyResults[0].key).toBe('C');
    });

    it('should filter songs by BPM range', async () => {
      const mockSongs: Song[] = [
        {
          id: '1',
          title: 'Slow Song',
          key: 'A',
          bpm: 80,
          duration: 180,
          techRequirements: []
        },
        {
          id: '2',
          title: 'Medium Song',
          key: 'C',
          bpm: 120,
          duration: 200,
          techRequirements: []
        },
        {
          id: '3',
          title: 'Fast Song',
          key: 'D',
          bpm: 160,
          duration: 150,
          techRequirements: []
        }
      ];

      const { db } = require('../database');
      db.songs.toArray.mockResolvedValue(mockSongs);

      const results = await bandService.getSongsByBPMRange(100, 140);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Medium Song');
    });
  });

  describe('Contractor Management', () => {
    it('should create a contractor with all required fields', async () => {
      const contractorData = {
        name: 'John Doe',
        role: 'sound_engineer' as const,
        phone: '+1234567890',
        email: 'john@example.com',
        rate: 50,
        availability: ['Monday', 'Tuesday', 'Wednesday']
      };

      const mockContractor = { id: 'test-id', ...contractorData };
      
      const { db } = require('../database');
      db.contractors.add.mockResolvedValue(mockContractor);

      const result = await bandService.createContractor(contractorData);

      expect(db.contractors.add).toHaveBeenCalledWith(expect.objectContaining({
        ...contractorData,
        id: expect.any(String)
      }));
      expect(result).toEqual(expect.objectContaining(contractorData));
    });

    it('should filter contractors by role', async () => {
      const mockContractors: Contractor[] = [
        {
          id: '1',
          name: 'Sound Engineer',
          role: 'sound_engineer',
          phone: '+1111111111',
          availability: []
        },
        {
          id: '2',
          name: 'Lighting Tech',
          role: 'lighting_tech',
          phone: '+2222222222',
          availability: []
        },
        {
          id: '3',
          name: 'Another Sound Engineer',
          role: 'sound_engineer',
          phone: '+3333333333',
          availability: []
        }
      ];

      const { db } = require('../database');
      db.contractors.toArray.mockResolvedValue(mockContractors);

      const results = await bandService.getContractorsByRole('sound_engineer');
      expect(results).toHaveLength(2);
      expect(results.every(c => c.role === 'sound_engineer')).toBe(true);
    });

    it('should search contractors by name, phone, and email', async () => {
      const mockContractors: Contractor[] = [
        {
          id: '1',
          name: 'John Smith',
          role: 'sound_engineer',
          phone: '+1234567890',
          email: 'john@example.com',
          availability: []
        },
        {
          id: '2',
          name: 'Jane Doe',
          role: 'lighting_tech',
          phone: '+0987654321',
          email: 'jane@example.com',
          availability: []
        }
      ];

      const { db } = require('../database');
      db.contractors.toArray.mockResolvedValue(mockContractors);

      // Test search by name
      const nameResults = await bandService.searchContractors('john');
      expect(nameResults).toHaveLength(1);
      expect(nameResults[0].name).toBe('John Smith');

      // Test search by phone
      const phoneResults = await bandService.searchContractors('1234567890');
      expect(phoneResults).toHaveLength(1);
      expect(phoneResults[0].phone).toBe('+1234567890');

      // Test search by email
      const emailResults = await bandService.searchContractors('jane@example.com');
      expect(emailResults).toHaveLength(1);
      expect(emailResults[0].email).toBe('jane@example.com');
    });
  });
});