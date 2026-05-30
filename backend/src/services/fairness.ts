import { db, FieldValue } from '../config/firebase';

export function generatePersonalizedCard(basePrompts: string[], size: number): string[][] {
  const shuffled = [...basePrompts];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, size * size);
  const card: string[][] = [];
  for (let row = 0; row < size; row += 1) {
    card.push(selected.slice(row * size, (row + 1) * size));
  }

  return card;
}

export async function createPersonalizedRoom(
  ownerId: string,
  displayName: string,
  museumId: string,
  basePrompts: string[],
  size: number
): Promise<string> {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ownerCard = generatePersonalizedCard(basePrompts, size);
  const roomRef = db.collection('multiplayer_rooms').doc(roomId);

  await roomRef.set({
    roomId,
    museumId,
    ownerId,
    isPersonalized: true,
    status: 'waiting',
    createdAt: FieldValue.serverTimestamp(),
    players: {
      [ownerId]: {
        userId: ownerId,
        displayName,
        score: 0,
        completedTiles: [],
        joinedAt: FieldValue.serverTimestamp(),
      },
    },
  });

  await roomRef.collection('playerCards').doc(ownerId).set({ card: ownerCard });
  return roomId;
}

export async function addPlayerWithPersonalizedCard(
  roomId: string,
  userId: string,
  displayName: string,
  basePrompts: string[],
  size: number
): Promise<void> {
  const card = generatePersonalizedCard(basePrompts, size);
  const roomRef = db.collection('multiplayer_rooms').doc(roomId);

  await roomRef.update({
    [`players.${userId}`]: {
      userId,
      displayName,
      score: 0,
      completedTiles: [],
      joinedAt: FieldValue.serverTimestamp(),
    },
  });

  await roomRef.collection('playerCards').doc(userId).set({ card });
}
