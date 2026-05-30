import { PermissionsAndroid, Platform } from 'react-native';

export interface BeaconRegion {
  identifier: string;
  uuid: string;
  major?: number;
  minor?: number;
}

export interface BeaconReading {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  accuracy: number;
  txPower: number;
}

export interface BeaconInfo {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  distance: number;
  proximity: 'immediate' | 'near' | 'far' | 'unknown';
  timestamp: number;
}

export interface IndoorPosition {
  lat: number;
  lng: number;
  heading: number;
  accuracy: number;
  source: 'beacon';
  timestamp: number;
}

type BeaconModule = {
  requestPermissions?: () => Promise<unknown>;
  configure?: (options: Record<string, unknown>) => void;
  startRanging?: (region: BeaconRegion) => void;
  stopRanging?: (region: BeaconRegion) => void;
  stopAllRanging?: () => void;
  on?: (event: 'ranging', callback: (region: BeaconRegion, beacons: BeaconReading[]) => void) => (() => void) | void;
};

type BeaconZone = {
  lat: number;
  lng: number;
  heading: number;
};

export class BeaconService {
  private static instance: BeaconService | null = null;

  private initialized = false;

  private isScanning = false;

  private activeRegions: BeaconRegion[] = [];

  private listenerCleanup: (() => void) | null = null;

  private mapping = new Map<string, BeaconZone>();

  private currentPosition: IndoorPosition | null = null;

  private currentBeacons: BeaconInfo[] = [];

  private positionListeners = new Set<(position: IndoorPosition | null) => void>();

  private beaconListeners = new Set<(beacons: BeaconInfo[]) => void>();

  private constructor() {}

  static getInstance(): BeaconService {
    if (!BeaconService.instance) {
      BeaconService.instance = new BeaconService();
    }
    return BeaconService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const scan = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
    const connect = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
    const location = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return (
      scan === PermissionsAndroid.RESULTS.GRANTED &&
      connect === PermissionsAndroid.RESULTS.GRANTED &&
      location === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  async initialize(regions: BeaconRegion[] = []): Promise<void> {
    if (this.initialized) return;

    const module = (await import('react-native-beacon-kit')).default as BeaconModule;
    await module.requestPermissions?.();
    await this.requestPermissions();
    module.configure?.({
      scanPeriod: 1100,
      backgroundScanPeriod: 5000,
      betweenScanPeriod: 0,
      foregroundService: true,
    });

    this.listenerCleanup = module.on?.('ranging', (_region, beacons) => {
      this.currentBeacons = beacons.map((beacon) => ({
        uuid: beacon.uuid,
        major: beacon.major,
        minor: beacon.minor,
        rssi: beacon.rssi,
        distance: beacon.accuracy,
        proximity: this.getProximity(beacon.accuracy),
        timestamp: Date.now(),
      }));
      this.currentPosition = this.triangulatePosition(beacons);
      this.notifyPositionListeners();
      this.notifyBeaconListeners();
    }) as (() => void) | null;

    this.initialized = true;
    if (regions.length > 0) {
      this.startRanging(regions);
    }
  }

  startRanging(regions: BeaconRegion[]): void {
    if (this.isScanning || regions.length === 0) return;
    this.activeRegions = regions;
    void import('react-native-beacon-kit').then((beaconModule) => {
      const module = beaconModule.default as BeaconModule;
      for (const region of regions) {
        module.startRanging?.(region);
      }
      this.isScanning = true;
    });
  }

  stopRanging(): void {
    if (!this.isScanning) return;
    void import('react-native-beacon-kit').then((beaconModule) => {
      const module = beaconModule.default as BeaconModule;
      if (module.stopAllRanging) {
        module.stopAllRanging();
      } else {
        for (const region of this.activeRegions) {
          module.stopRanging?.(region);
        }
      }
      this.isScanning = false;
      this.activeRegions = [];
    });
  }

  registerBeaconMapping(beaconId: string, lat: number, lng: number, heading: number): void {
    this.mapping.set(beaconId, { lat, lng, heading });
  }

  addListener(listener: (position: IndoorPosition | null) => void): () => void {
    this.positionListeners.add(listener);
    listener(this.currentPosition);
    return () => {
      this.positionListeners.delete(listener);
    };
  }

  addBeaconListener(listener: (beacons: BeaconInfo[]) => void): () => void {
    this.beaconListeners.add(listener);
    if (this.currentBeacons.length > 0) {
      listener(this.currentBeacons);
    }
    return () => {
      this.beaconListeners.delete(listener);
    };
  }

  getCurrentPosition(): IndoorPosition | null {
    return this.currentPosition;
  }

  getCurrentBeacons(): BeaconInfo[] {
    return this.currentBeacons;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    const module = (await import('react-native-beacon-kit')).default as BeaconModule;
    this.listenerCleanup?.();
    this.listenerCleanup = null;

    if (module.stopAllRanging) {
      module.stopAllRanging();
    } else {
      for (const region of this.activeRegions) {
        module.stopRanging?.(region);
      }
    }

    this.activeRegions = [];
    this.currentPosition = null;
    this.currentBeacons = [];
    this.isScanning = false;
    this.initialized = false;
  }

  private triangulatePosition(beacons: BeaconReading[]): IndoorPosition | null {
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    let headingAccumulator = 0;

    for (const beacon of beacons) {
      const id = `${beacon.uuid}:${beacon.major}:${beacon.minor}`;
      const zone = this.mapping.get(id);
      if (!zone) continue;

      const safeDistance = Math.max(0.5, Number.isFinite(beacon.accuracy) ? beacon.accuracy : 10);
      const weight = 1 / (safeDistance * safeDistance);

      weightedLat += zone.lat * weight;
      weightedLng += zone.lng * weight;
      headingAccumulator += zone.heading * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return null;

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
      heading: headingAccumulator / totalWeight,
      accuracy: Math.max(1.5, Math.min(5, 3 / Math.sqrt(totalWeight))),
      source: 'beacon',
      timestamp: Date.now(),
    };
  }

  private getProximity(distance: number): 'immediate' | 'near' | 'far' | 'unknown' {
    if (distance < 0.5) return 'immediate';
    if (distance < 3) return 'near';
    if (distance < 10) return 'far';
    return 'unknown';
  }

  private notifyPositionListeners(): void {
    for (const listener of this.positionListeners) {
      listener(this.currentPosition);
    }
  }

  private notifyBeaconListeners(): void {
    for (const listener of this.beaconListeners) {
      listener(this.currentBeacons);
    }
  }
}

export const beaconService = BeaconService.getInstance();
