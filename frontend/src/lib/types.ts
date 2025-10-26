export interface EmergencyCall {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string; // ISO 8601 format
  description: string;
}

export interface FilterState {
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  urgencyLevels: string[];
  searchQuery: string;
}

export interface MapState {
  calls: EmergencyCall[];
  filteredCalls: EmergencyCall[];
  selectedCall: EmergencyCall | null;
  filters: FilterState;
  loading: boolean;
}

// Backend data structure from Supabase
export interface BackendCaller {
  id: number;
  latitude: number;
  longitude: number;
  severity: number;
  metadata: string;
  created_at: string;
}

// SSE message types from backend
export interface SSEMessage {
  type: 'initial' | 'new_callers' | 'heartbeat' | 'error';
  callers?: BackendCaller[];
  new_callers?: BackendCaller[];
  count?: number;
  last_id?: number;
  timestamp: string;
  message?: string; // for error messages
}

export const URGENCY_COLORS = {
  low: '#10B981',      // Green
  medium: '#F59E0B',   // Amber
  high: '#EF4444',     // Red
  critical: '#7C2D12'  // Dark red
} as const;