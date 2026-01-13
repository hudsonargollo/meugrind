'use client';

import React, { useState, useEffect } from 'react';
import { Song, TechRequirement } from '../../types/band';
import { bandService } from '../../lib/band-service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trash2, Edit, Plus, Search, Music } from 'lucide-react';

interface SongFormData {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  duration: number;
  notes: string;
  techRequirements: TechRequirement[];
}

const initialFormData: SongFormData = {
  title: '',
  artist: '',
  key: 'C',
  bpm: 120,
  duration: 180, // 3 minutes in seconds
  notes: '',
  techRequirements: []
};

const musicalKeys = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
];

export function SongManagement() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formData, setFormData] = useState<SongFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load songs on component mount
  useEffect(() => {
    loadSongs();
  }, []);

  // Filter songs based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [songs, searchQuery]);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const allSongs = await bandService.getAllSongs();
      setSongs(allSongs);
      setError(null);
    } catch (err) {
      setError('Failed to load songs');
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSong) {
        await bandService.updateSong(editingSong.id, formData);
      } else {
        await bandService.createSong(formData);
      }
      
      await loadSongs();
      resetForm();
      setError(null);
    } catch (err) {
      setError(editingSong ? 'Failed to update song' : 'Failed to create song');
      console.error('Error saving song:', err);
    }
  };

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setFormData({
      title: song.title,
      artist: song.artist || '',
      key: song.key,
      bpm: song.bpm,
      duration: song.duration,
      notes: song.notes || '',
      techRequirements: song.techRequirements
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (songId: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      try {
        await bandService.deleteSong(songId);
        await loadSongs();
        setError(null);
      } catch (err) {
        setError('Failed to delete song');
        console.error('Error deleting song:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingSong(null);
    setIsFormOpen(false);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const addTechRequirement = () => {
    const newRequirement: TechRequirement = {
      id: Date.now().toString(),
      type: 'input',
      description: '',
      required: true
    };
    setFormData(prev => ({
      ...prev,
      techRequirements: [...prev.techRequirements, newRequirement]
    }));
  };

  const updateTechRequirement = (index: number, field: keyof TechRequirement, value: any) => {
    setFormData(prev => ({
      ...prev,
      techRequirements: prev.techRequirements.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      )
    }));
  };

  const removeTechRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      techRequirements: prev.techRequirements.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading songs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Music className="h-6 w-6" />
          Song Repertoire
        </h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Song
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search songs by title, artist, or key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Song List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSongs.map((song) => (
          <Card key={song.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="truncate">{song.title}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(song)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(song.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              {song.artist && (
                <p className="text-sm text-gray-600">by {song.artist}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Badge variant="secondary">Key: {song.key}</Badge>
                <Badge variant="secondary">{song.bpm} BPM</Badge>
                <Badge variant="outline">{formatDuration(song.duration)}</Badge>
              </div>
              
              {song.techRequirements.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Tech Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {song.techRequirements.slice(0, 3).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req.description}
                      </Badge>
                    ))}
                    {song.techRequirements.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{song.techRequirements.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {song.notes && (
                <p className="text-sm text-gray-600 line-clamp-2">{song.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSongs.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'No songs found matching your search.' : 'No songs in repertoire yet.'}
        </div>
      )}

      {/* Song Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingSong ? 'Edit Song' : 'Add New Song'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    value={formData.artist}
                    onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="key">Key</Label>
                  <Select value={formData.key} onValueChange={(value) => setFormData(prev => ({ ...prev, key: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {musicalKeys.map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bpm">BPM</Label>
                  <Input
                    id="bpm"
                    type="number"
                    min="60"
                    max="200"
                    value={formData.bpm}
                    onChange={(e) => setFormData(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="30"
                    max="600"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 180 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Tech Requirements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Technical Requirements</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTechRequirement}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Requirement
                  </Button>
                </div>
                
                {formData.techRequirements.map((req, index) => (
                  <div key={req.id} className="flex gap-2 mb-2 p-3 border rounded">
                    <Select 
                      value={req.type} 
                      onValueChange={(value) => 
                        updateTechRequirement(index, 'type', value as 'input' | 'output' | 'special')
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="input">Input</SelectItem>
                        <SelectItem value="output">Output</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Description"
                      value={req.description}
                      onChange={(e) => updateTechRequirement(index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={req.required}
                        onChange={(e) => updateTechRequirement(index, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTechRequirement(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSong ? 'Update Song' : 'Add Song'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}