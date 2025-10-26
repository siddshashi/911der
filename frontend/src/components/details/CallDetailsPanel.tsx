'use client';

import { useEffect, useRef, memo } from 'react';
import { EmergencyCall, URGENCY_COLORS } from '@/lib/types';

interface CallDetailsPanelProps {
  call: EmergencyCall | null;
  onClose: () => void;
}

const CallDetailsPanel = memo(function CallDetailsPanel({ call, onClose }: CallDetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Only close if clicking on the map area, not on popups or other UI elements
        const target = event.target as HTMLElement;
        if (target.closest('.leaflet-container') || target.closest('.leaflet-popup')) {
          onClose();
        }
      }
    };

    if (call) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [call, onClose]);

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (call) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [call, onClose]);

  if (!call) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        full: date.toLocaleString()
      };
    } catch {
      return {
        date: 'Invalid date',
        time: 'Invalid time',
        full: timestamp
      };
    }
  };

  const getUrgencyDisplayName = (urgency: string) => {
    return urgency.charAt(0).toUpperCase() + urgency.slice(1);
  };

  const getUrgencyDescription = (urgency: EmergencyCall['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'Immediate response required';
      case 'high':
        return 'High priority response needed';
      case 'medium':
        return 'Standard response time';
      case 'low':
        return 'Low priority, routine response';
      default:
        return '';
    }
  };

  const timeInfo = formatTimestamp(call.timestamp);

  return (
    <>
      {/* Panel - Responsive */}
      <div
        ref={panelRef}
        className="fixed inset-0 lg:right-0 lg:top-0 lg:left-auto lg:h-full lg:w-full lg:max-w-md bg-white transform transition-transform duration-300 ease-in-out overflow-y-auto lg:border-l border-gray-200"
        style={{
          transform: call ? 'translateX(0)' : 'translateX(100%)',
          zIndex: 10000,
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header - Responsive */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
            Emergency Call Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 touch-manipulation"
            aria-label="Close details panel"
          >
            <svg 
              className="w-6 h-6 lg:w-5 lg:h-5 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Content - Responsive padding */}
        <div className="px-4 lg:px-6 py-4 lg:py-6 space-y-4 lg:space-y-6">
          {/* Call ID */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Call ID
            </h3>
            <p className="text-lg font-mono text-gray-900">#{call.id}</p>
          </div>

          {/* Urgency Level */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Urgency Level
            </h3>
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: URGENCY_COLORS[call.urgency] }}
              />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {getUrgencyDisplayName(call.urgency)} Priority
                </p>
                <p className="text-sm text-gray-600">
                  {getUrgencyDescription(call.urgency)}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Location
            </h3>
            <div className="space-y-2">
              {call.location.address && (
                <p className="text-base text-gray-900 font-medium">
                  {call.location.address}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-mono">
                  {call.location.latitude.toFixed(6)}, {call.location.longitude.toFixed(6)}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Call Time
            </h3>
            <div className="space-y-1">
              <p className="text-base text-gray-900 font-medium">
                {timeInfo.date} at {timeInfo.time}
              </p>
              <p className="text-sm text-gray-600">
                {timeInfo.full}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Call Description
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap">
                {call.description}
              </p>
            </div>
          </div>

          {/* Actions - Touch-friendly buttons */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-col lg:flex-row gap-3">
              <button
                onClick={() => {
                  // Copy coordinates to clipboard
                  navigator.clipboard.writeText(
                    `${call.location.latitude}, ${call.location.longitude}`
                  );
                }}
                className="flex-1 px-4 py-3 lg:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium touch-manipulation"
              >
                Copy Coordinates
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 lg:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium touch-manipulation"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default CallDetailsPanel;