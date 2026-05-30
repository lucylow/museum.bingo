import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

export type LocationPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

class LocationService {
  private watchId: number | null = null;

  private currentPosition: LocationCoords | null = null;

  private listeners = new Set<(coords: LocationCoords) => void>();

  async requestPermissions(requireBackground = true): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'android') {
      const fineGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: 'Location Permission',
        message: 'Museum.Bingo uses location to find nearby museums.',
        buttonPositive: 'OK',
      });

      if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) return 'denied';

      if (requireBackground && Platform.Version >= 29) {
        const bgGranted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION, {
          title: 'Background Location',
          message: 'Allow Museum.Bingo to detect museum entry while app is in background.',
          buttonPositive: 'Allow',
        });
        if (bgGranted !== PermissionsAndroid.RESULTS.GRANTED) return 'blocked';
      }
      return 'granted';
    }

    const status = await Geolocation.requestAuthorization(requireBackground ? 'always' : 'whenInUse');
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'blocked';
  }

  getCurrentPosition(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading ?? null,
            speed: position.coords.speed ?? null,
            timestamp: position.timestamp,
          };
          this.currentPosition = coords;
          resolve(coords);
        },
        (error) => reject({ code: error.code, message: error.message } as LocationError),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }

  startWatching(callback: (coords: LocationCoords) => void, intervalMs = 5000): void {
    this.stopWatching();
    this.watchId = Geolocation.watchPosition(
      (position) => {
        const coords: LocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
          timestamp: position.timestamp,
        };
        this.currentPosition = coords;
        callback(coords);
        this.notifyListeners(coords);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.warn('Location watch error:', error);
      },
      { enableHighAccuracy: true, distanceFilter: 10, interval: intervalMs, fastestInterval: intervalMs }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  addListener(callback: (coords: LocationCoords) => void): () => void {
    this.listeners.add(callback);
    if (this.currentPosition) callback(this.currentPosition);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(coords: LocationCoords): void {
    for (const listener of this.listeners) {
      listener(coords);
    }
  }
}

export const locationService = new LocationService();
