import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import { gameSessionsCollection, multiplayerRoomsCollection, usersCollection } from './schema';

type GameSessionUpdate = {
  id: string;
  [key: string]: unknown;
};

export function subscribeToGameSession(
  sessionId: string,
  onUpdate: (session: GameSessionUpdate) => void
): () => void {
  const doc = gameSessionsCollection.doc(sessionId);
  const unsubscribe = doc.onSnapshot((snapshot) => {
    if (!snapshot.exists) {
      return;
    }

    onUpdate({ id: snapshot.id, ...snapshot.data() });
  });

  return unsubscribe;
}

export async function validateTile(
  sessionId: string,
  userId: string,
  tileId: string
): Promise<{ success: boolean; newScore: number }> {
  const sessionRef = gameSessionsCollection.doc(sessionId);
  const userRef = usersCollection.doc(userId);

  return db.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      throw new Error('Session not found');
    }

    const session = sessionDoc.data() as { completedTiles?: string[]; score?: number };
    const completedTiles = session.completedTiles || [];
    const score = session.score || 0;

    if (completedTiles.includes(tileId)) {
      return { success: false, newScore: score };
    }

    const newScore = score + 10;
    transaction.update(sessionRef, {
      completedTiles: FieldValue.arrayUnion(tileId),
      score: newScore,
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(
      userRef,
      {
        totalBingos: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, newScore };
  });
}

export async function createMultiplayerRoom(
  museumId: string,
  ownerId: string,
  ownerName: string
): Promise<string> {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const roomRef = multiplayerRoomsCollection.doc(roomId);
  await roomRef.set({
    roomId,
    museumId,
    ownerId,
    players: {
      [ownerId]: { userId: ownerId, displayName: ownerName, score: 0 },
    },
    status: 'waiting',
    createdAt: FieldValue.serverTimestamp(),
  });
  return roomId;
}
