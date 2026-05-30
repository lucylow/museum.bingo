import { type AudioLanguage, audioManager } from './AudioManager';
import { tts } from './TextToSpeechService';
import { voiceHintSystem } from './VoiceHintSystem';

export type AudioEventType =
  | 'GAME_START'
  | 'TILE_VALIDATED'
  | 'STREAK_BONUS'
  | 'LINE_COMPLETE'
  | 'BINGO_COMPLETE'
  | 'HINT_REQUESTED'
  | 'BADGE_UNLOCKED'
  | 'ROOM_JOINED'
  | 'ROOM_LEFT'
  | 'SCAN_ERROR'
  | 'SESSION_COMPLETE';

export interface AudioEventPayload {
  type: AudioEventType;
  data: Record<string, unknown>;
  timestamp: number;
  priority: number;
}

class AudioEventBus {
  private eventQueue: AudioEventPayload[] = [];
  private isProcessing = false;
  private readonly debounceMs = 500;
  private lastEventTime: Partial<Record<AudioEventType, number>> = {};

  emit(event: AudioEventType, data: Record<string, unknown>, priority = 5): void {
    const now = Date.now();
    const lastTime = this.lastEventTime[event] ?? 0;
    if (now - lastTime < this.debounceMs) return;
    this.lastEventTime[event] = now;

    this.eventQueue.push({
      type: event,
      data,
      timestamp: now,
      priority,
    });
    this.eventQueue.sort((a, b) => b.priority - a.priority);
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    const next = this.eventQueue.shift();
    if (next) {
      await this.handle(next);
    }
    this.isProcessing = false;

    if (this.eventQueue.length > 0) {
      setTimeout(() => {
        void this.processQueue();
      }, 100);
    }
  }

  private async handle(payload: AudioEventPayload): Promise<void> {
    switch (payload.type) {
      case 'TILE_VALIDATED':
        await this.handleTileValidated(payload.data);
        break;
      case 'STREAK_BONUS':
        await this.handleStreakBonus(payload.data);
        break;
      case 'LINE_COMPLETE':
        await this.handleLineComplete(payload.data);
        break;
      case 'BINGO_COMPLETE':
        await this.handleBingoComplete(payload.data);
        break;
      case 'HINT_REQUESTED':
        await this.handleHintRequested(payload.data);
        break;
      case 'BADGE_UNLOCKED':
        await this.handleBadgeUnlocked(payload.data);
        break;
      case 'SCAN_ERROR':
        await this.handleScanError(payload.data);
        break;
      default:
        break;
    }
  }

  private async handleTileValidated(data: Record<string, unknown>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;
    audioManager.playSound('tileValidated');

    const points = Number(data.points ?? 0);
    const tileId = String(data.tileId ?? '');
    const message = tileId
      ? `Tile ${tileId} validated. Plus ${points} points.`
      : `Tile validated. Plus ${points} points.`;

    await tts.speakWithQueue(message, { language: settings.voiceLanguage }, 8);
  }

  private async handleStreakBonus(data: Record<string, unknown>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;
    audioManager.playSound('streakBonus');

    const streak = Number(data.streak ?? 0);
    const bonus = Number(data.bonus ?? 0);
    await tts.speakWithQueue(
      `Streak bonus. ${streak} in a row. Plus ${bonus} points.`,
      { language: settings.voiceLanguage },
      9,
    );
  }

  private async handleLineComplete(data: Record<string, unknown>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;
    audioManager.playSound('lineComplete');

    const bonus = Number(data.bonus ?? 0);
    await tts.speakWithQueue(
      `Line complete. Plus ${bonus} bonus points.`,
      { language: settings.voiceLanguage },
      10,
    );
  }

  private async handleBingoComplete(data: Record<string, unknown>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;
    audioManager.playSound('bingoWin');

    const bonus = Number(data.bonus ?? 0);
    await tts.speakWithQueue(
      `Bingo complete. You earned ${bonus} points.`,
      { language: settings.voiceLanguage },
      10,
    );
  }

  private async handleHintRequested(data: Record<string, unknown>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;
    audioManager.playSound('hintReceived');

    await voiceHintSystem.provideHint({
      id: String(data.hintId ?? `hint-${Date.now().toString()}`),
      type: 'contextual',
      text: String(data.hintText ?? 'Try scanning a nearby artwork.'),
      priority: 7,
    });
  }

  private async handleBadgeUnlocked(data: Record<string, unknown>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;
    audioManager.playSound('badgeUnlocked');

    const badgeName = String(data.badgeName ?? 'New badge');
    await tts.speakWithQueue(
      `New badge unlocked: ${badgeName}.`,
      { language: settings.voiceLanguage },
      9,
    );
  }

  private async handleScanError(data: Record<string, unknown>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;
    audioManager.playSound('scanError');

    const errorMessages: Record<string, Record<AudioLanguage, string>> = {
      low_light: {
        en: 'Low light detected. Try moving to a brighter area.',
        es: 'Se detecto poca luz. Ve a un area mas iluminada.',
        fr: 'Faible luminosite detectee. Allez dans une zone plus lumineuse.',
        de: 'Wenig Licht erkannt. Gehe in einen helleren Bereich.',
        zh: '检测到光线不足。请前往更明亮的区域。',
        ar: 'تم اكتشاف اضاءة منخفضة. انتقل الى منطقة اكثر سطوعا.',
        ru: 'Обнаружено низкое освещение. Перейдите в более светлое место.',
      },
      too_far: {
        en: 'You are too far from the artwork. Move closer to scan.',
        es: 'Estas demasiado lejos de la obra. Acercate para escanear.',
        fr: 'Vous etes trop loin de l oeuvre. Rapprochez vous pour scanner.',
        de: 'Du bist zu weit vom Kunstwerk entfernt. Geh naeher heran.',
        zh: '你离艺术品太远了，请靠近后再扫描。',
        ar: 'انت بعيد جدا عن العمل الفني. اقترب للمسح.',
        ru: 'Вы слишком далеко от произведения. Подойдите ближе для сканирования.',
      },
    };

    const errorType = String(data.errorType ?? 'low_light');
    const localized =
      errorMessages[errorType]?.[settings.voiceLanguage] ??
      errorMessages[errorType]?.en ??
      'Could not recognize this artwork. Please try again.';

    await tts.speakWithQueue(localized, { language: settings.voiceLanguage }, 5);
  }
}

export const audioEventBus = new AudioEventBus();
