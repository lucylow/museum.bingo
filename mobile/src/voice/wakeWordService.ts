import { NativeModules, Platform } from 'react-native';

const { WakeWordModule } = NativeModules;

export interface WakeWordConfig {
  enabled: boolean;
  word: string;
  sensitivity: number;
}

export class WakeWordService {
  private static instance: WakeWordService;
  private isListening = false;
  private callback: (() => void) | null = null;

  static getInstance(): WakeWordService {
    if (!WakeWordService.instance) {
      WakeWordService.instance = new WakeWordService();
    }
    return WakeWordService.instance;
  }

  async initialize(config: WakeWordConfig): Promise<void> {
    if (!config.enabled) return;

    if (Platform.OS === 'ios') {
      await WakeWordModule?.initialize(config.word, config.sensitivity);
    } else {
      // Android native wake-word integration can be wired here.
    }
  }

  startListening(onWakeWordDetected: () => void): void {
    if (this.isListening) return;

    this.callback = onWakeWordDetected;
    if (Platform.OS === 'ios') {
      WakeWordModule?.startListening(() => this.callback?.());
    }
    this.isListening = true;
  }

  stopListening(): void {
    if (!this.isListening) return;

    if (Platform.OS === 'ios') {
      WakeWordModule?.stopListening();
    }
    this.isListening = false;
    this.callback = null;
  }
}
