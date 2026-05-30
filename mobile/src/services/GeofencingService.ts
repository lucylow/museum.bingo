import { Platform } from 'react-native';
import BackgroundGeolocation, { GeofenceEvent } from 'react-native-background-geolocation';

export interface Geofence {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  identifier: string;
}

class GeofencingService {
  private geofences: Geofence[] = [];

  private enteredGeofences = new Set<string>();

  private onEnterCallbacks = new Map<string, (geofence: Geofence) => void>();

  private onExitCallbacks = new Map<string, (geofence: Geofence) => void>();

  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10,
      stopOnTerminate: false,
      startOnBoot: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
    });

    BackgroundGeolocation.onGeofence((event) => {
      this.handleGeofenceEvent(event);
    });

    this.initialized = true;

    if (Platform.OS === 'android') {
      await BackgroundGeolocation.start();
    }
  }

  addGeofence(geofence: Geofence): void {
    if (this.geofences.find((entry) => entry.id === geofence.id)) return;
    this.geofences.push(geofence);

    void BackgroundGeolocation.addGeofence({
      identifier: geofence.id,
      radius: geofence.radius,
      latitude: geofence.latitude,
      longitude: geofence.longitude,
      notifyOnEntry: true,
      notifyOnExit: true,
      notifyOnDwell: false,
    });
  }

  addGeofenceListener(event: 'enter' | 'exit', geofenceId: string, callback: (geofence: Geofence) => void): void {
    const geofence = this.geofences.find((entry) => entry.id === geofenceId);
    if (!geofence) return;
    if (event === 'enter') {
      this.onEnterCallbacks.set(geofenceId, callback);
      return;
    }
    this.onExitCallbacks.set(geofenceId, callback);
  }

  async startMonitoringAll(): Promise<void> {
    await this.initialize();
    await BackgroundGeolocation.start();
    for (const geofence of this.geofences) {
      this.addGeofence(geofence);
    }
  }

  async stopMonitoring(): Promise<void> {
    await BackgroundGeolocation.stop();
    this.enteredGeofences.clear();
  }

  private handleGeofenceEvent(event: GeofenceEvent): void {
    const geofenceId = event.identifier;
    const geofence = this.geofences.find((entry) => entry.id === geofenceId);
    if (!geofence) return;

    if (event.action === 'ENTER') {
      if (!this.enteredGeofences.has(geofenceId)) {
        this.enteredGeofences.add(geofenceId);
        this.onEnterCallbacks.get(geofenceId)?.(geofence);
      }
      return;
    }

    if (event.action === 'EXIT') {
      this.enteredGeofences.delete(geofenceId);
      this.onExitCallbacks.get(geofenceId)?.(geofence);
    }
  }
}

export const geofencingService = new GeofencingService();
