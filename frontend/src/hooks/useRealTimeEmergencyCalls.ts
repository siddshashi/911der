import { useState, useEffect, useCallback, useRef } from 'react';
import { EmergencyCall } from '@/lib/types';
import { fetchEmergencyCalls, subscribeToCallUpdates } from '@/lib/api';

interface UseRealTimeEmergencyCallsReturn {
  calls: EmergencyCall[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: Date | null;
  reconnect: () => void;
}

/**
 * Custom hook for managing real-time emergency calls with SSE integration
 * Includes fallback polling mechanism for connection failures
 */
export function useRealTimeEmergencyCalls(): UseRealTimeEmergencyCallsReturn {
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Refs to manage cleanup and prevent memory leaks
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle successful data updates
  const handleDataUpdate = useCallback((newCalls: EmergencyCall[]) => {
    setCalls(newCalls);
    setLastUpdate(new Date());
    setError(null);
    setLoading(false);
  }, []);

  // Handle connection errors
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsConnected(false);
    
    // Start fallback polling if not already running
    if (!fallbackIntervalRef.current) {
      console.log('Starting fallback polling due to SSE error');
      fallbackIntervalRef.current = setInterval(async () => {
        try {
          const fallbackCalls = await fetchEmergencyCalls();
          handleDataUpdate(fallbackCalls);
          console.log('Fallback polling successful');
        } catch (fallbackError) {
          console.error('Fallback polling failed:', fallbackError);
          setError('Connection lost. Retrying...');
        }
      }, 10000); // Poll every 10 seconds during fallback
    }
  }, [handleDataUpdate]);

  // Handle connection state changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    
    if (connected) {
      // Connection restored, stop fallback polling
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
        console.log('SSE connection restored, stopping fallback polling');
      }
      setError(null);
    }
  }, []);

  // Initialize SSE connection
  const initializeConnection = useCallback(() => {
    // Clean up existing connection
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log('Initializing SSE connection...');
    
    // Start with initial data fetch
    fetchEmergencyCalls()
      .then(handleDataUpdate)
      .catch((fetchError) => {
        console.error('Initial data fetch failed:', fetchError);
        setError('Failed to load initial data');
        setLoading(false);
      });

    // Subscribe to real-time updates
    unsubscribeRef.current = subscribeToCallUpdates(
      handleDataUpdate,
      handleError,
      handleConnectionChange
    );
  }, [handleDataUpdate, handleError, handleConnectionChange]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('Manual reconnect triggered');
    setLoading(true);
    setError(null);
    
    // Stop fallback polling during reconnect attempt
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    
    // Delay reconnection slightly to avoid rapid reconnect attempts
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeConnection();
    }, 1000);
  }, [initializeConnection]);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initializeConnection]);

  // Auto-reconnect on connection loss (with exponential backoff)
  useEffect(() => {
    if (!isConnected && !loading && !fallbackIntervalRef.current) {
      console.log('Connection lost, attempting to reconnect in 5 seconds...');
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnect();
      }, 5000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isConnected, loading, reconnect]);

  return {
    calls,
    loading,
    error,
    isConnected,
    lastUpdate,
    reconnect,
  };
}