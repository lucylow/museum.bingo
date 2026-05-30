import { api } from './client';

export type MultiplayerRoom = {
  roomId: string;
  museumId: string;
  ownerId: string;
  bingoCard: string[][];
  isPersonalized: boolean;
  status: 'waiting' | 'playing' | 'finished';
  players: Record<
    string,
    {
      userId: string;
      displayName: string;
      score: number;
      completedTiles: string[];
    }
  >;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  score: number;
};

export async function createRoom(
  museumId: string,
  bingoCard: string[][],
  isPersonalized = false
): Promise<string> {
  const { data } = await api.post<{ roomId: string }>('/multiplayer/create', {
    museumId,
    bingoCard,
    isPersonalized,
  });
  return data.roomId;
}

export async function joinRoom(roomId: string, displayName?: string): Promise<void> {
  await api.post('/multiplayer/join', { roomId, displayName });
}

export async function getRoom(roomId: string): Promise<MultiplayerRoom> {
  const { data } = await api.get<MultiplayerRoom>(`/multiplayer/${roomId}`);
  return data;
}

export async function getLeaderboard(roomId: string): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<LeaderboardEntry[]>(`/multiplayer/${roomId}/leaderboard`);
  return data;
}

export async function updateTileValidation(
  roomId: string,
  tileId: string,
  artworkId: string
): Promise<{ success: boolean; newScore?: number; message?: string }> {
  const { data } = await api.post<{ success: boolean; newScore?: number; message?: string }>(
    `/multiplayer/${roomId}/validate`,
    { tileId, artworkId }
  );
  return data;
}
