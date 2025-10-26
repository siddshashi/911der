'use client';

import { useState } from 'react';
import { EmergencyCall, URGENCY_COLORS } from '@/lib/types';
import MapWrapper from './MapWrapper';

// Test data with different urgency levels
const testCalls: EmergencyCall[] = [
  {
    id: '1',
    location: { latitude: 40.7128, longitude: -74.0060 },
    urgency: 'low',
    timestamp: '2024-01-15T10:30:00Z',
    description: 'Low priority test call - routine maintenance check'
  },
  {
    id: '2',
    location: { latitude: 40.7589, longitude: -73.9851 },
    urgency: 'medium',
    timestamp: '2024-01-15T11:15:00Z',
    description: 'Medium priority test call - minor incident requiring attention'
  },
  {
    id: '3',
    location: { latitude: 40.7282, longitude: -73.7949 },
    urgency: 'high',
    timestamp: '2024-01-15T12:00:00Z',
    description: 'High priority test call - urgent situation requiring immediate response'
  },
  {
    id: '4',
    location: { latitude: 40.6892, longitude: -74.0445 },
    urgency: 'critical',
    timestamp: '2024-01-15T12:30:00Z',
    description: 'Critical priority test call - life-threatening emergency requiring immediate dispatch'
  }
];

export default function MarkerTest() {
  const [selectedCall, setSelectedCall] = useState<EmergencyCall | null>(null);
  const [clickCount, setClickCount] = useState(0);

  const handleCallSelect = (call: EmergencyCall | null) => {
    console.log('MarkerTest: Call selected:', call);
    setSelectedCall(call);
    if (call) {
      setClickCount(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">CallMarker Component Test</h2>
        <p className="text-gray-600 mb-4">
          Testing markers with different urgency levels and interactions
        </p>
        
        {/* Color Legend */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Urgency Color Coding:</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(URGENCY_COLORS).map(([urgency, color]) => (
              <div key={urgency} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm capitalize">{urgency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="h-96 w-full border rounded-lg overflow-hidden">
          <MapWrapper 
            calls={testCalls}
            selectedCall={selectedCall}
            onCallSelect={handleCallSelect}
          />
        </div>

        {/* Selected Call Info */}
        {selectedCall && selectedCall.id && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected Call Details:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>ID:</strong> {selectedCall.id}</div>
              <div><strong>Urgency:</strong> {selectedCall.urgency}</div>
              <div><strong>Location:</strong> {selectedCall.location.latitude.toFixed(4)}, {selectedCall.location.longitude.toFixed(4)}</div>
              <div><strong>Description:</strong> {selectedCall.description}</div>
            </div>
          </div>
        )}

        {/* Click Counter */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm">
            <strong>Click Counter:</strong> {clickCount} clicks detected
            {clickCount > 0 && (
              <span className="ml-2 text-green-600">✓ Click events working!</span>
            )}
          </div>
        </div>

        {/* Manual Test Checklist */}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Manual Tests:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>✓ Place test markers with different urgency levels on map</li>
            <li>✓ Verify each urgency level shows correct color (green, amber, red, dark red)</li>
            <li>✓ Test hover effects work and click events fire correctly</li>
            <li>✓ Check that selected markers show visual highlighting</li>
            <li>✓ Verify popup content displays correctly</li>
            <li>✓ Click markers to test event handling (counter above should increment)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}