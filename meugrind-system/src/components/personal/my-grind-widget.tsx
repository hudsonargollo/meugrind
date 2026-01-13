'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { personalDashboardService, ImmediateAction } from '../../lib/personal-dashboard-service';
import { useAuth } from '../../hooks/use-auth';
import { Clock, Calendar, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface MyGrindWidgetProps {
  className?: string;
}

export function MyGrindWidget({ className }: MyGrindWidgetProps) {
  const { isPersonal } = useAuth();
  const [actions, setActions] = useState<ImmediateAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPersonal()) {
      loadImmediateActions();
    }
  }, [isPersonal]);

  const loadImmediateActions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const immediateActions = await personalDashboardService.getImmediateActions();
      setActions(immediateActions);
    } catch (err) {
      console.error('Failed to load immediate actions:', err);
      setError('Failed to load your immediate actions');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <Clock className="h-4 w-4" />;
      case 'medium':
        return <Calendar className="h-4 w-4" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDueDate = (dueDate?: Date) => {
    if (!dueDate) return null;

    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return 'Overdue';
    } else if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '✓';
      case 'event':
        return '📅';
      case 'followup':
        return '📞';
      default:
        return '•';
    }
  };

  if (!isPersonal) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">My Grind</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">My Grind</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadImmediateActions}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          My Grind
          <span className="text-sm font-normal text-gray-500">Next 3 Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">All caught up!</p>
            <p className="text-gray-500 text-sm">No immediate actions needed right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="group relative p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">{getTypeIcon(action.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 text-sm leading-5 truncate">
                        {action.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 ${getPriorityColor(action.priority)}`}
                        >
                          <span className="flex items-center gap-1">
                            {getPriorityIcon(action.priority)}
                            {action.priority}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="capitalize">{action.category}</span>
                      
                      {action.dueDate && (
                        <>
                          <span>•</span>
                          <span className={formatDueDate(action.dueDate) === 'Overdue' ? 'text-red-600 font-medium' : ''}>
                            {formatDueDate(action.dueDate)}
                          </span>
                        </>
                      )}
                      
                      {action.estimatedMinutes && (
                        <>
                          <span>•</span>
                          <span>{action.estimatedMinutes}min</span>
                        </>
                      )}
                      
                      {action.moduleType && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{action.moduleType}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Priority indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                  action.priority === 'urgent' ? 'bg-red-500' :
                  action.priority === 'high' ? 'bg-orange-500' :
                  action.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={loadImmediateActions}
            className="w-full text-xs"
          >
            Refresh Actions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}