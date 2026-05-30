import { type AudioLanguage, audioManager } from './AudioManager';
import { formatMessage, VOICE_MESSAGES } from './MessageTemplates';
import { tts } from './TextToSpeechService';

export interface VoiceHint {
  id: string;
  type: 'visual' | 'location' | 'contextual' | 'educational';
  text: string;
  priority: number;
}

type Direction = 'left' | 'right' | 'ahead' | 'behind' | 'upstairs' | 'downstairs';
type ComparisonRelation = 'similar' | 'different' | 'nearby';

class VoiceHintSystem {
  private activeHints = new Map<string, VoiceHint>();
  private hintHistory: string[] = [];

  async provideHint(hint: VoiceHint, options?: { interrupt?: boolean }): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    if (options?.interrupt) {
      await tts.stop();
    }

    const message = VOICE_MESSAGES.hintProvided;
    const text = formatMessage(message, settings.voiceLanguage, { hintText: hint.text });
    await tts.speak(text, { language: settings.voiceLanguage });

    this.hintHistory.push(hint.id);
    this.activeHints.set(hint.id, hint);
  }

  async provideArtworkContext(artworkTitle: string, artist: string, period: string): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    const contextTexts: Record<AudioLanguage, string> = {
      en: `This is ${artworkTitle} by ${artist}, from the ${period} period.`,
      es: `Esta es ${artworkTitle} de ${artist}, del periodo ${period}.`,
      fr: `Ceci est ${artworkTitle} par ${artist}, de la periode ${period}.`,
      de: `Dies ist ${artworkTitle} von ${artist}, aus der ${period} Periode.`,
      zh: `这是 ${artist} 的 ${artworkTitle}，来自 ${period} 时期。`,
      ar: `هذا هو ${artworkTitle} للفنان ${artist} من فترة ${period}.`,
      ru: `Это ${artworkTitle} автора ${artist}, период ${period}.`,
    };

    const text = contextTexts[settings.voiceLanguage] ?? contextTexts.en;
    await tts.speak(text, { language: settings.voiceLanguage });
  }

  async provideDirectionalHint(direction: Direction, distanceMeters: number): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    const directionTexts: Record<AudioLanguage, Record<Direction, string>> = {
      en: {
        left: `Look to your left, about ${distanceMeters} meters away.`,
        right: `Look to your right, about ${distanceMeters} meters away.`,
        ahead: `Look straight ahead, about ${distanceMeters} meters away.`,
        behind: `Turn around, the artwork is behind you, about ${distanceMeters} meters away.`,
        upstairs: `Go upstairs, about ${distanceMeters} meters away.`,
        downstairs: `Go downstairs, about ${distanceMeters} meters away.`,
      },
      es: {
        left: `Mira a tu izquierda, a unos ${distanceMeters} metros.`,
        right: `Mira a tu derecha, a unos ${distanceMeters} metros.`,
        ahead: `Mira al frente, a unos ${distanceMeters} metros.`,
        behind: `Date la vuelta, la obra esta detras de ti, a unos ${distanceMeters} metros.`,
        upstairs: `Sube las escaleras, a unos ${distanceMeters} metros.`,
        downstairs: `Baja las escaleras, a unos ${distanceMeters} metros.`,
      },
      fr: {
        left: `Regardez a gauche, a environ ${distanceMeters} metres.`,
        right: `Regardez a droite, a environ ${distanceMeters} metres.`,
        ahead: `Regardez droit devant, a environ ${distanceMeters} metres.`,
        behind: `Tournez-vous, l oeuvre est derriere vous, a environ ${distanceMeters} metres.`,
        upstairs: `Montez a l etage, a environ ${distanceMeters} metres.`,
        downstairs: `Descendez a l etage inferieur, a environ ${distanceMeters} metres.`,
      },
      de: {
        left: `Schau nach links, etwa ${distanceMeters} Meter entfernt.`,
        right: `Schau nach rechts, etwa ${distanceMeters} Meter entfernt.`,
        ahead: `Schau geradeaus, etwa ${distanceMeters} Meter entfernt.`,
        behind: `Dreh dich um, das Kunstwerk ist hinter dir, etwa ${distanceMeters} Meter entfernt.`,
        upstairs: `Geh nach oben, etwa ${distanceMeters} Meter entfernt.`,
        downstairs: `Geh nach unten, etwa ${distanceMeters} Meter entfernt.`,
      },
      zh: {
        left: `请看左边，大约 ${distanceMeters} 米远。`,
        right: `请看右边，大约 ${distanceMeters} 米远。`,
        ahead: `请直视前方，大约 ${distanceMeters} 米远。`,
        behind: `请转身，艺术品在你身后，大约 ${distanceMeters} 米远。`,
        upstairs: `请上楼，大约 ${distanceMeters} 米远。`,
        downstairs: `请下楼，大约 ${distanceMeters} 米远。`,
      },
      ar: {
        left: `انظر الى اليسار، على بعد حوالي ${distanceMeters} متر.`,
        right: `انظر الى اليمين، على بعد حوالي ${distanceMeters} متر.`,
        ahead: `انظر مباشرة الى الامام، على بعد حوالي ${distanceMeters} متر.`,
        behind: `استدر، العمل الفني خلفك، على بعد حوالي ${distanceMeters} متر.`,
        upstairs: `اصعد الى الطابق العلوي، على بعد حوالي ${distanceMeters} متر.`,
        downstairs: `انزل الى الطابق السفلي، على بعد حوالي ${distanceMeters} متر.`,
      },
      ru: {
        left: `Посмотрите налево, примерно ${distanceMeters} метров.`,
        right: `Посмотрите направо, примерно ${distanceMeters} метров.`,
        ahead: `Посмотрите прямо, примерно ${distanceMeters} метров.`,
        behind: `Повернитесь, произведение позади вас, примерно ${distanceMeters} метров.`,
        upstairs: `Поднимитесь наверх, примерно ${distanceMeters} метров.`,
        downstairs: `Спуститесь вниз, примерно ${distanceMeters} метров.`,
      },
    };

    const text =
      directionTexts[settings.voiceLanguage]?.[direction] ?? directionTexts.en[direction];

    await tts.speak(text, { language: settings.voiceLanguage });
  }

  async provideComparisonHint(
    _currentArtwork: string,
    compareArtwork: string,
    relation: ComparisonRelation,
  ): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    let text = '';
    switch (relation) {
      case 'similar':
        text = `This artwork looks similar to ${compareArtwork}. Try comparing the brushwork.`;
        break;
      case 'different':
        text = `Unlike ${compareArtwork}, this piece uses different materials.`;
        break;
      case 'nearby':
        text = `${compareArtwork} is located in the same gallery, about 10 meters away.`;
        break;
      default:
        text = `Compare this artwork with ${compareArtwork}.`;
        break;
    }

    await tts.speak(text, { language: settings.voiceLanguage });
  }

  async provideEducationalFact(artworkTitle: string, fact: string): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    const factTexts: Record<AudioLanguage, string> = {
      en: `Did you know this about ${artworkTitle}? ${fact}`,
      es: `Sabias esto sobre ${artworkTitle}? ${fact}`,
      fr: `Saviez vous cela sur ${artworkTitle}? ${fact}`,
      de: `Wusstest du das uber ${artworkTitle}? ${fact}`,
      zh: `你知道关于 ${artworkTitle} 的这个事实吗？${fact}`,
      ar: `هل تعلم هذه المعلومة عن ${artworkTitle}؟ ${fact}`,
      ru: `Знали ли вы это о ${artworkTitle}? ${fact}`,
    };

    const text = factTexts[settings.voiceLanguage] ?? factTexts.en;
    await tts.speak(text, { language: settings.voiceLanguage });
  }

  clearHints(): void {
    this.activeHints.clear();
  }

  getHintHistory(): string[] {
    return [...this.hintHistory];
  }
}

export const voiceHintSystem = new VoiceHintSystem();
