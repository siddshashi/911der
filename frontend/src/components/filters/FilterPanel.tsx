'use client';

import { useState, memo } from 'react';
import TimeFilter from './TimeFilter';
import UrgencyFilter from './UrgencyFilter';
import SearchFilter from './SearchFilter';

interface FilterPanelProps {
  // Time filter props
  startDate: Date | null;
  endDate: Date | null;
  onTimeRangeChange: (start: Date | null, end: Date | null) => void;
  
  // Urgency filter props
  selectedUrgencies: string[];
  onUrgencyChange: (urgencies: string[]) => void;
  
  // Search filter props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // Panel props
  hasActiveFilters: boolean;
  filterSummary: string;
  onClearAll: () => void;
  className?: string;
  onVisibilityChange?: (isHidden: boolean) => void;
  isDarkMode?: boolean;
}

const FilterPanel = memo(function FilterPanel({
  startDate,
  endDate,
  onTimeRangeChange,
  selectedUrgencies,
  onUrgencyChange,
  searchQuery,
  onSearchChange,
  hasActiveFilters,
  filterSummary,
  onClearAll,
  className = '',
  onVisibilityChange,
  isDarkMode = false
}: FilterPanelProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Filter Panel */}
      <div className={`hidden lg:block transition-all duration-300 ease-in-out h-full ${
        isHidden ? 'w-0 overflow-hidden opacity-0' : 'w-80 opacity-100'
      } ${
        isDarkMode 
          ? 'bg-gray-800 border-r border-gray-700' 
          : 'bg-gray-50 border-r border-gray-200'
      } ${className}`}>
        {/* Header */}
        <div className={`p-4 border-b ${
          isDarkMode 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Filters</h2>
              {hasActiveFilters && (
                <p className={`text-xs mt-1 truncate font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {filterSummary}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Search Filter */}
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            isDarkMode={isDarkMode}
          />

          {/* Time Filter */}
          <TimeFilter
            startDate={startDate}
            endDate={endDate}
            onTimeRangeChange={onTimeRangeChange}
            isDarkMode={isDarkMode}
          />

          {/* Urgency Filter */}
          <UrgencyFilter
            selectedUrgencies={selectedUrgencies}
            onUrgencyChange={onUrgencyChange}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open filters"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Modal */}
          <div className={`absolute bottom-0 left-0 right-0 rounded-t-xl max-h-[80vh] overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-gray-700 bg-gray-800' 
                : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {hasActiveFilters && (
                    <p className="text-xs text-gray-700 mt-1 font-medium">
                      {filterSummary}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={onClearAll}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium px-2 py-1"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close filters"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Search Filter */}
              <SearchFilter
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                isDarkMode={isDarkMode}
              />

              {/* Time Filter */}
              <TimeFilter
                startDate={startDate}
                endDate={endDate}
                onTimeRangeChange={onTimeRangeChange}
                isDarkMode={isDarkMode}
              />

              {/* Urgency Filter */}
              <UrgencyFilter
                selectedUrgencies={selectedUrgencies}
                onUrgencyChange={onUrgencyChange}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Mobile Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Toggle Button - Fixed position relative to viewport */}
      <button
        onClick={() => {
          const newHidden = !isHidden;
          setIsHidden(newHidden);
          onVisibilityChange?.(newHidden);
        }}
        className={`hidden lg:block fixed top-1/2 -translate-y-1/2 z-50 border shadow-lg p-2 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
            : 'bg-white border-gray-300 hover:bg-gray-50'
        } ${
          isHidden 
            ? 'left-0 rounded-r-lg' 
            : 'left-80 rounded-l-lg'
        }`}
        style={{
          marginTop: '32px' // Account for header height
        }}
        aria-label={isHidden ? 'Show filters' : 'Hide filters'}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isHidden ? 'rotate-0' : 'rotate-180'
          } ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </>
  );
});

export default FilterPanel;