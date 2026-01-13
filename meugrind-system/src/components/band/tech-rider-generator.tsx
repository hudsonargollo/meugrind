'use client';

import React, { useState, useEffect } from 'react';
import { Setlist, TechRider, AudioInput } from '../../types/band';
import { bandService } from '../../lib/band-service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Edit, 
  Save,
  Printer,
  Music
} from 'lucide-react';

interface TechRiderFormData {
  setlistId: string;
  additionalRequirements: string[];
  stagePlot?: string;
  customInputs: AudioInput[];
}

const initialFormData: TechRiderFormData = {
  setlistId: '',
  additionalRequirements: [],
  customInputs: []
};

export function TechRiderGenerator() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [techRiders, setTechRiders] = useState<TechRider[]>([]);
  const [currentRider, setCurrentRider] = useState<TechRider | null>(null);
  const [formData, setFormData] = useState<TechRiderFormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allSetlists, allRiders] = await Promise.all([
        bandService.getAllSetlists(),
        // We'll need to implement getTechRiders in the service
        Promise.resolve([]) // Placeholder for now
      ]);
      setSetlists(allSetlists);
      setTechRiders(allRiders);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRider = async () => {
    if (!formData.setlistId) return;

    try {
      setIsGenerating(true);
      const rider = await bandService.generateTechRider(
        formData.setlistId,
        formData.additionalRequirements
      );
      
      setCurrentRider(rider);
      await loadData();
      setError(null);
    } catch (err) {
      setError('Failed to generate tech rider');
      console.error('Error generating tech rider:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateRider = async () => {
    if (!currentRider) return;

    try {
      await bandService.updateTechRider(currentRider.id, {
        inputList: currentRider.inputList,
        specialRequirements: currentRider.specialRequirements,
        stagePlot: currentRider.stagePlot
      });
      
      await loadData();
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to update tech rider');
      console.error('Error updating tech rider:', err);
    }
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalRequirements: [...prev.additionalRequirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalRequirements: prev.additionalRequirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddCustomInput = () => {
    const newInput: AudioInput = {
      channel: (currentRider?.inputList.length || 0) + 1,
      instrument: '',
      micType: '',
      diRequired: false,
      notes: ''
    };

    if (currentRider) {
      setCurrentRider({
        ...currentRider,
        inputList: [...currentRider.inputList, newInput]
      });
    }
  };

  const handleUpdateInput = (index: number, field: keyof AudioInput, value: any) => {
    if (!currentRider) return;

    const updatedInputs = currentRider.inputList.map((input, i) => 
      i === index ? { ...input, [field]: value } : input
    );

    setCurrentRider({
      ...currentRider,
      inputList: updatedInputs
    });
  };

  const handleRemoveInput = (index: number) => {
    if (!currentRider) return;

    const updatedInputs = currentRider.inputList.filter((_, i) => i !== index);
    
    setCurrentRider({
      ...currentRider,
      inputList: updatedInputs
    });
  };

  const handleAddSpecialRequirement = () => {
    if (!currentRider) return;

    const requirement = prompt('Enter special requirement:');
    if (requirement?.trim()) {
      setCurrentRider({
        ...currentRider,
        specialRequirements: [...currentRider.specialRequirements, requirement.trim()]
      });
    }
  };

  const handleRemoveSpecialRequirement = (index: number) => {
    if (!currentRider) return;

    setCurrentRider({
      ...currentRider,
      specialRequirements: currentRider.specialRequirements.filter((_, i) => i !== index)
    });
  };

  const generatePDF = () => {
    if (!currentRider) return;

    // Create a simple HTML representation for printing
    const setlist = setlists.find(s => s.id === currentRider.setlistId);
    const printContent = `
      <html>
        <head>
          <title>Tech Rider - ${setlist?.name || 'Setlist'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .requirement { margin: 5px 0; padding: 5px; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Technical Rider</h1>
          <h2>Setlist: ${setlist?.name || 'Unknown'}</h2>
          <p>Generated: ${new Date(currentRider.generatedAt).toLocaleDateString()}</p>
          
          <h3>Input List</h3>
          <table>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Instrument</th>
                <th>Mic Type</th>
                <th>DI Required</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${currentRider.inputList.map(input => `
                <tr>
                  <td>${input.channel}</td>
                  <td>${input.instrument}</td>
                  <td>${input.micType || 'N/A'}</td>
                  <td>${input.diRequired ? 'Yes' : 'No'}</td>
                  <td>${input.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h3>Special Requirements</h3>
          ${currentRider.specialRequirements.map(req => `
            <div class="requirement">${req}</div>
          `).join('')}
          
          ${currentRider.stagePlot ? `
            <h3>Stage Plot</h3>
            <p>Stage plot available separately</p>
          ` : ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getSelectedSetlist = () => {
    return setlists.find(s => s.id === formData.setlistId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading tech riders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Tech Rider Generator
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Tech Rider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="setlist">Select Setlist</Label>
              <Select 
                value={formData.setlistId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, setlistId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a setlist" />
                </SelectTrigger>
                <SelectContent>
                  {setlists.map(setlist => (
                    <SelectItem key={setlist.id} value={setlist.id}>
                      {setlist.name} ({setlist.songs.length} songs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.setlistId && (
              <div>
                <h4 className="font-medium mb-2">Setlist Preview</h4>
                <div className="p-3 bg-gray-50 rounded border">
                  {getSelectedSetlist()?.songs.map((song, index) => (
                    <div key={song.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{index + 1}. {song.title}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {song.key}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {song.bpm} BPM
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Additional Requirements</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add special requirement..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                />
                <Button onClick={handleAddRequirement} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.additionalRequirements.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.additionalRequirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{req}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRequirement(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerateRider}
              disabled={!formData.setlistId || isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Tech Rider'}
            </Button>
          </CardContent>
        </Card>

        {/* Current Tech Rider */}
        {currentRider && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tech Rider</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                  {isEditing && (
                    <Button size="sm" onClick={handleUpdateRider}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  )}
                  <Button size="sm" onClick={generatePDF}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Generated: {new Date(currentRider.generatedAt).toLocaleDateString()}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Input List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Input List</h4>
                  {isEditing && (
                    <Button size="sm" variant="outline" onClick={handleAddCustomInput}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Input
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {currentRider.inputList.map((input, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 p-2 border rounded">
                      <div className="text-sm font-medium">Ch {input.channel}</div>
                      {isEditing ? (
                        <>
                          <Input
                            value={input.instrument}
                            onChange={(e) => handleUpdateInput(index, 'instrument', e.target.value)}
                            placeholder="Instrument"
                            className="text-sm"
                          />
                          <Input
                            value={input.micType || ''}
                            onChange={(e) => handleUpdateInput(index, 'micType', e.target.value)}
                            placeholder="Mic Type"
                            className="text-sm"
                          />
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={input.diRequired}
                              onChange={(e) => handleUpdateInput(index, 'diRequired', e.target.checked)}
                            />
                            DI
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInput(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-sm">{input.instrument}</div>
                          <div className="text-sm">{input.micType || 'N/A'}</div>
                          <div className="text-sm">{input.diRequired ? 'DI Required' : 'No DI'}</div>
                          <div></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Special Requirements</h4>
                  {isEditing && (
                    <Button size="sm" variant="outline" onClick={handleAddSpecialRequirement}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Requirement
                    </Button>
                  )}
                </div>
                
                <div className="space-y-1">
                  {currentRider.specialRequirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{req}</span>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSpecialRequirement(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {currentRider.specialRequirements.length === 0 && (
                    <div className="text-sm text-gray-500 italic">No special requirements</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {setlists.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No setlists available</h3>
              <p className="text-gray-500">Create a setlist first to generate tech riders.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}