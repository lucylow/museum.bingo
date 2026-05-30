import { db, Timestamp } from '../config/firebase';

export interface Player {
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  completedTiles: string[];
  joinedAt: Timestamp;
}

export interface MultiplayerRoom {
  roomId: string;
  museumId: string;
  ownerId: string;
  bingoCard: string[][];
  isPersonalized: boolean;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  players: Record<string, Player>;
  maxPlayers?: number;
}

const roomsCollection = db.collection('multiplayer_rooms');

function createRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createRoom(
  ownerId: string,
  displayName: string,
  museumId: string,
  bingoCard: string[][],
  isPersonalized = false
): Promise<string> {
  const roomId = createRoomId();
  const roomData: MultiplayerRoom = {
    roomId,
    museumId,
    ownerId,
    bingoCard,
    isPersonalized,
    status: 'waiting',
    createdAt: Timestamp.now(),
    players: {
      [ownerId]: {
        userId: ownerId,
        displayName,
        score: 0,
        completedTiles: [],
        joinedAt: Timestamp.now(),
      },
    },
  };

  await roomsCollection.doc(roomId).set(roomData);
  return roomId;
}

export async function joinRoom(
  roomId: string,
  userId: string,
  displayName: string
): Promise<MultiplayerRoom | null> {
  const roomRef = roomsCollection.doc(roomId);
  const doc = await roomRef.get();

  if (!doc.exists) {
    return null;
  }

  const room = doc.data() as MultiplayerRoom;
  if (room.status !== 'waiting') {
    return null;
  }

  const existingPlayer = room.players[userId];
  const playerRecord = existingPlayer || {
    userId,
    displayName,
    score: 0,
    completedTiles: [],
    joinedAt: Timestamp.now(),
  };

  await roomRef.update({
    [`players.${userId}`]: playerRecord,
  });

  const refreshed = await roomRef.get();
  return refreshed.exists ? (refreshed.data() as MultiplayerRoom) : null;
}

export async function getRoom(roomId: string): Promise<MultiplayerRoom | null> {
  const doc = await roomsCollection.doc(roomId).get();
  return doc.exists ? (doc.data() as MultiplayerRoom) : null;
}

export async function startGame(roomId: string): Promise<void> {
  await roomsCollection.doc(roomId).update({
    status: 'playing',
    startedAt: Timestamp.now(),
  });
}
