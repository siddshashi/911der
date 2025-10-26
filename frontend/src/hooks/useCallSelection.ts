'use client';

import { useState, useCallback } from 'react';
import { EmergencyCall } from '@/lib/types';

export interface CallSelectionState {
  selectedCall: EmergencyCall | null;
  isDetailsOpen: boolean;
}

export interface CallSelectionActions {
  selectCall: (call: EmergencyCall) => void;
  clearSelection: () => void;
  closeDetails: () => void;
  openDetails: (call: EmergencyCall) => void;
}

export interface UseCallSelectionReturn extends CallSelectionState, CallSelectionActions {}

/**
 * Custom hook for managing call selection state and details panel visibility
 */
export function useCallSelection(): UseCallSelectionReturn {
  const [selectedCall, setSelectedCall] = useState<EmergencyCall | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const selectCall = useCallback((call: EmergencyCall) => {
    console.log('Selecting call:', call.id);
    setSelectedCall(call);
    setIsDetailsOpen(true);
  }, []);

  const clearSelection = useCallback(() => {
    console.log('Clearing call selection');
    setSelectedCall(null);
    setIsDetailsOpen(false);
  }, []);

  const closeDetails = useCallback(() => {
    console.log('Closing details panel');
    setIsDetailsOpen(false);
    // Keep selectedCall for marker highlighting, just close the panel
  }, []);

  const openDetails = useCallback((call: EmergencyCall) => {
    console.log('Opening details for call:', call.id);
    setSelectedCall(call);
    setIsDetailsOpen(true);
  }, []);

  return {
    selectedCall,
    isDetailsOpen,
    selectCall,
    clearSelection,
    closeDetails,
    openDetails,
  };
}