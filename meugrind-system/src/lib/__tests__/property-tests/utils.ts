/**
 * Property-based test utilities for MEUGRIND system
 * Provides helper functions and configurations for property tests
 */

import * as fc from 'fast-check';

// Configuration for property tests
export const propertyTestConfig = {
  // Minimum iterations as specified in design document
  numRuns: 100,
  
  // Timeout for individual property tests (30 seconds)
  timeout: 30000,
  
  // Seed for reproducible tests (can be overridden)
  seed: 42,
  
  // Verbose output for debugging
  verbose: process.env.NODE_ENV === 'test' && process.env.VERBOSE === 'true',
  
  // Enable shrinking to find minimal failing cases
  endOnFailure: false,
};

// Property test wrapper that applies consistent configuration
export function propertyTest(
  name: string,
  property: fc.IProperty<any>,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  const testConfig = { ...propertyTestConfig, ...config };
  
  test(name, async () => {
    await fc.assert(property, {
      numRuns: testConfig.numRuns,
      timeout: testConfig.timeout,
      seed: testConfig.seed,
      verbose: testConfig.verbose,
      endOnFailure: testConfig.endOnFailure,
    });
  }, testConfig.timeout + 5000); // Add buffer to Jest timeout
}

// Tagged property test for requirement traceability
export function taggedPropertyTest(
  featureName: string,
  propertyNumber: number,
  propertyDescription: string,
  requirements: string[],
  property: fc.IProperty<any>,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  const tag = `Feature: ${featureName}, Property ${propertyNumber}: ${propertyDescription}`;
  const requirementTag = `Validates: Requirements ${requirements.join(', ')}`;
  
  describe(`${tag}`, () => {
    propertyTest(
      `${requirementTag}`,
      property,
      config
    );
  });
}

// Async property test wrapper for database operations
export function asyncPropertyTest(
  name: string,
  asyncProperty: (data: any) => Promise<boolean>,
  generator: fc.Arbitrary<any>,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  const testConfig = { ...propertyTestConfig, ...config };
  
  test(name, async () => {
    await fc.assert(
      fc.asyncProperty(generator, asyncProperty),
      {
        numRuns: testConfig.numRuns,
        timeout: testConfig.timeout,
        seed: testConfig.seed,
        verbose: testConfig.verbose,
        endOnFailure: testConfig.endOnFailure,
      }
    );
  }, testConfig.timeout + 5000);
}

// Helper for testing invariants (properties that should always hold)
export function invariantTest<T>(
  name: string,
  generator: fc.Arbitrary<T>,
  invariant: (data: T) => boolean,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  propertyTest(
    name,
    fc.property(generator, invariant),
    config
  );
}

// Helper for testing round-trip properties (encode/decode, serialize/deserialize)
export function roundTripTest<T, U>(
  name: string,
  generator: fc.Arbitrary<T>,
  encode: (data: T) => U,
  decode: (encoded: U) => T,
  equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  config: Partial<typeof propertyTestConfig> = {}
): void {
  propertyTest(
    name,
    fc.property(generator, (original) => {
      const encoded = encode(original);
      const decoded = decode(encoded);
      return equals(original, decoded);
    }),
    config
  );
}

// Helper for testing idempotent operations (f(x) = f(f(x)))
export function idempotentTest<T>(
  name: string,
  generator: fc.Arbitrary<T>,
  operation: (data: T) => T,
  equals: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  config: Partial<typeof propertyTestConfig> = {}
): void {
  propertyTest(
    name,
    fc.property(generator, (data) => {
      const once = operation(data);
      const twice = operation(once);
      return equals(once, twice);
    }),
    config
  );
}

// Helper for testing metamorphic properties (relationships between inputs/outputs)
export function metamorphicTest<T, U>(
  name: string,
  generator: fc.Arbitrary<T>,
  operation: (data: T) => U,
  relationship: (input: T, output: U) => boolean,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  propertyTest(
    name,
    fc.property(generator, (input) => {
      const output = operation(input);
      return relationship(input, output);
    }),
    config
  );
}

// Helper for testing error conditions
export function errorConditionTest<T>(
  name: string,
  generator: fc.Arbitrary<T>,
  operation: (data: T) => any,
  shouldThrow: (data: T) => boolean,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  propertyTest(
    name,
    fc.property(generator, (data) => {
      try {
        operation(data);
        return !shouldThrow(data); // Should not throw but did not
      } catch (error) {
        return shouldThrow(data); // Should throw and did throw
      }
    }),
    config
  );
}

// Helper for testing database CRUD operations
export function crudPropertyTest<T extends { id: string }>(
  name: string,
  generator: fc.Arbitrary<T>,
  create: (data: T) => Promise<T>,
  read: (id: string) => Promise<T | null>,
  update: (id: string, data: Partial<T>) => Promise<T>,
  delete_: (id: string) => Promise<void>,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  asyncPropertyTest(
    name,
    async (data: T) => {
      try {
        // Create
        const created = await create(data);
        if (!created || created.id !== data.id) return false;
        
        // Read
        const read_result = await read(created.id);
        if (!read_result || read_result.id !== created.id) return false;
        
        // Update
        const updateData = { ...data, updatedAt: new Date() };
        const updated = await update(created.id, updateData);
        if (!updated || updated.id !== created.id) return false;
        
        // Delete
        await delete_(created.id);
        const deleted = await read(created.id);
        return deleted === null;
      } catch (error) {
        console.error('CRUD operation failed:', error);
        return false;
      }
    },
    generator,
    config
  );
}

