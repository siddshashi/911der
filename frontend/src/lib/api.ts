import { EmergencyCall, BackendCaller, SSEMessage } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Fetch all emergency calls from the FastAPI backend
 */
export async function fetchEmergencyCalls(): Promise<EmergencyCall[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/callers/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawData: BackendCaller[] = await response.json();
    
    // Transform backend data to frontend format
    return rawData.map(transformCallerToEmergencyCall);
  } catch (error) {
    console.error('Failed to fetch emergency calls:', error);
    throw new Error('Failed to fetch emergency calls. Please check your connection.');
  }
}

/**
 * Transform backend caller format to frontend emergency call format
 */
export function transformCallerToEmergencyCall(caller: BackendCaller): EmergencyCall {
  return {
    id: caller.id.toString(),
    location: {
      latitude: caller.latitude,
      longitude: caller.longitude,
    },
    urgency: mapSeverityToUrgency(caller.severity),
    timestamp: caller.created_at || new Date().toISOString(),
    description: caller.metadata || 'No description available',
  };
}

/**
 * Map severity numbers to urgency levels
 */
export function mapSeverityToUrgency(severity: number): 'low' | 'medium' | 'high' | 'critical' {
  switch (severity) {
    case 1: return 'low';
    case 2: return 'medium';
    case 3: return 'high';
    case 4: return 'critical';
    default: return 'medium';
  }
}

/**
 * Subscribe to real-time emergency call updates using Server-Sent Events
 */
export function subscribeToCallUpdates(
  onUpdate: (calls: EmergencyCall[]) => void,
  onError?: (error: string) => void,
  onConnectionChange?: (connected: boolean) => void
) {
  const eventSource = new EventSource(`${API_BASE_URL}/callers/stream`);
  
  eventSource.onopen = () => {
    console.log('SSE connection opened');
    onConnectionChange?.(true);
  };
  
  eventSource.onmessage = (event) => {
    try {
      const message: SSEMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'initial':
          if (message.callers) {
            const transformedCalls = message.callers.map(transformCallerToEmergencyCall);
            onUpdate(transformedCalls);
          }
          break;
          
        case 'new_callers':
          if (message.new_callers) {
            // For new callers, we need to fetch all calls again to maintain proper order
            // In a real implementation, you might want to merge these more intelligently
            fetchEmergencyCalls().then(onUpdate).catch(console.error);
          }
          break;
          
        case 'heartbeat':
          // Connection is alive, no action needed
          break;
          
        case 'error':
          console.error('SSE error:', message.message);
          onError?.(message.message || 'Unknown SSE error');
          break;
      }
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
      onError?.('Failed to parse server message');
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    onConnectionChange?.(false);
    onError?.('Connection to server lost');
  };
  
  return () => {
    eventSource.close();
    onConnectionChange?.(false);
  };
}