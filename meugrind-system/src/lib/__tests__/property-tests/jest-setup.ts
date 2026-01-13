/**
 * Jest setup for property-based tests
 * Configures global settings and utilities for Fast-check integration
 */

// Set up global test environment variables (avoid direct assignment to read-only properties)
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    configurable: true
  });
}

// Configure Fast-check global settings
import * as fc from 'fast-check';

// Global configuration for Fast-check
fc.configureGlobal({
  // Use deterministic random number generation for reproducible tests
  seed: process.env.FAST_CHECK_SEED ? parseInt(process.env.FAST_CHECK_SEED) : 42,
  
  // Number of test runs (can be overridden by individual tests)
  numRuns: process.env.FAST_CHECK_NUM_RUNS ? parseInt(process.env.FAST_CHECK_NUM_RUNS) : 100,
  
  // Enable verbose output in CI or when explicitly requested
  verbose: process.env.CI === 'true' || process.env.VERBOSE === 'true',
  
  // Timeout for individual property checks
  timeout: 30000,
  
  // Enable shrinking to find minimal failing examples
  endOnFailure: false,
});

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toSatisfyProperty(property: any): R;
      toBeValidEntity(): R;
      toHaveValidSyncStatus(): R;
    }
  }
}

// Custom Jest matchers for property testing
expect.extend({
  toSatisfyProperty(received: any, property: any) {
    try {
      fc.assert(fc.property(fc.constant(received), property));
      return {
        message: () => `Expected value to satisfy property`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected value to satisfy property but failed: ${error}`,
        pass: false,
      };
    }
  },
  
  toBeValidEntity(received: any) {
    const hasId = received && typeof received.id === 'string' && received.id.length > 0;
    const hasTimestamps = received && received.createdAt instanceof Date && received.updatedAt instanceof Date;
    const hasSyncStatus = received && ['synced', 'pending', 'conflict'].includes(received.syncStatus);
    
    const isValid = hasId && hasTimestamps && hasSyncStatus;
    
    return {
      message: () => isValid 
        ? `Expected entity to be invalid`
        : `Expected entity to be valid (have id, timestamps, and sync status)`,
      pass: isValid,
    };
  },
  
  toHaveValidSyncStatus(received: any) {
    const validStatuses = ['synced', 'pending', 'conflict'];
    const isValid = received && validStatuses.includes(received.syncStatus);
    
    return {
      message: () => isValid
        ? `Expected sync status to be invalid`
        : `Expected sync status to be one of: ${validStatuses.join(', ')}`,
      pass: isValid,
    };
  },
});

// Mock console methods to reduce noise during property testing
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly enabled
  if (process.env.VERBOSE !== 'true') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test timeout for property-based tests
jest.setTimeout(60000);

// Export configuration for use in tests
export const propertyTestGlobalConfig = {
  seed: process.env.FAST_CHECK_SEED ? parseInt(process.env.FAST_CHECK_SEED) : 42,
  numRuns: process.env.FAST_CHECK_NUM_RUNS ? parseInt(process.env.FAST_CHECK_NUM_RUNS) : 100,
  verbose: process.env.CI === 'true' || process.env.VERBOSE === 'true',
  timeout: 30000,
};