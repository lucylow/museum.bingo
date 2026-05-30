import { db } from '../config/firebase';

/**
 * Predicts the likelihood that a visitor will complete a bingo session
 * based on early behavior (tile validations and elapsed time).
 */
export async function predictCompletionProbability(
  userId: string,
  museumId: string,
  sessionId: string
): Promise<number> {
  void userId;
  void museumId;

  const sessionDoc = await db.collection('game_sessions').doc(sessionId).get();
  const session = sessionDoc.data();

  if (!session || session.completedTiles.length < 2) {
    return 0.5;
  }

  const numValidated = session.completedTiles.length;
  const elapsedMinutes = (Date.now() - session.startTime.toDate().getTime()) / 60000;
  const avgTimePerTile = elapsedMinutes / numValidated;

  let probability = 0.5;
  if (numValidated >= 3) {
    probability += 0.2;
  }
  if (avgTimePerTile < 2) {
    probability += 0.15;
  }
  if (avgTimePerTile > 10) {
    probability -= 0.2;
  }

  return Math.min(0.95, Math.max(0.05, probability));
}

/**
 * Cluster visitors by behavior to personalize future bingo cards.
 * Features: [avgValidationTime, numHintsUsed, score].
 */
export async function clusterVisitors(museumId: string): Promise<void> {
  const sessions = await db
    .collection('game_sessions')
    .where('museumId', '==', museumId)
    .where('status', '==', 'completed')
    .limit(1000)
    .get();

  const features: number[][] = [];
  sessions.forEach((doc: any) => {
    const data = doc.data();
    const avgTime =
      (data.endTime.toDate() - data.startTime.toDate()) / 60000 / Math.max(1, data.completedTiles.length);
    const hints = data.hintsUsed || 0;
    features.push([avgTime, hints, data.score]);
  });

  if (features.length < 10) {
    return;
  }

  const centroids = await kmeans(features, 3);
  await db.collection('analytics').doc(`${museumId}_clusters`).set({
    centroids,
    updatedAt: new Date(),
  });
}

async function kmeans(data: number[][], k: number, maxIters = 20): Promise<number[][]> {
  let centroids = data.slice(0, k);

  for (let iter = 0; iter < maxIters; iter++) {
    const assignments = data.map((point) => {
      let minDist = Number.POSITIVE_INFINITY;
      let bestIdx = 0;

      for (let i = 0; i < k; i++) {
        const dist = Math.hypot(...point.map((v, j) => v - centroids[i][j]));
        if (dist < minDist) {
          minDist = dist;
          bestIdx = i;
        }
      }

      return bestIdx;
    });

    const newCentroids = Array(k)
      .fill(null)
      .map(() => Array(data[0].length).fill(0));
    const counts = Array(k).fill(0);

    assignments.forEach((cluster, idx) => {
      counts[cluster]++;
      for (let j = 0; j < data[0].length; j++) {
        newCentroids[cluster][j] += data[idx][j];
      }
    });

    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        newCentroids[i] = newCentroids[i].map((v: number) => v / counts[i]);
      } else {
        newCentroids[i] = centroids[i];
      }
    }

    if (JSON.stringify(centroids) === JSON.stringify(newCentroids)) {
      break;
    }

    centroids = newCentroids;
  }

  return centroids;
}
