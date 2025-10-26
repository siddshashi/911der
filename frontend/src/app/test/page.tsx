'use client';

import { useState, useEffect } from 'react';
import { fetchEmergencyCalls, transformCallerToEmergencyCall, mapSeverityToUrgency } from '@/lib/api';
import { EmergencyCall, BackendCaller } from '@/lib/types';
import { isValidEmergencyCall, formatTimestamp } from '@/lib/utils';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';

// Import the map wrapper that handles client-side loading
import MapWrapper from '@/components/map/MapWrapper';

const MarkerTest = dynamic(() => import('@/components/map/MarkerTest'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">Loading marker test...</div>
});

const IntegrationTest = dynamic(() => import('@/components/map/IntegrationTest'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">Loading integration test...</div>
});

export default function TestPage() {
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    apiTest: boolean;
    transformationTest: boolean;
    severityMappingTest: boolean;
    validationTest: boolean;
  }>({
    apiTest: false,
    transformationTest: false,
    severityMappingTest: false,
    validationTest: false,
  });

  // Test the API client
  const testApiClient = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedCalls = await fetchEmergencyCalls();
      setCalls(fetchedCalls);
      setTestResults(prev => ({ ...prev, apiTest: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTestResults(prev => ({ ...prev, apiTest: false }));
    } finally {
      setLoading(false);
    }
  };

  // Test data transformation
  const testDataTransformation = () => {
    const mockBackendCaller: BackendCaller = {
      id: 123,
      latitude: 40.7128,
      longitude: -74.0060,
      severity: 2,
      metadata: 'Test emergency call',
      created_at: '2024-01-15T10:30:00Z'
    };

    const transformed = transformCallerToEmergencyCall(mockBackendCaller);
    
    const isValid = (
      transformed.id === '123' &&
      transformed.location.latitude === 40.7128 &&
      transformed.location.longitude === -74.0060 &&
      transformed.urgency === 'medium' &&
      transformed.description === 'Test emergency call' &&
      transformed.timestamp === '2024-01-15T10:30:00Z'
    );

    setTestResults(prev => ({ ...prev, transformationTest: isValid }));
    return transformed;
  };

  // Test severity to urgency mapping
  const testSeverityMapping = () => {
    const mappings = [
      { severity: 1, expected: 'low' },
      { severity: 2, expected: 'medium' },
      { severity: 3, expected: 'high' },
      { severity: 4, expected: 'critical' },
      { severity: 99, expected: 'medium' }, // default case
    ];

    const allCorrect = mappings.every(({ severity, expected }) => 
      mapSeverityToUrgency(severity) === expected
    );

    setTestResults(prev => ({ ...prev, severityMappingTest: allCorrect }));
    return mappings;
  };

  // Test data validation
  const testDataValidation = () => {
    const validCall: EmergencyCall = {
      id: '1',
      location: { latitude: 40.7128, longitude: -74.0060 },
      urgency: 'high',
      timestamp: '2024-01-15T10:30:00Z',
      description: 'Valid call'
    };

    const invalidCall = {
      id: 123, // should be string
      location: { latitude: 'invalid', longitude: -74.0060 }, // should be number
      urgency: 'invalid', // should be valid urgency level
      timestamp: '2024-01-15T10:30:00Z',
      description: 'Invalid call'
    };

    const validResult = isValidEmergencyCall(validCall);
    const invalidResult = isValidEmergencyCall(invalidCall);

    const testPassed = validResult === true && invalidResult === false;
    setTestResults(prev => ({ ...prev, validationTest: testPassed }));
    
    return { validResult, invalidResult };
  };

  // Run all tests
  const runAllTests = () => {
    testDataTransformation();
    testSeverityMapping();
    testDataValidation();
    testApiClient();
  };

  useEffect(() => {
    // Run transformation and mapping tests on component mount
    testDataTransformation();
    testSeverityMapping();
    testDataValidation();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Client Test Page</h1>
          <p className="text-gray-600">Testing emergency call data fetching and transformation</p>
        </header>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={testApiClient}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing API...' : 'Test API Client'}
            </button>
            <button
              onClick={runAllTests}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Run All Tests
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${testResults.apiTest ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              <div className="font-medium">API Client</div>
              <div className="text-sm">{testResults.apiTest ? '✅ Passed' : '⏳ Not tested'}</div>
            </div>
            <div className={`p-4 rounded-lg ${testResults.transformationTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Data Transform</div>
              <div className="text-sm">{testResults.transformationTest ? '✅ Passed' : '❌ Failed'}</div>
            </div>
            <div className={`p-4 rounded-lg ${testResults.severityMappingTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Severity Mapping</div>
              <div className="text-sm">{testResults.severityMappingTest ? '✅ Passed' : '❌ Failed'}</div>
            </div>
            <div className={`p-4 rounded-lg ${testResults.validationTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="font-medium">Data Validation</div>
              <div className="text-sm">{testResults.validationTest ? '✅ Passed' : '❌ Failed'}</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Map Test */}
        <ClientOnly fallback={<div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Map Component Test</h2>
          <p className="text-gray-600 mb-4">Loading map components...</p>
          <div className="h-96 w-full border rounded-lg overflow-hidden bg-gray-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-500">Initializing map...</span>
          </div>
        </div>}>
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Map Component Test</h2>
            <p className="text-gray-600 mb-4">Testing EmergencyMap component with React Leaflet integration</p>
            <div className="h-96 w-full border rounded-lg overflow-hidden">
              <MapWrapper 
                calls={calls} 
                onCallSelect={(call) => console.log('Selected call:', call)}
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Manual Tests:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>✓ Verify map loads and displays properly</li>
                <li>✓ Test zoom in/out and pan functionality works smoothly</li>
                <li>✓ Ensure map tiles load without errors</li>
              </ul>
            </div>
          </div>

          {/* Marker Test */}
          <MarkerTest />

          {/* Integration Test */}
          <IntegrationTest />
        </ClientOnly>

        {/* Data Display */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Fetched Emergency Calls ({calls.length})</h2>
          {calls.length === 0 ? (
            <p className="text-gray-500">No calls fetched yet. Click "Test API Client" to fetch data.</p>
          ) : (
            <div className="space-y-4">
              {calls.slice(0, 5).map((call) => (
                <div key={call.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Call ID: {call.id}</h3>
                      <p className="text-sm text-gray-600">
                        Location: {call.location.latitude.toFixed(4)}, {call.location.longitude.toFixed(4)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Urgency: <span className={`px-2 py-1 rounded text-xs font-medium ${
                          call.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                          call.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                          call.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {call.urgency}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Time: {formatTimestamp(call.timestamp)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Description: {call.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Valid: {isValidEmergencyCall(call) ? '✅' : '❌'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {calls.length > 5 && (
                <p className="text-gray-500 text-center">... and {calls.length - 5} more calls</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}