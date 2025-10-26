'use client';

import { useEffect, useRef, memo, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { EmergencyCall } from '@/lib/types';
import CallMarker from './CallMarker';
import '@/lib/leaflet-setup'; // Fix for marker icons
import 'leaflet/dist/leaflet.css';

interface EmergencyMapProps {
  calls: EmergencyCall[];
  onCallSelect?: (call: EmergencyCall | null) => void;
  selectedCall?: EmergencyCall | null;
  className?: string;
  forceResize?: number;
  isDarkMode?: boolean;
  onDarkModeChange?: (isDark: boolean) => void;
}

// Component to handle map instance access and bounds
function MapController({ 
  calls, 
  bounds, 
  onMapClick 
}: { 
  calls: EmergencyCall[], 
  bounds: [[number, number], [number, number]] | null,
  onMapClick?: (e: any) => void
}) {
  const map = useMap();
  
  useEffect(() => {
    // Ensure map tiles load properly
    map.invalidateSize();
    
    // Fit bounds to show all calls if we have calls and bounds
    if (bounds && calls.length > 0) {
      try {
        if (calls.length === 1) {
          // For single call, center on it with a reasonable zoom
          const call = calls[0];
          map.setView([call.location.latitude, call.location.longitude], 14);
        } else {
          // For multiple calls, fit all bounds
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.warn('Failed to fit bounds:', error);
      }
    }
  }, [map, calls.length, bounds]);

  useEffect(() => {
    if (onMapClick) {
      map.on('click', onMapClick);
      return () => {
        map.off('click', onMapClick);
      };
    }
  }, [map, onMapClick]);

  return null;
}

const EmergencyMap = memo(function EmergencyMap({ 
  calls, 
  onCallSelect, 
  selectedCall, 
  className = '',
  forceResize,
  isDarkMode = false,
  onDarkModeChange
}: EmergencyMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  // Map tile configurations
  const tileConfigs = {
    light: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  };

  const currentTileConfig = isDarkMode ? tileConfigs.dark : tileConfigs.light;

  // Calculate dynamic center and zoom based on calls
  const mapSettings = useMemo(() => {
    if (calls.length === 0) {
      // Default to New York if no calls
      return {
        center: [40.7128, -74.0060] as [number, number],
        zoom: 10,
        bounds: null
      };
    }

    const latitudes = calls.map(call => call.location.latitude);
    const longitudes = calls.map(call => call.location.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    // Calculate center point
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate appropriate zoom level based on the spread of points
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 10; // default
    if (maxDiff < 0.01) zoom = 15;      // Very close points
    else if (maxDiff < 0.05) zoom = 13;  // Close points  
    else if (maxDiff < 0.1) zoom = 12;   // Nearby points
    else if (maxDiff < 0.5) zoom = 10;   // City-wide
    else if (maxDiff < 2) zoom = 8;      // Regional
    else zoom = 6;                       // Wide area
    
    // Add padding to bounds for fitBounds
    const padding = Math.max(0.01, maxDiff * 0.1);
    const bounds = [
      [minLat - padding, minLng - padding],
      [maxLat + padding, maxLng + padding]
    ] as [[number, number], [number, number]];
    
    return {
      center: [centerLat, centerLng] as [number, number],
      zoom,
      bounds
    };
  }, [calls]);

  // Memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return calls.map((call) => (
      <CallMarker
        key={call.id}
        call={call}
        isSelected={selectedCall?.id === call.id}
        onClick={() => onCallSelect?.(call)}
      />
    ));
  }, [calls, selectedCall?.id, onCallSelect]);

  // Handle map click to deselect calls
  const handleMapClick = (e: any) => {
    // Only deselect if clicking on the map itself, not on markers
    if (e.originalEvent && onCallSelect) {
      onCallSelect(null); // Deselect current call
    }
  };

  // Force map resize when forceResize prop changes
  useEffect(() => {
    if (mapRef.current && forceResize !== undefined) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 50);
    }
  }, [forceResize]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapContainer
        center={mapSettings.center}
        zoom={mapSettings.zoom}
        className="w-full h-full touch-pan-y touch-pan-x"
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
        attributionControl={true}
      >
        <MapController calls={calls} bounds={mapSettings.bounds} onMapClick={handleMapClick} />
        
        {/* Dynamic tile layer based on mode */}
        <TileLayer
          key={isDarkMode ? 'dark' : 'light'} // Force re-render when mode changes
          url={currentTileConfig.url}
          attribution={currentTileConfig.attribution}
          maxZoom={19}
          minZoom={3}
        />
        
        {/* Render call markers (memoized) */}
        {markers}
      </MapContainer>
      
      {/* Night Mode Toggle */}
      <div className="absolute top-2 lg:top-4 right-2 lg:right-4 z-[1000]">
        <button
          onClick={() => onDarkModeChange?.(!isDarkMode)}
          className={`p-2 lg:p-3 rounded-lg shadow-md transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          title={isDarkMode ? 'Switch to day mode' : 'Switch to night mode'}
        >
          {isDarkMode ? (
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>


      
      {/* Selected call indicator - Responsive with better positioning for night mode toggle */}
      {selectedCall && selectedCall.id && (
        <div className="absolute top-14 lg:top-16 right-2 lg:right-4 z-[1000] bg-blue-600 text-white rounded-lg shadow-md px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm font-medium">
          <span className="hidden lg:inline">Call #{selectedCall.id} selected</span>
          <span className="lg:hidden">#{selectedCall.id}</span>
        </div>
      )}
    </div>
  );
});

export default EmergencyMap;