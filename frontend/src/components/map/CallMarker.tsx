'use client';

import { useEffect, useRef, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { EmergencyCall, URGENCY_COLORS } from '@/lib/types';

interface CallMarkerProps {
  call: EmergencyCall;
  isSelected: boolean;
  onClick: () => void;
}

// Create simpler, more reliable marker icons with touch-friendly sizing
const createUrgencyIcon = (urgency: EmergencyCall['urgency'], isSelected: boolean = false) => {
  const color = URGENCY_COLORS[urgency];
  // Larger sizes for better touch interaction
  const size = isSelected ? 36 : 24;
  const borderWidth = isSelected ? 4 : 2;
  
  return L.divIcon({
    className: `urgency-marker urgency-${urgency} ${isSelected ? 'selected' : ''}`,
    html: `
      <div class="marker-circle" style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
        position: relative;
        touch-action: manipulation;
        ${isSelected ? 'transform: scale(1.2);' : ''}
      ">
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -3px;
            right: -3px;
            width: 8px;
            height: 8px;
            background-color: #3B82F6;
            border: 1px solid white;
            border-radius: 50%;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
    popupAnchor: [0, -(size + 8) / 2],
  });
};

const CallMarker = memo(function CallMarker({ call, isSelected, onClick }: CallMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  // Update icon when selection state changes
  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.setIcon(createUrgencyIcon(call.urgency, isSelected));
    }
  }, [isSelected, call.urgency]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getUrgencyDisplayName = (urgency: string) => {
    return urgency.charAt(0).toUpperCase() + urgency.slice(1);
  };

  const handleMarkerClick = (e: L.LeafletMouseEvent) => {
    console.log('Marker clicked:', call.id);
    e.originalEvent?.stopPropagation(); // Prevent map click event
    
    // Just let the popup open on marker click - don't trigger onClick yet
    // The onClick will be triggered by the "Select Call" button in the popup
  };

  return (
    <Marker
      ref={markerRef}
      position={[call.location.latitude, call.location.longitude]}
      icon={createUrgencyIcon(call.urgency, isSelected)}
      eventHandlers={{
        click: handleMarkerClick,
        mouseover: (e) => {
          const marker = e.target;
          if (!isSelected) {
            marker.setIcon(createUrgencyIcon(call.urgency, false));
            // Add hover effect via CSS if needed
          }
        },
        mouseout: (e) => {
          const marker = e.target;
          if (!isSelected) {
            marker.setIcon(createUrgencyIcon(call.urgency, false));
          }
        }
      }}
    >
      <Popup 
        closeButton={true}
        autoClose={false}
        closeOnEscapeKey={true}
        closeOnClick={false}
      >
        <div className="p-3 min-w-[250px] max-w-[300px]">
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: URGENCY_COLORS[call.urgency] }}
            />
            <span className="font-semibold text-gray-900 text-base">
              {getUrgencyDisplayName(call.urgency)} Priority
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Call ID:</span>
              <div className="text-gray-600">#{call.id}</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <div className="text-gray-600">
                {call.location.address || 
                 `${call.location.latitude.toFixed(4)}, ${call.location.longitude.toFixed(4)}`}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Time:</span>
              <div className="text-gray-600">{formatTimestamp(call.timestamp)}</div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Description:</span>
              <div className="text-gray-600 break-words">
                {call.description.length > 150 
                  ? `${call.description.substring(0, 150)}...` 
                  : call.description}
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Popup button clicked for call:', call.id);
                // Close the popup first, then trigger selection
                const marker = markerRef.current;
                if (marker) {
                  marker.closePopup();
                }
                onClick();
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Select Call →
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

export default CallMarker;