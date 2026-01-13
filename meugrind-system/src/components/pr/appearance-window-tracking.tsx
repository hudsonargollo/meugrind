'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { AppearanceWindow, PRContract } from '../../types/pr';
import { prService } from '../../lib/pr-service';

interface AppearanceWindowTrackingProps {
  className?: string;
}

export function AppearanceWindowTracking({ className }: AppearanceWindowTrackingProps) {
  const [windows, setWindows] = useState<AppearanceWindow[]>([]);
  const [contracts, setContracts] = useState<PRContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWindow, setEditingWindow] = useState<AppearanceWindow | null>(null);
  const [formData, setFormData] = useState({
    contractId: '',
    showName: '',
    startDate: '',
    endDate: '',
    availabilityType: 'available' as AppearanceWindow['availabilityType'],
    restrictions: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [windowsData, contractsData] = await Promise.all([
        prService.getAllAppearanceWindows(),
        prService.getAllPRContracts(),
      ]);
      setWindows(windowsData);
      setContracts(contractsData);
    } catch (error) {
      console.error('Error loading appearance windows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const windowData = {
        contractId: formData.contractId,
        showName: formData.showName,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        availabilityType: formData.availabilityType,
        restrictions: formData.restrictions ? formData.restrictions.split(',').map(r => r.trim()) : undefined,
        notes: formData.notes || undefined,
      };

      if (editingWindow) {
        await prService.updateAppearanceWindow(editingWindow.id, windowData);
      } else {
        await prService.createAppearanceWindow(windowData);
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving appearance window:', error);
    }
  };

  const handleEdit = (window: AppearanceWindow) => {
    setEditingWindow(window);
    setFormData({
      contractId: window.contractId,
      showName: window.showName,
      startDate: window.startDate.toISOString().split('T')[0],
      endDate: window.endDate.toISOString().split('T')[0],
      availabilityType: window.availabilityType,
      restrictions: window.restrictions?.join(', ') || '',
      notes: window.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this appearance window?')) {
      try {
        await prService.deleteAppearanceWindow(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting appearance window:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      contractId: '',
      showName: '',
      startDate: '',
      endDate: '',
      availabilityType: 'available',
      restrictions: '',
      notes: '',
    });
    setEditingWindow(null);
    setShowForm(false);
  };

  const getAvailabilityIcon = (type: AppearanceWindow['availabilityType']) => {
    switch (type) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'blackout':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'restricted':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getAvailabilityColor = (type: AppearanceWindow['availabilityType']) => {
    switch (type) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'blackout':
        return 'bg-red-100 text-red-800';
      case 'restricted':
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isWindowActive = (window: AppearanceWindow) => {
    const now = new Date();
    return window.startDate <= now && window.endDate >= now;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appearance Window Tracking
              </CardTitle>
              <CardDescription>
                Manage reality TV contract availability windows and restrictions
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Window
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingWindow ? 'Edit' : 'Add'} Appearance Window</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contractId">Contract</Label>
                      <Select
                        value={formData.contractId}
                        onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contract" />
                        </SelectTrigger>
                        <SelectContent>
                          {contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.showName} - {contract.network}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="showName">Show Name</Label>
                      <Input
                        id="showName"
                        value={formData.showName}
                        onChange={(e) => setFormData({ ...formData, showName: e.target.value })}
                        placeholder="Enter show name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="availabilityType">Availability Type</Label>
                    <Select
                      value={formData.availabilityType}
                      onValueChange={(value) => 
                        setFormData({ ...formData, availabilityType: value as AppearanceWindow['availabilityType'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="blackout">Blackout Period</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.availabilityType === 'restricted' && (
                    <div>
                      <Label htmlFor="restrictions">Restrictions (comma-separated)</Label>
                      <Input
                        id="restrictions"
                        value={formData.restrictions}
                        onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                        placeholder="e.g., No competing shows, Limited hours"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about this window"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingWindow ? 'Update' : 'Create'} Window
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {windows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No appearance windows found. Add your first window to get started.
              </div>
            ) : (
              windows.map((window) => (
                <Card key={window.id} className={`${isWindowActive(window) ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getAvailabilityIcon(window.availabilityType)}
                          <h3 className="font-semibold">{window.showName}</h3>
                          <Badge className={getAvailabilityColor(window.availabilityType)}>
                            {window.availabilityType}
                          </Badge>
                          {isWindowActive(window) && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(window.startDate)} - {formatDate(window.endDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.ceil((window.endDate.getTime() - window.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                          </div>
                        </div>

                        {window.restrictions && window.restrictions.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Restrictions:</p>
                            <div className="flex flex-wrap gap-1">
                              {window.restrictions.map((restriction, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {restriction}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {window.notes && (
                          <p className="text-sm text-gray-600">{window.notes}</p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(window)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(window.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}