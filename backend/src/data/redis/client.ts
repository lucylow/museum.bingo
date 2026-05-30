import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export default redis;

export async function setRoomState(roomId: string, state: unknown): Promise<void> {
  await redis.setex(`room:${roomId}`, 14400, JSON.stringify(state));
}

export async function getRoomState<T = Record<string, unknown>>(roomId: string): Promise<T | null> {
  const data = await redis.get(`room:${roomId}`);
  return data ? (JSON.parse(data) as T) : null;
}

export async function incrementPlayerScore(roomId: string, userId: string, increment: number): Promise<number> {
  const key = `room:${roomId}:scores`;
  const newScore = await redis.hincrby(key, userId, increment);
  await redis.expire(key, 14400);
  return newScore;
}

export async function getRoomLeaderboard(
  roomId: string,
  topN = 10
): Promise<Array<{ userId: string; score: number }>> {
  const key = `room:${roomId}:scores`;
  const scores = await redis.hgetall(key);
  const entries = Object.entries(scores).map(([userId, score]) => ({
    userId,
    score: parseInt(score, 10),
  }));
  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, topN);
}
