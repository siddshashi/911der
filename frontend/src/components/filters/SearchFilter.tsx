'use client';

import { useState, useEffect, memo } from 'react';
import { useDebounce } from '@/lib/debounce';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode?: boolean;
}

const SearchFilter = memo(function SearchFilter({
  searchQuery,
  onSearchChange,
  isDarkMode = false
}: SearchFilterProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debouncedQuery = useDebounce(localQuery, 300); // 300ms debounce for quick response

  // Update the filter when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  // Sync with external changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleClear = () => {
    setLocalQuery('');
  };

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${
        isDarkMode ? 'text-gray-200' : 'text-gray-700'
      }`}>
        Search Descriptions
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="e.g., fire grandma smoke"
          className={`block w-full pl-10 pr-10 py-2 text-sm border rounded-md transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-1`}
        />
        
        {localQuery && (
          <button
            onClick={handleClear}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity ${
              isDarkMode ? 'text-gray-400' : 'text-gray-400'
            }`}
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Search for keywords in call descriptions. Separate multiple terms with spaces.
      </p>
    </div>
  );
});

export default SearchFilter;