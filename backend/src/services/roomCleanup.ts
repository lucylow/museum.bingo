import { Server } from 'socket.io';
import { db, FieldValue, Timestamp } from '../config/firebase';

const DISCONNECT_TIMEOUT_MS = 2 * 60 * 1000;

export function handlePlayerDisconnect(io: Server, roomId: string, userId: string): void {
  const roomRef = db.collection('multiplayer_rooms').doc(roomId);
  const disconnectedRef = roomRef.collection('disconnected').doc(userId);

  void disconnectedRef.set({ disconnectedAt: FieldValue.serverTimestamp() }, { merge: true });

  setTimeout(async () => {
    const disconnectedDoc = await disconnectedRef.get();
    if (!disconnectedDoc.exists) {
      return;
    }

    const disconnectedAt = disconnectedDoc.data()?.disconnectedAt as Timestamp | undefined;
    if (!disconnectedAt) {
      return;
    }

    const elapsed = Date.now() - disconnectedAt.toMillis();
    if (elapsed < DISCONNECT_TIMEOUT_MS) {
      return;
    }

    await roomRef.update({
      [`players.${userId}`]: FieldValue.delete(),
    });
    await disconnectedRef.delete();

    io.to(`room:${roomId}`).emit('player-left', { userId });
  }, DISCONNECT_TIMEOUT_MS);
}

export async function clearDisconnectedMarker(roomId: string, userId: string): Promise<void> {
  await db.collection('multiplayer_rooms').doc(roomId).collection('disconnected').doc(userId).delete();
}
