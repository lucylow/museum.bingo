export type SessionMode =
  | 'solo'
  | 'multiplayer'
  | 'daily_challenge'
  | 'full_card'
  | 'family'
  | 'speed_run';

export type ResultType = 'success' | 'failure' | 'partial';

export type GameplayEventType =
  | 'scan_started'
  | 'scan_success'
  | 'scan_failure'
  | 'tile_completed'
  | 'streak_updated'
  | 'hint_used'
  | 'line_completed'
  | 'bingo_completed'
  | 'badge_unlocked'
  | 'room_joined'
  | 'room_left'
  | 'leaderboard_rank_changed'
  | 'session_started'
  | 'session_ended';

export interface BaseGameplayEvent {
  id: string;
  type: GameplayEventType;
  timestamp: number;
  userId: string;
  sessionId: string;
  roomId?: string | null;
  museumId?: string | null;
  tileId?: string | null;
  artworkId?: string | null;
  pointsGained?: number;
  streakBefore?: number;
  streakAfter?: number;
  resultType?: ResultType;
  metadata?: Record<string, unknown>;
}

export type ScanEvent = BaseGameplayEvent & {
  type: 'scan_started' | 'scan_success' | 'scan_failure';
  metadata?: {
    confidence?: number;
    validateDurationMs?: number;
    source?: string;
    [key: string]: unknown;
  };
};

export type ValidationEvent = BaseGameplayEvent & {
  type: 'tile_completed' | 'line_completed' | 'bingo_completed';
};

export type HintEvent = BaseGameplayEvent & {
  type: 'hint_used';
};

export type WinEvent = BaseGameplayEvent & {
  type: 'line_completed' | 'bingo_completed';
  metadata?: {
    bingoLinesCompleted?: number;
    fullCardCompleted?: boolean;
    rank?: number;
    [key: string]: unknown;
  };
};

export type RewardEvent = BaseGameplayEvent & {
  type: 'badge_unlocked';
  metadata?: {
    badgeId?: string;
    rarity?: string;
    category?: string;
    [key: string]: unknown;
  };
};

export type GameplayEvent = BaseGameplayEvent;

export interface AccuracyStat {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  accuracyPercentage: number;
  averageTimeToValidateMs: number;
  fastestTileCompletionMs: number | null;
}

export interface StreakStat {
  currentStreak: number;
  longestStreak: number;
  streakHistory: number[];
  longestRoomVictoryStreak: number;
}

export interface BadgeStat {
  totalBadgesEarned: number;
  byRarity: Record<string, number>;
  recentBadgeIds: string[];
  favoriteAchievementCategory: string | null;
}

export interface RoomStats {
  roomId: string;
  roomCode?: string;
  sessionsPlayed: number;
  playersJoined: number;
  activePlayers: number;
  rankHistory: number[];
  roomWinnerUserId?: string | null;
  scoreSpread: number;
  mostActivePlayerUserId?: string | null;
  totalTilesCompletedByRoom: number;
  fastestRoomBingoMs: number | null;
  tieBreakResults: number;
  totalWins: number;
  joinedAt: number;
  lastPlayedAt: number;
}

export interface MuseumStats {
  museumId: string;
  museumName?: string;
  sessionsPlayed: number;
  artworksScanned: number;
  tilesCompleted: number;
  timeSpentMs: number;
  averageScanSuccessRate: number;
  topMatchedArtworks: Record<string, number>;
  promptCategoryCompletion: Record<string, number>;
  hintsUsed: number;
  badgesEarned: number;
  lastPlayedAt: number;
}

export interface SessionStats {
  sessionId: string;
  mode: SessionMode;
  userId: string;
  museumId: string | null;
  roomId: string | null;
  startedAt: number;
  endedAt: number | null;
  totalSessionDurationMs: number;
  scansMade: number;
  validatedScans: number;
  failedScans: number;
  accuracy: number;
  streak: StreakStat;
  tilesCompleted: number;
  bingoLinesCompleted: number;
  bingosCompleted: number;
  fullCardCompletions: number;
  badgesEarned: number;
  pointsEarned: number;
  hintsUsed: number;
  finalRankInRoom: number | null;
  timeToFirstTileMs: number | null;
  timeToFirstBingoLineMs: number | null;
  timeToBingoCompletionMs: number | null;
  averageTimeToValidateMs: number;
  fastestTileCompletionMs: number | null;
}

export interface GameplaySession {
  sessionId: string;
  userId: string;
  museumId: string | null;
  roomId: string | null;
  mode: SessionMode;
  startedAt: number;
  lastUpdatedAt: number;
  partialSnapshot: ProgressSnapshot;
}

export interface LifetimeStats {
  userId: string;
  totalSessions: number;
  totalMuseumsVisited: number;
  totalScans: number;
  totalValidatedScans: number;
  totalFailedScans: number;
  averageAccuracy: number;
  averageTimeToValidateMs: number;
  totalTilesCompleted: number;
  totalBingos: number;
  totalFullCardCompletions: number;
  totalHintsUsed: number;
  totalBadges: number;
  totalRoomsJoined: number;
  bestRankAchieved: number | null;
  bestStreak: number;
  longestRoomVictoryStreak: number;
  totalPoints: number;
  favoriteMuseum: string | null;
  favoritePromptType: string | null;
  mostPlayedMode: SessionMode | null;
  fastestTileCompletionMs: number | null;
  fastestBingoCompletionMs: number | null;
  replayabilityInsights: string[];
  dailySummaries: Record<string, number>;
  weeklySummaries: Record<string, number>;
  monthlySummaries: Record<string, number>;
}

export interface ProgressSnapshot {
  timestamp: number;
  sessionStats: SessionStats;
  lifetimeStats: LifetimeStats;
  museumStats: MuseumStats | null;
  roomStats: RoomStats | null;
  accuracy: AccuracyStat;
  streak: StreakStat;
  badge: BadgeStat;
}
