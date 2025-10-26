'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/lib/debounce';

interface TimeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onTimeRangeChange: (start: Date | null, end: Date | null) => void;
  className?: string;
  isDarkMode?: boolean;
}

// Format date for datetime-local input
const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function TimeFilter({
  startDate,
  endDate,
  onTimeRangeChange,
  className = '',
  isDarkMode = false
}: TimeFilterProps) {
  const [startInput, setStartInput] = useState(
    startDate ? formatDateTimeLocal(startDate) : ''
  );
  const [endInput, setEndInput] = useState(
    endDate ? formatDateTimeLocal(endDate) : ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate time range
  const validateTimeRange = useCallback((start: Date | null, end: Date | null): string | null => {
    if (!start && !end) return null;
    
    if (start && end && start > end) {
      return 'Start time must be before end time';
    }
    
    if (start && start > new Date()) {
      return 'Start time cannot be in the future';
    }
    
    if (end && end > new Date()) {
      return 'End time cannot be in the future';
    }
    
    return null;
  }, []);

  // Debounce the filter changes to improve performance
  const debouncedStartInput = useDebounce(startInput, 300);
  const debouncedEndInput = useDebounce(endInput, 300);

  // Apply debounced changes
  useEffect(() => {
    const newStart = debouncedStartInput ? new Date(debouncedStartInput) : null;
    const newEnd = debouncedEndInput ? new Date(debouncedEndInput) : null;
    const error = validateTimeRange(newStart, newEnd);
    setValidationError(error);
    
    if (!error) {
      onTimeRangeChange(newStart, newEnd);
    }
  }, [debouncedStartInput, debouncedEndInput, onTimeRangeChange, validateTimeRange]);

  // Handle start date change (immediate UI update, debounced filter application)
  const handleStartChange = useCallback((value: string) => {
    setStartInput(value);
  }, []);

  // Handle end date change (immediate UI update, debounced filter application)
  const handleEndChange = useCallback((value: string) => {
    setEndInput(value);
  }, []);

  // Clear all filters
  const handleClear = useCallback(() => {
    setStartInput('');
    setEndInput('');
    setValidationError(null);
    onTimeRangeChange(null, null);
  }, [onTimeRangeChange]);

  // Set quick time ranges (now accepts minutes)
  const setQuickRange = useCallback((minutes: number) => {
    const now = new Date();
    const start = new Date(now.getTime() - (minutes * 60 * 1000));
    
    const startFormatted = formatDateTimeLocal(start);
    const endFormatted = formatDateTimeLocal(now);
    
    setStartInput(startFormatted);
    setEndInput(endFormatted);
    setValidationError(null);
    onTimeRangeChange(start, now);
  }, [onTimeRangeChange]);

  return (
    <div className={`rounded-lg shadow-sm border p-4 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Time Range</h3>
        <button
          onClick={handleClear}
          className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium"
          disabled={!startInput && !endInput}
        >
          Clear
        </button>
      </div>

      {/* Quick range buttons */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        <button
          onClick={() => setQuickRange(5)}
          className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${
            isDarkMode 
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          5 min
        </button>
        <button
          onClick={() => setQuickRange(10)}
          className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${
            isDarkMode 
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          10 min
        </button>
        <button
          onClick={() => setQuickRange(30)}
          className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${
            isDarkMode 
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          30 min
        </button>
        <button
          onClick={() => setQuickRange(60)}
          className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${
            isDarkMode 
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          1 hour
        </button>
        <button
          onClick={() => setQuickRange(180)}
          className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${
            isDarkMode 
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          3 hours
        </button>
        <button
          onClick={() => setQuickRange(720)}
          className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${
            isDarkMode 
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          12 hours
        </button>
        <button
          onClick={() => setQuickRange(1440)}
          className={`px-2 py-1.5 text-xs rounded transition-colors font-medium col-span-2 ${
            isDarkMode 
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
          }`}
        >
          1 day
        </button>
      </div>

      {/* Date inputs */}
      <div className="space-y-3">
        <div>
          <label htmlFor="start-time" className={`block text-sm font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Start Time
          </label>
          <input
            id="start-time"
            type="datetime-local"
            value={startInput}
            onChange={(e) => handleStartChange(e.target.value)}
            className={`w-full px-3 py-2.5 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${
              isDarkMode 
                ? 'text-white bg-gray-700 border-gray-600' 
                : 'text-gray-900 bg-white border-gray-300'
            }`}
            max={formatDateTimeLocal(new Date())}
          />
        </div>

        <div>
          <label htmlFor="end-time" className={`block text-sm font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            End Time
          </label>
          <input
            id="end-time"
            type="datetime-local"
            value={endInput}
            onChange={(e) => handleEndChange(e.target.value)}
            className={`w-full px-3 py-2.5 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${
              isDarkMode 
                ? 'text-white bg-gray-700 border-gray-600' 
                : 'text-gray-900 bg-white border-gray-300'
            }`}
            max={formatDateTimeLocal(new Date())}
            min={startInput}
          />
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {validationError}
        </div>
      )}

      {/* Active filter indicator */}
      {(startDate || endDate) && !validationError && (
        <div className="mt-3 text-xs text-blue-800 bg-blue-100 px-3 py-2 rounded-md font-medium">
          {startDate && endDate ? (
            <>Showing calls from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}</>
          ) : startDate ? (
            <>Showing calls from {startDate.toLocaleDateString()}</>
          ) : (
            <>Showing calls until {endDate?.toLocaleDateString()}</>
          )}
        </div>
      )}
    </div>
  );
}