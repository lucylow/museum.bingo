import { applyEventToRoomStats, applyEventToSessionStats, applySessionToLifetime, finalizeSessionStats } from '../mobile/src/stats/aggregator';
import { createEmptyLifetimeStats, createEmptySessionStats } from '../mobile/src/stats/helpers';
import { gameplayStatsTracker } from '../mobile/src/stats/tracker';
import { useGameplayStatsStore } from '../mobile/src/store/gameplayStatsStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async () => undefined),
  getItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => undefined),
}));

jest.mock('../mobile/src/api/gameplayStats', () => ({
  sendGameplayEventBatch: jest.fn(async () => []),
  sendSessionSummaryBatch: jest.fn(async () => []),
  fetchLifetimeStats: jest.fn(async () => null),
}));

describe('Gameplay stats aggregation', () => {
  afterAll(() => {
    gameplayStatsTracker.stopAutoSync();
  });

  beforeEach(() => {
    useGameplayStatsStore.setState({
      currentSession: null,
      currentSessionStats: null,
      lifetimeStats: createEmptyLifetimeStats('user-1'),
      museumStats: {},
      roomStats: {},
      sessionHistory: [],
      recentEvents: [],
      pendingEvents: [],
      pendingSessionSummaries: [],
      latestSnapshot: null,
    });
  });

  test('tracks scan accuracy and validation timings', () => {
    const startedAt = Date.now() - 10_000;
    const session = createEmptySessionStats('s-1', 'user-1', 'solo', startedAt, 'museum-1', null);
    const withScanStart = applyEventToSessionStats(session, {
      id: 'e1',
      type: 'scan_started',
      timestamp: startedAt + 100,
      userId: 'user-1',
      sessionId: 's-1',
      museumId: 'museum-1',
    });
    const withSuccess = applyEventToSessionStats(withScanStart, {
      id: 'e2',
      type: 'scan_success',
      timestamp: startedAt + 500,
      userId: 'user-1',
      sessionId: 's-1',
      museumId: 'museum-1',
      metadata: { validateDurationMs: 240 },
    });
    const withFailure = applyEventToSessionStats(withSuccess, {
      id: 'e3',
      type: 'scan_failure',
      timestamp: startedAt + 800,
      userId: 'user-1',
      sessionId: 's-1',
      museumId: 'museum-1',
    });
    expect(withFailure.scansMade).toBe(1);
    expect(withFailure.validatedScans).toBe(1);
    expect(withFailure.failedScans).toBe(1);
    expect(withFailure.accuracy).toBe(100);
    expect(withFailure.averageTimeToValidateMs).toBe(240);
  });

  test('updates streak stats and bingo milestones', () => {
    const startedAt = Date.now() - 15_000;
    let session = createEmptySessionStats('s-2', 'user-1', 'solo', startedAt, 'museum-1', null);
    session = applyEventToSessionStats(session, {
      id: 'e4',
      type: 'streak_updated',
      timestamp: startedAt + 300,
      userId: 'user-1',
      sessionId: 's-2',
      streakAfter: 3,
    });
    session = applyEventToSessionStats(session, {
      id: 'e5',
      type: 'line_completed',
      timestamp: startedAt + 900,
      userId: 'user-1',
      sessionId: 's-2',
    });
    session = applyEventToSessionStats(session, {
      id: 'e6',
      type: 'bingo_completed',
      timestamp: startedAt + 1600,
      userId: 'user-1',
      sessionId: 's-2',
      metadata: { fullCardCompleted: true },
    });
    expect(session.streak.currentStreak).toBe(3);
    expect(session.streak.longestStreak).toBe(3);
    expect(session.bingoLinesCompleted).toBe(1);
    expect(session.bingosCompleted).toBe(1);
    expect(session.fullCardCompletions).toBe(1);
    expect(session.timeToFirstBingoLineMs).toBe(900);
    expect(session.timeToBingoCompletionMs).toBe(1600);
  });

  test('rolls up session into lifetime stats', () => {
    const lifetime = createEmptyLifetimeStats('user-1');
    const session = finalizeSessionStats(
      {
        ...createEmptySessionStats('s-3', 'user-1', 'multiplayer', Date.now() - 20_000, 'museum-2', 'room-1'),
        scansMade: 8,
        validatedScans: 6,
        failedScans: 2,
        accuracy: 75,
        tilesCompleted: 6,
        bingosCompleted: 1,
        badgesEarned: 2,
        pointsEarned: 180,
        finalRankInRoom: 2,
        averageTimeToValidateMs: 350,
      },
      Date.now()
    );
    const rolled = applySessionToLifetime(lifetime, session, {
      'museum-2': {
        museumId: 'museum-2',
        sessionsPlayed: 1,
        artworksScanned: 8,
        tilesCompleted: 6,
        timeSpentMs: 120000,
        averageScanSuccessRate: 75,
        topMatchedArtworks: {},
        promptCategoryCompletion: {},
        hintsUsed: 1,
        badgesEarned: 2,
        lastPlayedAt: Date.now(),
      },
    });
    expect(rolled.totalSessions).toBe(1);
    expect(rolled.totalScans).toBe(8);
    expect(rolled.totalValidatedScans).toBe(6);
    expect(rolled.totalPoints).toBe(180);
    expect(rolled.bestRankAchieved).toBe(2);
    expect(rolled.favoriteMuseum).toBe('museum-2');
  });

  test('builds room rank history summaries', () => {
    let roomStats = applyEventToRoomStats({}, {
      id: 'r1',
      type: 'room_joined',
      timestamp: Date.now(),
      userId: 'user-1',
      sessionId: 's-room',
      roomId: 'room-abc',
    });
    roomStats = applyEventToRoomStats(roomStats, {
      id: 'r2',
      type: 'leaderboard_rank_changed',
      timestamp: Date.now(),
      userId: 'user-1',
      sessionId: 's-room',
      roomId: 'room-abc',
      metadata: { rank: 1 },
    });
    roomStats = applyEventToRoomStats(roomStats, {
      id: 'r3',
      type: 'tile_completed',
      timestamp: Date.now(),
      userId: 'user-1',
      sessionId: 's-room',
      roomId: 'room-abc',
    });
    expect(roomStats['room-abc'].playersJoined).toBe(1);
    expect(roomStats['room-abc'].rankHistory).toEqual([1]);
    expect(roomStats['room-abc'].totalTilesCompletedByRoom).toBe(1);
  });

  test('prevents duplicate local event writes by idempotency key', () => {
    gameplayStatsTracker.startSession({
      userId: 'user-1',
      sessionId: 's-dup',
      mode: 'solo',
      museumId: 'museum-dup',
    });
    gameplayStatsTracker.trackEvent({
      type: 'tile_completed',
      userId: 'user-1',
      sessionId: 's-dup',
      museumId: 'museum-dup',
      tileId: '1_1',
      idempotencyKey: 'dup-key',
    });
    gameplayStatsTracker.trackEvent({
      type: 'tile_completed',
      userId: 'user-1',
      sessionId: 's-dup',
      museumId: 'museum-dup',
      tileId: '1_1',
      idempotencyKey: 'dup-key',
    });
    const pending = useGameplayStatsStore.getState().pendingEvents.filter((event) => event.tileId === '1_1');
    expect(pending.length).toBe(1);
  });
});
