import { GamificationEngine } from '../mobile/src/gamification/GamificationEngine';
import { BADGES } from '../mobile/src/gamification/badges';
import { GamificationState } from '../mobile/src/gamification/types';

const createBaseState = (): GamificationState => ({
  userId: 'test-user',
  sessionId: 'session-1',
  museumId: 'museum-1',
  totalScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  tilesValidated: [],
  linesCompleted: 0,
  bingosCompleted: 0,
  badgesEarned: [],
  rank: 0,
  rankChange: 0,
  lastActionTimestamp: Date.now(),
});

describe('GamificationEngine', () => {
  const engine = new GamificationEngine({}, BADGES);

  test('tile validation awards base points', () => {
    const baseState = createBaseState();
    const { newState, scoreEvents } = engine.processTileValidation(baseState, 'tile-1', false, false);

    expect(newState.totalScore).toBeGreaterThan(0);
    expect(scoreEvents.some((event) => event.type === 'tile_validated')).toBe(true);
  });

  test('streak increases after consecutive validations', () => {
    const baseState = createBaseState();
    baseState.lastActionTimestamp = Date.now() - 1000;

    const { newState: state1 } = engine.processTileValidation(baseState, 'tile-1', false, false);
    expect(state1.currentStreak).toBe(1);

    const { newState: state2 } = engine.processTileValidation(state1, 'tile-2', false, false);
    expect(state2.currentStreak).toBe(2);
  });

  test('streak resets after timeout', () => {
    const baseState = createBaseState();
    baseState.currentStreak = 5;
    baseState.lastActionTimestamp = Date.now() - 40000;

    const { newState } = engine.processTileValidation(baseState, 'tile-1', false, false);
    expect(newState.currentStreak).toBe(1);
  });

  test('line bonus awarded correctly', () => {
    const baseState = createBaseState();
    const { newState, scoreEvents } = engine.processTileValidation(baseState, 'tile-1', true, false);

    expect(scoreEvents.some((event) => event.type === 'line_bonus')).toBe(true);
    expect(newState.linesCompleted).toBe(1);
  });

  test('bingo bonus awarded correctly', () => {
    const baseState = createBaseState();
    const { newState, scoreEvents } = engine.processTileValidation(baseState, 'tile-1', false, true);

    expect(scoreEvents.some((event) => event.type === 'bingo_bonus')).toBe(true);
    expect(newState.bingosCompleted).toBe(1);
  });

  test('badge unlocks first scan', () => {
    const baseState = createBaseState();
    const { newBadges } = engine.processTileValidation(baseState, 'tile-1', false, false);
    expect(newBadges.some((badge) => badge.id === 'first_scan')).toBe(true);
  });

  test('rank updates correctly', () => {
    const baseState = createBaseState();
    const scores = [
      { userId: 'a', score: 100 },
      { userId: 'test-user', score: 80 },
      { userId: 'c', score: 120 },
    ];

    const { newRank, rankChange } = engine.updateRank({ ...baseState, rank: 2 }, scores);
    expect(newRank).toBe(3);
    expect(rankChange).toBe(-1);
  });
});
