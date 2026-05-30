export interface GamificationState {
  userId: string;
  sessionId: string;
  museumId: string;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  tilesValidated: string[];
  linesCompleted: number;
  bingosCompleted: number;
  badgesEarned: BadgeEarned[];
  rank: number;
  rankChange: number;
  lastActionTimestamp: number;
}

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  rarity: BadgeRarity;
  unlockCondition: (state: GamificationState) => boolean;
}

export interface BadgeEarned extends Badge {
  earnedAt: number;
  notificationShown: boolean;
}

export type ScoreEventType =
  | 'tile_validated'
  | 'streak_bonus'
  | 'line_bonus'
  | 'bingo_bonus'
  | 'badge_bonus';

export interface ScoreEvent {
  type: ScoreEventType;
  points: number;
  multiplier?: number;
  metadata?: Record<string, unknown>;
}

export interface GamificationConfig {
  basePointsPerTile: number;
  streakMultiplierStart: number;
  lineBonusPoints: number;
  bingoBonusPoints: number;
  badgeUnlockPoints: number;
  maxStreakBonus: number;
  streakResetTimeoutMs: number;
}
