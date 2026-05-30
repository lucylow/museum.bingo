import { AccessibilityInfo, Platform } from 'react-native';
import { type AudioLanguage, audioManager } from './AudioManager';
import { tts } from './TextToSpeechService';

export interface ScreenReaderAnnouncement {
  screen: string;
  element: string;
  action: string;
  details?: string;
}

class AudioAccessibility {
  private isScreenReaderEnabled = false;

  constructor() {
    void this.checkScreenReader();
  }

  private async checkScreenReader(): Promise<void> {
    this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      this.isScreenReaderEnabled = enabled;
    });
  }

  async announceToScreenReader(announcement: ScreenReaderAnnouncement): Promise<void> {
    const settings = audioManager.getSettings();

    if (this.isScreenReaderEnabled && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(
        `${announcement.screen}: ${announcement.element} ${announcement.action}`,
      );
      return;
    }

    if (settings.voiceEnabled) {
      const details = announcement.details ? ` ${announcement.details}` : '';
      const text = `${announcement.screen}. ${announcement.element} ${announcement.action}.${details}`;
      await tts.speak(text, { language: settings.voiceLanguage });
    }
  }

  async announceGameState(
    tilesCompleted: number,
    totalTiles: number,
    currentScore: number,
  ): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    const stateTexts: Record<AudioLanguage, string> = {
      en: `You completed ${tilesCompleted} out of ${totalTiles} tiles. Current score: ${currentScore} points.`,
      es: `Completaste ${tilesCompleted} de ${totalTiles} casillas. Puntuacion actual: ${currentScore} puntos.`,
      fr: `Vous avez complete ${tilesCompleted} cases sur ${totalTiles}. Score actuel: ${currentScore} points.`,
      de: `Du hast ${tilesCompleted} von ${totalTiles} Feldern geschafft. Aktueller Punktestand: ${currentScore}.`,
      zh: `你已完成 ${tilesCompleted}/${totalTiles} 个格子。当前得分：${currentScore} 分。`,
      ar: `لقد اكملت ${tilesCompleted} من ${totalTiles} مربعات. النتيجة الحالية: ${currentScore} نقطة.`,
      ru: `Вы завершили ${tilesCompleted} из ${totalTiles} ячеек. Текущий счет: ${currentScore}.`,
    };

    await tts.speak(stateTexts[settings.voiceLanguage] ?? stateTexts.en, {
      language: settings.voiceLanguage,
    });
  }

  async announceLeaderboardPosition(rank: number, totalPlayers: number): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    const positionTexts: Record<AudioLanguage, string> = {
      en: `You are in position ${rank} out of ${totalPlayers} players.`,
      es: `Estas en la posicion ${rank} de ${totalPlayers} jugadores.`,
      fr: `Vous etes en position ${rank} sur ${totalPlayers} joueurs.`,
      de: `Du bist auf Platz ${rank} von ${totalPlayers} Spielern.`,
      zh: `你在 ${totalPlayers} 位玩家中排名第 ${rank}。`,
      ar: `انت في المركز ${rank} من اصل ${totalPlayers} لاعب.`,
      ru: `Вы занимаете ${rank} место из ${totalPlayers} игроков.`,
    };

    await tts.speak(positionTexts[settings.voiceLanguage] ?? positionTexts.en, {
      language: settings.voiceLanguage,
    });
  }

  async announceMultiplayerEvent(
    playerName: string,
    event: 'joined' | 'completed_tile' | 'got_bingo' | 'left',
    points?: number,
  ): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled) return;

    const eventTexts: Record<typeof event, Record<AudioLanguage, string>> = {
      joined: {
        en: `${playerName} joined the room.`,
        es: `${playerName} se unio a la sala.`,
        fr: `${playerName} a rejoint la salle.`,
        de: `${playerName} ist dem Raum beigetreten.`,
        zh: `${playerName} 加入了房间。`,
        ar: `انضم ${playerName} الى الغرفة.`,
        ru: `${playerName} присоединился к комнате.`,
      },
      completed_tile: {
        en: `${playerName} completed a tile and earned ${points ?? 0} points.`,
        es: `${playerName} completo una casilla y gano ${points ?? 0} puntos.`,
        fr: `${playerName} a complete une case et a gagne ${points ?? 0} points.`,
        de: `${playerName} hat ein Feld abgeschlossen und ${points ?? 0} Punkte erhalten.`,
        zh: `${playerName} 完成了一个格子，获得 ${points ?? 0} 分。`,
        ar: `اكمل ${playerName} مربعا وحصل على ${points ?? 0} نقطة.`,
        ru: `${playerName} завершил ячейку и получил ${points ?? 0} очков.`,
      },
      got_bingo: {
        en: `${playerName} got Bingo. Congratulations!`,
        es: `${playerName} hizo Bingo. Felicitaciones.`,
        fr: `${playerName} a fait Bingo. Felicitations.`,
        de: `${playerName} hat Bingo. Glueckwunsch.`,
        zh: `${playerName} 获得了宾果，恭喜！`,
        ar: `حقق ${playerName} بنغو. تهانينا.`,
        ru: `${playerName} сделал бинго. Поздравляем.`,
      },
      left: {
        en: `${playerName} left the room.`,
        es: `${playerName} salio de la sala.`,
        fr: `${playerName} a quitte la salle.`,
        de: `${playerName} hat den Raum verlassen.`,
        zh: `${playerName} 离开了房间。`,
        ar: `غادر ${playerName} الغرفة.`,
        ru: `${playerName} покинул комнату.`,
      },
    };

    await tts.speak(eventTexts[event][settings.voiceLanguage] ?? eventTexts[event].en, {
      language: settings.voiceLanguage,
    });
  }

  async announceBadgeCollection(badges: Array<{ name: string; rarity: string }>): Promise<void> {
    const settings = audioManager.getSettings();
    if (!settings.voiceEnabled || badges.length === 0) return;

    const badgeList = badges.map((badge) => `${badge.name} (${badge.rarity})`).join(', ');
    const text = `You earned ${badges.length} new badges: ${badgeList}.`;
    await tts.speak(text, { language: settings.voiceLanguage });
  }
}

export const audioAccessibility = new AudioAccessibility();
