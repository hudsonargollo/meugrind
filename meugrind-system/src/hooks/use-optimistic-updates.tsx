'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface OptimisticAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  optimisticData?: any;
  originalData?: any;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

interface OptimisticState {
  actions: OptimisticAction[];
  isProcessing: boolean;
}

type OptimisticActionType = 
  | { type: 'ADD_ACTION'; action: OptimisticAction }
  | { type: 'UPDATE_ACTION_STATUS'; id: string; status: 'success' | 'error'; errorMessage?: string }
  | { type: 'REMOVE_ACTION'; id: string }
  | { type: 'CLEAR_COMPLETED' };

const initialState: OptimisticState = {
  actions: [],
  isProcessing: false,
};

function optimisticReducer(state: OptimisticState, action: OptimisticActionType): OptimisticState {
  switch (action.type) {
    case 'ADD_ACTION':
      return {
        ...state,
        actions: [...state.actions, action.action],
        isProcessing: true,
      };
    
    case 'UPDATE_ACTION_STATUS':
      return {
        ...state,
        actions: state.actions.map(a => 
          a.id === action.id 
            ? { ...a, status: action.status, errorMessage: action.errorMessage }
            : a
        ),
        isProcessing: state.actions.some(a => a.id !== action.id && a.status === 'pending'),
      };
    
    case 'REMOVE_ACTION':
      const filteredActions = state.actions.filter(a => a.id !== action.id);
      return {
        ...state,
        actions: filteredActions,
        isProcessing: filteredActions.some(a => a.status === 'pending'),
      };
    
    case 'CLEAR_COMPLETED':
      const pendingActions = state.actions.filter(a => a.status === 'pending');
      return {
        ...state,
        actions: pendingActions,
        isProcessing: pendingActions.length > 0,
      };
    
    default:
      return state;
  }
}

interface OptimisticContextType {
  state: OptimisticState;
  addOptimisticAction: (action: Omit<OptimisticAction, 'id' | 'timestamp' | 'status'>) => string;
  updateActionStatus: (id: string, status: 'success' | 'error', errorMessage?: string) => void;
  removeAction: (id: string) => void;
  clearCompleted: () => void;
  getPendingActions: () => OptimisticAction[];
  getFailedActions: () => OptimisticAction[];
  isActionPending: (entityType: string, entityId: string) => boolean;
}

const OptimisticContext = createContext<OptimisticContextType | undefined>(undefined);

interface OptimisticProviderProps {
  children: ReactNode;
}

export function OptimisticProvider({ children }: OptimisticProviderProps) {
  const [state, dispatch] = useReducer(optimisticReducer, initialState);

  const addOptimisticAction = (actionData: Omit<OptimisticAction, 'id' | 'timestamp' | 'status'>): string => {
    const id = `${actionData.entityType}_${actionData.entityId}_${Date.now()}_${Math.random()}`;
    const action: OptimisticAction = {
      ...actionData,
      id,
      timestamp: new Date(),
      status: 'pending',
    };
    
    dispatch({ type: 'ADD_ACTION', action });
    return id;
  };

  const updateActionStatus = (id: string, status: 'success' | 'error', errorMessage?: string) => {
    dispatch({ type: 'UPDATE_ACTION_STATUS', id, status, errorMessage });
    
    // Auto-remove successful actions after a delay
    if (status === 'success') {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_ACTION', id });
      }, 2000);
    }
  };

  const removeAction = (id: string) => {
    dispatch({ type: 'REMOVE_ACTION', id });
  };

  const clearCompleted = () => {
    dispatch({ type: 'CLEAR_COMPLETED' });
  };

  const getPendingActions = (): OptimisticAction[] => {
    return state.actions.filter(action => action.status === 'pending');
  };

  const getFailedActions = (): OptimisticAction[] => {
    return state.actions.filter(action => action.status === 'error');
  };

  const isActionPending = (entityType: string, entityId: string): boolean => {
    return state.actions.some(action => 
      action.entityType === entityType && 
      action.entityId === entityId && 
      action.status === 'pending'
    );
  };

  const value: OptimisticContextType = {
    state,
    addOptimisticAction,
    updateActionStatus,
    removeAction,
    clearCompleted,
    getPendingActions,
    getFailedActions,
    isActionPending,
  };

  return (
    <OptimisticContext.Provider value={value}>
      {children}
    </OptimisticContext.Provider>
  );
}

export function useOptimisticUpdates(): OptimisticContextType {
  const context = useContext(OptimisticContext);
  if (context === undefined) {
    throw new Error('useOptimisticUpdates must be used within an OptimisticProvider');
  }
  return context;
}