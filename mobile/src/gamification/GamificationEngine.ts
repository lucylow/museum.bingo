import {
  Badge,
  BadgeEarned,
  GamificationConfig,
  GamificationState,
  ScoreEvent,
} from './types';

const DEFAULT_CONFIG: GamificationConfig = {
  basePointsPerTile: 10,
  streakMultiplierStart: 1.0,
  lineBonusPoints: 50,
  bingoBonusPoints: 150,
  badgeUnlockPoints: 20,
  maxStreakBonus: 2.0,
  streakResetTimeoutMs: 30000,
};

export class GamificationEngine {
  private config: GamificationConfig;

  private badges: Badge[];

  constructor(config: Partial<GamificationConfig> = {}, badgeList: Badge[]) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.badges = badgeList;
  }

  processTileValidation(
    currentState: GamificationState,
    tileId: string,
    isNewLine: boolean,
    isBingo: boolean
  ): { newState: GamificationState; scoreEvents: ScoreEvent[]; newBadges: BadgeEarned[] } {
    const now = Date.now();
    const events: ScoreEvent[] = [];
    const previousTiles = new Set(currentState.tilesValidated);
    if (previousTiles.has(tileId)) {
      return { newState: currentState, scoreEvents: [], newBadges: [] };
    }

    const newState: GamificationState = {
      ...currentState,
      badgesEarned: [...currentState.badgesEarned],
      tilesValidated: [...currentState.tilesValidated],
    };

    const timeSinceLast = now - currentState.lastActionTimestamp;
    const streakActive = timeSinceLast < this.config.streakResetTimeoutMs;
    const newStreak = streakActive ? currentState.currentStreak + 1 : 1;

    newState.currentStreak = newStreak;
    newState.bestStreak = Math.max(newState.bestStreak, newStreak);
    newState.lastActionTimestamp = now;

    let multiplier = this.config.streakMultiplierStart + (newStreak - 1) * 0.05;
    multiplier = Math.min(multiplier, this.config.maxStreakBonus);
    let pointsDelta = Math.round(this.config.basePointsPerTile * multiplier);

    events.push({
      type: 'tile_validated',
      points: pointsDelta,
      multiplier,
      metadata: { tileId },
    });

    if (newStreak >= 3) {
      events.push({
        type: 'streak_bonus',
        points: 0,
        metadata: { streak: newStreak, multiplier },
      });
    }

    if (isNewLine) {
      newState.linesCompleted += 1;
      pointsDelta += this.config.lineBonusPoints;
      events.push({ type: 'line_bonus', points: this.config.lineBonusPoints });
    }

    if (isBingo) {
      newState.bingosCompleted += 1;
      pointsDelta += this.config.bingoBonusPoints;
      events.push({ type: 'bingo_bonus', points: this.config.bingoBonusPoints });
    }

    newState.totalScore += pointsDelta;
    newState.tilesValidated.push(tileId);

    const newBadges = this.checkAndUnlockBadges(newState, currentState);
    for (const badge of newBadges) {
      events.push({ type: 'badge_bonus', points: this.config.badgeUnlockPoints });
      newState.totalScore += this.config.badgeUnlockPoints;
      newState.badgesEarned.push(badge);
    }

    return { newState, scoreEvents: events, newBadges };
  }

  updateRank(
    currentState: GamificationState,
    allScores: { userId: string; score: number }[]
  ): { newRank: number; rankChange: number } {
    const sorted = [...allScores].sort((a, b) => b.score - a.score);
    const found = sorted.findIndex((entry) => entry.userId === currentState.userId);
    const newRank = found >= 0 ? found + 1 : currentState.rank;
    const rankChange = currentState.rank - newRank;
    return { newRank, rankChange };
  }

  getScoreEventsForUI(events: ScoreEvent[]): { message: string; points: number; icon: string }[] {
    return events.map((event) => {
      switch (event.type) {
        case 'tile_validated':
          return { message: 'Artwork found!', points: event.points, icon: '🖼️' };
        case 'streak_bonus':
          return {
            message: `Streak ${String(event.metadata?.streak ?? '')}!`,
            points: 0,
            icon: '🔥',
          };
        case 'line_bonus':
          return { message: 'Line complete!', points: event.points, icon: '📏' };
        case 'bingo_bonus':
          return { message: 'BINGO!', points: event.points, icon: '🎉' };
        case 'badge_bonus':
          return { message: 'Badge unlocked!', points: event.points, icon: '🏅' };
        default:
          return { message: 'Points earned', points: event.points, icon: '⭐' };
      }
    });
  }

  private checkAndUnlockBadges(
    newState: GamificationState,
    oldState: GamificationState
  ): BadgeEarned[] {
    const earned: BadgeEarned[] = [];
    const alreadyHave = new Set(oldState.badgesEarned.map((badge) => badge.id));

    for (const badge of this.badges) {
      if (alreadyHave.has(badge.id)) {
        continue;
      }
      if (badge.unlockCondition(newState)) {
        earned.push({
          ...badge,
          earnedAt: Date.now(),
          notificationShown: false,
        });
      }
    }

    return earned;
  }
}
