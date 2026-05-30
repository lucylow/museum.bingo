import { NativeModules, Platform } from 'react-native';

type Capability = 'full' | 'limited' | 'none';

export class ARPerformanceManager {
  private static instance: ARPerformanceManager;

  private lowPowerMode = false;

  private arSessionActive = false;

  static getInstance(): ARPerformanceManager {
    if (!ARPerformanceManager.instance) {
      ARPerformanceManager.instance = new ARPerformanceManager();
    }
    return ARPerformanceManager.instance;
  }

  async checkDeviceCapabilities(): Promise<Capability> {
    if (Platform.OS === 'ios') {
      const hasARKitSupport = Boolean(NativeModules.ARConfettiModule);
      return hasARKitSupport ? 'full' : 'limited';
    }
    if (Platform.OS === 'android') {
      const hasARCoreBridge = Boolean(NativeModules.ARConfettiModule);
      return hasARCoreBridge ? 'full' : 'limited';
    }
    return 'none';
  }

  setSessionActive(active: boolean): void {
    this.arSessionActive = active;
  }

  shouldEnablePlaneDetection(): boolean {
    return !this.lowPowerMode;
  }

  setLowPowerMode(enabled: boolean): void {
    this.lowPowerMode = enabled;
    if (enabled && this.arSessionActive) {
      // Session tuning would be delegated to the native module if implemented.
    }
  }
}

export const arPerformanceManager = ARPerformanceManager.getInstance();
