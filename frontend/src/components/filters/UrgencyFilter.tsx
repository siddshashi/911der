'use client';

import { useCallback, useState, useEffect } from 'react';
import { URGENCY_COLORS } from '@/lib/types';
import { useDebounce } from '@/lib/debounce';

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

interface UrgencyFilterProps {
  selectedUrgencies: string[];
  onUrgencyChange: (urgencies: string[]) => void;
  className?: string;
  isDarkMode?: boolean;
}

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Non-urgent situations' },
  { value: 'medium', label: 'Medium', description: 'Standard priority' },
  { value: 'high', label: 'High', description: 'Urgent response needed' },
  { value: 'critical', label: 'Critical', description: 'Immediate response required' },
];

export default function UrgencyFilter({
  selectedUrgencies,
  onUrgencyChange,
  className = '',
  isDarkMode = false
}: UrgencyFilterProps) {
  // Local state for immediate UI updates
  const [localSelectedUrgencies, setLocalSelectedUrgencies] = useState(selectedUrgencies);
  
  // Debounce the filter changes to improve performance
  const debouncedSelectedUrgencies = useDebounce(localSelectedUrgencies, 150);

  // Apply debounced changes
  useEffect(() => {
    onUrgencyChange(debouncedSelectedUrgencies);
  }, [debouncedSelectedUrgencies, onUrgencyChange]);

  // Sync local state when prop changes (for external updates)
  useEffect(() => {
    setLocalSelectedUrgencies(selectedUrgencies);
  }, [selectedUrgencies]);
  
  // Handle individual urgency toggle (immediate UI update, debounced filter application)
  const handleUrgencyToggle = useCallback((urgency: string) => {
    const isSelected = localSelectedUrgencies.includes(urgency);
    
    if (isSelected) {
      // Remove from selection
      setLocalSelectedUrgencies(prev => prev.filter(u => u !== urgency));
    } else {
      // Add to selection
      setLocalSelectedUrgencies(prev => [...prev, urgency]);
    }
  }, [localSelectedUrgencies]);

  // Select all urgencies
  const handleSelectAll = useCallback(() => {
    setLocalSelectedUrgencies(URGENCY_OPTIONS.map(option => option.value));
  }, []);

  // Clear all selections
  const handleSelectNone = useCallback(() => {
    setLocalSelectedUrgencies([]);
  }, []);

  const allSelected = localSelectedUrgencies.length === URGENCY_OPTIONS.length;
  const noneSelected = localSelectedUrgencies.length === 0;

  return (
    <div className={`rounded-lg shadow-sm border p-4 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Urgency Level</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            disabled={allSelected}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            All
          </button>
          <span className="text-xs text-gray-300">|</span>
          <button
            onClick={handleSelectNone}
            disabled={noneSelected}
            className="text-xs text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            None
          </button>
        </div>
      </div>

      {/* Urgency checkboxes */}
      <div className="space-y-2">
        {URGENCY_OPTIONS.map((option) => {
          const isSelected = localSelectedUrgencies.includes(option.value);
          const urgencyColor = URGENCY_COLORS[option.value];
          
          return (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleUrgencyToggle(option.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-transparent'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: isSelected ? urgencyColor : 'transparent',
                  }}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-1">
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full border border-gray-200"
                  style={{ backgroundColor: urgencyColor }}
                />
                
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-xs font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {option.description}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {localSelectedUrgencies.length > 0 && (
        <div className="mt-3 text-xs text-blue-800 bg-blue-100 px-3 py-2 rounded-md font-medium">
          {localSelectedUrgencies.length === URGENCY_OPTIONS.length ? (
            'Showing all urgency levels'
          ) : localSelectedUrgencies.length === 1 ? (
            `Showing ${localSelectedUrgencies[0]} urgency calls`
          ) : (
            `Showing ${localSelectedUrgencies.length} urgency levels`
          )}
        </div>
      )}

      {/* No selection warning */}
      {noneSelected && (
        <div className="mt-3 text-xs text-amber-800 bg-amber-100 px-3 py-2 rounded-md font-medium">
          No urgency levels selected - no calls will be shown
        </div>
      )}
    </div>
  );
}