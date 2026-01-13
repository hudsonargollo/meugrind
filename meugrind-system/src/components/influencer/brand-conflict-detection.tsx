'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Brand, BrandDeal } from '../../types/influencer';
import { influencerService } from '../../lib/influencer-service';
import { 
  AlertTriangle, 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface BrandFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  exclusivityConflicts: string[];
  blacklisted: boolean;
  blacklistReason: string;
}

const initialFormData: BrandFormData = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  exclusivityConflicts: [],
  blacklisted: false,
  blacklistReason: '',
};

export function BrandConflictDetection() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandDeals, setBrandDeals] = useState<BrandDeal[]>([]);
  const [formData, setFormData] = useState<BrandFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [conflictCheck, setConflictCheck] = useState<{
    brandName: string;
    exclusivityClauses: string[];
    result: {
      hasConflicts: boolean;
      conflicts: string[];
      isBlacklisted: boolean;
    } | null;
  }>({
    brandName: '',
    exclusivityClauses: [],
    result: null,
  });

  useEffect(() => {
    loadBrands();
    loadBrandDeals();
  }, []);

  const loadBrands = async () => {
    try {
      const allBrands = await influencerService.getAllBrands();
      setBrands(allBrands);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const loadBrandDeals = async () => {
    try {
      const deals = await influencerService.getAllBrandDeals();
      setBrandDeals(deals);
    } catch (error) {
      console.error('Failed to load brand deals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const brandData = {
        ...formData,
        previousDeals: brandDeals
          .filter(deal => deal.brandName.toLowerCase() === formData.name.toLowerCase())
          .map(deal => deal.id),
      };

      if (editingId) {
        await influencerService.updateBrand(editingId, brandData);
      } else {
        await influencerService.createBrand(brandData);
      }

      await loadBrands();
      resetForm();
    } catch (error) {
      console.error('Failed to save brand:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setFormData({
      name: brand.name,
      contactPerson: brand.contactPerson || '',
      email: brand.email || '',
      phone: brand.phone || '',
      exclusivityConflicts: brand.exclusivityConflicts,
      blacklisted: brand.blacklisted,
      blacklistReason: brand.blacklistReason || '',
    });
    setEditingId(brand.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        await influencerService.deleteBrand(id);
        await loadBrands();
      } catch (error) {
        console.error('Failed to delete brand:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const checkConflicts = async () => {
    if (!conflictCheck.brandName || conflictCheck.exclusivityClauses.length === 0) {
      return;
    }

    try {
      const result = await influencerService.checkBrandConflicts(
        conflictCheck.brandName,
        conflictCheck.exclusivityClauses
      );
      setConflictCheck(prev => ({ ...prev, result }));
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    }
  };

  const toggleBlacklist = async (brandId: string, currentStatus: boolean, reason?: string) => {
    try {
      await influencerService.updateBrand(brandId, {
        blacklisted: !currentStatus,
        blacklistReason: !currentStatus ? reason : '',
      });
      await loadBrands();
    } catch (error) {
      console.error('Failed to update blacklist status:', error);
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.contactPerson && brand.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActiveDealCount = (brandName: string) => {
    return brandDeals.filter(deal => 
      deal.brandName.toLowerCase() === brandName.toLowerCase() &&
      ['contract', 'content', 'posted'].includes(deal.status)
    ).length;
  };

  const getLastDealDate = (brandName: string) => {
    const deals = brandDeals
      .filter(deal => deal.brandName.toLowerCase() === brandName.toLowerCase())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return deals.length > 0 ? deals[0].createdAt : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Brand Conflict Detection</h2>
          <p className="text-gray-600">Manage brand relationships and detect exclusivity conflicts</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {/* Conflict Checker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Conflict Checker
          </CardTitle>
          <CardDescription>
            Check for potential conflicts before signing new brand deals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="checkBrandName">Brand Name</Label>
            <Input
              id="checkBrandName"
              value={conflictCheck.brandName}
              onChange={(e) => setConflictCheck(prev => ({ 
                ...prev, 
                brandName: e.target.value,
                result: null 
              }))}
              placeholder="Enter brand name to check"
            />
          </div>
          <div>
            <Label htmlFor="checkClauses">Exclusivity Clauses (one per line)</Label>
            <Textarea
              id="checkClauses"
              value={conflictCheck.exclusivityClauses.join('\n')}
              onChange={(e) => setConflictCheck(prev => ({
                ...prev,
                exclusivityClauses: e.target.value.split('\n').filter(c => c.trim()),
                result: null
              }))}
              placeholder="e.g., No competing beauty brands for 30 days"
              rows={3}
            />
          </div>
          <Button onClick={checkConflicts} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Check for Conflicts
          </Button>

          {conflictCheck.result && (
            <div className={`border rounded-lg p-4 ${
              conflictCheck.result.hasConflicts 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className={`flex items-center gap-2 font-medium mb-2 ${
                conflictCheck.result.hasConflicts ? 'text-red-800' : 'text-green-800'
              }`}>
                {conflictCheck.result.hasConflicts ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {conflictCheck.result.hasConflicts ? 'Conflicts Detected' : 'No Conflicts Found'}
              </div>
              {conflictCheck.result.conflicts.length > 0 && (
                <ul className={`text-sm space-y-1 ${
                  conflictCheck.result.hasConflicts ? 'text-red-700' : 'text-green-700'
                }`}>
                  {conflictCheck.result.conflicts.map((conflict, index) => (
                    <li key={index}>• {conflict}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Brand' : 'Add New Brand'}</CardTitle>
            <CardDescription>
              Manage brand information and exclusivity settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Brand Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="exclusivityConflicts">Known Exclusivity Conflicts (one per line)</Label>
                <Textarea
                  id="exclusivityConflicts"
                  value={formData.exclusivityConflicts.join('\n')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    exclusivityConflicts: e.target.value.split('\n').filter(c => c.trim())
                  }))}
                  placeholder="e.g., Competing beauty brand, Fashion competitor"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="blacklisted"
                  checked={formData.blacklisted}
                  onChange={(e) => setFormData(prev => ({ ...prev, blacklisted: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="blacklisted">Blacklist this brand</Label>
              </div>

              {formData.blacklisted && (
                <div>
                  <Label htmlFor="blacklistReason">Blacklist Reason</Label>
                  <Textarea
                    id="blacklistReason"
                    value={formData.blacklistReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, blacklistReason: e.target.value }))}
                    placeholder="Reason for blacklisting this brand"
                    rows={2}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')} Brand
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
        {filteredBrands.map((brand) => {
          const activeDealCount = getActiveDealCount(brand.name);
          const lastDealDate = getLastDealDate(brand.name);

          return (
            <Card key={brand.id} className={brand.blacklisted ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{brand.name}</h3>
                      {brand.blacklisted && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Blacklisted
                        </Badge>
                      )}
                      {activeDealCount > 0 && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activeDealCount} Active Deal{activeDealCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {brand.contactPerson && (
                      <p className="text-gray-600">Contact: {brand.contactPerson}</p>
                    )}
                    {brand.email && (
                      <p className="text-gray-600">Email: {brand.email}</p>
                    )}
                    {brand.phone && (
                      <p className="text-gray-600">Phone: {brand.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(brand)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(brand.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {brand.exclusivityConflicts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Known Conflicts:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {brand.exclusivityConflicts.map((conflict, index) => (
                        <Badge key={index} variant="outline" className="text-yellow-700 border-yellow-300">
                          {conflict}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {brand.blacklisted && brand.blacklistReason && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-1">Blacklist Reason:</h4>
                    <p className="text-red-700 text-sm">{brand.blacklistReason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {lastDealDate && (
                      <span>Last deal: {lastDealDate.toLocaleDateString()}</span>
                    )}
                    {brand.previousDeals.length > 0 && (
                      <span className="ml-4">Total deals: {brand.previousDeals.length}</span>
                    )}
                  </div>
                  <Button
                    variant={brand.blacklisted ? "default" : "destructive"}
                    size="sm"
                    onClick={() => {
                      if (!brand.blacklisted) {
                        const reason = prompt('Reason for blacklisting:');
                        if (reason) {
                          toggleBlacklist(brand.id, brand.blacklisted, reason);
                        }
                      } else {
                        toggleBlacklist(brand.id, brand.blacklisted);
                      }
                    }}
                  >
                    {brand.blacklisted ? 'Remove from Blacklist' : 'Add to Blacklist'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBrands.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {brands.length === 0 ? 'No brands yet' : 'No brands found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {brands.length === 0 
                ? "Start by adding your first brand to track relationships and conflicts"
                : "No brands match your search criteria"
              }
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}