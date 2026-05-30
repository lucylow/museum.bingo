import { api } from '../api/client';
import { beaconService, BeaconInfo, BeaconRegion } from './BeaconService';
import { geofencingService, Geofence } from './GeofencingService';
import { locationService, LocationCoords } from './LocationService';

export interface DetectedMuseum {
  placeId: string;
  name: string;
  location: { lat: number; lng: number };
  detectionMethod: 'gps' | 'beacon' | 'geofence' | 'manual';
  confidence: number;
  distance?: number;
}

type PlacesNearbyResult = {
  placeId: string;
  name: string;
  location: { lat: number; lng: number };
  formattedAddress: string;
};

class MuseumDetectionService {
  private readonly nearbySearchRadius = 2000;

  private readonly geofenceSetupRadius = 10000;

  private readonly geofenceRadius = 50;

  private readonly gpsEntryDistance = 80;

  private readonly gpsExitDistance = 220;

  private readonly gpsGeofenceConfirmationDistance = 45;

  private readonly geofenceConfirmationWindowMs = 90_000;

  private currentMuseum: DetectedMuseum | null = null;

  private listeners = new Set<(museum: DetectedMuseum | null) => void>();

  private nearbyMuseums: DetectedMuseum[] = [];

  private museumDirectory = new Map<string, PlacesNearbyResult>();

  private geofenceCandidate:
    | {
        placeId: string;
        enteredAt: number;
      }
    | null = null;

  private lastUpdateTime = 0;

  private readonly updateInterval = 10000;

  private initialized = false;

  private museumBeaconMap: Record<string, { placeId: string; name: string; lat: number; lng: number }> = {
    '12345678-1234-1234-1234-123456789abc': {
      placeId: 'met_nyc',
      name: 'The Metropolitan Museum of Art',
      lat: 40.7794,
      lng: -73.9632,
    },
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await locationService.requestPermissions(true);
    await beaconService.initialize();
    const beaconRegions: BeaconRegion[] = Object.keys(this.museumBeaconMap).map((uuid, index) => ({
      identifier: `museum-region-${String(index + 1)}`,
      uuid,
    }));
    beaconService.startRanging(beaconRegions);

    locationService.startWatching((coords) => {
      void this.detectMuseumFromLocation(coords);
    });

    beaconService.addBeaconListener((beacons) => {
      void this.detectMuseumFromBeacons(beacons);
    });

    await this.setupGeofences();
    this.initialized = true;
  }

