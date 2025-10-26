'use client';

import { useState, useCallback, useMemo } from 'react';
import { EmergencyCall, FilterState } from '@/lib/types';

export function useMapFilters(calls: EmergencyCall[]) {
  const [filters, setFilters] = useState<FilterState>({
    timeRange: {
      start: null,
      end: null,
    },
    urgencyLevels: ['low', 'medium', 'high', 'critical'], // Show all by default
    searchQuery: '',
  });

  // Update time range filter
  const updateTimeRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({
      ...prev,
      timeRange: { start, end }
    }));
  }, []);

  // Update urgency filter
  const updateUrgencyLevels = useCallback((urgencyLevels: string[]) => {
    setFilters(prev => ({
      ...prev,
      urgencyLevels
    }));
  }, []);

  // Update search query
  const updateSearchQuery = useCallback((searchQuery: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery
    }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      timeRange: {
        start: null,
        end: null,
      },
      urgencyLevels: ['low', 'medium', 'high', 'critical'],
      searchQuery: '',
    });
  }, []);

  // Filter calls based on current filter state
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Time range filter
      if (filters.timeRange.start || filters.timeRange.end) {
        const callTime = new Date(call.timestamp);
        
        if (filters.timeRange.start && callTime < filters.timeRange.start) {
          return false;
        }
        
        if (filters.timeRange.end && callTime > filters.timeRange.end) {
          return false;
        }
      }

      // Urgency filter
      if (filters.urgencyLevels.length > 0 && !filters.urgencyLevels.includes(call.urgency)) {
        return false;
      }

      // Search filter - check if any search terms appear in description
      if (filters.searchQuery.trim()) {
        const searchTerms = filters.searchQuery.toLowerCase().trim().split(/\s+/);
        const description = call.description.toLowerCase();
        
        // Check if any search term appears in the description
        const hasMatch = searchTerms.some(term => description.includes(term));
        if (!hasMatch) {
          return false;
        }
      }

      return true;
    });
  }, [calls, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const hasTimeFilter = filters.timeRange.start !== null || filters.timeRange.end !== null;
    const hasUrgencyFilter = filters.urgencyLevels.length !== 4; // Not all urgency levels selected
    const hasSearchFilter = filters.searchQuery.trim().length > 0;
    return hasTimeFilter || hasUrgencyFilter || hasSearchFilter;
  }, [filters]);

  // Get filter summary for display
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    
    if (filters.timeRange.start || filters.timeRange.end) {
      if (filters.timeRange.start && filters.timeRange.end) {
        parts.push(`Time: ${filters.timeRange.start.toLocaleDateString()} - ${filters.timeRange.end.toLocaleDateString()}`);
      } else if (filters.timeRange.start) {
        parts.push(`Time: From ${filters.timeRange.start.toLocaleDateString()}`);
      } else if (filters.timeRange.end) {
        parts.push(`Time: Until ${filters.timeRange.end.toLocaleDateString()}`);
      }
    }
    
    if (filters.urgencyLevels.length !== 4) {
      if (filters.urgencyLevels.length === 0) {
        parts.push('Urgency: None selected');
      } else if (filters.urgencyLevels.length === 1) {
        parts.push(`Urgency: ${filters.urgencyLevels[0]}`);
      } else {
        parts.push(`Urgency: ${filters.urgencyLevels.length} levels`);
      }
    }
    
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim();
      const displayQuery = query.length > 20 ? `${query.substring(0, 20)}...` : query;
      parts.push(`Search: "${displayQuery}"`);
    }
    
    return parts.join(', ');
  }, [filters]);

  return {
    filters,
    filteredCalls,
    hasActiveFilters,
    filterSummary,
    updateTimeRange,
    updateUrgencyLevels,
    updateSearchQuery,
    clearAllFilters,
  };
}