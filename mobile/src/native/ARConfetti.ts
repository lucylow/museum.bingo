import { NativeModules } from 'react-native';

type StartCallback = (success: boolean, message: string) => void;

type NativeARConfettiModule = {
  startConfetti?: (callback: StartCallback) => void;
  startConfettiWithPlaneDetection?: (callback: StartCallback) => void;
  stopConfetti?: () => void;
};

const { ARConfettiModule } = NativeModules as {
  ARConfettiModule?: NativeARConfettiModule;
};

export interface ARConfettiEvents {
  onConfettiStarted?: () => void;
  onConfettiStopped?: () => void;
  onError?: (message: string) => void;
}

class ARConfettiManager {
  private static instance: ARConfettiManager;

  private isActive = false;

  private events: ARConfettiEvents = {};

  static getInstance(): ARConfettiManager {
    if (!ARConfettiManager.instance) {
      ARConfettiManager.instance = new ARConfettiManager();
    }
    return ARConfettiManager.instance;
  }

  async start(events?: ARConfettiEvents): Promise<boolean> {
    if (this.isActive) return false;

    if (!ARConfettiModule) {
      events?.onError?.('AR native module is unavailable on this build.');
      return false;
    }

    const startFn =
      ARConfettiModule.startConfettiWithPlaneDetection ?? ARConfettiModule.startConfetti;
    if (!startFn) {
      events?.onError?.('AR confetti start method is not implemented.');
      return false;
    }

    this.events = events ?? {};

    return new Promise((resolve) => {
      startFn((success, message) => {
        if (!success) {
          this.events.onError?.(message || 'Failed to start AR confetti.');
          resolve(false);
          return;
        }

        this.isActive = true;
        this.events.onConfettiStarted?.();
        resolve(true);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isActive) return;
    ARConfettiModule?.stopConfetti?.();
    this.isActive = false;
    this.events.onConfettiStopped?.();
  }

  isConfettiActive(): boolean {
    return this.isActive;
  }
}

export const arConfetti = ARConfettiManager.getInstance();
