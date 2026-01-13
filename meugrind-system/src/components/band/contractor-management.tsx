'use client';

import React, { useState, useEffect } from 'react';
import { Contractor } from '../../types/band';
import { bandService } from '../../lib/band-service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trash2, Edit, Plus, Search, Users, Phone, Mail, DollarSign } from 'lucide-react';

interface ContractorFormData {
  name: string;
  role: Contractor['role'];
  phone: string;
  email: string;
  rate: number;
  availability: string[];
}

const initialFormData: ContractorFormData = {
  name: '',
  role: 'sound_engineer',
  phone: '',
  email: '',
  rate: 0,
  availability: []
};

const contractorRoles: { value: Contractor['role']; label: string }[] = [
  { value: 'sound_engineer', label: 'Sound Engineer' },
  { value: 'lighting_tech', label: 'Lighting Technician' },
  { value: 'roadie', label: 'Roadie' },
  { value: 'security', label: 'Security' }
];

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function ContractorManagement() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [formData, setFormData] = useState<ContractorFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contractors on component mount
  useEffect(() => {
    loadContractors();
  }, []);

  // Filter contractors based on search query and role filter
  useEffect(() => {
    let filtered = contractors;

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(contractor =>
        contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contractor.phone.includes(searchQuery) ||
        contractor.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(contractor => contractor.role === roleFilter);
    }

    setFilteredContractors(filtered);
  }, [contractors, searchQuery, roleFilter]);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const allContractors = await bandService.getAllContractors();
      setContractors(allContractors);
      setError(null);
    } catch (err) {
      setError('Failed to load contractors');
      console.error('Error loading contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContractor) {
        await bandService.updateContractor(editingContractor.id, formData);
      } else {
        await bandService.createContractor(formData);
      }
      
      await loadContractors();
      resetForm();
      setError(null);
    } catch (err) {
      setError(editingContractor ? 'Failed to update contractor' : 'Failed to create contractor');
      console.error('Error saving contractor:', err);
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setFormData({
      name: contractor.name,
      role: contractor.role,
      phone: contractor.phone,
      email: contractor.email || '',
      rate: contractor.rate || 0,
      availability: contractor.availability
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (contractorId: string) => {
    if (confirm('Are you sure you want to delete this contractor?')) {
      try {
        await bandService.deleteContractor(contractorId);
        await loadContractors();
        setError(null);
      } catch (err) {
        setError('Failed to delete contractor');
        console.error('Error deleting contractor:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingContractor(null);
    setIsFormOpen(false);
  };

  const getRoleLabel = (role: Contractor['role']): string => {
    return contractorRoles.find(r => r.value === role)?.label || role;
  };

  const getRoleBadgeColor = (role: Contractor['role']): string => {
    switch (role) {
      case 'sound_engineer': return 'bg-blue-100 text-blue-800';
      case 'lighting_tech': return 'bg-yellow-100 text-yellow-800';
      case 'roadie': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleAvailability = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading contractors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Contractor Database
        </h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contractor
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search contractors by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {contractorRoles.map(role => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contractor List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContractors.map((contractor) => (
          <Card key={contractor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="truncate">{contractor.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(contractor)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(contractor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className={getRoleBadgeColor(contractor.role)}>
                {getRoleLabel(contractor.role)}
              </Badge>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{contractor.phone}</span>
                </div>
                
                {contractor.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{contractor.email}</span>
                  </div>
                )}
                
                {contractor.rate && contractor.rate > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>${contractor.rate}/hour</span>
                  </div>
                )}
              </div>
              
              {contractor.availability.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Available:</p>
                  <div className="flex flex-wrap gap-1">
                    {contractor.availability.map(day => (
                      <Badge key={day} variant="outline" className="text-xs">
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContractors.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchQuery || roleFilter !== 'all' 
            ? 'No contractors found matching your filters.' 
            : 'No contractors in database yet.'}
        </div>
      )}

      {/* Contractor Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingContractor ? 'Edit Contractor' : 'Add New Contractor'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as Contractor['role'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contractorRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Availability */}
              <div>
                <Label>Availability</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availability.includes(day)}
                        onChange={() => toggleAvailability(day)}
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContractor ? 'Update Contractor' : 'Add Contractor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}