'use client';

import { useEffect, useState } from 'react';
import { EmergencyCall } from '@/lib/types';

interface MapWrapperProps {
  calls: EmergencyCall[];
  onCallSelect?: (call: EmergencyCall | null) => void;
  selectedCall?: EmergencyCall | null;
  className?: string;
  forceResize?: number; // Trigger to force map resize
  isDarkMode?: boolean;
  onDarkModeChange?: (isDark: boolean) => void;
}

export default function MapWrapper(props: MapWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [MapComponent, setMapComponent] = useState<React.ComponentType<MapWrapperProps> | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import the map component only on client side
    import('./EmergencyMap').then((module) => {
      setMapComponent(() => module.default);
    });
  }, []);

  if (!isClient || !MapComponent) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-gray-600 text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return <MapComponent {...props} />;
}