export interface CompassReading {
  heading: number;
  accuracy: number;
  quality: 'reliable' | 'unreliable';
  interfering: boolean;
  timestamp: number;
}

type HeadingListener = (heading: number, accuracy: number, quality?: string, interfering?: boolean) => void;

type CompassModule = {
  requestPermission?: () => Promise<unknown>;
  setLocation?: (lat: number, lng: number) => void;
  addHeadingListener?: (listener: HeadingListener) => void | (() => void);
};

export class CompassService {
  private static instance: CompassService | null = null;

  private listeners = new Set<(reading: CompassReading) => void>();

  private initialized = false;

  private currentReading: CompassReading | null = null;

  private setLocationFn: ((lat: number, lng: number) => void) | null = null;

  private removeHeadingListener: (() => void) | null = null;

  private constructor() {}

  static getInstance(): CompassService {
    if (!CompassService.instance) {
      CompassService.instance = new CompassService();
    }
    return CompassService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const module = (await import('react-native-nitro-compass')) as CompassModule;
    if (module.requestPermission) {
      await module.requestPermission();
    }

    this.setLocationFn = module.setLocation ?? null;
    if (module.addHeadingListener) {
      const maybeUnsubscribe = module.addHeadingListener((heading, accuracy, quality, interfering) => {
        const normalizedHeading = ((heading % 360) + 360) % 360;
        const reliableByAccuracy = Number.isFinite(accuracy) ? accuracy <= 20 : false;
        const hasInterference = interfering === true;
        this.currentReading = {
          heading: normalizedHeading,
          accuracy: Number.isFinite(accuracy) ? accuracy : 999,
          quality: quality === 'reliable' && reliableByAccuracy && !hasInterference ? 'reliable' : 'unreliable',
          interfering: hasInterference,
          timestamp: Date.now(),
        };
        this.notifyListeners();
      });

      this.removeHeadingListener =
        typeof maybeUnsubscribe === 'function' ? maybeUnsubscribe : this.removeHeadingListener;
    }

    this.initialized = true;
  }

  updateUserLocation(lat: number, lng: number): void {
    if (!this.setLocationFn) return;
    this.setLocationFn(lat, lng);
  }

  addListener(listener: (reading: CompassReading) => void): () => void {
    this.listeners.add(listener);
    if (this.currentReading) {
      listener(this.currentReading);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentReading(): CompassReading | null {
    return this.currentReading;
  }

  shutdown(): void {
    this.removeHeadingListener?.();
    this.removeHeadingListener = null;
    this.listeners.clear();
    this.initialized = false;
  }

  private notifyListeners(): void {
    if (!this.currentReading) return;
    for (const listener of this.listeners) {
      listener(this.currentReading);
    }
  }
}
