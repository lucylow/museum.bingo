import {
  GameplayEvent,
  LifetimeStats,
  MuseumStats,
  ProgressSnapshot,
  RoomStats,
  SessionStats,
} from './types';
import {
  createProgressSnapshot,
  getOrCreateMuseumStats,
  getOrCreateRoomStats,
  incrementMapCount,
  summarizeReplayabilityInsights,
  toDayKey,
  toMonthKey,
  toWeekKey,
  updateAccuracy,
} from './helpers';

const average = (currentAverage: number, currentCount: number, incomingValue: number): number =>
  (currentAverage * currentCount + incomingValue) / Math.max(1, currentCount + 1);

export const applyEventToSessionStats = (session: SessionStats, event: GameplayEvent): SessionStats => {
  const next = {
    ...session,
    streak: { ...session.streak, streakHistory: [...session.streak.streakHistory] },
  };
  const elapsed = Math.max(0, event.timestamp - session.startedAt);

  switch (event.type) {
    case 'scan_started':
      next.scansMade += 1;
      break;
    case 'scan_success':
      next.validatedScans += 1;
      if (next.timeToFirstTileMs === null) {
        next.timeToFirstTileMs = elapsed;
      }
      if (typeof event.metadata?.validateDurationMs === 'number') {
        next.averageTimeToValidateMs = average(
          next.averageTimeToValidateMs,
          Math.max(0, next.validatedScans - 1),
          event.metadata.validateDurationMs
        );
      }
      if (next.fastestTileCompletionMs === null || elapsed < next.fastestTileCompletionMs) {
        next.fastestTileCompletionMs = elapsed;
      }
      break;
    case 'scan_failure':
      next.failedScans += 1;
      break;
    case 'tile_completed':
      next.tilesCompleted += 1;
      break;
    case 'streak_updated': {
      const streakAfter = event.streakAfter ?? next.streak.currentStreak;
      next.streak.currentStreak = streakAfter;
      next.streak.longestStreak = Math.max(next.streak.longestStreak, streakAfter);
      next.streak.streakHistory.push(streakAfter);
      break;
    }
    case 'hint_used':
      next.hintsUsed += 1;
      break;
    case 'line_completed':
      next.bingoLinesCompleted += 1;
      if (next.timeToFirstBingoLineMs === null) {
        next.timeToFirstBingoLineMs = elapsed;
      }
      break;
    case 'bingo_completed':
      next.bingosCompleted += 1;
      if (next.timeToBingoCompletionMs === null) {
        next.timeToBingoCompletionMs = elapsed;
      }
      if (event.metadata?.fullCardCompleted === true) {
        next.fullCardCompletions += 1;
      }
      break;
    case 'badge_unlocked':
      next.badgesEarned += 1;
      break;
    case 'leaderboard_rank_changed':
      if (typeof event.metadata?.rank === 'number') {
        next.finalRankInRoom = event.metadata.rank;
      }
      break;
    case 'session_ended':
      next.endedAt = event.timestamp;
      next.totalSessionDurationMs = Math.max(0, event.timestamp - next.startedAt);
      break;
    default:
      break;
  }

  next.pointsEarned += event.pointsGained ?? 0;
  next.accuracy = updateAccuracy(next.validatedScans, next.scansMade);
  return next;
};

export const finalizeSessionStats = (session: SessionStats, endedAt = Date.now()): SessionStats => {
  const finalized = {
    ...session,
    endedAt,
    totalSessionDurationMs: Math.max(0, endedAt - session.startedAt),
  };
  finalized.accuracy = updateAccuracy(finalized.validatedScans, finalized.scansMade);
  return finalized;
};

export const applySessionToLifetime = (
  lifetime: LifetimeStats,
  session: SessionStats,
  museumStatsById: Record<string, MuseumStats>
): LifetimeStats => {
  const next = { ...lifetime };
  next.totalSessions += 1;
  next.totalScans += session.scansMade;
  next.totalValidatedScans += session.validatedScans;
  next.totalFailedScans += session.failedScans;
  next.totalTilesCompleted += session.tilesCompleted;
  next.totalBingos += session.bingosCompleted;
  next.totalFullCardCompletions += session.fullCardCompletions;
  next.totalHintsUsed += session.hintsUsed;
  next.totalBadges += session.badgesEarned;
  next.totalPoints += session.pointsEarned;
  next.bestStreak = Math.max(next.bestStreak, session.streak.longestStreak);
  next.longestRoomVictoryStreak = Math.max(next.longestRoomVictoryStreak, session.streak.longestRoomVictoryStreak);

  if (session.roomId) {
    next.totalRoomsJoined += 1;
  }
  if (session.finalRankInRoom !== null) {
    next.bestRankAchieved =
      next.bestRankAchieved === null ? session.finalRankInRoom : Math.min(next.bestRankAchieved, session.finalRankInRoom);
  }
  if (session.fastestTileCompletionMs !== null) {
    next.fastestTileCompletionMs =
      next.fastestTileCompletionMs === null
        ? session.fastestTileCompletionMs
        : Math.min(next.fastestTileCompletionMs, session.fastestTileCompletionMs);
  }
  if (session.timeToBingoCompletionMs !== null) {
    next.fastestBingoCompletionMs =
      next.fastestBingoCompletionMs === null
        ? session.timeToBingoCompletionMs
        : Math.min(next.fastestBingoCompletionMs, session.timeToBingoCompletionMs);
  }
  if (session.museumId) {
    next.favoriteMuseum = session.museumId;
  }
  next.mostPlayedMode = session.mode;
  next.averageAccuracy = updateAccuracy(next.totalValidatedScans, next.totalScans);
  next.averageTimeToValidateMs = average(
    next.averageTimeToValidateMs,
    Math.max(0, next.totalSessions - 1),
    session.averageTimeToValidateMs
  );

  const dayKey = toDayKey(session.startedAt);
  const weekKey = toWeekKey(session.startedAt);
  const monthKey = toMonthKey(session.startedAt);
  next.dailySummaries = incrementMapCount(next.dailySummaries, dayKey, session.pointsEarned);
  next.weeklySummaries = incrementMapCount(next.weeklySummaries, weekKey, session.pointsEarned);
  next.monthlySummaries = incrementMapCount(next.monthlySummaries, monthKey, session.pointsEarned);
  next.totalMuseumsVisited = new Set(Object.keys(museumStatsById)).size;
  next.replayabilityInsights = summarizeReplayabilityInsights(next, museumStatsById);
  return next;
};

