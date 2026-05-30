import express, { Request, Response } from 'express';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { leaderboardManager } from '../data/leaderboard/manager';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.post('/validate', authenticateToken, async (req: Request, res: Response) => {
  const {
    museumId,
    tileId,
    artworkId,
    isNewLine,
    isBingo,
    newScore,
    newStreak,
    newBadges = [],
    previousScore = 0,
  } = req.body as {
    museumId?: string;
    tileId?: string;
    artworkId?: string;
    isNewLine?: boolean;
    isBingo?: boolean;
    newScore?: number;
    newStreak?: number;
    newBadges?: unknown[];
    previousScore?: number;
  };

  const userId = (req as AuthenticatedRequest).user?.uid;
  const sessionId = req.headers['x-session-id'] as string | undefined;

  if (!userId || !museumId || !tileId || typeof newScore !== 'number' || typeof newStreak !== 'number') {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  await db
    .collection('users')
    .doc(userId)
    .set(
      {
        totalScore: newScore,
        currentStreak: newStreak,
        lastActionTimestamp: Date.now(),
      },
      { merge: true }
    );

  await db.collection('gamification_events').add({
    userId,
    museumId,
    sessionId: sessionId ?? null,
    tileId,
    artworkId: artworkId ?? null,
    eventType: 'tile_validated',
    isNewLine: Boolean(isNewLine),
    isBingo: Boolean(isBingo),
    scoreDelta: newScore - previousScore,
    streakAfter: newStreak,
    badgesUnlocked: newBadges,
    timestamp: Date.now(),
  });

  if (Array.isArray(newBadges) && newBadges.length > 0) {
    const batch = db.batch();
    for (const badge of newBadges) {
      const docRef = db.collection('users').doc(userId).collection('badges').doc();
      batch.set(docRef, badge);
    }
    await batch.commit();
  }

  await db
    .collection('leaderboards')
    .doc(`museum_${museumId}`)
    .set(
      {
        [userId]: newScore,
      },
      { merge: true }
    );

  // Best-effort Redis leaderboard update for low-latency reads.
  try {
    const scoreDelta = Math.max(0, newScore - previousScore);
    if (scoreDelta > 0) {
      await leaderboardManager.recordScore(museumId, userId, scoreDelta);
    }
  } catch {
    // Do not fail tile validation if leaderboard cache is unavailable.
  }

  res.json({ success: true });
});

router.get('/leaderboard/:museumId', authenticateToken, async (req: Request, res: Response) => {
  const { museumId } = req.params;
  const snapshot = await db.collection('leaderboards').doc(`museum_${museumId}`).get();
  const scores = (snapshot.data() || {}) as Record<string, number>;

  const leaderboard = Object.entries(scores)
    .map(([userId, score]) => ({ userId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  res.json(leaderboard);
});

router.get('/badges/:userId', authenticateToken, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const snapshot = await db.collection('users').doc(userId).collection('badges').get();
  const badges = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data());
  res.json(badges);
});

export default router;
