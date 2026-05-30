import {
  BadgeStat,
  GameplayEvent,
  LifetimeStats,
  MuseumStats,
  ProgressSnapshot,
  RoomStats,
  SessionMode,
  SessionStats,
  StreakStat,
} from './types';

export const toDayKey = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);

export const toMonthKey = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 7);

export const toWeekKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const createEmptyStreak = (): StreakStat => ({
  currentStreak: 0,
  longestStreak: 0,
  streakHistory: [],
  longestRoomVictoryStreak: 0,
});

export const createEmptySessionStats = (
  sessionId: string,
  userId: string,
  mode: SessionMode,
  startedAt: number,
  museumId?: string | null,
  roomId?: string | null
): SessionStats => ({
  sessionId,
  mode,
  userId,
  museumId: museumId ?? null,
  roomId: roomId ?? null,
  startedAt,
  endedAt: null,
  totalSessionDurationMs: 0,
  scansMade: 0,
  validatedScans: 0,
  failedScans: 0,
  accuracy: 0,
  streak: createEmptyStreak(),
  tilesCompleted: 0,
  bingoLinesCompleted: 0,
  bingosCompleted: 0,
  fullCardCompletions: 0,
  badgesEarned: 0,
  pointsEarned: 0,
  hintsUsed: 0,
  finalRankInRoom: null,
  timeToFirstTileMs: null,
  timeToFirstBingoLineMs: null,
  timeToBingoCompletionMs: null,
  averageTimeToValidateMs: 0,
  fastestTileCompletionMs: null,
});

export const createEmptyLifetimeStats = (userId: string): LifetimeStats => ({
  userId,
  totalSessions: 0,
  totalMuseumsVisited: 0,
  totalScans: 0,
  totalValidatedScans: 0,
  totalFailedScans: 0,
  averageAccuracy: 0,
  averageTimeToValidateMs: 0,
  totalTilesCompleted: 0,
  totalBingos: 0,
  totalFullCardCompletions: 0,
  totalHintsUsed: 0,
  totalBadges: 0,
  totalRoomsJoined: 0,
  bestRankAchieved: null,
  bestStreak: 0,
  longestRoomVictoryStreak: 0,
  totalPoints: 0,
  favoriteMuseum: null,
  favoritePromptType: null,
  mostPlayedMode: null,
  fastestTileCompletionMs: null,
  fastestBingoCompletionMs: null,
  replayabilityInsights: [],
  dailySummaries: {},
  weeklySummaries: {},
  monthlySummaries: {},
});

export const updateAccuracy = (validatedScans: number, scansMade: number): number => {
  if (scansMade <= 0) {
    return 0;
  }
  return Math.round((validatedScans / scansMade) * 1000) / 10;
};

export const incrementMapCount = (map: Record<string, number>, key: string, step = 1): Record<string, number> => ({
  ...map,
  [key]: (map[key] ?? 0) + step,
});

export const getOrCreateMuseumStats = (
  statsByMuseum: Record<string, MuseumStats>,
  museumId: string
): MuseumStats =>
  statsByMuseum[museumId] ?? {
    museumId,
    sessionsPlayed: 0,
    artworksScanned: 0,
    tilesCompleted: 0,
    timeSpentMs: 0,
    averageScanSuccessRate: 0,
    topMatchedArtworks: {},
    promptCategoryCompletion: {},
    hintsUsed: 0,
    badgesEarned: 0,
    lastPlayedAt: Date.now(),
  };

export const getOrCreateRoomStats = (statsByRoom: Record<string, RoomStats>, roomId: string): RoomStats =>
  statsByRoom[roomId] ?? {
    roomId,
    sessionsPlayed: 0,
    playersJoined: 0,
    activePlayers: 0,
    rankHistory: [],
    roomWinnerUserId: null,
    scoreSpread: 0,
    mostActivePlayerUserId: null,
    totalTilesCompletedByRoom: 0,
    fastestRoomBingoMs: null,
    tieBreakResults: 0,
    totalWins: 0,
    joinedAt: Date.now(),
    lastPlayedAt: Date.now(),
  };

export const summarizeReplayabilityInsights = (
  lifetime: LifetimeStats,
  museumStats: Record<string, MuseumStats>
): string[] => {
  const insights: string[] = [];
  if (lifetime.averageAccuracy < 60) {
    insights.push('Try heat-vision hints to improve scan accuracy.');
  } else if (lifetime.averageAccuracy >= 85) {
    insights.push('High scan accuracy detected, speed-run mode is a great fit.');
  }
  if (lifetime.bestStreak < 5) {
    insights.push('Build a longer streak by chaining quick validations.');
  }
  const topMuseum = Object.values(museumStats).sort((a, b) => b.sessionsPlayed - a.sessionsPlayed)[0];
  if (topMuseum) {
    insights.push(`You play most at ${topMuseum.museumName ?? topMuseum.museumId}.`);
  }
  return insights.slice(0, 3);
};

export const createBadgeStat = (events: GameplayEvent[]): BadgeStat => {
  const unlocked = events.filter((event) => event.type === 'badge_unlocked');
  const byRarity = unlocked.reduce<Record<string, number>>((acc, event) => {
    const rarity = String(event.metadata?.rarity ?? 'unknown');
    acc[rarity] = (acc[rarity] ?? 0) + 1;
    return acc;
  }, {});
  return {
    totalBadgesEarned: unlocked.length,
    byRarity,
    recentBadgeIds: unlocked
      .slice(-5)
      .map((event) => String(event.metadata?.badgeId ?? 'unknown'))
      .reverse(),
    favoriteAchievementCategory:
      unlocked.length > 0 ? String(unlocked[unlocked.length - 1]?.metadata?.category ?? 'general') : null,
  };
};

export const createProgressSnapshot = (
  sessionStats: SessionStats,
  lifetimeStats: LifetimeStats,
  museumStats: MuseumStats | null,
  roomStats: RoomStats | null,
  events: GameplayEvent[]
): ProgressSnapshot => ({
  timestamp: Date.now(),
  sessionStats,
  lifetimeStats,
  museumStats,
  roomStats,
  accuracy: {
    totalScans: sessionStats.scansMade,
    successfulScans: sessionStats.validatedScans,
    failedScans: sessionStats.failedScans,
    accuracyPercentage: sessionStats.accuracy,
    averageTimeToValidateMs: sessionStats.averageTimeToValidateMs,
    fastestTileCompletionMs: sessionStats.fastestTileCompletionMs,
  },
  streak: sessionStats.streak,
  badge: createBadgeStat(events),
});
