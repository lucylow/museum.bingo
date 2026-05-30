import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';

const SOUND_SETTINGS_KEY = 'soundSettings';

const SOUNDS = {
  chipDrop: 'bingo_chip_drop.mp3',
  fanfare: 'fanfare_celebrate.mp3',
} as const;

interface SoundSettings {
  isEnabled: boolean;
  volume: number;
}

class SoundService {
  private static instance: SoundService;

  private sounds = new Map<string, Sound>();

  private initialized = false;

  private settings: SoundSettings = { isEnabled: true, volume: 0.8 };

  private constructor() {}

  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    Sound.setCategory('Playback');

    const saved = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
    if (saved) {
      try {
        this.settings = { ...this.settings, ...(JSON.parse(saved) as Partial<SoundSettings>) };
      } catch {
        // Ignore corrupt user settings and continue with defaults.
      }
    }

    await Promise.all(
      Object.entries(SOUNDS).map(
        ([key, filename]) =>
          new Promise<void>((resolve) => {
            const sound = new Sound(filename, Sound.MAIN_BUNDLE, () => resolve());
            this.sounds.set(key, sound);
          }),
      ),
    );
  }

  playChipDrop(): void {
    this.play('chipDrop');
  }

  playCelebration(): void {
    this.play('fanfare');
  }

  async updateSettings(settings: Partial<SoundSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  private play(key: keyof typeof SOUNDS): void {
    if (!this.settings.isEnabled) return;

    const sound = this.sounds.get(key);
    if (!sound) return;

    sound.setVolume(this.settings.volume);
    sound.stop(() => {
      sound.play();
    });
  }
}

export const soundService = SoundService.getInstance();
