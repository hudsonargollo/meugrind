'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { SolarLead, ContactInfo, EnergyRequirements, Address } from '../../types/solar';
import { solarService } from '../../lib/solar-service';

interface LeadCaptureFormProps {
  onLeadCreated?: (lead: SolarLead) => void;
  onCancel?: () => void;
  className?: string;
}

export function LeadCaptureForm({ onLeadCreated, onCancel, className }: LeadCaptureFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'email' as ContactInfo['preferredContact'],
    
    // Address
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brazil',
    
    // Lead Information
    propertyType: 'domestic' as 'domestic' | 'commercial',
    source: 'website' as SolarLead['source'],
    priority: 'medium' as SolarLead['priority'],
    
    // Energy Requirements
    monthlyUsage: '',
    currentBill: '',
    roofType: 'tile' as EnergyRequirements['roofType'],
    roofCondition: 'good' as EnergyRequirements['roofCondition'],
    shadingIssues: false,
    budgetMin: '',
    budgetMax: '',
    
    // Additional Information
    notes: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contactInfo: ContactInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        preferredContact: formData.preferredContact,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
      };

      const energyRequirements: EnergyRequirements = {
        monthlyUsage: parseFloat(formData.monthlyUsage) || 0,
        currentBill: parseFloat(formData.currentBill) || 0,
        roofType: formData.roofType,
        roofCondition: formData.roofCondition,
        shadingIssues: formData.shadingIssues,
        budgetRange: {
          min: parseFloat(formData.budgetMin) || 0,
          max: parseFloat(formData.budgetMax) || 0,
        },
      };

      // Calculate initial followup date (1 day from now for new leads)
      const followupDate = new Date();
      followupDate.setDate(followupDate.getDate() + 1);

      const leadData: Omit<SolarLead, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'> = {
        contactInfo,
        propertyType: formData.propertyType,
        energyRequirements,
        status: 'lead',
        followupDate,
        notes: formData.notes ? [formData.notes] : [],
        source: formData.source,
        priority: formData.priority,
      };

      const newLead = await solarService.createLead(leadData);
      
      // Automatic followup scheduling is handled in the service
      await solarService.scheduleAutomaticFollowup(newLead.id, 'lead');

      onLeadCreated?.(newLead);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferredContact: 'email',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Brazil',
        propertyType: 'domestic',
        source: 'website',
        priority: 'medium',
        monthlyUsage: '',
        currentBill: '',
        roofType: 'tile',
        roofCondition: 'good',
        shadingIssues: false,
        budgetMin: '',
        budgetMax: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>New Solar Lead</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                <Select value={formData.preferredContact} onValueChange={(value) => handleInputChange('preferredContact', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Property Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Lead Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Lead Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">Domestic</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">Lead Source</Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Energy Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Energy Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyUsage">Monthly Usage (kWh)</Label>
                <Input
                  id="monthlyUsage"
                  type="number"
                  value={formData.monthlyUsage}
                  onChange={(e) => handleInputChange('monthlyUsage', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="currentBill">Current Monthly Bill (R$)</Label>
                <Input
                  id="currentBill"
                  type="number"
                  value={formData.currentBill}
                  onChange={(e) => handleInputChange('currentBill', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="roofType">Roof Type</Label>
                <Select value={formData.roofType} onValueChange={(value) => handleInputChange('roofType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tile">Tile</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="concrete">Concrete</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="roofCondition">Roof Condition</Label>
                <Select value={formData.roofCondition} onValueChange={(value) => handleInputChange('roofCondition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budgetMin">Budget Range Min (R$)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="budgetMax">Budget Range Max (R$)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shadingIssues"
                checked={formData.shadingIssues}
                onChange={(e) => handleInputChange('shadingIssues', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="shadingIssues">Property has shading issues</Label>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information about the lead..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating Lead...' : 'Create Lead'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}