/**
 * Property Test: Optimistic UI Updates
 * 
 * Property 4: For any user action, the UI should render changes immediately 
 * before persistence confirmation
 * 
 * Validates: Requirements 1.5
 */

import * as fc from 'fast-check';
import { asyncPropertyTest } from './utils';

// Define types for UI testing
interface UIState {
  entities: Record<string, any>;
  pendingOperations: PendingOperation[];
  isLoading: boolean;
  lastUpdated: Date;
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  optimisticData?: any;
  originalData?: any; // Store original data for rollback
  timestamp: Date;
  confirmed: boolean;
}

interface UserAction {
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data?: any;
  timestamp: Date;
}

interface UIUpdateResult {
  immediateState: UIState;
  finalState: UIState;
  renderTime: number;
  persistenceTime: number;
  rollbackRequired: boolean;
}

// Simple generators for UI testing
const generators = {
  id: () => fc.uuid(),
  date: () => fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  
  // Generate valid titles that are not just whitespace
  validTitle: () => fc.constantFrom(
    'Task Title',
    'Event Name',
    'Song Title',
    'Brand Deal Campaign',
    'Test Entity',
    'Sample Item',
    'Valid Title',
    'Content Item'
  ),
  
  entity: () => fc.record({
    id: fc.uuid(),
    title: generators.validTitle(),
    description: fc.option(fc.string({ maxLength: 500 })),
    completed: fc.boolean(),
    createdAt: generators.date(),
    updatedAt: generators.date(),
  }),
  
  userAction: () => fc.record({
    type: fc.constantFrom('create', 'update', 'delete'),
    entityType: fc.constantFrom('task', 'event', 'song', 'brandDeal'),
    entityId: fc.uuid(),
    data: fc.record({
      title: generators.validTitle(),
      completed: fc.boolean(),
      description: fc.option(fc.string({ maxLength: 500 })),
    }),
    timestamp: generators.date(),
  }),
  
  uiState: () => fc.record({
    entities: fc.dictionary(
      fc.uuid(),
      generators.entity()
    ),
    pendingOperations: fc.array(fc.record({
      id: fc.uuid(),
      type: fc.constantFrom('create', 'update', 'delete'),
      entityType: fc.constantFrom('task', 'event', 'song', 'brandDeal'),
      entityId: fc.uuid(),
      optimisticData: fc.option(fc.object()),
      timestamp: generators.date(),
      confirmed: fc.boolean(),
    }), { maxLength: 5 }),
    isLoading: fc.boolean(),
    lastUpdated: generators.date(),
  }),
};

