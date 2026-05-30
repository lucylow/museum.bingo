/**
 * Event logging service for Museum.Bingo backend.
 * Captures anonymized behavioral events and batches writes to Firestore.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase';

export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'tile_validated'
  | 'hint_used'
  | 'bingo_completed'
  | 'leaderboard_viewed'
  | 'multiplayer_room_joined'
  | 'artwork_scanned'
  | 'heatvision_activated';

export interface AnalyticsEvent {
  event_id: string;
  user_id: string;
  session_id: string;
  museum_id: string;
  event_type: AnalyticsEventType;
  timestamp: number;
  metadata: Record<string, unknown>;
  location_hash?: string;
}

class AnalyticsEventLogger {
  private eventBuffer: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly batchSize = 100;
  private readonly flushIntervalMs = 5000;

  constructor() {
    this.startFlushInterval();
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      void this.flushToFirestore();
    }, this.flushIntervalMs);
  }

  async logEvent(
    userId: string,
    sessionId: string,
    museumId: string,
    eventType: AnalyticsEventType,
    metadata: Record<string, unknown> = {},
    locationHash?: string
  ): Promise<void> {
    const event: AnalyticsEvent = {
      event_id: uuidv4(),
      user_id: userId,
      session_id: sessionId,
      museum_id: museumId,
      event_type: eventType,
      timestamp: Date.now(),
      metadata: this.sanitizeMetadata(metadata),
      location_hash: locationHash,
    };

    this.eventBuffer.push(event);
    if (this.eventBuffer.length >= this.batchSize) {
      await this.flushToFirestore();
    }
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const disallowed = new Set(['email', 'phone', 'name', 'ip', 'user_agent', 'uid']);
    return Object.entries(metadata).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (!disallowed.has(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  private async flushToFirestore(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const eventsToWrite = [...this.eventBuffer];
    this.eventBuffer = [];

    const batch = db.batch();
    const collectionRef = db.collection('analytics_events');
    for (const event of eventsToWrite) {
      batch.set(collectionRef.doc(event.event_id), event);
    }

    try {
      await batch.commit();
      // eslint-disable-next-line no-console
      console.log(`Flushed ${eventsToWrite.length} analytics events to Firestore`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to flush analytics events:', error);
      this.eventBuffer.unshift(...eventsToWrite);
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flushToFirestore();
  }
}

export const analyticsLogger = new AnalyticsEventLogger();

export const analyticsMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const user = (req as Request & { user?: { analyticsId?: string } }).user;
  const anonymizedUserId = user?.analyticsId;
  const sessionId = req.headers['x-session-id'] as string | undefined;
  const museumId = req.headers['x-museum-id'] as string | undefined;

  if (anonymizedUserId && sessionId && museumId) {
    await analyticsLogger.logEvent(anonymizedUserId, sessionId, museumId, 'session_start', {
      path: req.path,
      method: req.method,
    });
  }
  next();
};
