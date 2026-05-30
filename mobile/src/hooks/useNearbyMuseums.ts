import { useEffect, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { api } from '../api/client';
import { NearbyMuseum } from '../types/museums';

type Location = { lat: number; lng: number };

interface UseNearbyMuseumsResult {
  nearby: NearbyMuseum[];
  loading: boolean;
  location: Location | null;
}

export const useNearbyMuseums = (radiusMeters = 5000): UseNearbyMuseumsResult => {
  const [nearby, setNearby] = useState<NearbyMuseum[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        void fetchNearby(latitude, longitude);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.warn('Nearby lookup location unavailable', error.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusMeters]);

  const fetchNearby = async (lat: number, lng: number) => {
    try {
      const response = await api.get<NearbyMuseum[]>('/museums/nearby', {
        params: {
          lat,
          lng,
          radius: radiusMeters,
        },
      });
      setNearby(response.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch nearby museums', error);
      setNearby([]);
    } finally {
      setLoading(false);
    }
  };

  return { nearby, loading, location };
};
