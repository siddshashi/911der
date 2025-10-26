'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { EmergencyCall, FilterState, MapState } from '@/lib/types';
import { useRealTimeEmergencyCalls } from '@/hooks/useRealTimeEmergencyCalls';

// Action types for the reducer
type EmergencyCallAction =
  | { type: 'SET_CALLS'; payload: EmergencyCall[] }
  | { type: 'SELECT_CALL'; payload: EmergencyCall | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<FilterState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'RESET_FILTERS' };

// Context value interface
interface EmergencyCallContextValue {
  // State
  calls: EmergencyCall[];
  filteredCalls: EmergencyCall[];
  selectedCall: EmergencyCall | null;
  filters: FilterState;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  
  // Actions
  selectCall: (call: EmergencyCall | null) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  clearSelection: () => void;
  resetFilters: () => void;
  reconnect: () => void;
}

// Initial state
const initialState: MapState = {
  calls: [],
  filteredCalls: [],
  selectedCall: null,
  filters: {
    timeRange: {
      start: null,
      end: null,
    },
    urgencyLevels: ['low', 'medium', 'high', 'critical'], // Show all by default
    searchQuery: '',
  },
  loading: true,
};

// Reducer function
function emergencyCallReducer(state: MapState, action: EmergencyCallAction): MapState {
  switch (action.type) {
    case 'SET_CALLS':
      return {
        ...state,
        calls: action.payload,
        loading: false,
      };
      
    case 'SELECT_CALL':
      return {
        ...state,
        selectedCall: action.payload,
      };
      
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
      
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedCall: null,
      };
      
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
      };
      
    default:
      return state;
  }
}

// Helper functions for filtering
function matchesTimeFilter(call: EmergencyCall, timeRange: FilterState['timeRange']): boolean {
  if (!timeRange.start && !timeRange.end) {
    return true; // No time filter applied
  }
  
  const callTime = new Date(call.timestamp);
  
  if (timeRange.start && callTime < timeRange.start) {
    return false;
  }
  
  if (timeRange.end && callTime > timeRange.end) {
    return false;
  }
  
  return true;
}

function matchesUrgencyFilter(call: EmergencyCall, urgencyLevels: string[]): boolean {
  return urgencyLevels.includes(call.urgency);
}

function matchesSearchFilter(call: EmergencyCall, searchQuery: string): boolean {
  if (!searchQuery.trim()) {
    return true; // No search filter applied
  }
  
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
  const description = call.description.toLowerCase();
  
  // Check if any search term appears in the description
  return searchTerms.some(term => description.includes(term));
}

// Create the context
const EmergencyCallContext = createContext<EmergencyCallContextValue | undefined>(undefined);

// Provider component
interface EmergencyCallProviderProps {
  children: React.ReactNode;
}

export function EmergencyCallProvider({ children }: EmergencyCallProviderProps) {
  const [state, dispatch] = useReducer(emergencyCallReducer, initialState);
  
  // Use the real-time data hook
  const {
    calls: realTimeCalls,
    loading: realTimeLoading,
    error,
    isConnected,
    lastUpdate,
    reconnect,
  } = useRealTimeEmergencyCalls();

  // Update state when real-time data changes
  useEffect(() => {
    dispatch({ type: 'SET_CALLS', payload: realTimeCalls });
  }, [realTimeCalls]);

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: realTimeLoading });
  }, [realTimeLoading]);

  // Calculate filtered calls based on current filters
  const filteredCalls = useMemo(() => {
    return state.calls.filter(call => {
      return matchesTimeFilter(call, state.filters.timeRange) &&
             matchesUrgencyFilter(call, state.filters.urgencyLevels) &&
             matchesSearchFilter(call, state.filters.searchQuery);
    });
  }, [state.calls, state.filters]);

  // Action creators
  const selectCall = (call: EmergencyCall | null) => {
    dispatch({ type: 'SELECT_CALL', payload: call });
  };

  const updateFilters = (filters: Partial<FilterState>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  };

  const clearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };

  // Context value
  const contextValue: EmergencyCallContextValue = {
    // State
    calls: state.calls,
    filteredCalls,
    selectedCall: state.selectedCall,
    filters: state.filters,
    loading: state.loading,
    error,
    isConnected,
    lastUpdate,
    
    // Actions
    selectCall,
    updateFilters,
    clearSelection,
    resetFilters,
    reconnect,
  };

  return (
    <EmergencyCallContext.Provider value={contextValue}>
      {children}
    </EmergencyCallContext.Provider>
  );
}

// Custom hook to use the context
export function useEmergencyCallContext(): EmergencyCallContextValue {
  const context = useContext(EmergencyCallContext);
  
  if (context === undefined) {
    throw new Error('useEmergencyCallContext must be used within an EmergencyCallProvider');
  }
  
  return context;
}

// Export the context for advanced use cases
export { EmergencyCallContext };