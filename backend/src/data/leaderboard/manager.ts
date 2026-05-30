import { FieldValue } from 'firebase-admin/firestore';
import redis from '../redis/client';
import { leaderboardCollection } from '../firestore/schema';

export class LeaderboardManager {
  private readonly dailyKey = (museumId: string): string => `leaderboard:daily:${museumId}`;

  async recordScore(museumId: string, userId: string, scoreIncrement: number): Promise<void> {
    const key = this.dailyKey(museumId);
    await redis.zincrby(key, scoreIncrement, userId);
    await redis.expire(key, 86400);
  }

  async getDailyTop(museumId: string, limit = 100): Promise<Array<{ userId: string; score: number }>> {
    const key = this.dailyKey(museumId);
    const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
    const leaderboard: Array<{ userId: string; score: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        score: parseInt(results[i + 1], 10),
      });
    }
    return leaderboard;
  }

  async snapshotDailyLeaderboard(museumId: string): Promise<void> {
    const top = await this.getDailyTop(museumId, 500);
    const snapshotId = `${museumId}_${new Date().toISOString().slice(0, 13)}`;
    await leaderboardCollection.doc(snapshotId).set({
      museumId,
      timestamp: FieldValue.serverTimestamp(),
      topPlayers: top,
    });
  }
}

export const leaderboardManager = new LeaderboardManager();