export const applyEventToMuseumStats = (
  allMuseumStats: Record<string, MuseumStats>,
  event: GameplayEvent
): Record<string, MuseumStats> => {
  if (!event.museumId) {
    return allMuseumStats;
  }
  const current = getOrCreateMuseumStats(allMuseumStats, event.museumId);
  const next: MuseumStats = { ...current, topMatchedArtworks: { ...current.topMatchedArtworks } };

  if (event.type === 'scan_started') {
    next.artworksScanned += 1;
  }
  if (event.type === 'scan_success' && event.artworkId) {
    next.topMatchedArtworks[event.artworkId] = (next.topMatchedArtworks[event.artworkId] ?? 0) + 1;
  }
  if (event.type === 'tile_completed') {
    next.tilesCompleted += 1;
  }
  if (event.type === 'hint_used') {
    next.hintsUsed += 1;
  }
  if (event.type === 'badge_unlocked') {
    next.badgesEarned += 1;
  }
  if (event.type === 'session_ended') {
    next.sessionsPlayed += 1;
    if (typeof event.metadata?.sessionDurationMs === 'number') {
      next.timeSpentMs += event.metadata.sessionDurationMs;
    }
  }

  if (event.type === 'scan_success' || event.type === 'scan_failure' || event.type === 'scan_started') {
    const totalScans = Math.max(1, next.artworksScanned);
    const successful = Object.values(next.topMatchedArtworks).reduce((acc, count) => acc + count, 0);
    next.averageScanSuccessRate = Math.round((successful / totalScans) * 1000) / 10;
  }
  next.lastPlayedAt = event.timestamp;
  return { ...allMuseumStats, [event.museumId]: next };
};

export const applyEventToRoomStats = (
  allRoomStats: Record<string, RoomStats>,
  event: GameplayEvent
): Record<string, RoomStats> => {
  if (!event.roomId) {
    return allRoomStats;
  }
  const current = getOrCreateRoomStats(allRoomStats, event.roomId);
  const next: RoomStats = { ...current, rankHistory: [...current.rankHistory] };

  if (event.type === 'room_joined') {
    next.playersJoined += 1;
    next.activePlayers += 1;
  }
  if (event.type === 'room_left') {
    next.activePlayers = Math.max(0, next.activePlayers - 1);
  }
  if (event.type === 'tile_completed') {
    next.totalTilesCompletedByRoom += 1;
  }
  if (event.type === 'leaderboard_rank_changed' && typeof event.metadata?.rank === 'number') {
    next.rankHistory.push(event.metadata.rank);
    if (next.rankHistory.length > 50) {
      next.rankHistory.shift();
    }
  }
  if (event.type === 'bingo_completed' && typeof event.metadata?.elapsedMs === 'number') {
    const elapsed = event.metadata.elapsedMs;
    next.fastestRoomBingoMs = next.fastestRoomBingoMs === null ? elapsed : Math.min(next.fastestRoomBingoMs, elapsed);
  }
  if (event.type === 'session_ended') {
    next.sessionsPlayed += 1;
    if (event.metadata?.winnerUserId) {
      next.roomWinnerUserId = String(event.metadata.winnerUserId);
      if (event.metadata.winnerUserId === event.userId) {
        next.totalWins += 1;
      }
    }
    if (typeof event.metadata?.scoreSpread === 'number') {
      next.scoreSpread = event.metadata.scoreSpread;
      if (event.metadata.scoreSpread === 0) {
        next.tieBreakResults += 1;
      }
    }
  }
  next.lastPlayedAt = event.timestamp;
  return { ...allRoomStats, [event.roomId]: next };
};

export const buildProgressSnapshot = (
  session: SessionStats,
  lifetime: LifetimeStats,
  museumStats: Record<string, MuseumStats>,
  roomStats: Record<string, RoomStats>,
  events: GameplayEvent[]
): ProgressSnapshot =>
  createProgressSnapshot(
    session,
    lifetime,
    session.museumId ? museumStats[session.museumId] ?? null : null,
    session.roomId ? roomStats[session.roomId] ?? null : null,
    events
  );
