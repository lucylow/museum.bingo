import Tts from 'react-native-tts';
import { audioManager, type AudioLanguage, type VoiceGender } from './AudioManager';

export interface TTSOptions {
  language?: AudioLanguage;
  gender?: VoiceGender;
  speed?: number;
  pitch?: number;
}

interface QueueItem {
  text: string;
  options: TTSOptions;
  priority: number;
}

class TextToSpeechService {
  private currentLanguage: AudioLanguage = 'en';
  private isSpeaking = false;
  private queue: QueueItem[] = [];
  private processing = false;
  private initialized = false;

  private toTtsLanguageCode(language: AudioLanguage): string {
    const map: Record<AudioLanguage, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      zh: 'zh-CN',
      ar: 'ar-SA',
      ru: 'ru-RU',
    };
    return map[language];
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    await Tts.getInitStatus();
    await Tts.setDefaultLanguage(this.toTtsLanguageCode(this.currentLanguage));

    Tts.addEventListener('tts-start', () => {
      this.isSpeaking = true;
    });
    Tts.addEventListener('tts-finish', () => {
      this.isSpeaking = false;
      this.processing = false;
      void this.processQueue();
    });
    Tts.addEventListener('tts-cancel', () => {
      this.isSpeaking = false;
      this.processing = false;
      void this.processQueue();
    });
    Tts.addEventListener('tts-error', (error) => {
      console.warn('TTS error', error);
      this.isSpeaking = false;
      this.processing = false;
      void this.processQueue();
    });

    this.initialized = true;
  }

  async setLanguage(language: AudioLanguage): Promise<void> {
    await this.ensureInitialized();
    this.currentLanguage = language;
    await Tts.setDefaultLanguage(this.toTtsLanguageCode(language));
    const settings = audioManager.getSettings();
    const voice = audioManager.getLanguageVoice(language, settings.voiceGender);
    try {
      await Tts.setDefaultVoice(voice);
    } catch {
      // Some devices do not expose all voices. Language fallback is enough.
    }
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!text.trim()) return;
    await this.ensureInitialized();

    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    const language = options.language ?? settings.voiceLanguage ?? this.currentLanguage;
    const speed = options.speed ?? settings.voiceSpeed;
    const pitch = options.pitch ?? settings.voicePitch;
    const gender = options.gender ?? settings.voiceGender;

    await Tts.stop();
    await Tts.setDefaultLanguage(this.toTtsLanguageCode(language));
    await Tts.setDefaultRate(speed);
    await Tts.setDefaultPitch(pitch);

    try {
      await Tts.setDefaultVoice(audioManager.getLanguageVoice(language, gender));
    } catch {
      // Keep speaking with default voice if specific voice selection fails.
    }

    Tts.speak(text);
  }

  async speakWithQueue(text: string, options: TTSOptions = {}, priority = 0): Promise<void> {
    if (!text.trim()) return;
    await this.ensureInitialized();

    this.queue.push({ text, options, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.isSpeaking || this.queue.length === 0) return;

    this.processing = true;
    const next = this.queue.shift();
    if (!next) {
      this.processing = false;
      return;
    }

    await this.speak(next.text, next.options);
  }

  async stop(): Promise<void> {
    this.queue = [];
    this.isSpeaking = false;
    this.processing = false;
    await Tts.stop();
  }

  async getAvailableVoices(): Promise<Array<{ language: string; name: string }>> {
    await this.ensureInitialized();
    const voices = (await Tts.voices()) as Array<{ language: string; name: string }>;
    return voices.map((voice) => ({ language: voice.language, name: voice.name }));
  }
}

export const tts = new TextToSpeechService();
