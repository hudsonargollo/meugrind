'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { BrandDeal, Deliverable } from '../../types/influencer';
import { influencerService } from '../../lib/influencer-service';
import { Plus, Edit, Trash2, AlertTriangle, DollarSign, Calendar, Package } from 'lucide-react';

interface BrandDealFormData {
  brandName: string;
  campaignName: string;
  status: BrandDeal['status'];
  fee: number;
  deadline: string;
  exclusivityClauses: string[];
  notes: string;
  deliverables: Deliverable[];
}

const initialFormData: BrandDealFormData = {
  brandName: '',
  campaignName: '',
  status: 'pitch',
  fee: 0,
  deadline: '',
  exclusivityClauses: [],
  notes: '',
  deliverables: [],
};

export function BrandDealManagement() {
  const [brandDeals, setBrandDeals] = useState<BrandDeal[]>([]);
  const [formData, setFormData] = useState<BrandDealFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBrandDeals();
  }, []);

  const loadBrandDeals = async () => {
    try {
      const deals = await influencerService.getAllBrandDeals();
      setBrandDeals(deals);
    } catch (error) {
      console.error('Failed to load brand deals:', error);
    }
  };

  const checkConflicts = async (brandName: string, exclusivityClauses: string[]) => {
    if (!brandName || exclusivityClauses.length === 0) {
      setConflictWarnings([]);
      return;
    }

    try {
      const conflicts = await influencerService.checkBrandConflicts(brandName, exclusivityClauses);
      setConflictWarnings(conflicts.conflicts);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const brandDealData = {
        ...formData,
        deadline: new Date(formData.deadline),
        deliverables: formData.deliverables.map(d => ({
          ...d,
          deadline: new Date(d.deadline),
        })),
      };

      if (editingId) {
        await influencerService.updateBrandDeal(editingId, brandDealData);
      } else {
        await influencerService.createBrandDeal(brandDealData);
      }

      await loadBrandDeals();
      resetForm();
    } catch (error) {
      console.error('Failed to save brand deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (deal: BrandDeal) => {
    setFormData({
      brandName: deal.brandName,
      campaignName: deal.campaignName,
      status: deal.status,
      fee: deal.fee,
      deadline: deal.deadline.toISOString().split('T')[0],
      exclusivityClauses: deal.exclusivityClauses,
      notes: deal.notes || '',
      deliverables: deal.deliverables.map(d => ({
        ...d,
        deadline: d.deadline.toISOString().split('T')[0],
      })) as any,
    });
    setEditingId(deal.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand deal?')) {
      try {
        await influencerService.deleteBrandDeal(id);
        await loadBrandDeals();
      } catch (error) {
        console.error('Failed to delete brand deal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setConflictWarnings([]);
  };

  const addDeliverable = () => {
    const newDeliverable: Deliverable = {
      id: `temp-${Date.now()}`,
      type: 'post',
      platform: 'instagram',
      description: '',
      deadline: new Date(),
      completed: false,
    };
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, newDeliverable],
    }));
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: any) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      ),
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: BrandDeal['status']) => {
    const colors = {
      pitch: 'bg-yellow-100 text-yellow-800',
      contract: 'bg-blue-100 text-blue-800',
      content: 'bg-purple-100 text-purple-800',
      posted: 'bg-green-100 text-green-800',
      paid: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Brand Deal Management</h2>
          <p className="text-gray-600">Manage influencer campaigns and deliverables</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Brand Deal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Brand Deal' : 'Create New Brand Deal'}</CardTitle>
            <CardDescription>
              Enter the details for the brand partnership campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, brandName: e.target.value }));
                      checkConflicts(e.target.value, formData.exclusivityClauses);
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={formData.campaignName}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, status: value as BrandDeal['status'] }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pitch">Pitch</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="content">Content Creation</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fee">Fee ($)</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={formData.fee}
                    onChange={(e) => setFormData(prev => ({ ...prev, fee: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="exclusivityClauses">Exclusivity Clauses (one per line)</Label>
                <Textarea
                  id="exclusivityClauses"
                  value={formData.exclusivityClauses.join('\n')}
                  onChange={(e) => {
                    const clauses = e.target.value.split('\n').filter(c => c.trim());
                    setFormData(prev => ({ ...prev, exclusivityClauses: clauses }));
                    checkConflicts(formData.brandName, clauses);
                  }}
                  placeholder="e.g., No competing beauty brands for 30 days"
                  rows={3}
                />
              </div>

              {conflictWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Potential Conflicts Detected
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {conflictWarnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Deliverables</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDeliverable}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Deliverable
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.deliverables.map((deliverable, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Select 
                          value={deliverable.type} 
                          onValueChange={(value) => updateDeliverable(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="story">Story</SelectItem>
                            <SelectItem value="post">Post</SelectItem>
                            <SelectItem value="reel">Reel</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="blog">Blog</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select 
                          value={deliverable.platform} 
                          onValueChange={(value) => updateDeliverable(index, 'platform', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={typeof deliverable.deadline === 'string' ? deliverable.deadline : deliverable.deadline.toISOString().split('T')[0]}
                          onChange={(e) => updateDeliverable(index, 'deadline', e.target.value)}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeDeliverable(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Deliverable description"
                        value={deliverable.description}
                        onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the campaign"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')} Brand Deal
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {brandDeals.map((deal) => (
          <Card key={deal.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{deal.campaignName}</h3>
                  <p className="text-gray-600">{deal.brandName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(deal.status)}>
                    {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(deal)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(deal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">${deal.fee.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{deal.deadline.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span>{deal.deliverables.length} deliverables</span>
                </div>
              </div>

              {deal.deliverables.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Deliverables:</h4>
                  <div className="space-y-1">
                    {deal.deliverables.map((deliverable, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>
                          {deliverable.type.toUpperCase()} on {deliverable.platform} - {deliverable.description}
                        </span>
                        <Badge variant={deliverable.completed ? 'default' : 'secondary'}>
                          {deliverable.completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deal.exclusivityClauses.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Exclusivity Clauses:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {deal.exclusivityClauses.map((clause, index) => (
                      <li key={index}>• {clause}</li>
                    ))}
                  </ul>
                </div>
              )}

              {deal.notes && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Notes:</h4>
                  <p className="text-sm text-gray-600">{deal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {brandDeals.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brand deals yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first brand partnership campaign</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Brand Deal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}