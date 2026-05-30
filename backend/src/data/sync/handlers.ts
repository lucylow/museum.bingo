import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import redis, { setRoomState } from '../redis/client';
import { uploadArtworkImage } from '../s3/client';

type SnapshotLike = {
  data: () => Record<string, unknown> | undefined;
  ref: {
    update: (payload: Record<string, unknown>) => Promise<void>;
  };
};

export async function onArtworkCreated(snapshot: SnapshotLike): Promise<void> {
  const artwork = snapshot.data();
  if (!artwork || artwork.imageS3Key || !artwork.tempImageBase64) {
    return;
  }

  const museumId = String(artwork.museumId || '');
  const artworkId = String(artwork.id || '');
  if (!museumId || !artworkId) {
    return;
  }

  const imageBuffer = Buffer.from(String(artwork.tempImageBase64), 'base64');
  const s3Key = await uploadArtworkImage(museumId, artworkId, imageBuffer);
  await snapshot.ref.update({
    imageS3Key: s3Key,
    tempImageBase64: FieldValue.delete(),
  });
}

export async function onMultiplayerRoomActivated(roomId: string): Promise<void> {
  const roomDoc = await db.collection('multiplayer_rooms').doc(roomId).get();
  if (!roomDoc.exists) {
    return;
  }

  await setRoomState(roomId, {
    ...roomDoc.data(),
    cachedAt: Date.now(),
  });
}

export async function syncScoresToFirestore(roomId: string): Promise<void> {
  const scores = await redis.hgetall(`room:${roomId}:scores`);
  const roomRef = db.collection('multiplayer_rooms').doc(roomId);
  const batch = db.batch();

  for (const [userId, score] of Object.entries(scores)) {
    batch.update(roomRef, {
      [`players.${userId}.score`]: parseInt(score, 10),
    });
  }

  await batch.commit();
}