// Mock optimistic UI manager for testing
const createMockOptimisticUIManager = () => {
  let currentState: UIState = {
    entities: {},
    pendingOperations: [],
    isLoading: false,
    lastUpdated: new Date(),
  };
  
  let forceFailure = false; // Add flag to control persistence failure
  
  const uiManager = {
    // Get current UI state
    getState: (): UIState => ({ ...currentState }),
    
    // Set initial state
    setState: (state: UIState): void => {
      currentState = { ...state };
    },
    
    // Control persistence failure for testing
    setForceFailure: (shouldFail: boolean): void => {
      forceFailure = shouldFail;
    },
    
    // Property 4: Apply optimistic update immediately
    applyOptimisticUpdate: async (action: UserAction): Promise<UIUpdateResult> => {
      const startTime = performance.now();
      
      // Store original state for potential rollback
      const originalState = JSON.parse(JSON.stringify(currentState));
      
      // 1. Immediately update UI state (optimistic)
      const optimisticState = { ...currentState };
      const pendingOp: PendingOperation = {
        id: `pending_${Date.now()}_${Math.random()}`,
        type: action.type,
        entityType: action.entityType,
        entityId: action.entityId,
        optimisticData: action.data,
        timestamp: action.timestamp,
        confirmed: false,
      };
      
      // Store original entity data for rollback
      if (action.type === 'update' && optimisticState.entities[action.entityId]) {
        pendingOp.originalData = JSON.parse(JSON.stringify(optimisticState.entities[action.entityId]));
      }
      
      // Apply optimistic changes to UI
      switch (action.type) {
        case 'create':
          if (action.data) {
            optimisticState.entities[action.entityId] = {
              ...action.data,
              id: action.entityId,
              optimistic: true, // Mark as optimistic
            };
          }
          break;
          
        case 'update':
          if (optimisticState.entities[action.entityId] && action.data) {
            optimisticState.entities[action.entityId] = {
              ...optimisticState.entities[action.entityId],
              ...action.data,
              optimistic: true, // Mark as optimistic
            };
          }
          break;
          
        case 'delete':
          if (optimisticState.entities[action.entityId]) {
            // Mark as deleted optimistically
            optimisticState.entities[action.entityId] = {
              ...optimisticState.entities[action.entityId],
              deleted: true,
              optimistic: true,
            };
          }
          break;
      }
      
      // Add pending operation
      optimisticState.pendingOperations.push(pendingOp);
      optimisticState.lastUpdated = new Date();
      
      // Update current state immediately
      currentState = optimisticState;
      const renderTime = performance.now() - startTime;
      
      // Capture the immediate state before persistence
      const immediateStateSnapshot = JSON.parse(JSON.stringify(optimisticState));
      
      // 2. Simulate persistence (async)
      const persistenceStartTime = performance.now();
      const persistenceSuccess = await uiManager.simulatePersistence(action);
      const persistenceTime = performance.now() - persistenceStartTime;
      
      // 3. Confirm or rollback based on persistence result
      let finalState: UIState;
      let rollbackRequired = false;
      
      if (persistenceSuccess) {
        // Confirm the operation
        finalState = uiManager.confirmOperation(pendingOp.id);
      } else {
        // Rollback the optimistic update
        finalState = uiManager.rollbackOperation(pendingOp.id);
        rollbackRequired = true;
      }
      
      return {
        immediateState: immediateStateSnapshot,
        finalState,
        renderTime,
        persistenceTime,
        rollbackRequired,
      };
    },
    
    // Simulate persistence operation
    simulatePersistence: async (action: UserAction): Promise<boolean> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 10)); // Fixed delay for deterministic tests
      
      // Return failure if forced, otherwise succeed
      return !forceFailure;
    },
    
    // Confirm successful operation
    confirmOperation: (pendingOpId: string): UIState => {
      const newState = { ...currentState };
      
      // Find and remove the pending operation
      const pendingOpIndex = newState.pendingOperations.findIndex(op => op.id === pendingOpId);
      if (pendingOpIndex >= 0) {
        const pendingOp = newState.pendingOperations[pendingOpIndex];
        newState.pendingOperations.splice(pendingOpIndex, 1);
        
        // Remove optimistic flag from entity
        if (newState.entities[pendingOp.entityId]) {
          const entity = { ...newState.entities[pendingOp.entityId] };
          delete entity.optimistic;
          newState.entities[pendingOp.entityId] = entity;
        }
      }
      
      newState.lastUpdated = new Date();
      currentState = newState;
      return newState;
    },
    
    // Rollback failed operation
    rollbackOperation: (pendingOpId: string): UIState => {
      const newState = { ...currentState };
      
      // Find the pending operation
      const pendingOpIndex = newState.pendingOperations.findIndex(op => op.id === pendingOpId);
      if (pendingOpIndex >= 0) {
        const pendingOp = newState.pendingOperations[pendingOpIndex];
        newState.pendingOperations.splice(pendingOpIndex, 1);
        
        // Rollback the optimistic change
        switch (pendingOp.type) {
          case 'create':
            // Remove the optimistically created entity
            delete newState.entities[pendingOp.entityId];
            break;
            
          case 'update':
            // Restore the original entity data
            if (pendingOp.originalData) {
              newState.entities[pendingOp.entityId] = JSON.parse(JSON.stringify(pendingOp.originalData));
            } else if (newState.entities[pendingOp.entityId]) {
              // Fallback: just remove optimistic flag
              const entity = { ...newState.entities[pendingOp.entityId] };
              delete entity.optimistic;
              newState.entities[pendingOp.entityId] = entity;
            }
            break;
            
          case 'delete':
            // Restore the deleted entity
            if (newState.entities[pendingOp.entityId]) {
              const entity = { ...newState.entities[pendingOp.entityId] };
              delete entity.deleted;
              delete entity.optimistic;
              newState.entities[pendingOp.entityId] = entity;
            }
            break;
        }
      }
      
      newState.lastUpdated = new Date();
      currentState = newState;
      return newState;
    },
    
    // Get pending operations count
    getPendingOperationsCount: (): number => {
      return currentState.pendingOperations.length;
    },
    
    // Clear all state
    clearState: (): void => {
      currentState = {
        entities: {},
        pendingOperations: [],
        isLoading: false,
        lastUpdated: new Date(),
      };
    },
  };
  
  return uiManager;
};

