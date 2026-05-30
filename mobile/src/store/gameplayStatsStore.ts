import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  GameplayEvent,
  GameplaySession,
  LifetimeStats,
  MuseumStats,
  ProgressSnapshot,
  RoomStats,
  SessionMode,
  SessionStats,
} from '../stats/types';
import {
  applyEventToMuseumStats,
  applyEventToRoomStats,
  applyEventToSessionStats,
  applySessionToLifetime,
  buildProgressSnapshot,
  finalizeSessionStats,
} from '../stats/aggregator';
import { createEmptyLifetimeStats, createEmptySessionStats } from '../stats/helpers';

interface GameplayStatsStore {
  currentSession: GameplaySession | null;
  currentSessionStats: SessionStats | null;
  lifetimeStats: LifetimeStats;
  museumStats: Record<string, MuseumStats>;
  roomStats: Record<string, RoomStats>;
  sessionHistory: SessionStats[];
  recentEvents: GameplayEvent[];
  pendingEvents: GameplayEvent[];
  pendingSessionSummaries: SessionStats[];
  latestSnapshot: ProgressSnapshot | null;
  startSession: (params: {
    userId: string;
    sessionId: string;
    mode: SessionMode;
    museumId?: string | null;
    roomId?: string | null;
    startedAt?: number;
  }) => void;
  recordEvent: (event: GameplayEvent) => void;
  endSession: (params?: { endedAt?: number; metadata?: Record<string, unknown> }) => SessionStats | null;
  markEventsSynced: (eventIds: string[]) => void;
  markSessionSummariesSynced: (sessionIds: string[]) => void;
  hydrateLifetime: (lifetime: LifetimeStats) => void;
}

const initialLifetime = createEmptyLifetimeStats('anonymous');

export const useGameplayStatsStore = create<GameplayStatsStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      currentSessionStats: null,
      lifetimeStats: initialLifetime,
      museumStats: {},
      roomStats: {},
      sessionHistory: [],
      recentEvents: [],
      pendingEvents: [],
      pendingSessionSummaries: [],
      latestSnapshot: null,
      startSession: ({ userId, sessionId, mode, museumId = null, roomId = null, startedAt = Date.now() }) => {
        const sessionStats = createEmptySessionStats(sessionId, userId, mode, startedAt, museumId, roomId);
        const lifetime = get().lifetimeStats.userId === 'anonymous' ? createEmptyLifetimeStats(userId) : get().lifetimeStats;
        const session: GameplaySession = {
          sessionId,
          userId,
          museumId,
          roomId,
          mode,
          startedAt,
          lastUpdatedAt: startedAt,
          partialSnapshot: buildProgressSnapshot(sessionStats, lifetime, get().museumStats, get().roomStats, []),
        };
        set({
          currentSession: session,
          currentSessionStats: sessionStats,
          lifetimeStats: lifetime,
          latestSnapshot: session.partialSnapshot,
        });
      },
      recordEvent: (event) => {
        const state = get();
        if (!state.currentSession || !state.currentSessionStats) {
          return;
        }
        const nextSessionStats = applyEventToSessionStats(state.currentSessionStats, event);
        const nextMuseumStats = applyEventToMuseumStats(state.museumStats, event);
        const nextRoomStats = applyEventToRoomStats(state.roomStats, event);
        const recentEvents = [...state.recentEvents, event].slice(-250);
        const snapshot = buildProgressSnapshot(
          nextSessionStats,
          state.lifetimeStats,
          nextMuseumStats,
          nextRoomStats,
          recentEvents
        );
        set({
          currentSessionStats: nextSessionStats,
          museumStats: nextMuseumStats,
          roomStats: nextRoomStats,
          recentEvents,
          pendingEvents: [...state.pendingEvents, event],
          currentSession: { ...state.currentSession, lastUpdatedAt: event.timestamp, partialSnapshot: snapshot },
          latestSnapshot: snapshot,
        });
      },
      endSession: ({ endedAt = Date.now(), metadata = {} } = {}) => {
        const state = get();
        if (!state.currentSession || !state.currentSessionStats) {
          return null;
        }
        const endedEvent: GameplayEvent = {
          id: `session-end-${state.currentSession.sessionId}-${endedAt}`,
          type: 'session_ended',
          timestamp: endedAt,
          userId: state.currentSession.userId,
          sessionId: state.currentSession.sessionId,
          roomId: state.currentSession.roomId,
          museumId: state.currentSession.museumId,
          metadata: {
            ...metadata,
            sessionDurationMs: endedAt - state.currentSession.startedAt,
          },
        };

        const afterEndEvent = applyEventToSessionStats(state.currentSessionStats, endedEvent);
        const finalized = finalizeSessionStats(afterEndEvent, endedAt);
        const museumStats = applyEventToMuseumStats(state.museumStats, endedEvent);
        const roomStats = applyEventToRoomStats(state.roomStats, endedEvent);
        const lifetime = applySessionToLifetime(state.lifetimeStats, finalized, museumStats);
        const sessionHistory = [finalized, ...state.sessionHistory].slice(0, 50);
        const recentEvents = [...state.recentEvents, endedEvent].slice(-250);
        const snapshot = buildProgressSnapshot(finalized, lifetime, museumStats, roomStats, recentEvents);

        set({
          currentSession: null,
          currentSessionStats: null,
          museumStats,
          roomStats,
          lifetimeStats: lifetime,
          sessionHistory,
          pendingEvents: [...state.pendingEvents, endedEvent],
          pendingSessionSummaries: [...state.pendingSessionSummaries, finalized],
          recentEvents,
          latestSnapshot: snapshot,
        });
        return finalized;
      },
      markEventsSynced: (eventIds) => {
        const setIds = new Set(eventIds);
        set((state) => ({ pendingEvents: state.pendingEvents.filter((event) => !setIds.has(event.id)) }));
      },
      markSessionSummariesSynced: (sessionIds) => {
        const setIds = new Set(sessionIds);
        set((state) => ({
          pendingSessionSummaries: state.pendingSessionSummaries.filter((summary) => !setIds.has(summary.sessionId)),
        }));
      },
      hydrateLifetime: (lifetime) => {
        set({ lifetimeStats: lifetime });
      },
    }),
    {
      name: 'gameplay-stats-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lifetimeStats: state.lifetimeStats,
        museumStats: state.museumStats,
        roomStats: state.roomStats,
        sessionHistory: state.sessionHistory,
        recentEvents: state.recentEvents,
        pendingEvents: state.pendingEvents,
        pendingSessionSummaries: state.pendingSessionSummaries,
        latestSnapshot: state.latestSnapshot,
      }),
    }
  )
);
