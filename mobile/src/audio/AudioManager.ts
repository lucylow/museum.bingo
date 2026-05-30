import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Sound from 'react-native-sound';

export type AudioLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar' | 'ru';
export type VoiceGender = 'female' | 'male';

export interface AudioSettings {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  voiceLanguage: AudioLanguage;
  voiceGender: VoiceGender;
  voiceSpeed: number;
  voicePitch: number;
}

const AUDIO_SETTINGS_KEY = 'audioSettings';

const DEFAULT_SETTINGS: AudioSettings = {
  soundEnabled: true,
  voiceEnabled: true,
  voiceLanguage: 'en',
  voiceGender: 'female',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
};

const SOUNDS = {
  tileValidated: 'tile_validated.mp3',
  streakBonus: 'streak_bonus.mp3',
  lineComplete: 'line_complete.mp3',
  bingoWin: 'bingo_win.mp3',
  hintReceived: 'hint_received.mp3',
  scanStart: 'scan_start.mp3',
  scanError: 'scan_error.mp3',
  badgeUnlocked: 'badge_unlocked.mp3',
} as const;

type VoiceMap = Record<AudioLanguage, Record<VoiceGender, string>>;

const IOS_VOICE_IDS: VoiceMap = {
  en: { female: 'com.apple.ttsbundle.Samantha-compact', male: 'com.apple.ttsbundle.Tom-compact' },
  es: { female: 'com.apple.ttsbundle.Monica-compact', male: 'com.apple.ttsbundle.Jorge-compact' },
  fr: { female: 'com.apple.ttsbundle.Amelie-compact', male: 'com.apple.ttsbundle.Thomas-compact' },
  de: { female: 'com.apple.ttsbundle.Anna-compact', male: 'com.apple.ttsbundle.Markus-compact' },
  zh: { female: 'com.apple.ttsbundle.Ting-Ting-compact', male: 'com.apple.ttsbundle.Sin-ji-compact' },
  ar: { female: 'com.apple.ttsbundle.Maged-compact', male: 'com.apple.ttsbundle.Maged-compact' },
  ru: { female: 'com.apple.ttsbundle.Milena-compact', male: 'com.apple.ttsbundle.Yuri-compact' },
};

const ANDROID_LANGUAGE_CODES: VoiceMap = {
  en: { female: 'en-US', male: 'en-US' },
  es: { female: 'es-ES', male: 'es-ES' },
  fr: { female: 'fr-FR', male: 'fr-FR' },
  de: { female: 'de-DE', male: 'de-DE' },
  zh: { female: 'zh-CN', male: 'zh-CN' },
  ar: { female: 'ar-SA', male: 'ar-SA' },
  ru: { female: 'ru-RU', male: 'ru-RU' },
};

class AudioManager {
  private static instance: AudioManager;
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private sounds = new Map<string, Sound>();
  private initialized = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const saved = await AsyncStorage.getItem(AUDIO_SETTINGS_KEY);
    if (saved) {
      try {
        this.settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(saved) as Partial<AudioSettings>) };
      } catch {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    }

    Sound.setCategory('Playback', true);

    await Promise.all(
      Object.entries(SOUNDS).map(
        ([key, filename]) =>
          new Promise<void>((resolve) => {
            const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
              if (error) {
                console.warn(`Failed to load ${filename}`, error);
              }
              resolve();
            });
            this.sounds.set(key, sound);
          }),
      ),
    );

    this.initialized = true;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async updateSettings(next: Partial<AudioSettings>): Promise<void> {
    this.settings = { ...this.settings, ...next };
    await AsyncStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  playSound(soundKey: keyof typeof SOUNDS): void {
    if (!this.settings.soundEnabled) return;

    const sound = this.sounds.get(soundKey);
    if (!sound) return;

    sound.setVolume(0.8);
    sound.stop(() => {
      sound.play((success) => {
        if (!success) {
          console.warn(`Sound playback failed for ${soundKey}`);
        }
      });
    });
  }

  getLanguageVoice(language: AudioLanguage, gender: VoiceGender): string {
    const map = Platform.OS === 'ios' ? IOS_VOICE_IDS : ANDROID_LANGUAGE_CODES;
    return map[language]?.[gender] ?? map.en.female;
  }

  async cleanup(): Promise<void> {
    for (const sound of this.sounds.values()) {
      sound.release();
    }
    this.sounds.clear();
    this.initialized = false;
  }
}

export const audioManager = AudioManager.getInstance();
