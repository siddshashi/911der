'use client';

import { useEffect, useRef, memo } from 'react';
import { Marker } from 'react-leaflet';
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


  const handleMarkerClick = (e: L.LeafletMouseEvent) => {
    console.log('Marker clicked:', call.id);
    e.originalEvent?.stopPropagation(); // Prevent map click event
    
    // Directly trigger the onClick to open the details panel
    onClick();
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
    />
  );
});

export default CallMarker;