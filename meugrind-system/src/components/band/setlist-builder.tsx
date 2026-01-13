'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Song, Setlist } from '../../types/band';
import { bandService } from '../../lib/band-service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Save, 
  Trash2, 
  Edit, 
  Search, 
  Music, 
  Clock, 
  Eye, 
  EyeOff,
  GripVertical,
  Play
} from 'lucide-react';

interface SetlistFormData {
  name: string;
  notes: string;
  gigId?: string;
}

const initialFormData: SetlistFormData = {
  name: '',
  notes: '',
  gigId: undefined
};

// Sortable Song Item Component
function SortableSongItem({ song, onRemove, performanceMode }: { 
  song: Song; 
  onRemove: () => void;
  performanceMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm ${
        performanceMode ? 'bg-black text-white border-white' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className={`h-4 w-4 ${performanceMode ? 'text-white' : 'text-gray-400'}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`font-medium truncate ${performanceMode ? 'text-2xl text-white' : ''}`}>
            {song.title}
          </h4>
          {!performanceMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {song.artist && (
          <p className={`text-sm ${performanceMode ? 'text-gray-300 text-lg' : 'text-gray-600'}`}>
            by {song.artist}
          </p>
        )}
        
        <div className="flex gap-2 mt-2">
          <Badge 
            variant={performanceMode ? "outline" : "secondary"}
            className={performanceMode ? 'text-white border-white text-lg px-3 py-1' : ''}
          >
            Key: {song.key}
          </Badge>
          <Badge 
            variant={performanceMode ? "outline" : "secondary"}
            className={performanceMode ? 'text-white border-white text-lg px-3 py-1' : ''}
          >
            {song.bpm} BPM
          </Badge>
          <Badge 
            variant="outline"
            className={performanceMode ? 'text-white border-white text-lg px-3 py-1' : ''}
          >
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(song.duration)}
          </Badge>
        </div>
        
        {performanceMode && song.techRequirements.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-300 mb-1">Tech Requirements:</p>
            <div className="flex flex-wrap gap-1">
              {song.techRequirements.map((req, index) => (
                <Badge key={index} variant="outline" className="text-white border-white text-sm">
                  {req.description}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Song Selection Component
function SongSelector({ 
  onAddSong, 
  excludeSongIds 
}: { 
  onAddSong: (song: Song) => void;
  excludeSongIds: string[];
}) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    const availableSongs = songs.filter(song => !excludeSongIds.includes(song.id));
    
    if (searchQuery.trim() === '') {
      setFilteredSongs(availableSongs);
    } else {
      const filtered = availableSongs.filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [songs, searchQuery, excludeSongIds]);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const allSongs = await bandService.getAllSongs();
      setSongs(allSongs);
    } catch (err) {
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-4">Loading songs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search songs to add..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => onAddSong(song)}
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{song.title}</h4>
              {song.artist && (
                <p className="text-sm text-gray-600">by {song.artist}</p>
              )}
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">Key: {song.key}</Badge>
                <Badge variant="secondary" className="text-xs">{song.bpm} BPM</Badge>
                <Badge variant="outline" className="text-xs">{formatDuration(song.duration)}</Badge>
              </div>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          {searchQuery ? 'No songs found matching your search.' : 'No available songs to add.'}
        </div>
      )}
    </div>
  );
}

export function SetlistBuilder() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [formData, setFormData] = useState<SetlistFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSetlists();
  }, []);

  const loadSetlists = async () => {
    try {
      setLoading(true);
      const allSetlists = await bandService.getAllSetlists();
      setSetlists(allSetlists);
      setError(null);
    } catch (err) {
      setError('Failed to load setlists');
      console.error('Error loading setlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSetlist = await bandService.createSetlist({
        ...formData,
        songs: []
      });
      
      await loadSetlists();
      setCurrentSetlist(newSetlist);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to create setlist');
      console.error('Error creating setlist:', err);
    }
  };

  const handleSaveSetlist = async () => {
    if (!currentSetlist) return;
    
    try {
      await bandService.updateSetlist(currentSetlist.id, {
        songs: currentSetlist.songs,
        notes: currentSetlist.notes
      });
      
      await loadSetlists();
      setError(null);
    } catch (err) {
      setError('Failed to save setlist');
      console.error('Error saving setlist:', err);
    }
  };

  const handleDeleteSetlist = async (setlistId: string) => {
    if (confirm('Are you sure you want to delete this setlist?')) {
      try {
        await bandService.deleteSetlist(setlistId);
        await loadSetlists();
        
        if (currentSetlist?.id === setlistId) {
          setCurrentSetlist(null);
        }
        setError(null);
      } catch (err) {
        setError('Failed to delete setlist');
        console.error('Error deleting setlist:', err);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && currentSetlist) {
      const oldIndex = currentSetlist.songs.findIndex(song => song.id === active.id);
      const newIndex = currentSetlist.songs.findIndex(song => song.id === over?.id);

      const newSongs = arrayMove(currentSetlist.songs, oldIndex, newIndex);
      
      setCurrentSetlist({
        ...currentSetlist,
        songs: newSongs,
        totalDuration: newSongs.reduce((sum, song) => sum + song.duration, 0)
      });
    }
  };

  const handleAddSong = (song: Song) => {
    if (!currentSetlist) return;
    
    const newSongs = [...currentSetlist.songs, song];
    setCurrentSetlist({
      ...currentSetlist,
      songs: newSongs,
      totalDuration: newSongs.reduce((sum, song) => sum + song.duration, 0)
    });
    setIsAddingSongs(false);
  };

  const handleRemoveSong = (songId: string) => {
    if (!currentSetlist) return;
    
    const newSongs = currentSetlist.songs.filter(song => song.id !== songId);
    setCurrentSetlist({
      ...currentSetlist,
      songs: newSongs,
      totalDuration: newSongs.reduce((sum, song) => sum + song.duration, 0)
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setIsFormOpen(false);
  };

  const formatTotalDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading setlists...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${performanceMode ? 'bg-black min-h-screen p-6' : ''}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold flex items-center gap-2 ${performanceMode ? 'text-white' : ''}`}>
          <Music className="h-6 w-6" />
          Setlist Builder
        </h2>
        <div className="flex gap-2">
          <Button
            variant={performanceMode ? "outline" : "ghost"}
            onClick={() => setPerformanceMode(!performanceMode)}
            className={performanceMode ? 'text-white border-white' : ''}
          >
            {performanceMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {performanceMode ? 'Exit Performance Mode' : 'Performance Mode'}
          </Button>
          {!performanceMode && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Setlist
            </Button>
          )}
        </div>
      </div>

      {error && !performanceMode && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setlist List */}
        {!performanceMode && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Setlists</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {setlists.map((setlist) => (
                  <div
                    key={setlist.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      currentSetlist?.id === setlist.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setCurrentSetlist(setlist)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{setlist.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSetlist(setlist.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {setlist.songs.length} songs
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatTotalDuration(setlist.totalDuration)}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {setlists.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No setlists created yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Setlist */}
        <div className={performanceMode ? 'col-span-1' : 'lg:col-span-2'}>
          {currentSetlist ? (
            <Card className={performanceMode ? 'bg-black border-white' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={performanceMode ? 'text-white text-3xl' : ''}>
                    {currentSetlist.name}
                  </CardTitle>
                  {!performanceMode && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingSongs(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Songs
                      </Button>
                      <Button onClick={handleSaveSetlist}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <Badge 
                    variant={performanceMode ? "outline" : "secondary"}
                    className={performanceMode ? 'text-white border-white text-xl px-4 py-2' : ''}
                  >
                    {currentSetlist.songs.length} songs
                  </Badge>
                  <Badge 
                    variant={performanceMode ? "outline" : "secondary"}
                    className={performanceMode ? 'text-white border-white text-xl px-4 py-2' : ''}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTotalDuration(currentSetlist.totalDuration)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {currentSetlist.songs.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={currentSetlist.songs.map(song => song.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {currentSetlist.songs.map((song, index) => (
                          <div key={song.id} className="flex items-center gap-3">
                            {performanceMode && (
                              <div className="text-white text-2xl font-bold w-8">
                                {index + 1}.
                              </div>
                            )}
                            <div className="flex-1">
                              <SortableSongItem
                                song={song}
                                onRemove={() => handleRemoveSong(song.id)}
                                performanceMode={performanceMode}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className={`text-center py-8 ${performanceMode ? 'text-white' : 'text-gray-500'}`}>
                    No songs in this setlist yet.
                    {!performanceMode && (
                      <div className="mt-2">
                        <Button variant="outline" onClick={() => setIsAddingSongs(true)}>
                          Add your first song
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            !performanceMode && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No setlist selected</h3>
                    <p className="text-gray-500 mb-4">Select a setlist from the left or create a new one to get started.</p>
                    <Button onClick={() => setIsFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Setlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>

      {/* New Setlist Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Setlist</h3>
            
            <form onSubmit={handleCreateSetlist} className="space-y-4">
              <div>
                <Label htmlFor="name">Setlist Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
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

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Setlist
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Songs Modal */}
      {isAddingSongs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Songs to Setlist</h3>
              <Button variant="outline" onClick={() => setIsAddingSongs(false)}>
                Done
              </Button>
            </div>
            
            <SongSelector
              onAddSong={handleAddSong}
              excludeSongIds={currentSetlist?.songs.map(song => song.id) || []}
            />
          </div>
        </div>
      )}
    </div>
  );
}