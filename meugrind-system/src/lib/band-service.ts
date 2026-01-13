import { 
  songCRUD, 
  contractorCRUD, 
  setlistCRUD, 
  techRiderCRUD, 
  gigCRUD, 
  callSheetCRUD 
} from './crud-operations';
import { 
  Song, 
  Contractor, 
  Setlist, 
  TechRider, 
  Gig, 
  CallSheet, 
  TechRequirement,
  AudioInput,
  ContractorAssignment 
} from '../types/band';
import { v4 as uuidv4 } from 'uuid';

export class BandService {
  // Song Management
  async createSong(songData: Omit<Song, 'id'>): Promise<Song> {
    const song = await songCRUD.create(songData);
    return song as Song;
  }

  async getSong(id: string): Promise<Song | undefined> {
    const song = await songCRUD.getById(id);
    return song as Song | undefined;
  }

  async getAllSongs(): Promise<Song[]> {
    const songs = await songCRUD.getAll();
    return songs as Song[];
  }

  async updateSong(id: string, updates: Partial<Song>): Promise<void> {
    await songCRUD.update(id, updates);
  }

  async deleteSong(id: string): Promise<void> {
    await songCRUD.delete(id);
  }

  async searchSongs(query: string): Promise<Song[]> {
    const allSongs = await this.getAllSongs();
    const lowerQuery = query.toLowerCase();
    
    return allSongs.filter(song => 
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist?.toLowerCase().includes(lowerQuery) ||
      song.key.toLowerCase().includes(lowerQuery)
    );
  }

  async getSongsByKey(key: string): Promise<Song[]> {
    const allSongs = await this.getAllSongs();
    return allSongs.filter(song => song.key === key);
  }

  async getSongsByBPMRange(minBPM: number, maxBPM: number): Promise<Song[]> {
    const allSongs = await this.getAllSongs();
    return allSongs.filter(song => song.bpm >= minBPM && song.bpm <= maxBPM);
  }

  // Contractor Management
  async createContractor(contractorData: Omit<Contractor, 'id'>): Promise<Contractor> {
    const contractor = await contractorCRUD.create(contractorData);
    return contractor as Contractor;
  }

  async getContractor(id: string): Promise<Contractor | undefined> {
    const contractor = await contractorCRUD.getById(id);
    return contractor as Contractor | undefined;
  }

  async getAllContractors(): Promise<Contractor[]> {
    const contractors = await contractorCRUD.getAll();
    return contractors as Contractor[];
  }

  async updateContractor(id: string, updates: Partial<Contractor>): Promise<void> {
    await contractorCRUD.update(id, updates);
  }

  async deleteContractor(id: string): Promise<void> {
    await contractorCRUD.delete(id);
  }

  async getContractorsByRole(role: Contractor['role']): Promise<Contractor[]> {
    const allContractors = await this.getAllContractors();
    return allContractors.filter(contractor => contractor.role === role);
  }

  async searchContractors(query: string): Promise<Contractor[]> {
    const allContractors = await this.getAllContractors();
    const lowerQuery = query.toLowerCase();
    
    return allContractors.filter(contractor => 
      contractor.name.toLowerCase().includes(lowerQuery) ||
      contractor.role.toLowerCase().includes(lowerQuery) ||
      contractor.phone.includes(query) ||
      contractor.email?.toLowerCase().includes(lowerQuery)
    );
  }

