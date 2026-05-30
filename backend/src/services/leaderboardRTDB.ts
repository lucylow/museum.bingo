import { rtdb } from '../config/firebase';

export type LeaderboardEntry = {
  userId: string;
  score: number;
};

/**
 * Ephemeral leaderboard data for low-latency updates.
 * /rooms/{roomId}/scores/{userId} = number
 * /rooms/{roomId}/progress/{userId}/{tileId} = true
 */
export async function updatePlayerScore(roomId: string, userId: string, newScore: number): Promise<void> {
  await rtdb.ref(`rooms/${roomId}/scores/${userId}`).set(newScore);
}

export async function markTileCompleted(roomId: string, userId: string, tileId: string): Promise<void> {
  await rtdb.ref(`rooms/${roomId}/progress/${userId}/${tileId}`).set(true);
}

export async function getLeaderboard(roomId: string): Promise<LeaderboardEntry[]> {
  const snapshot = await rtdb.ref(`rooms/${roomId}/scores`).once('value');
  const scores = (snapshot.val() || {}) as Record<string, number>;

  return Object.entries(scores)
    .map(([userId, score]) => ({ userId, score: Number(score) || 0 }))
    .sort((a, b) => b.score - a.score);
}
