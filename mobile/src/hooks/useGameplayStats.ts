import { useCallback, useEffect, useMemo } from 'react';
import { gameplayStatsTracker } from '../stats/tracker';
import { useGameplayStatsStore } from '../store/gameplayStatsStore';
import { GameplayEventType, SessionMode } from '../stats/types';

type StartSessionParams = {
  userId: string;
  sessionId: string;
  mode: SessionMode;
  museumId?: string | null;
  roomId?: string | null;
};

type TrackParams = {
  type: GameplayEventType;
  userId: string;
  sessionId: string;
  museumId?: string | null;
  roomId?: string | null;
  tileId?: string | null;
  artworkId?: string | null;
  pointsGained?: number;
  streakBefore?: number;
  streakAfter?: number;
  resultType?: 'success' | 'failure' | 'partial';
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
};

let trackerInitialized = false;

export const useGameplayStats = () => {
  const latestSnapshot = useGameplayStatsStore((state) => state.latestSnapshot);
  const sessionHistory = useGameplayStatsStore((state) => state.sessionHistory);
  const lifetimeStats = useGameplayStatsStore((state) => state.lifetimeStats);

  useEffect(() => {
    if (trackerInitialized) {
      return;
    }
    trackerInitialized = true;
    void gameplayStatsTracker.initialize();
  }, []);

  const startSession = useCallback((params: StartSessionParams): void => {
    gameplayStatsTracker.startSession(params);
  }, []);

  const endSession = useCallback((metadata?: Record<string, unknown>): void => {
    gameplayStatsTracker.endSession(metadata);
  }, []);

  const track = useCallback((params: TrackParams): void => {
    gameplayStatsTracker.trackEvent(params);
  }, []);

  return useMemo(
    () => ({
      latestSnapshot,
      lifetimeStats,
      sessionHistory,
      startSession,
      endSession,
      track,
      flush: gameplayStatsTracker.flushBuffered,
    }),
    [endSession, latestSnapshot, lifetimeStats, sessionHistory, startSession, track]
  );
};
