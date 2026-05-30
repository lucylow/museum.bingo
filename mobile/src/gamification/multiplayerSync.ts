import { io, Socket } from 'socket.io-client';
import { BadgeEarned } from './types';
import { useGamificationStore } from '../store/gamificationStore';

type LeaderboardEntry = { userId: string; rank: number; score: number };

class GamificationMultiplayerSync {
  private socket: Socket | null = null;

  private roomId: string | null = null;

  connect(roomId: string, userId: string, token: string): void {
    this.disconnect();
    this.roomId = roomId;

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    this.socket = io(backendUrl, {
      auth: { token },
      query: { roomId, userId },
      transports: ['websocket'],
    });

    const handleScoreUpdate = ({
      userId: eventUserId,
      newScore,
      rankChange = 0,
    }: {
      userId: string;
      newScore: number;
      rankChange?: number;
    }) => {
      if (eventUserId === useGamificationStore.getState().userId) {
        useGamificationStore.getState().updateState({ totalScore: newScore, rankChange });
      }
    };

    this.socket.on('score_update', handleScoreUpdate);
    this.socket.on('score-update', handleScoreUpdate);

    this.socket.on('badge_unlocked', ({ userId: eventUserId, badge }) => {
      if (eventUserId === useGamificationStore.getState().userId) {
        useGamificationStore.getState().addBadge(badge as BadgeEarned);
      }
    });

    this.socket.on('room_leaderboard', (leaderboard: LeaderboardEntry[]) => {
      const currentUserId = useGamificationStore.getState().userId;
      const myEntry = leaderboard.find((entry) => entry.userId === currentUserId);
      if (myEntry) {
        useGamificationStore.getState().updateState({ rank: myEntry.rank });
      }
    });
  }

  emitTileValidation(
    tileId: string,
    newScore: number,
    badgeUnlocked?: BadgeEarned,
    points: number = 0
  ): void {
    this.socket?.emit('tile-validated', {
      roomId: this.roomId,
      tileId,
      points,
      newScore,
      badgeUnlocked,
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const gamificationSync = new GamificationMultiplayerSync();