// Helper for testing sync operations
export function syncPropertyTest<T extends { id: string; syncStatus: string }>(
  name: string,
  generator: fc.Arbitrary<T>,
  queueOperation: (entityType: string, entityId: string, operation: string, data: T) => Promise<void>,
  processSync: () => Promise<{ success: boolean; synced: number; conflicts: number; errors: string[] }>,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  asyncPropertyTest(
    name,
    async (data: T) => {
      try {
        // Queue the operation
        await queueOperation('test_entity', data.id, 'create', data);
        
        // Process sync
        const result = await processSync();
        
        // Verify sync completed successfully
        return result.success && result.synced > 0 && result.conflicts === 0;
      } catch (error) {
        console.error('Sync operation failed:', error);
        return false;
      }
    },
    generator,
    config
  );
}

// Helper for performance testing
export function performanceTest<T>(
  name: string,
  generator: fc.Arbitrary<T>,
  operation: (data: T) => any,
  maxTimeMs: number = 200, // Default 200ms as per requirements
  config: Partial<typeof propertyTestConfig> = {}
): void {
  propertyTest(
    name,
    fc.property(generator, (data) => {
      const startTime = performance.now();
      operation(data);
      const endTime = performance.now();
      const duration = endTime - startTime;
      return duration <= maxTimeMs;
    }),
    config
  );
}

// Helper for testing UI component properties
export function uiPropertyTest<T>(
  name: string,
  generator: fc.Arbitrary<T>,
  renderComponent: (props: T) => any,
  assertion: (rendered: any, props: T) => boolean,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  propertyTest(
    name,
    fc.property(generator, (props) => {
      const rendered = renderComponent(props);
      return assertion(rendered, props);
    }),
    config
  );
}

// Utility functions for common assertions
export const assertions = {
  // Check if two objects are deeply equal
  deepEqual: <T>(a: T, b: T): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  },
  
  // Check if array contains specific item
  arrayContains: <T>(array: T[], item: T): boolean => {
    return array.some(x => assertions.deepEqual(x, item));
  },
  
  // Check if array is sorted
  isSorted: <T>(array: T[], compareFn: (a: T, b: T) => number): boolean => {
    for (let i = 1; i < array.length; i++) {
      if (compareFn(array[i - 1], array[i]) > 0) {
        return false;
      }
    }
    return true;
  },
  
  // Check if value is within range
  inRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },
  
  // Check if string matches pattern
  matchesPattern: (str: string, pattern: RegExp): boolean => {
    return pattern.test(str);
  },
  
  // Check if date is valid
  isValidDate: (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  },
  
  // Check if object has required properties
  hasRequiredProperties: (obj: any, properties: string[]): boolean => {
    return properties.every(prop => obj.hasOwnProperty(prop) && obj[prop] !== undefined);
  },
};

// Mock implementations for testing
export const mocks = {
  // Mock database operations
  createMockDatabase: () => {
    const data = new Map<string, any>();
    
    return {
      create: async <T extends { id: string }>(entity: T): Promise<T> => {
        data.set(entity.id, { ...entity, createdAt: new Date(), updatedAt: new Date() });
        return data.get(entity.id);
      },
      
      read: async <T>(id: string): Promise<T | null> => {
        return data.get(id) || null;
      },
      
      update: async <T extends { id: string }>(id: string, updates: Partial<T>): Promise<T> => {
        const existing = data.get(id);
        if (!existing) throw new Error('Entity not found');
        const updated = { ...existing, ...updates, updatedAt: new Date() };
        data.set(id, updated);
        return updated;
      },
      
      delete: async (id: string): Promise<void> => {
        data.delete(id);
      },
      
      findAll: async <T>(): Promise<T[]> => {
        return Array.from(data.values());
      },
      
      clear: async (): Promise<void> => {
        data.clear();
      },
    };
  },
  
  // Mock sync manager
  createMockSyncManager: () => {
    const queue: any[] = [];
    
    return {
      queueOperation: async (entityType: string, entityId: string, operation: string, data: any): Promise<void> => {
        queue.push({ entityType, entityId, operation, data, timestamp: new Date() });
      },
      
      processSync: async (): Promise<{ success: boolean; synced: number; conflicts: number; errors: string[] }> => {
        const synced = queue.length;
        queue.length = 0; // Clear queue
        return { success: true, synced, conflicts: 0, errors: [] };
      },
      
      getSyncStatus: async () => ({
        isOnline: true,
        syncInProgress: false,
        pendingOperations: queue.length,
        conflicts: 0,
        ecoModeActive: false,
        syncPaused: false,
      }),
    };
  },
};

// Export default configuration for easy import
export default {
  propertyTestConfig,
  propertyTest,
  taggedPropertyTest,
  asyncPropertyTest,
  invariantTest,
  roundTripTest,
  idempotentTest,
  metamorphicTest,
  errorConditionTest,
  crudPropertyTest,
  syncPropertyTest,
  performanceTest,
  uiPropertyTest,
  assertions,
  mocks,
};