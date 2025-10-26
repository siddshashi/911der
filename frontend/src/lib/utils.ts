import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { EmergencyCall, FilterState } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate if an emergency call object has all required fields
 */
export function isValidEmergencyCall(call: any): call is EmergencyCall {
  return (
    call &&
    typeof call.id === 'string' &&
    call.location &&
    typeof call.location.latitude === 'number' &&
    typeof call.location.longitude === 'number' &&
    typeof call.urgency === 'string' &&
    ['low', 'medium', 'high', 'critical'].includes(call.urgency) &&
    typeof call.timestamp === 'string' &&
    typeof call.description === 'string'
  );
}

/**
 * Check if a call matches the time filter criteria
 */
export function matchesTimeFilter(call: EmergencyCall, timeRange: FilterState['timeRange']): boolean {
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

/**
 * Check if a call matches the urgency filter criteria
 */
export function matchesUrgencyFilter(call: EmergencyCall, urgencyLevels: string[]): boolean {
  if (urgencyLevels.length === 0) {
    return true; // No urgency filter applied
  }
  
  return urgencyLevels.includes(call.urgency);
}

/**
 * Apply all filters to a list of emergency calls
 */
export function applyFilters(calls: EmergencyCall[], filters: FilterState): EmergencyCall[] {
  return calls.filter(call => 
    matchesTimeFilter(call, filters.timeRange) && 
    matchesUrgencyFilter(call, filters.urgencyLevels)
  );
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}