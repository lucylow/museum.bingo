import { NativeModules, Platform } from 'react-native';

export interface WifiRTTReading {
  bssid: string;
  distanceMeters: number;
  rttMicroseconds: number;
  timestamp: number;
}

export interface WifiRTTLocation {
  lat: number;
  lng: number;
  heading: number;
  accuracy: number;
  source: 'wifi-rtt';
  timestamp: number;
}

type WifiRTTModuleShape = {
  isSupported?: () => Promise<boolean>;
  startRanging?: (callback: (readings: WifiRTTReading[]) => void) => void;
  stopRanging?: () => void;
};

type AccessPointAnchor = {
  lat: number;
  lng: number;
  heading: number;
};

export class WifiRTTService {
  private static instance: WifiRTTService | null = null;

  private readonly module = (NativeModules.WifiRTTModule ?? {}) as WifiRTTModuleShape;

  private initialized = false;

  private supported = false;

  private currentPosition: WifiRTTLocation | null = null;

  private accessPoints = new Map<string, AccessPointAnchor>();

  private listeners = new Set<(position: WifiRTTLocation | null) => void>();

  private constructor() {}

  static getInstance(): WifiRTTService {
    if (!WifiRTTService.instance) {
      WifiRTTService.instance = new WifiRTTService();
    }
    return WifiRTTService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return this.supported;
    this.initialized = true;

    if (Platform.OS !== 'android' || !this.module.isSupported) {
      this.supported = false;
      return false;
    }

    try {
      this.supported = (await this.module.isSupported()) === true;
    } catch {
      this.supported = false;
    }

    return this.supported;
  }

  registerAccessPoint(bssid: string, lat: number, lng: number, heading: number): void {
    this.accessPoints.set(bssid.toLowerCase(), { lat, lng, heading });
  }

  async startRanging(): Promise<void> {
    if (!(await this.initialize())) return;
    this.module.startRanging?.((readings) => {
      this.currentPosition = this.estimatePosition(readings);
      this.notifyListeners();
    });
  }

  stopRanging(): void {
    this.module.stopRanging?.();
    this.currentPosition = null;
    this.notifyListeners();
  }

  addListener(listener: (position: WifiRTTLocation | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentPosition);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isAvailable(): boolean {
    return this.supported;
  }

  getCurrentPosition(): WifiRTTLocation | null {
    return this.currentPosition;
  }

  private estimatePosition(readings: WifiRTTReading[]): WifiRTTLocation | null {
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    let headingAccumulator = 0;

    for (const reading of readings) {
      const anchor = this.accessPoints.get(reading.bssid.toLowerCase());
      if (!anchor) continue;

      const distance = Math.max(0.3, reading.distanceMeters);
      const weight = 1 / (distance * distance);
      totalWeight += weight;
      weightedLat += anchor.lat * weight;
      weightedLng += anchor.lng * weight;
      headingAccumulator += anchor.heading * weight;
    }

    if (totalWeight === 0) return null;

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
      heading: headingAccumulator / totalWeight,
      accuracy: Math.max(0.3, Math.min(2, 1 / Math.sqrt(totalWeight))),
      source: 'wifi-rtt',
      timestamp: Date.now(),
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentPosition);
    }
  }
}
