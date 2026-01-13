import { SyncableEntity } from '../types';

export interface ConflictResolutionStrategy {
  name: string;
  description: string;
  resolve: (local: any, remote: any) => any;
}

/**
 * Last-write-wins strategy for simple fields
 */
export const lastWriteWinsStrategy: ConflictResolutionStrategy = {
  name: 'last_write_wins',
  description: 'Use the version with the most recent timestamp',
  resolve: (local: SyncableEntity, remote: SyncableEntity) => {
    return local.updatedAt > remote.updatedAt ? local : remote;
  }
};

/**
 * Manual merge strategy for complex documents
 */
export const manualMergeStrategy: ConflictResolutionStrategy = {
  name: 'manual_merge',
  description: 'Requires manual intervention to resolve conflicts',
  resolve: (local: any, remote: any) => {
    // Return both versions for manual resolution
    return {
      requiresManualResolution: true,
      localVersion: local,
      remoteVersion: remote,
      conflictFields: findConflictingFields(local, remote)
    };
  }
};

/**
 * Field-level merge strategy
 */
export const fieldLevelMergeStrategy: ConflictResolutionStrategy = {
  name: 'field_level_merge',
  description: 'Merge non-conflicting fields automatically, flag conflicts',
  resolve: (local: any, remote: any) => {
    const merged = { ...local };
    const conflicts: string[] = [];

    for (const [key, remoteValue] of Object.entries(remote)) {
      if (key in local) {
        if (isSimpleField(key) && local[key] !== remoteValue) {
          // Use last-write-wins for simple fields
          if (remote.updatedAt > local.updatedAt) {
            merged[key] = remoteValue;
          }
        } else if (isComplexField(key) && !deepEqual(local[key], remoteValue)) {
          // Flag complex fields for manual resolution
          conflicts.push(key);
        }
      } else {
        // New field from remote
        merged[key] = remoteValue;
      }
    }

    return conflicts.length > 0 
      ? { ...merged, _conflicts: conflicts, _requiresManualResolution: true }
      : merged;
  }
};

/**
 * Array merge strategy for list fields
 */
export const arrayMergeStrategy: ConflictResolutionStrategy = {
  name: 'array_merge',
  description: 'Merge arrays by combining unique elements',
  resolve: (local: any, remote: any) => {
    const merged = { ...local };

    for (const [key, remoteValue] of Object.entries(remote)) {
      if (Array.isArray(remoteValue) && Array.isArray(local[key])) {
        // Merge arrays by combining unique elements
        merged[key] = mergeArrays(local[key], remoteValue);
      } else if (local[key] !== remoteValue) {
        // Use last-write-wins for non-array fields
        if (remote.updatedAt > local.updatedAt) {
          merged[key] = remoteValue;
        }
      }
    }

    return merged;
  }
};

/**
 * Find conflicting fields between two objects
 */
function findConflictingFields(local: any, remote: any): string[] {
  const conflicts: string[] = [];
  const localKeys = Object.keys(local);
  const remoteKeys = Object.keys(remote);
  const allKeys = Array.from(new Set([...localKeys, ...remoteKeys]));

  for (const key of allKeys) {
    if (key === 'id' || key === 'createdAt' || key === 'version') {
      continue; // Skip system fields
    }

    if (local[key] !== remote[key] && !deepEqual(local[key], remote[key])) {
      conflicts.push(key);
    }
  }

  return conflicts;
}

/**
 * Check if a field is considered simple (string, number, boolean, date)
 */
function isSimpleField(fieldName: string): boolean {
  const simpleFields = [
    'title', 'name', 'description', 'status', 'priority', 'completed',
    'email', 'phone', 'fee', 'duration', 'bpm', 'key'
  ];
  return simpleFields.includes(fieldName);
}

/**
 * Check if a field is considered complex (objects, arrays)
 */
function isComplexField(fieldName: string): boolean {
  const complexFields = [
    'deliverables', 'techRequirements', 'songs', 'contractors',
    'exclusivityClauses', 'timeline', 'permissions', 'preferences'
  ];
  return complexFields.includes(fieldName);
}

/**
 * Deep equality check for objects
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Merge two arrays by combining unique elements
 */
function mergeArrays(local: any[], remote: any[]): any[] {
  const merged = [...local];
  
  for (const remoteItem of remote) {
    const exists = merged.some(localItem => {
      if (typeof localItem === 'object' && localItem.id) {
        return localItem.id === remoteItem.id;
      }
      return deepEqual(localItem, remoteItem);
    });
    
    if (!exists) {
      merged.push(remoteItem);
    }
  }
  
  return merged;
}

/**
 * Get the appropriate conflict resolution strategy for an entity type
 */
export function getConflictResolutionStrategy(entityType: string): ConflictResolutionStrategy {
  const strategyMap: { [key: string]: ConflictResolutionStrategy } = {
    // Simple entities use last-write-wins
    'tasks': lastWriteWinsStrategy,
    'events': lastWriteWinsStrategy,
    'pomodoroSessions': lastWriteWinsStrategy,
    'solarLeads': lastWriteWinsStrategy,
    
    // Complex entities require manual merge
    'setlists': manualMergeStrategy,
    'brandDeals': manualMergeStrategy,
    'solarProjects': manualMergeStrategy,
    'gigs': manualMergeStrategy,
    
    // Entities with arrays use array merge
    'prEvents': arrayMergeStrategy,
    'appearanceWindows': fieldLevelMergeStrategy
  };

  return strategyMap[entityType] || lastWriteWinsStrategy;
}

/**
 * Resolve a conflict using the appropriate strategy
 */
export function resolveConflict(
  entityType: string,
  local: any,
  remote: any,
  customStrategy?: ConflictResolutionStrategy
): any {
  const strategy = customStrategy || getConflictResolutionStrategy(entityType);
  return strategy.resolve(local, remote);
}

/**
 * Create a conflict summary for UI display
 */
export function createConflictSummary(local: any, remote: any): {
  conflictingFields: string[];
  localTimestamp: Date;
  remoteTimestamp: Date;
  canAutoResolve: boolean;
} {
  const conflictingFields = findConflictingFields(local, remote);
  const canAutoResolve = conflictingFields.every(field => isSimpleField(field));

  return {
    conflictingFields,
    localTimestamp: local.updatedAt,
    remoteTimestamp: remote.updatedAt,
    canAutoResolve
  };
}