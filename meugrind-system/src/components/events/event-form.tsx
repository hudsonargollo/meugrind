'use client';

import React, { useState } from 'react';
import { Event } from '../../types';
import { eventService, CreateEventData } from '../../lib/event-service';
import { EventVisibilitySelector } from './event-visibility-selector';
import { PrivacyShieldToggle } from './privacy-shield-toggle';
import { useAuth } from '../../hooks/use-auth';

interface EventFormProps {
  event?: Event;
  onSave: (event: Event) => void;
  onCancel: () => void;
}

export function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const { user } = useAuth();
  const isEditing = !!event;

  const [formData, setFormData] = useState<CreateEventData>({
    title: event?.title || '',
    description: event?.description || '',
    startTime: event?.startTime || new Date(),
    endTime: event?.endTime || new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    type: event?.type || 'personal',
    visibility: event?.visibility || 'mandatory',
    moduleId: event?.moduleId,
    moduleType: event?.moduleType,
    isPrivacyShielded: event?.isPrivacyShielded || false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let savedEvent: Event;
      
      if (isEditing && event) {
        // Update existing event
        savedEvent = {
          ...event,
          ...formData,
          updatedAt: new Date(),
          version: event.version + 1,
          syncStatus: 'pending',
        };
      } else {
        // Create new event
        savedEvent = eventService.createEvent(formData);
      }

      onSave(savedEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof CreateEventData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Event' : 'Create New Event'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Event Title
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter event title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter event description (optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={formatDateTimeLocal(formData.startTime)}
              onChange={(e) => handleFieldChange('startTime', new Date(e.target.value))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={formatDateTimeLocal(formData.endTime)}
              onChange={(e) => handleFieldChange('endTime', new Date(e.target.value))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Event Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleFieldChange('type', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="personal">Personal</option>
            <option value="gig">Band Gig</option>
            <option value="brand_deal">Brand Deal</option>
            <option value="pr_event">PR Event</option>
            <option value="solar_appointment">Solar Appointment</option>
          </select>
        </div>

        <EventVisibilitySelector
          value={formData.visibility}
          onChange={(visibility) => handleFieldChange('visibility', visibility)}
          disabled={isLoading}
        />

        <PrivacyShieldToggle
          enabled={formData.isPrivacyShielded || false}
          onChange={(enabled) => handleFieldChange('isPrivacyShielded', enabled)}
          disabled={isLoading}
          eventType={formData.type}
        />

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
          </button>
        </div>
      </form>
    </div>
  );
}