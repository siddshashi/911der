'use client';

import { useState } from 'react';
import { EmergencyCall } from '@/lib/types';
import { EmergencyCallProvider, useEmergencyCallContext } from '@/context/EmergencyCallContext';
import MapWrapper from '@/components/map/MapWrapper';
import CallDetailsPanel from '@/components/details/CallDetailsPanel';
import { FilterPanel } from '@/components/filters';
import ClientOnly from '@/components/ClientOnly';

// Main component that uses the context
function EmergencyMapApp() {
  const [mapResizeTrigger, setMapResizeTrigger] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const {
    calls,
    filteredCalls,
    selectedCall,
    filters,
    loading,
    error,
    isConnected,
    lastUpdate,
    selectCall,
    updateFilters,
    clearSelection,
    resetFilters,
    reconnect,
  } = useEmergencyCallContext();

  // Calculate filter summary
  const hasActiveFilters = 
    filters.timeRange.start !== null || 
    filters.timeRange.end !== null || 
    filters.urgencyLevels.length !== 4 || // Not all urgency levels selected
    filters.searchQuery.trim().length > 0; // Has search query

  const filterSummary = (() => {
    const parts = [];
    if (filters.timeRange.start || filters.timeRange.end) {
      parts.push('time range');
    }
    if (filters.urgencyLevels.length !== 4) {
      parts.push(`${filters.urgencyLevels.length} urgency levels`);
    }
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim();
      const displayQuery = query.length > 15 ? `${query.substring(0, 15)}...` : query;
      parts.push(`search: "${displayQuery}"`);
    }
    return parts.join(', ');
  })();

  const handleCallSelect = (call: EmergencyCall | null) => {
    selectCall(call);
  };

  const handleDetailsClose = () => {
    clearSelection();
  };

  const handleTimeRangeChange = (start: Date | null, end: Date | null) => {
    updateFilters({
      timeRange: { start, end }
    });
  };

  const handleUrgencyChange = (urgencyLevels: string[]) => {
    updateFilters({ urgencyLevels });
  };

  const handleSearchChange = (searchQuery: string) => {
    updateFilters({ searchQuery });
  };

  const handleClearAllFilters = () => {
    resetFilters();
  };

  const handleFilterVisibilityChange = (isHidden: boolean) => {
    // Trigger map resize after a short delay to allow CSS transition to complete
    setTimeout(() => {
      setMapResizeTrigger(prev => prev + 1);
    }, 350); // Slightly longer than the 300ms CSS transition
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header - Responsive */}
      <header className={`shadow-sm border-b px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className={`text-xl lg:text-2xl font-bold truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Emergency Call Map</h1>
            <p className={`text-xs lg:text-sm truncate ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {loading ? 'Loading calls...' : 
               hasActiveFilters ? 
               `${filteredCalls.length} of ${calls.length} calls shown (filtered)` :
               `${calls.length} emergency calls displayed`}
              {lastUpdate && (
                <span className={`hidden lg:inline ml-2 text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  • Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          
          {/* Status indicators - Responsive */}
          <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
            {selectedCall && (
              <div className="bg-blue-100 text-blue-800 px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
                <span className="hidden lg:inline">Call #{selectedCall.id} selected</span>
                <span className="lg:hidden">#{selectedCall.id}</span>
              </div>
            )}
            
            <div className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium ${
              loading ? 'bg-yellow-100 text-yellow-800' :
              error ? 'bg-red-100 text-red-800' :
              isConnected ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {loading ? 'Loading...' : 
               error ? 'Error' : 
               isConnected ? 'Live' : 'Reconnecting...'}
            </div>
            
            {error && (
              <button
                onClick={reconnect}
                className="px-2 lg:px-3 py-1 bg-blue-600 text-white rounded-full text-xs lg:text-sm font-medium hover:bg-blue-700 transition-colors touch-manipulation"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Filter Panel - responsive positioning */}
        <FilterPanel
          startDate={filters.timeRange.start}
          endDate={filters.timeRange.end}
          onTimeRangeChange={handleTimeRangeChange}
          selectedUrgencies={filters.urgencyLevels}
          onUrgencyChange={handleUrgencyChange}
          searchQuery={filters.searchQuery}
          onSearchChange={handleSearchChange}
          hasActiveFilters={hasActiveFilters}
          filterSummary={filterSummary}
          onClearAll={handleClearAllFilters}
          onVisibilityChange={handleFilterVisibilityChange}
          isDarkMode={isDarkMode}
          className="flex-shrink-0 z-10"
        />

        {/* Map Area */}
        <div className={`flex-1 relative overflow-hidden z-0 min-h-0 ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
          {error ? (
            <div className="h-full flex items-center justify-center bg-red-50">
              <div className="text-center">
                <div className="text-red-600 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-red-800 mb-2">Failed to Load Emergency Calls</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={reconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : (
            <ClientOnly fallback={
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading emergency call map...</p>
                </div>
              </div>
            }>
              <MapWrapper
                calls={filteredCalls}
                onCallSelect={handleCallSelect}
                selectedCall={selectedCall}
                forceResize={mapResizeTrigger}
                isDarkMode={isDarkMode}
                onDarkModeChange={setIsDarkMode}
                className="h-full w-full"
              />
            </ClientOnly>
          )}

          {/* Call Details Panel */}
          <CallDetailsPanel
            call={selectedCall}
            onClose={handleDetailsClose}
          />
        </div>
      </div>
    </div>
  );
}

// Main export with provider wrapper
export default function Home() {
  return (
    <EmergencyCallProvider>
      <EmergencyMapApp />
    </EmergencyCallProvider>
  );
}