  addListener(callback: (museum: DetectedMuseum | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentMuseum);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getCurrentMuseum(): DetectedMuseum | null {
    return this.currentMuseum;
  }

  setManualMuseumSelection(museum: { placeId: string; name: string; location: { lat: number; lng: number } }): void {
    this.ensureMuseumInDirectory({
      placeId: museum.placeId,
      name: museum.name,
      location: museum.location,
      formattedAddress: '',
    });

    this.addOrUpdateGeofenceForMuseum({
      placeId: museum.placeId,
      name: museum.name,
      location: museum.location,
      formattedAddress: '',
    });

    this.setCurrentMuseum({
      placeId: museum.placeId,
      name: museum.name,
      location: museum.location,
      detectionMethod: 'manual',
      confidence: 1,
    });
  }

  private async updateNearbyMuseums(coords: LocationCoords): Promise<void> {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = now;

    try {
      const response = await api.get<PlacesNearbyResult[]>('/places/nearby', {
        params: { lat: coords.latitude, lng: coords.longitude, radius: this.nearbySearchRadius, type: 'museum' },
      });

      for (const museum of response.data) {
        this.ensureMuseumInDirectory(museum);
      }

      this.nearbyMuseums = response.data.map((museum) => ({
        placeId: museum.placeId,
        name: museum.name,
        location: museum.location,
        detectionMethod: 'gps',
        confidence: 0.7,
        distance: this.calculateDistance(
          coords.latitude,
          coords.longitude,
          museum.location.lat,
          museum.location.lng
        ),
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch nearby museums', error);
    }
  }

  private async detectMuseumFromLocation(coords: LocationCoords): Promise<void> {
    await this.updateNearbyMuseums(coords);

    this.nearbyMuseums = this.nearbyMuseums.map((museum) => ({
      ...museum,
      distance: this.calculateDistance(
        coords.latitude,
        coords.longitude,
        museum.location.lat,
        museum.location.lng
      ),
    }));

    if (this.confirmPendingGeofenceWithLocation(coords)) {
      return;
    }

    const closest = this.nearbyMuseums.reduce<DetectedMuseum | null>(
      (prev, curr) => ((curr.distance || Infinity) < (prev?.distance || Infinity) ? curr : prev),
      null
    );

    if (closest && typeof closest.distance === 'number' && closest.distance < this.gpsEntryDistance) {
      this.setCurrentMuseum({
        ...closest,
        detectionMethod: 'gps',
        confidence: 0.72,
      });
      return;
    }

    if (
      (this.currentMuseum?.detectionMethod === 'gps' || this.currentMuseum?.detectionMethod === 'geofence') &&
      closest &&
      typeof closest.distance === 'number' &&
      closest.distance > this.gpsExitDistance
    ) {
      this.clearCurrentMuseum();
    }
  }

  private async detectMuseumFromBeacons(beacons: BeaconInfo[]): Promise<void> {
    for (const beacon of beacons) {
      const mapping = this.museumBeaconMap[beacon.uuid];
      if (mapping && (beacon.proximity === 'immediate' || beacon.proximity === 'near')) {
        this.setCurrentMuseum({
          placeId: mapping.placeId,
          name: mapping.name,
          location: { lat: mapping.lat, lng: mapping.lng },
          detectionMethod: 'beacon',
          confidence: 0.95,
          distance: beacon.distance,
        });
        if (this.geofenceCandidate?.placeId === mapping.placeId) {
          this.geofenceCandidate = null;
        }
        return;
      }
    }
  }

  private async setupGeofences(): Promise<void> {
    const userCoords = await locationService.getCurrentPosition();
    const museums = await api.get<PlacesNearbyResult[]>('/places/nearby', {
      params: { lat: userCoords.latitude, lng: userCoords.longitude, radius: this.geofenceSetupRadius, type: 'museum' },
    });

    for (const museum of museums.data) {
      this.ensureMuseumInDirectory(museum);
      this.addOrUpdateGeofenceForMuseum(museum);
      geofencingService.addGeofenceListener('enter', museum.placeId, () => {
        this.markGeofenceCandidate(museum.placeId);
      });
      geofencingService.addGeofenceListener('exit', museum.placeId, () => {
        if (this.geofenceCandidate?.placeId === museum.placeId) {
          this.geofenceCandidate = null;
        }
        if (this.currentMuseum?.placeId === museum.placeId) {
          this.clearCurrentMuseum();
        }
      });
    }

    await geofencingService.startMonitoringAll();
  }

  private setCurrentMuseum(museum: DetectedMuseum): void {
    if (!this.shouldReplaceCurrentMuseum(museum)) {
      return;
    }
    this.currentMuseum = museum;
    this.notifyListeners();
  }

  private clearCurrentMuseum(): void {
    if (!this.currentMuseum) return;
    this.currentMuseum = null;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentMuseum);
    }
  }

  private ensureMuseumInDirectory(museum: PlacesNearbyResult): void {
    this.museumDirectory.set(museum.placeId, museum);
  }

  private addOrUpdateGeofenceForMuseum(museum: PlacesNearbyResult): void {
    const geofence: Geofence = {
      id: museum.placeId,
      latitude: museum.location.lat,
      longitude: museum.location.lng,
      radius: this.geofenceRadius,
      identifier: museum.name,
    };
    geofencingService.addGeofence(geofence);
  }

  private markGeofenceCandidate(placeId: string): void {
    this.geofenceCandidate = {
      placeId,
      enteredAt: Date.now(),
    };
  }

  private confirmPendingGeofenceWithLocation(coords: LocationCoords): boolean {
    if (!this.geofenceCandidate) return false;

    const elapsed = Date.now() - this.geofenceCandidate.enteredAt;
    if (elapsed > this.geofenceConfirmationWindowMs) {
      this.geofenceCandidate = null;
      return false;
    }

    const museum = this.museumDirectory.get(this.geofenceCandidate.placeId);
    if (!museum) return false;

    const distance = this.calculateDistance(
      coords.latitude,
      coords.longitude,
      museum.location.lat,
      museum.location.lng
    );
    if (distance > this.gpsGeofenceConfirmationDistance) {
      return false;
    }

    this.setCurrentMuseum({
      placeId: museum.placeId,
      name: museum.name,
      location: museum.location,
      detectionMethod: 'geofence',
      confidence: 0.88,
      distance,
    });
    this.geofenceCandidate = null;
    return true;
  }

  private shouldReplaceCurrentMuseum(nextMuseum: DetectedMuseum): boolean {
    if (!this.currentMuseum) return true;

    const current = this.currentMuseum;
    if (current.placeId === nextMuseum.placeId) {
      const higherPriority = this.getMethodPriority(nextMuseum.detectionMethod) > this.getMethodPriority(current.detectionMethod);
      return higherPriority || nextMuseum.confidence > current.confidence;
    }

    const currentScore = current.confidence + this.getMethodPriority(current.detectionMethod) * 0.05;
    const nextScore = nextMuseum.confidence + this.getMethodPriority(nextMuseum.detectionMethod) * 0.05;
    return nextScore > currentScore + 0.08;
  }

  private getMethodPriority(method: DetectedMuseum['detectionMethod']): number {
    switch (method) {
      case 'beacon':
        return 4;
      case 'manual':
        return 3;
      case 'geofence':
        return 2;
      case 'gps':
      default:
        return 1;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const museumDetection = new MuseumDetectionService();
