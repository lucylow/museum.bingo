import { fetchLifetimeStats, sendGameplayEventBatch, sendSessionSummaryBatch } from '../api/gameplayStats';
import { useGameplayStatsStore } from '../store/gameplayStatsStore';
import { GameplayEvent, GameplayEventType, SessionMode } from './types';

const EVENT_BATCH_SIZE = 25;
const SYNC_INTERVAL_MS = 7000;

const createEventId = (type: GameplayEventType, sessionId: string): string =>
  `${type}-${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type TrackEventInput = Omit<GameplayEvent, 'id' | 'timestamp'> & {
  idempotencyKey?: string;
  timestamp?: number;
};

class GameplayStatsTracker {
  private isSyncing = false;

  private syncTimer: ReturnType<typeof setInterval> | null = null;

  private processedLocalKeys = new Set<string>();

  constructor() {
    this.startAutoSync();
  }

  initialize = async (): Promise<void> => {
    try {
      const lifetimeStats = await fetchLifetimeStats();
      if (lifetimeStats) {
        useGameplayStatsStore.getState().hydrateLifetime(lifetimeStats);
      }
    } catch {
      // Keep local stats when offline or API unavailable.
    }
  };

  startSession = (params: {
    userId: string;
    sessionId: string;
    mode: SessionMode;
    museumId?: string | null;
    roomId?: string | null;
    startedAt?: number;
  }): void => {
    useGameplayStatsStore.getState().startSession(params);
    this.trackEvent({
      type: 'session_started',
      userId: params.userId,
      sessionId: params.sessionId,
      roomId: params.roomId ?? null,
      museumId: params.museumId ?? null,
      metadata: { mode: params.mode },
      timestamp: params.startedAt ?? Date.now(),
      idempotencyKey: `session-start-${params.sessionId}`,
    });
  };

  endSession = (metadata?: Record<string, unknown>): void => {
    const finalized = useGameplayStatsStore.getState().endSession({ metadata });
    if (finalized) {
      void this.syncNow();
    }
  };

  trackEvent = (event: TrackEventInput): string => {
    const dedupeKey = event.idempotencyKey ?? `${event.type}-${event.sessionId}-${event.tileId ?? 'na'}-${event.userId}`;
    if (this.processedLocalKeys.has(dedupeKey)) {
      return dedupeKey;
    }
    this.processedLocalKeys.add(dedupeKey);
    if (this.processedLocalKeys.size > 500) {
      const oldest = this.processedLocalKeys.values().next().value as string | undefined;
      if (oldest) {
        this.processedLocalKeys.delete(oldest);
      }
    }

    const timestamp = event.timestamp ?? Date.now();
    const id = createEventId(event.type, event.sessionId);
    useGameplayStatsStore.getState().recordEvent({
      ...event,
      id,
      timestamp,
    });
    void this.syncNow();
    return id;
  };

  flushBuffered = async (): Promise<void> => {
    await this.syncNow();
  };

  stopAutoSync = (): void => {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  };

  private startAutoSync = (): void => {
    if (this.syncTimer) {
      return;
    }
    this.syncTimer = setInterval(() => {
      void this.syncNow();
    }, SYNC_INTERVAL_MS);
  };

  private syncNow = async (): Promise<void> => {
    if (this.isSyncing) {
      return;
    }
    this.isSyncing = true;
    try {
      const store = useGameplayStatsStore.getState();
      const events = store.pendingEvents.slice(0, EVENT_BATCH_SIZE);
      if (events.length > 0) {
        const acceptedEventIds = await sendGameplayEventBatch(events);
        store.markEventsSynced(acceptedEventIds);
      }
      const sessions = store.pendingSessionSummaries.slice(0, 10);
      if (sessions.length > 0) {
        const acceptedSessionIds = await sendSessionSummaryBatch(sessions);
        store.markSessionSummariesSynced(acceptedSessionIds);
      }
    } catch {
      // Keep queue for retry on reconnect.
    } finally {
      this.isSyncing = false;
    }
  };
}

export const gameplayStatsTracker = new GameplayStatsTracker();
