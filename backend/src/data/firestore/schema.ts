import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';

// Collection references
export const usersCollection = db.collection('users');
export const museumsCollection = db.collection('museums');
export const gameSessionsCollection = db.collection('game_sessions');
export const multiplayerRoomsCollection = db.collection('multiplayer_rooms');
export const leaderboardCollection = db.collection('daily_leaderboards');

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isPremium: boolean;
  totalBingos: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Museum {
  id: string;
  name: string;
  location: GeoPoint;
  address: string;
  artworkCount: number;
  bingoPrompts: string[][];
  embeddingVersion: number;
  createdAt: Timestamp;
}

export interface GameSession {
  sessionId: string;
  userId: string;
  museumId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  completedTiles: string[];
  score: number;
  multiplayerRoomId?: string;
  status: 'active' | 'completed' | 'abandoned';
}

export interface MultiplayerRoom {
  roomId: string;
  museumId: string;
  ownerId: string;
  players: Record<
    string,
    {
      userId: string;
      displayName: string;
      score: number;
    }
  >;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Timestamp;
}
