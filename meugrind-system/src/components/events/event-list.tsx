'use client';

import React from 'react';
import { Event } from '../../types';
import { eventService } from '../../lib/event-service';
import { useAuth } from '../../hooks/use-auth';

interface EventListProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onEventEdit?: (event: Event) => void;
}

export function EventList({ events, onEventClick, onEventEdit }: EventListProps) {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to view events</div>;
  }

  const visibleEvents = eventService.filterEventsByVisibility(events, user);

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getEventTypeIcon = (type: string): string => {
    switch (type) {
      case 'gig': return '🎵';
      case 'brand_deal': return '📱';
      case 'pr_event': return '📺';
      case 'solar_appointment': return '☀️';
      case 'personal': return '👤';
      default: return '📅';
    }
  };

  const getVisibilityIcon = (visibility: string): string => {
    switch (visibility) {
      case 'manager_only': return '👑';
      case 'fyi_only': return '🔵';
      case 'mandatory': return '🔴';
      default: return '📅';
    }
  };

  const getVisibilityLabel = (visibility: string): string => {
    switch (visibility) {
      case 'manager_only': return 'Manager Only';
      case 'fyi_only': return 'FYI Only';
      case 'mandatory': return 'Mandatory';
      default: return 'Unknown';
    }
  };

  if (visibleEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📅</div>
        <p>No events to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleEvents.map((event) => {
        const canEdit = eventService.canEditEvent(event, user);
        const canViewDetails = eventService.canViewEventDetails(event, user);
        
        return (
          <div
            key={event.id}
            className={`
              bg-white border border-gray-200 rounded-lg p-4 shadow-sm
              ${onEventClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
              ${event.isPrivacyShielded ? 'border-l-4 border-l-blue-500' : ''}
            `}
            onClick={() => onEventClick?.(event)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                  <h3 className="font-semibold text-gray-900">
                    {canViewDetails ? event.title : 'Busy'}
                  </h3>
                  <span className="text-xs" title={getVisibilityLabel(event.visibility)}>
                    {getVisibilityIcon(event.visibility)}
                  </span>
                  {event.isPrivacyShielded && (
                    <span className="text-xs" title="Privacy Shield Enabled">
                      🛡️
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
                </div>
                
                {canViewDetails && event.description && (
                  <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Type: {event.type.replace('_', ' ')}</span>
                  <span>Visibility: {getVisibilityLabel(event.visibility)}</span>
                  {event.syncStatus !== 'synced' && (
                    <span className="text-orange-600">
                      {event.syncStatus === 'pending' ? 'Syncing...' : 'Conflict'}
                    </span>
                  )}
                </div>
              </div>
              
              {canEdit && onEventEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventEdit(event);
                  }}
                  className="ml-4 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}