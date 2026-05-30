import express, { Request, Response } from 'express';
import { db, FieldValue } from '../config/firebase';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

type GameplayEventType =
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

type GameplayEvent = {
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
  resultType?: 'success' | 'failure' | 'partial';
  metadata?: Record<string, unknown>;
};

type SessionStats = {
  sessionId: string;
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
  tilesCompleted: number;
  bingoLinesCompleted: number;
  bingosCompleted: number;
  fullCardCompletions: number;
  badgesEarned: number;
  pointsEarned: number;
  hintsUsed: number;
  finalRankInRoom: number | null;
  averageTimeToValidateMs: number;
};

const router = express.Router();

const dayKey = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);

const monthKey = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 7);

const weekKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

const validateEvent = (event: GameplayEvent): boolean =>
  Boolean(
    event &&
      typeof event.id === 'string' &&
      event.id.length > 3 &&
      typeof event.type === 'string' &&
      typeof event.timestamp === 'number' &&
      typeof event.userId === 'string' &&
      typeof event.sessionId === 'string'
  );

router.post('/events/batch', authenticateToken, async (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).user;
  const events = ((req.body as { events?: GameplayEvent[] }).events ?? []).filter(validateEvent);
  if (!authUser) {
    res.status(401).json({ acceptedEventIds: [] });
    return;
  }
  if (events.length === 0) {
    res.json({ acceptedEventIds: [] });
    return;
  }

  const acceptedEventIds: string[] = [];
  for (const event of events) {
    if (event.userId !== authUser.uid) {
      continue;
    }
    const eventRef = db.collection('users').doc(authUser.uid).collection('gameplay_events').doc(event.id);
    try {
      await eventRef.create({
        ...event,
        createdAt: Date.now(),
      });
      acceptedEventIds.push(event.id);
      if (event.museumId) {
        await db
          .collection('users')
          .doc(authUser.uid)
          .collection('museum_stats')
          .doc(event.museumId)
          .set(
            {
              museumId: event.museumId,
              lastPlayedAt: event.timestamp,
              artworksScanned: FieldValue.increment(event.type === 'scan_started' ? 1 : 0),
              tilesCompleted: FieldValue.increment(event.type === 'tile_completed' ? 1 : 0),
              hintsUsed: FieldValue.increment(event.type === 'hint_used' ? 1 : 0),
              badgesEarned: FieldValue.increment(event.type === 'badge_unlocked' ? 1 : 0),
            },
            { merge: true }
          );
      }
      if (event.roomId) {
        await db
          .collection('users')
          .doc(authUser.uid)
          .collection('room_stats')
          .doc(event.roomId)
          .set(
            {
              roomId: event.roomId,
              lastPlayedAt: event.timestamp,
              playersJoined: FieldValue.increment(event.type === 'room_joined' ? 1 : 0),
              activePlayers: FieldValue.increment(event.type === 'room_joined' ? 1 : event.type === 'room_left' ? -1 : 0),
              totalTilesCompletedByRoom: FieldValue.increment(event.type === 'tile_completed' ? 1 : 0),
            },
            { merge: true }
          );
      }
    } catch {
      // Duplicate event IDs are intentionally ignored for idempotency.
    }
  }

  res.json({ acceptedEventIds });
});

router.post('/sessions/batch', authenticateToken, async (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).user;
  const sessions = ((req.body as { sessions?: SessionStats[] }).sessions ?? []) as SessionStats[];
  if (!authUser) {
    res.status(401).json({ acceptedSessionIds: [] });
    return;
  }
  if (sessions.length === 0) {
    res.json({ acceptedSessionIds: [] });
    return;
  }

  const acceptedSessionIds: string[] = [];
  for (const session of sessions) {
    if (!session || session.userId !== authUser.uid || !session.sessionId) {
      continue;
    }
    const sessionRef = db.collection('users').doc(authUser.uid).collection('gameplay_sessions').doc(session.sessionId);
    try {
      await sessionRef.create({
        ...session,
        createdAt: Date.now(),
      });
      acceptedSessionIds.push(session.sessionId);

      const totalsRef = db.collection('users').doc(authUser.uid).collection('gameplay_stats').doc('lifetime');
      const sessionStartedAt = typeof session.startedAt === 'number' ? session.startedAt : Date.now();
      const day = dayKey(sessionStartedAt);
      const week = weekKey(sessionStartedAt);
      const month = monthKey(sessionStartedAt);
      await totalsRef.set(
        {
          userId: authUser.uid,
          totalSessions: FieldValue.increment(1),
          totalMuseumsVisited: FieldValue.increment(session.museumId ? 1 : 0),
          totalScans: FieldValue.increment(session.scansMade || 0),
          totalValidatedScans: FieldValue.increment(session.validatedScans || 0),
          totalFailedScans: FieldValue.increment(session.failedScans || 0),
          totalTilesCompleted: FieldValue.increment(session.tilesCompleted || 0),
          totalBingos: FieldValue.increment(session.bingosCompleted || 0),
          totalFullCardCompletions: FieldValue.increment(session.fullCardCompletions || 0),
          totalHintsUsed: FieldValue.increment(session.hintsUsed || 0),
          totalBadges: FieldValue.increment(session.badgesEarned || 0),
          totalRoomsJoined: FieldValue.increment(session.roomId ? 1 : 0),
          totalPoints: FieldValue.increment(session.pointsEarned || 0),
          bestStreak: FieldValue.increment(0),
          averageAccuracy: round1(session.accuracy || 0),
          averageTimeToValidateMs: session.averageTimeToValidateMs || 0,
          favoriteMuseum: session.museumId || null,
          fastestBingoCompletionMs: session.totalSessionDurationMs || null,
          [`dailySummaries.${day}`]: FieldValue.increment(session.pointsEarned || 0),
          [`weeklySummaries.${week}`]: FieldValue.increment(session.pointsEarned || 0),
          [`monthlySummaries.${month}`]: FieldValue.increment(session.pointsEarned || 0),
          lastUpdatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch {
      // Duplicate session IDs are ignored for idempotency.
    }
  }

  res.json({ acceptedSessionIds });
});

router.get('/lifetime', authenticateToken, async (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).user;
  if (!authUser) {
    res.status(401).json({ lifetimeStats: null });
    return;
  }
  const snapshot = await db.collection('users').doc(authUser.uid).collection('gameplay_stats').doc('lifetime').get();
  res.json({ lifetimeStats: snapshot.exists ? snapshot.data() : null });
});

export default router;