  // Setlist Management
  async createSetlist(setlistData: Omit<Setlist, 'id' | 'totalDuration' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<Setlist> {
    const totalDuration = setlistData.songs.reduce((sum, song) => sum + song.duration, 0);
    
    const setlist = await setlistCRUD.createSyncable({
      ...setlistData,
      totalDuration
    });
    return setlist as Setlist;
  }

  async getSetlist(id: string): Promise<Setlist | undefined> {
    const setlist = await setlistCRUD.getById(id);
    return setlist as Setlist | undefined;
  }

  async getAllSetlists(): Promise<Setlist[]> {
    const setlists = await setlistCRUD.getAll();
    return setlists as Setlist[];
  }

  async updateSetlist(id: string, updates: Partial<Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>>): Promise<void> {
    const updateData = { ...updates };
    
    // Recalculate total duration if songs are updated
    if (updates.songs) {
      updateData.totalDuration = updates.songs.reduce((sum, song) => sum + song.duration, 0);
    }
    
    await setlistCRUD.updateSyncable(id, updateData);
  }

  async deleteSetlist(id: string): Promise<void> {
    await setlistCRUD.delete(id);
  }

  async addSongToSetlist(setlistId: string, song: Song, position?: number): Promise<void> {
    const setlist = await this.getSetlist(setlistId);
    if (!setlist) throw new Error('Setlist not found');

    const newSongs = [...setlist.songs];
    if (position !== undefined && position >= 0 && position <= newSongs.length) {
      newSongs.splice(position, 0, song);
    } else {
      newSongs.push(song);
    }

    await this.updateSetlist(setlistId, { songs: newSongs });
  }

  async removeSongFromSetlist(setlistId: string, songId: string): Promise<void> {
    const setlist = await this.getSetlist(setlistId);
    if (!setlist) throw new Error('Setlist not found');

    const newSongs = setlist.songs.filter(song => song.id !== songId);
    await this.updateSetlist(setlistId, { songs: newSongs });
  }

  async reorderSetlistSongs(setlistId: string, songs: Song[]): Promise<void> {
    await this.updateSetlist(setlistId, { songs });
  }

  // Tech Rider Management
  async generateTechRider(setlistId: string, additionalRequirements: string[] = []): Promise<TechRider> {
    const setlist = await this.getSetlist(setlistId);
    if (!setlist) throw new Error('Setlist not found');

    // Generate input list from songs
    const inputList: AudioInput[] = [];
    let channelNumber = 1;

    // Collect all tech requirements from songs
    const allTechRequirements: TechRequirement[] = [];
    setlist.songs.forEach(song => {
      allTechRequirements.push(...song.techRequirements);
    });

    // Group requirements by type and create input list
    const inputRequirements = allTechRequirements.filter(req => req.type === 'input');
    const uniqueInputs = new Map<string, TechRequirement>();
    
    inputRequirements.forEach(req => {
      if (!uniqueInputs.has(req.description)) {
        uniqueInputs.set(req.description, req);
      }
    });

    uniqueInputs.forEach(req => {
      inputList.push({
        channel: channelNumber++,
        instrument: req.description,
        diRequired: req.required,
        notes: req.description
      });
    });

    // Collect special requirements
    const specialRequirements = allTechRequirements
      .filter(req => req.type === 'special')
      .map(req => req.description)
      .concat(additionalRequirements);

    const techRider: TechRider = {
      id: uuidv4(),
      setlistId,
      inputList,
      specialRequirements: Array.from(new Set(specialRequirements)), // Remove duplicates
      generatedAt: new Date()
    };

    await techRiderCRUD.create(techRider);
    return techRider;
  }

  async getTechRider(id: string): Promise<TechRider | undefined> {
    const techRider = await techRiderCRUD.getById(id);
    return techRider as TechRider | undefined;
  }

  async getTechRiderBySetlist(setlistId: string): Promise<TechRider | undefined> {
    const allRiders = await techRiderCRUD.getAll();
    const riders = allRiders as TechRider[];
    return riders.find(rider => rider.setlistId === setlistId);
  }

  async updateTechRider(id: string, updates: Partial<TechRider>): Promise<void> {
    await techRiderCRUD.update(id, updates);
  }

  async deleteTechRider(id: string): Promise<void> {
    await techRiderCRUD.delete(id);
  }

  // Gig Management
  async createGig(gigData: Omit<Gig, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<Gig> {
    const gig = await gigCRUD.createSyncable(gigData);
    return gig as Gig;
  }

  async getGig(id: string): Promise<Gig | undefined> {
    const gig = await gigCRUD.getById(id);
    return gig as Gig | undefined;
  }

  async getAllGigs(): Promise<Gig[]> {
    const gigs = await gigCRUD.getAll();
    return gigs as Gig[];
  }

  async updateGig(id: string, updates: Partial<Omit<Gig, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>>): Promise<void> {
    await gigCRUD.updateSyncable(id, updates);
  }

  async deleteGig(id: string): Promise<void> {
    await gigCRUD.delete(id);
  }

  async getUpcomingGigs(): Promise<Gig[]> {
    const allGigs = await this.getAllGigs();
    const now = new Date();
    return allGigs
      .filter(gig => gig.date > now && gig.status !== 'cancelled')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getGigsByDateRange(startDate: Date, endDate: Date): Promise<Gig[]> {
    const allGigs = await this.getAllGigs();
    return allGigs.filter(gig => 
      gig.date >= startDate && gig.date <= endDate
    );
  }

  // Call Sheet Management
  async generateCallSheets(gigId: string): Promise<CallSheet[]> {
    const gig = await this.getGig(gigId);
    if (!gig) throw new Error('Gig not found');

    const callSheets: CallSheet[] = [];

    for (const assignment of gig.contractors) {
      const contractor = await this.getContractor(assignment.contractorId);
      if (!contractor) continue;

      const callSheet: CallSheet & { id: string } = {
        id: uuidv4(),
        gigId,
        contractorId: assignment.contractorId,
        venue: gig.venue,
        date: gig.date,
        callTime: assignment.callTime,
        loadInTime: gig.loadInTime,
        soundCheckTime: gig.soundCheckTime,
        showTime: gig.showTime,
        contactInfo: `${contractor.name} - ${contractor.phone}${contractor.email ? ` - ${contractor.email}` : ''}`,
        specialInstructions: `Role: ${assignment.role}`
      };

      await callSheetCRUD.create(callSheet);
      callSheets.push(callSheet);
    }

    return callSheets;
  }

  async getCallSheet(gigId: string, contractorId: string): Promise<CallSheet | undefined> {
    const allCallSheets = await callSheetCRUD.getAll();
    const callSheets = allCallSheets as unknown as CallSheet[];
    return callSheets.find(sheet => 
      sheet.gigId === gigId && sheet.contractorId === contractorId
    );
  }

  async getCallSheetsByGig(gigId: string): Promise<CallSheet[]> {
    const allCallSheets = await callSheetCRUD.getAll();
    const callSheets = allCallSheets as unknown as CallSheet[];
    return callSheets.filter(sheet => sheet.gigId === gigId);
  }

  async updateCallSheet(gigId: string, contractorId: string, updates: Partial<CallSheet>): Promise<void> {
    const allCallSheets = await callSheetCRUD.getAll();
    const callSheets = allCallSheets as unknown as (CallSheet & { id: string })[];
    const callSheet = callSheets.find(sheet => 
      sheet.gigId === gigId && sheet.contractorId === contractorId
    );
    
    if (callSheet) {
      await callSheetCRUD.update(callSheet.id, updates as any);
    }
  }

  async deleteCallSheet(gigId: string, contractorId: string): Promise<void> {
    const allCallSheets = await callSheetCRUD.getAll();
    const callSheets = allCallSheets as unknown as (CallSheet & { id: string })[];
    const callSheet = callSheets.find(sheet => 
      sheet.gigId === gigId && sheet.contractorId === contractorId
    );
    
    if (callSheet) {
      await callSheetCRUD.delete(callSheet.id);
    }
  }

  // Utility Methods
  async getSetlistDuration(setlistId: string): Promise<number> {
    const setlist = await this.getSetlist(setlistId);
    return setlist?.totalDuration || 0;
  }

  async validateSetlistForGig(setlistId: string, gigDuration: number): Promise<{ valid: boolean; message?: string }> {
    const setlist = await this.getSetlist(setlistId);
    if (!setlist) {
      return { valid: false, message: 'Setlist not found' };
    }

    if (setlist.totalDuration > gigDuration * 60) { // Convert minutes to seconds
      return { 
        valid: false, 
        message: `Setlist duration (${Math.round(setlist.totalDuration / 60)} min) exceeds gig duration (${gigDuration} min)` 
      };
    }

    if (setlist.songs.length === 0) {
      return { valid: false, message: 'Setlist is empty' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const bandService = new BandService();