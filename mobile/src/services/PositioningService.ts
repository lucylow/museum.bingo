import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { BeaconService, IndoorPosition } from './BeaconService';
import { CompassService } from './CompassService';
import { WifiRTTLocation, WifiRTTService } from './WifiRTTService';

export interface UserPosition {
  lat: number;
  lng: number;
  heading: number;
  accuracy: number;
  source: 'gps' | 'beacon' | 'wifi-rtt' | 'hybrid';
  timestamp: number;
}

export interface PositioningConfig {
  enableBeacons?: boolean;
  enableWifiRTT?: boolean;
}

export class PositioningService {
  private static instance: PositioningService | null = null;

  private listeners = new Set<(position: UserPosition) => void>();

  private watchId: number | null = null;

  private gpsPosition: UserPosition | null = null;

  private beaconPosition: IndoorPosition | null = null;

  private wifiPosition: WifiRTTLocation | null = null;

  private currentPosition: UserPosition | null = null;

  private unsubBeacon: (() => void) | null = null;

  private unsubWifi: (() => void) | null = null;

  private constructor() {}

  static getInstance(): PositioningService {
    if (!PositioningService.instance) {
      PositioningService.instance = new PositioningService();
    }
    return PositioningService.instance;
  }

  async initialize(config: PositioningConfig = {}): Promise<void> {
    await CompassService.getInstance().initialize();
    Geolocation.requestAuthorization('whenInUse');

    if (this.watchId === null) {
      this.watchId = Geolocation.watchPosition(
        (position) => {
          this.gpsPosition = this.toGpsPosition(position);
          this.recomputePosition();
        },
        (error) => {
          // Intentionally lightweight to avoid log spam in weak indoor GPS zones.
          console.warn('GPS watch error', error.code, error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 1,
          interval: 1000,
          fastestInterval: 750,
          forceRequestLocation: true,
          showLocationDialog: true,
        },
      );
    }

    if (config.enableBeacons) {
      this.unsubBeacon = BeaconService.getInstance().addListener((position) => {
        this.beaconPosition = position;
        this.recomputePosition();
      });
    }

    if (config.enableWifiRTT) {
      this.unsubWifi = WifiRTTService.getInstance().addListener((position) => {
        this.wifiPosition = position;
        this.recomputePosition();
      });
    }
  }

  stop(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.unsubBeacon?.();
    this.unsubBeacon = null;
    this.unsubWifi?.();
    this.unsubWifi = null;
  }

  addListener(listener: (position: UserPosition) => void): () => void {
    this.listeners.add(listener);
    if (this.currentPosition) {
      listener(this.currentPosition);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentPosition(): UserPosition | null {
    return this.currentPosition;
  }

  private toGpsPosition(position: GeoPosition): UserPosition {
    const heading = Number.isFinite(position.coords.heading) ? (position.coords.heading as number) : 0;
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      heading,
      accuracy: position.coords.accuracy,
      source: 'gps',
      timestamp: Date.now(),
    };
  }

  private recomputePosition(): void {
    const bestIndoor = this.selectIndoorPosition();
    const fallback = this.gpsPosition ?? bestIndoor;
    if (!fallback) return;

    const compassReading = CompassService.getInstance().getCurrentReading();
    const heading =
      compassReading && compassReading.quality === 'reliable' ? compassReading.heading : fallback.heading;

    const selected: UserPosition = {
      ...fallback,
      heading,
      source: bestIndoor ? 'hybrid' : fallback.source,
      timestamp: Date.now(),
    };

    this.currentPosition = selected;
    CompassService.getInstance().updateUserLocation(selected.lat, selected.lng);
    this.notifyListeners();
  }

  private selectIndoorPosition(): UserPosition | null {
    if (this.wifiPosition && this.wifiPosition.accuracy <= 1.5) {
      return { ...this.wifiPosition, source: 'wifi-rtt' };
    }
    if (this.beaconPosition && this.beaconPosition.accuracy <= 5) {
      return { ...this.beaconPosition, source: 'beacon' };
    }
    return null;
  }

  private notifyListeners(): void {
    if (!this.currentPosition) return;
    for (const listener of this.listeners) {
      listener(this.currentPosition);
    }
  }
}