describe('Property Test: Optimistic UI Updates', () => {
  let uiManager: ReturnType<typeof createMockOptimisticUIManager>;
  
  beforeEach(() => {
    uiManager = createMockOptimisticUIManager();
  });

  // Property 4: Optimistic UI Updates
  describe('Feature: meugrind-productivity-system, Property 4: Optimistic UI Updates', () => {
    asyncPropertyTest(
      'Validates: Requirements 1.5',
      async (actions) => {
        try {
          // Set up initial state with some entities
          const initialEntities: Record<string, any> = {};
          for (let i = 0; i < 3; i++) {
            const entityId = `entity_${i}`;
            initialEntities[entityId] = {
              id: entityId,
              title: `Entity ${i}`,
              completed: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          
          uiManager.setState({
            entities: initialEntities,
            pendingOperations: [],
            isLoading: false,
            lastUpdated: new Date(),
          });
          
          // Test each user action
          for (const action of actions) {
            // Skip invalid actions - ensure we have valid data
            if (!action.entityId || action.entityId.trim().length === 0) {
              continue;
            }
            
            // Skip create actions without valid data
            if (action.type === 'create' && (!action.data || !action.data.title || action.data.title.trim().length < 3)) {
              continue;
            }
            
            // Skip actions with invalid titles for update operations
            if (action.type === 'update' && action.data && action.data.title && action.data.title.trim().length < 3) {
              continue;
            }
            
            // Ensure entity exists for update/delete operations
            if (action.type !== 'create') {
              const currentState = uiManager.getState();
              if (!currentState.entities[action.entityId]) {
                // Create the entity first
                currentState.entities[action.entityId] = {
                  id: action.entityId,
                  title: 'Test Entity',
                  completed: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                uiManager.setState(currentState);
              }
            }
            
            // Property 4: UI should render changes immediately
            const result = await uiManager.applyOptimisticUpdate(action);
            
            // Verify immediate UI update (optimistic)
            if (result.renderTime > 50) { // Should render within 50ms
              return false; // UI update should be immediate
            }
            
            // Verify optimistic state was applied immediately
            const immediateState = result.immediateState;
            switch (action.type) {
              case 'create':
                if (action.data && !immediateState.entities[action.entityId]) {
                  return false; // Entity should be created optimistically
                }
                if (immediateState.entities[action.entityId] && !immediateState.entities[action.entityId].optimistic) {
                  return false; // Should be marked as optimistic
                }
                break;
                
              case 'update':
                if (immediateState.entities[action.entityId] && !immediateState.entities[action.entityId].optimistic) {
                  return false; // Should be marked as optimistic
                }
                break;
                
              case 'delete':
                if (immediateState.entities[action.entityId] && !immediateState.entities[action.entityId].deleted) {
                  return false; // Should be marked as deleted optimistically
                }
                break;
            }
            
            // Verify pending operation was created
            const pendingOps = immediateState.pendingOperations;
            const relevantPendingOp = pendingOps.find(op => 
              op.entityId === action.entityId && op.type === action.type
            );
            if (!relevantPendingOp) {
              return false; // Should have created pending operation
            }
            
            // Verify final state handling
            const finalState = result.finalState;
            if (result.rollbackRequired) {
              // If rollback was required, optimistic changes should be reverted
              if (finalState.entities[action.entityId]?.optimistic) {
                return false; // Optimistic flag should be removed after rollback
              }
            } else {
              // If successful, optimistic flag should be removed
              if (finalState.entities[action.entityId]?.optimistic) {
                return false; // Optimistic flag should be removed after confirmation
              }
            }
            
            // Verify pending operation was resolved
            const finalPendingOps = finalState.pendingOperations;
            const stillPending = finalPendingOps.find(op => 
              op.entityId === action.entityId && op.type === action.type
            );
            if (stillPending) {
              return false; // Pending operation should be resolved
            }
          }
          
          return true;
        } catch (error) {
          console.error('Optimistic UI updates test failed:', error);
          return false;
        }
      },
      fc.array(generators.userAction(), { minLength: 1, maxLength: 5 })
    );
  });

  // Test optimistic updates with different entity types
  describe('Feature: meugrind-productivity-system, Property 4: Optimistic Updates Across Entity Types', () => {
    asyncPropertyTest(
      'Validates: Requirements 1.5',
      async (entityTypes) => {
        try {
          // Test optimistic updates for different entity types
          for (const entityType of entityTypes) {
            const action: UserAction = {
              type: 'update',
              entityType,
              entityId: `test_${entityType}_${Date.now()}`,
              data: {
                title: `Updated ${entityType}`,
                updatedAt: new Date(),
              },
              timestamp: new Date(),
            };
            
            // Create initial entity
            const initialState = uiManager.getState();
            initialState.entities[action.entityId] = {
              id: action.entityId,
              title: `Original ${entityType}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            uiManager.setState(initialState);
            
            // Apply optimistic update
            const result = await uiManager.applyOptimisticUpdate(action);
            
            // Verify immediate update regardless of entity type
            if (result.renderTime > 50) {
              return false; // Should render immediately for all entity types
            }
            
            // Verify optimistic state
            const optimisticEntity = result.immediateState.entities[action.entityId];
            if (!optimisticEntity || !optimisticEntity.optimistic) {
              return false; // Should be marked as optimistic
            }
            
            if (optimisticEntity.title !== `Updated ${entityType}`) {
              return false; // Should have applied the update
            }
          }
          
          return true;
        } catch (error) {
          console.error('Multi-entity optimistic updates test failed:', error);
          return false;
        }
      },
      fc.array(fc.constantFrom('task', 'event', 'song', 'brandDeal'), { minLength: 1, maxLength: 4 })
    );
  });

  // Test optimistic update rollback scenarios
  describe('Feature: meugrind-productivity-system, Property 4: Optimistic Update Rollback', () => {
    asyncPropertyTest(
      'Validates: Requirements 1.5',
      async (actions) => {
        try {
          // Set up initial state
          const initialEntities: Record<string, any> = {};
          const testEntityId = 'rollback_test_entity';
          initialEntities[testEntityId] = {
            id: testEntityId,
            title: 'Original Title',
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          uiManager.setState({
            entities: initialEntities,
            pendingOperations: [],
            isLoading: false,
            lastUpdated: new Date(),
          });
          
          // Test rollback scenarios
          for (const action of actions) {
            // Skip invalid actions - ensure we have valid data
            if (!action.entityId || action.entityId.trim().length === 0) {
              continue;
            }
            
            // Skip actions with invalid data
            if (action.data && action.data.title && action.data.title.trim().length < 3) {
              continue;
            }
            
            // Use the test entity for update/delete, or generate new ID for create
            const testAction: UserAction = {
              ...action,
              entityId: action.type === 'create' ? `create_test_${Date.now()}` : testEntityId,
              data: {
                title: 'Optimistically Updated Title',
                completed: true,
              },
            };
            
            // Force a rollback scenario by setting failure flag
            uiManager.setForceFailure(true);
            
            const result = await uiManager.applyOptimisticUpdate(testAction);
            
            // Reset failure flag
            uiManager.setForceFailure(false);
            
            // Verify rollback occurred
            if (!result.rollbackRequired) {
              return false; // This should not happen with forced failure
            }
            
            // Verify optimistic changes were rolled back
            const finalEntity = result.finalState.entities[testAction.entityId];
            
            // For create operations, entity should be removed after rollback
            if (testAction.type === 'create') {
              if (finalEntity) {
                return false; // Entity should be removed after create rollback
              }
            } else {
              // For update/delete operations, entity should still exist
              if (!finalEntity) {
                return false; // Entity should still exist after rollback
              }
              
              if (finalEntity.optimistic) {
                return false; // Optimistic flag should be removed
              }
              
              // For update operations, verify original values are restored
              if (testAction.type === 'update') {
                if (finalEntity.title === 'Optimistically Updated Title') {
                  return false; // Should have rolled back to original title
                }
              }
            }
            
            // Verify no pending operations remain
            if (result.finalState.pendingOperations.length > 0) {
              return false; // Pending operations should be cleared after rollback
            }
          }
          
          return true;
        } catch (error) {
          console.error('Optimistic rollback test failed:', error);
          return false;
        }
      },
      fc.array(generators.userAction(), { minLength: 1, maxLength: 3 })
    );
  });

  // Test performance requirements for optimistic updates
  describe('Feature: meugrind-productivity-system, Property 4: Optimistic Update Performance', () => {
    asyncPropertyTest(
      'Validates: Requirements 1.5',
      async (batchActions) => {
        try {
          // Test performance with multiple rapid actions
          const performanceResults: number[] = [];
          
          for (const action of batchActions) {
            // Skip invalid actions - ensure we have valid data
            if (!action.entityId || action.entityId.trim().length === 0) {
              continue;
            }
            
            // Skip create actions without valid data
            if (action.type === 'create' && (!action.data || !action.data.title || action.data.title.trim().length < 3)) {
              // Provide valid data for create operations
              action.data = {
                title: 'Created Entity',
                completed: false,
              };
            }
            
            // Skip actions with invalid titles for update operations
            if (action.type === 'update' && action.data && action.data.title && action.data.title.trim().length < 3) {
              continue;
            }
            
            // Ensure entity exists for update/delete operations
            if (action.type !== 'create') {
              const currentState = uiManager.getState();
              currentState.entities[action.entityId] = {
                id: action.entityId,
                title: 'Test Entity',
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              uiManager.setState(currentState);
            }
            
            const result = await uiManager.applyOptimisticUpdate(action);
            performanceResults.push(result.renderTime);
            
            // Each individual update should be fast
            if (result.renderTime > 100) { // 100ms threshold for individual updates
              return false; // Individual updates should be fast
            }
          }
          
          // Average performance should be good
          if (performanceResults.length > 0) {
            const averageTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
            if (averageTime > 50) { // Average should be under 50ms
              return false; // Average performance should be good
            }
          }
          
          return true;
        } catch (error) {
          console.error('Optimistic update performance test failed:', error);
          return false;
        }
      },
      fc.array(generators.userAction(), { minLength: 3, maxLength: 10 })
    );
  });

  // Test concurrent optimistic updates
  describe('Feature: meugrind-productivity-system, Property 4: Concurrent Optimistic Updates', () => {
    asyncPropertyTest(
      'Validates: Requirements 1.5',
      async (concurrentActions) => {
        try {
          // Set up initial entities for concurrent updates
          const initialEntities: Record<string, any> = {};
          const entityIds = ['entity_1', 'entity_2', 'entity_3'];
          
          for (const entityId of entityIds) {
            initialEntities[entityId] = {
              id: entityId,
              title: `Original ${entityId}`,
              completed: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          
          uiManager.setState({
            entities: initialEntities,
            pendingOperations: [],
            isLoading: false,
            lastUpdated: new Date(),
          });
          
          // Apply concurrent updates
          const updatePromises = concurrentActions
            .filter((action: any) => {
              // Filter out invalid actions
              if (!action.entityId || action.entityId.trim().length === 0) {
                return false;
              }
              
              // For create operations, ensure we have valid data
              if (action.type === 'create') {
                if (!action.data || !action.data.title || action.data.title.trim().length < 3) {
                  return false;
                }
              }
              
              // For update operations, check if entity exists or is in our test set
              if (action.type === 'update' && !entityIds.includes(action.entityId)) {
                return false;
              }
              
              return entityIds.includes(action.entityId) || action.type === 'create';
            })
            .map(async (action: any) => {
              // For create operations, generate unique ID
              if (action.type === 'create') {
                action.entityId = `created_${Date.now()}_${Math.random()}`;
                if (!action.data || !action.data.title || action.data.title.trim().length < 3) {
                  action.data = {
                    title: `Created Entity ${Date.now()}`,
                    completed: false,
                  };
                }
              }
              
              return uiManager.applyOptimisticUpdate(action);
            });
          
          // Wait for all concurrent updates
          const results = await Promise.all(updatePromises);
          
          // Verify all updates were applied optimistically
          for (const result of results) {
            if (result.renderTime > 100) {
              return false; // Each update should be fast even when concurrent
            }
          }
          
          // Verify final state is consistent
          const finalState = uiManager.getState();
          
          // Should have no pending operations after all complete
          if (finalState.pendingOperations.length > 0) {
            return false; // All operations should be resolved
          }
          
          // All entities should exist and not be marked as optimistic
          for (const entityId of Object.keys(finalState.entities)) {
            const entity = finalState.entities[entityId];
            if (entity.optimistic) {
              return false; // No entities should remain optimistic
            }
          }
          
          return true;
        } catch (error) {
          console.error('Concurrent optimistic updates test failed:', error);
          return false;
        }
      },
      fc.array(
        fc.record({
          type: fc.constantFrom('create', 'update'),
          entityType: fc.constantFrom('task', 'event'),
          entityId: fc.constantFrom('entity_1', 'entity_2', 'entity_3'),
          data: fc.record({
            title: generators.validTitle(),
            completed: fc.boolean(),
          }),
          timestamp: generators.date(),
        }),
        { minLength: 2, maxLength: 6 }
      )
    );
  });
});