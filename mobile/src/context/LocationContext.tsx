import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { locationService, LocationCoords, LocationPermissionStatus } from '../services/LocationService';
import { DetectedMuseum, museumDetection } from '../services/MuseumDetectionService';

interface LocationContextType {
  currentMuseum: DetectedMuseum | null;
  userLocation: LocationCoords | null;
  locationPermissionGranted: boolean;
  permissionStatus: LocationPermissionStatus;
  isLocating: boolean;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMuseum, setCurrentMuseum] = useState<DetectedMuseum | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('unavailable');
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubMuseum: (() => void) | null = null;
    let unsubLocation: (() => void) | null = null;

    const init = async () => {
      const status = await locationService.requestPermissions(true);
      if (!mounted) return;
      setPermissionStatus(status);

      if (status === 'granted') {
        await museumDetection.initialize();
        if (!mounted) return;

        unsubMuseum = museumDetection.addListener(setCurrentMuseum);
        unsubLocation = locationService.addListener(setUserLocation);
        try {
          const coords = await locationService.getCurrentPosition();
          if (mounted) setUserLocation(coords);
        } catch {
          // Ignore one-shot fetch errors; live watch will continue delivering updates.
        }
      }

      if (mounted) setIsLocating(false);
    };

    void init();

    return () => {
      mounted = false;
      unsubMuseum?.();
      unsubLocation?.();
      locationService.stopWatching();
    };
  }, []);

  const refreshLocation = async () => {
    const coords = await locationService.getCurrentPosition();
    setUserLocation(coords);
  };

  const value = useMemo(
    () => ({
      currentMuseum,
      userLocation,
      locationPermissionGranted: permissionStatus === 'granted',
      permissionStatus,
      isLocating,
      refreshLocation,
    }),
    [currentMuseum, userLocation, permissionStatus, isLocating]
  );

  if (isLocating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
