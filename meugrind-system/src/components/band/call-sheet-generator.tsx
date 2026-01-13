'use client';

import React, { useState, useEffect } from 'react';
import { Gig, CallSheet, Contractor, ContractorAssignment } from '../../types/band';
import { bandService } from '../../lib/band-service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Printer,
  Plus,
  Trash2,
  Edit,
  Save
} from 'lucide-react';

interface GigFormData {
  venue: string;
  date: Date;
  loadInTime: Date;
  soundCheckTime: Date;
  showTime: Date;
  fee: number;
  status: Gig['status'];
  contractors: ContractorAssignment[];
}

const initialGigData: GigFormData = {
  venue: '',
  date: new Date(),
  loadInTime: new Date(),
  soundCheckTime: new Date(),
  showTime: new Date(),
  fee: 0,
  status: 'booked',
  contractors: []
};

export function CallSheetGenerator() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [callSheets, setCallSheets] = useState<CallSheet[]>([]);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [isCreatingGig, setIsCreatingGig] = useState(false);
  const [gigFormData, setGigFormData] = useState<GigFormData>(initialGigData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allGigs, allContractors] = await Promise.all([
        bandService.getAllGigs(),
        bandService.getAllContractors()
      ]);
      setGigs(allGigs);
      setContractors(allContractors);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCallSheets = async (gigId: string) => {
    try {
      const sheets = await bandService.getCallSheetsByGig(gigId);
      setCallSheets(sheets);
    } catch (err) {
      console.error('Error loading call sheets:', err);
    }
  };

  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGig = await bandService.createGig(gigFormData);
      await loadData();
      setSelectedGig(newGig);
      setIsCreatingGig(false);
      setGigFormData(initialGigData);
      setError(null);
    } catch (err) {
      setError('Failed to create gig');
      console.error('Error creating gig:', err);
    }
  };

  const handleGenerateCallSheets = async () => {
    if (!selectedGig) return;

    try {
      const sheets = await bandService.generateCallSheets(selectedGig.id);
      setCallSheets(sheets);
      setError(null);
    } catch (err) {
      setError('Failed to generate call sheets');
      console.error('Error generating call sheets:', err);
    }
  };

  const handleAddContractor = () => {
    if (!selectedGig) return;

    const contractorId = prompt('Select contractor ID (this would be a proper selector in production)');
    const role = prompt('Enter role for this gig');
    
    if (contractorId && role) {
      const callTime = new Date(selectedGig.loadInTime);
      callTime.setHours(callTime.getHours() - 1); // Default to 1 hour before load-in

      const newAssignment: ContractorAssignment = {
        contractorId,
        role,
        confirmed: false,
        callTime
      };

      const updatedGig = {
        ...selectedGig,
        contractors: [...selectedGig.contractors, newAssignment]
      };

      bandService.updateGig(selectedGig.id, { contractors: updatedGig.contractors })
        .then(() => {
          setSelectedGig(updatedGig);
          loadData();
        })
        .catch(err => {
          setError('Failed to add contractor');
          console.error('Error adding contractor:', err);
        });
    }
  };

  const handleRemoveContractor = (contractorId: string) => {
    if (!selectedGig) return;

    const updatedContractors = selectedGig.contractors.filter(c => c.contractorId !== contractorId);
    
    bandService.updateGig(selectedGig.id, { contractors: updatedContractors })
      .then(() => {
        setSelectedGig({
          ...selectedGig,
          contractors: updatedContractors
        });
        loadData();
      })
      .catch(err => {
        setError('Failed to remove contractor');
        console.error('Error removing contractor:', err);
      });
  };

  const printCallSheet = (callSheet: CallSheet) => {
    const contractor = contractors.find(c => c.id === callSheet.contractorId);
    
    const printContent = `
      <html>
        <head>
          <title>Call Sheet - ${contractor?.name || 'Contractor'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-section { padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .info-section h3 { margin-top: 0; color: #333; }
            .time-item { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; }
            .contact-info { background: #e8f4f8; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CALL SHEET</h1>
            <h2>${contractor?.name || 'Contractor'}</h2>
            <p><strong>Role:</strong> ${callSheet.specialInstructions}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Event Details</h3>
              <p><strong>Venue:</strong> ${callSheet.venue}</p>
              <p><strong>Date:</strong> ${callSheet.date.toLocaleDateString()}</p>
            </div>
            
            <div class="info-section contact-info">
              <h3>Contact Information</h3>
              <p>${callSheet.contactInfo}</p>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Schedule</h3>
            <div class="time-item">
              <strong>Call Time:</strong> ${callSheet.callTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div class="time-item">
              <strong>Load-In:</strong> ${callSheet.loadInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div class="time-item">
              <strong>Sound Check:</strong> ${callSheet.soundCheckTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div class="time-item">
              <strong>Show Time:</strong> ${callSheet.showTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div class="info-section">
            <h3>Important Notes</h3>
            <ul>
              <li>Please arrive promptly at your call time</li>
              <li>Bring all necessary equipment and tools</li>
              <li>Contact production if you have any questions or issues</li>
              <li>Professional attire required</li>
            </ul>
          </div>
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

  const printAllCallSheets = () => {
    callSheets.forEach((sheet, index) => {
      setTimeout(() => printCallSheet(sheet), index * 1000); // Stagger printing
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  const getContractorName = (contractorId: string): string => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.name || 'Unknown Contractor';
  };

  const getContractorRole = (contractorId: string): string => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.role || 'unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading call sheets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Call Sheet Generator
        </h2>
        <Button onClick={() => setIsCreatingGig(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Gig
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gig List */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Gigs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gigs.map((gig) => (
              <div
                key={gig.id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedGig?.id === gig.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => {
                  setSelectedGig(gig);
                  loadCallSheets(gig.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{gig.venue}</h4>
                  <Badge variant={gig.status === 'confirmed' ? 'default' : 'outline'}>
                    {gig.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(gig.date)}</span>
                  <Clock className="h-3 w-3 ml-2" />
                  <span>{formatTime(gig.showTime)}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {gig.contractors.length} crew
                  </Badge>
                </div>
              </div>
            ))}
            
            {gigs.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No gigs scheduled yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gig Details & Contractor Management */}
        {selectedGig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {selectedGig.venue}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {formatDate(selectedGig.date)} • Show: {formatTime(selectedGig.showTime)}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Load-In:</strong> {formatTime(selectedGig.loadInTime)}
                </div>
                <div>
                  <strong>Sound Check:</strong> {formatTime(selectedGig.soundCheckTime)}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Crew Assignments</h4>
                  <Button size="sm" variant="outline" onClick={handleAddContractor}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Crew
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {selectedGig.contractors.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {getContractorName(assignment.contractorId)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {assignment.role} • Call: {formatTime(assignment.callTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={assignment.confirmed ? 'default' : 'outline'} className="text-xs">
                          {assignment.confirmed ? 'Confirmed' : 'Pending'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveContractor(assignment.contractorId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {selectedGig.contractors.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No crew assigned yet.
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleGenerateCallSheets}
                disabled={selectedGig.contractors.length === 0}
                className="w-full"
              >
                Generate Call Sheets
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Call Sheets */}
        {callSheets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Call Sheets</CardTitle>
                <Button size="sm" onClick={printAllCallSheets}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print All
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {callSheets.map((sheet) => {
                const contractor = contractors.find(c => c.id === sheet.contractorId);
                return (
                  <div key={`${sheet.gigId}-${sheet.contractorId}`} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{contractor?.name || 'Unknown'}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => printCallSheet(sheet)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span>{sheet.specialInstructions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call Time:</span>
                        <span>{formatTime(sheet.callTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{contractor?.phone}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Gig Form Modal */}
      {isCreatingGig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Gig</h3>
            
            <form onSubmit={handleCreateGig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    value={gigFormData.venue}
                    onChange={(e) => setGigFormData(prev => ({ ...prev, venue: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={gigFormData.date.toISOString().split('T')[0]}
                    onChange={(e) => setGigFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="loadInTime">Load-In Time</Label>
                  <Input
                    id="loadInTime"
                    type="time"
                    value={gigFormData.loadInTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newTime = new Date(gigFormData.date);
                      newTime.setHours(parseInt(hours), parseInt(minutes));
                      setGigFormData(prev => ({ ...prev, loadInTime: newTime }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="soundCheckTime">Sound Check</Label>
                  <Input
                    id="soundCheckTime"
                    type="time"
                    value={gigFormData.soundCheckTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newTime = new Date(gigFormData.date);
                      newTime.setHours(parseInt(hours), parseInt(minutes));
                      setGigFormData(prev => ({ ...prev, soundCheckTime: newTime }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="showTime">Show Time</Label>
                  <Input
                    id="showTime"
                    type="time"
                    value={gigFormData.showTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newTime = new Date(gigFormData.date);
                      newTime.setHours(parseInt(hours), parseInt(minutes));
                      setGigFormData(prev => ({ ...prev, showTime: newTime }));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fee">Fee ($)</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={gigFormData.fee}
                    onChange={(e) => setGigFormData(prev => ({ ...prev, fee: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={gigFormData.status} 
                    onValueChange={(value) => setGigFormData(prev => ({ ...prev, status: value as Gig['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreatingGig(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Gig
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!selectedGig && gigs.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a gig</h3>
              <p className="text-gray-500">Choose a gig from the list to manage crew and generate call sheets.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}