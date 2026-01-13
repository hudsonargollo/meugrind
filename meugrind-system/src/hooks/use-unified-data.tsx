'use client';

import { useState, useEffect, useCallback } from 'react';
import { unifiedDataService, UnifiedEntity, Task, Event } from '../lib/unified-data-service';
import { useAuth } from './use-auth';

export function useUnifiedData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic CRUD operations
  const create = useCallback(async <T extends UnifiedEntity>(
    entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await unifiedDataService.create<T>({
        ...entity,
        userId: user?.id || '',
      } as any);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create entity';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const update = useCallback(async <T extends UnifiedEntity>(
    type: string,
    id: string,
    updates: Partial<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await unifiedDataService.update<T>(type, id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update entity';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (type: string, id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await unifiedDataService.delete(type, id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entity';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findById = useCallback(async <T extends UnifiedEntity>(
    type: string,
    id: string
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await unifiedDataService.findById<T>(type, id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find entity';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findAll = useCallback(async <T extends UnifiedEntity>(
    type: string,
    filters?: Record<string, any>
  ): Promise<T[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await unifiedDataService.findAll<T>(type, filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find entities';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cross-module operations
  const createTask = useCallback(async (
    entityType: string,
    entityId: string,
    taskData: Partial<Task>
  ): Promise<Task> => {
    return create<Task>({
      ...taskData,
      type: 'task',
      moduleId: entityType,
      entityId: entityId,
      completed: false,
      priority: taskData.priority || 'medium',
      tags: taskData.tags || [],
      userId: user?.id || '',
    } as any);
  }, [create, user?.id]);

  const createEvent = useCallback(async (
    entityType: string,
    entityId: string,
    eventData: Partial<Event>
  ): Promise<Event> => {
    return create<Event>({
      ...eventData,
      type: 'event',
      moduleId: entityType,
      entityId: entityId,
      visibility: eventData.visibility || 'fyi',
      attendees: eventData.attendees || [],
      userId: user?.id || '',
    } as any);
  }, [create, user?.id]);

  const getRelatedTasks = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<Task[]> => {
    return unifiedDataService.getRelatedTasks(entityType, entityId);
  }, []);

  const getRelatedEvents = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<Event[]> => {
    return unifiedDataService.getRelatedEvents(entityType, entityId);
  }, []);

  // Dashboard data
  const getDashboardData = useCallback(async (role: 'manager' | 'personal') => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await unifiedDataService.getDashboardData(user.id, role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Sync operations
  const forceSyncAll = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await unifiedDataService.forceSyncAll();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSyncStatus = useCallback(async () => {
    try {
      return await unifiedDataService.getSyncStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get sync status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Cache operations
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await unifiedDataService.clearCache();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    // CRUD operations
    create,
    update,
    remove,
    findById,
    findAll,
    
    // Cross-module operations
    createTask,
    createEvent,
    getRelatedTasks,
    getRelatedEvents,
    
    // Dashboard data
    getDashboardData,
    
    // Sync operations
    forceSyncAll,
    getSyncStatus,
    
    // Cache operations
    clearCache,
    
    // State
    isLoading,
    error,
    
    // Clear error
    clearError: () => setError(null),
  };
}

// Hook for specific entity types
export function useEntityData<T extends UnifiedEntity>(type: string) {
  const { findAll, create, update, remove, isLoading, error } = useUnifiedData();
  const [entities, setEntities] = useState<T[]>([]);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchEntities = useCallback(async (filters?: Record<string, any>) => {
    try {
      const result = await findAll<T>(type, filters);
      setEntities(result);
      setLastFetch(new Date());
      return result;
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
      throw err;
    }
  }, [findAll, type]);

  const createEntity = useCallback(async (
    entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>
  ): Promise<T> => {
    const result = await create<T>(entity);
    // Refresh the list
    await fetchEntities();
    return result;
  }, [create, fetchEntities]);

  const updateEntity = useCallback(async (
    id: string,
    updates: Partial<T>
  ): Promise<T> => {
    const result = await update<T>(type, id, updates);
    // Refresh the list
    await fetchEntities();
    return result;
  }, [update, type, fetchEntities]);

  const deleteEntity = useCallback(async (id: string): Promise<void> => {
    await remove(type, id);
    // Refresh the list
    await fetchEntities();
  }, [remove, type, fetchEntities]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  return {
    entities,
    lastFetch,
    fetchEntities,
    createEntity,
    updateEntity,
    deleteEntity,
    isLoading,
    error,
  };
}