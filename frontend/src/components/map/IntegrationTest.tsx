'use client';

import { useState, useEffect } from 'react';
import { EmergencyCall } from '@/lib/types';
import { fetchEmergencyCalls } from '@/lib/api';
import MapWrapper from './MapWrapper';

export default function IntegrationTest() {
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<EmergencyCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRealData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedCalls = await fetchEmergencyCalls();
      setCalls(fetchedCalls);
      console.log('Loaded calls:', fetchedCalls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Failed to load calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load data on component mount
    loadRealData();
  }, []);

  const handleCallSelect = (call: EmergencyCall | null) => {
    console.log('handleCallSelect called with:', call);
    setSelectedCall(call);
    
    if (call) {
      // Show a temporary notification for selection
      const notification = document.createElement('div');
      notification.textContent = `Selected Call #${call.id} (${call.urgency})`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3B82F6;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } else {
      // Show deselection notification
      const notification = document.createElement('div');
      notification.textContent = 'Call deselected';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #6B7280;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    }
  };

  const clearSelection = () => {
    setSelectedCall(null);
    console.log('Cleared selection');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Map Integration Test</h2>
        <p className="text-gray-600 mb-4">
          Testing complete integration with real backend data
        </p>
        
        {/* Controls */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={loadRealData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Reload Data'}
          </button>
          
          {selectedCall && (
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Status */}
        <div className="mb-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              Error: {error}
            </div>
          )}
          
          {!error && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              ✓ Loaded {calls.length} emergency calls from backend
            </div>
          )}
        </div>

        {/* Map */}
        <div className="h-96 w-full border rounded-lg overflow-hidden">
          <MapWrapper 
            calls={calls}
            selectedCall={selectedCall}
            onCallSelect={handleCallSelect}
          />
        </div>

        {/* Selected Call Details */}
        {selectedCall && selectedCall.id && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected Call Details:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <div><strong>ID:</strong> {selectedCall.id}</div>
                <div><strong>Urgency:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    selectedCall.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                    selectedCall.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedCall.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedCall.urgency}
                  </span>
                </div>
                <div><strong>Location:</strong> {selectedCall.location.latitude.toFixed(4)}, {selectedCall.location.longitude.toFixed(4)}</div>
              </div>
              <div>
                <div><strong>Time:</strong> {new Date(selectedCall.timestamp).toLocaleString()}</div>
                <div><strong>Description:</strong> {selectedCall.description}</div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Test Checklist */}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Manual Tests for Task 4.3:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>✓ Load real data from backend and verify all calls appear as markers</li>
            <li>✓ Click on different markers and verify selection highlighting works</li>
            <li>✓ Ensure marker positions match the latitude/longitude from your data</li>
            <li>✓ Test that clicking on map background deselects current call</li>
            <li>✓ Verify call count indicator updates correctly</li>
            <li>✓ Check that selected call indicator shows correct call ID</li>
          </ul>
        </div>

        {/* Data Summary */}
        {calls.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Data Summary:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Total Calls</div>
                <div className="text-2xl font-bold text-blue-600">{calls.length}</div>
              </div>
              <div>
                <div className="font-medium">Critical</div>
                <div className="text-2xl font-bold text-red-600">
                  {calls.filter(c => c.urgency === 'critical').length}
                </div>
              </div>
              <div>
                <div className="font-medium">High</div>
                <div className="text-2xl font-bold text-orange-600">
                  {calls.filter(c => c.urgency === 'high').length}
                </div>
              </div>
              <div>
                <div className="font-medium">Medium/Low</div>
                <div className="text-2xl font-bold text-green-600">
                  {calls.filter(c => c.urgency === 'medium' || c.urgency === 'low').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}