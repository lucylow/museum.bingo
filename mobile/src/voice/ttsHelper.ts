import Sound from 'react-native-sound';
import { VoiceConfig } from './commandTypes';

class TTSHelper {
  private static instance: TTSHelper;
  private isSpeaking = false;
  private queue: string[] = [];

  static getInstance(): TTSHelper {
    if (!TTSHelper.instance) {
      TTSHelper.instance = new TTSHelper();
    }
    return TTSHelper.instance;
  }

  async speak(text: string, config: VoiceConfig, onComplete?: () => void): Promise<void> {
    if (!text.trim()) return;

    this.queue.push(text);
    if (!this.isSpeaking) {
      await this.processQueue(config, onComplete);
    }
  }

  private async processQueue(config: VoiceConfig, onComplete?: () => void): Promise<void> {
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      onComplete?.();
      return;
    }

    this.isSpeaking = true;
    const text = this.queue.shift();
    if (!text) {
      this.isSpeaking = false;
      return;
    }

    const voice = config.language === 'en' ? 'Brian' : 'Joanna';
    const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;
    const sound = new Sound(ttsUrl, '', (error) => {
      if (error) {
        console.warn('TTS error:', error);
        void this.processQueue(config, onComplete);
        return;
      }

      sound.play(() => {
        sound.release();
        void this.processQueue(config, onComplete);
      });
    });
  }

  stopSpeaking(): void {
    this.queue = [];
    this.isSpeaking = false;
  }
}

export default TTSHelper;
