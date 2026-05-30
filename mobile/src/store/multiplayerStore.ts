import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type MultiplayerPlayer = {
  userId: string;
  displayName: string;
  score: number;
  completedTiles: string[];
};

interface MultiplayerState {
  currentRoomId: string | null;
  isHost: boolean;
  players: Record<string, MultiplayerPlayer>;
  score: number;
  completedTiles: string[];
  setRoom: (roomId: string, isHost: boolean) => void;
  setPlayers: (players: Record<string, MultiplayerPlayer>) => void;
  updatePlayerScore: (userId: string, newScore: number) => void;
  addCompletedTile: (tileId: string) => void;
  setScore: (score: number) => void;
  resetMultiplayer: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>()(
  persist(
    (set) => ({
      currentRoomId: null,
      isHost: false,
      players: {},
      score: 0,
      completedTiles: [],
      setRoom: (roomId, isHost) =>
        set({
          currentRoomId: roomId,
          isHost,
          completedTiles: [],
          score: 0,
          players: {},
        }),
      setPlayers: (players) => set({ players }),
      updatePlayerScore: (userId, newScore) =>
        set((state) => {
          const existing = state.players[userId];
          if (!existing) {
            return state;
          }
          return {
            players: {
              ...state.players,
              [userId]: { ...existing, score: newScore },
            },
          };
        }),
      addCompletedTile: (tileId) =>
        set((state) => ({
          completedTiles: state.completedTiles.includes(tileId)
            ? state.completedTiles
            : [...state.completedTiles, tileId],
        })),
      setScore: (score) => set({ score }),
      resetMultiplayer: () =>
        set({
          currentRoomId: null,
          isHost: false,
          players: {},
          score: 0,
          completedTiles: [],
        }),
    }),
    { name: 'multiplayer-storage' }
  )
);
