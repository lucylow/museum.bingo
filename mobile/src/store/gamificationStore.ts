import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BadgeEarned, GamificationState, ScoreEvent } from '../gamification/types';

interface GamificationStore extends GamificationState {
  scoreEvents: ScoreEvent[];
  addScoreEvent: (event: ScoreEvent) => void;
  updateState: (partial: Partial<GamificationState>) => void;
  resetSession: (museumId: string, userId: string, sessionId: string) => void;
  addBadge: (badge: BadgeEarned) => void;
  clearScoreEvents: () => void;
}

const initialState: Omit<
  GamificationStore,
  'addScoreEvent' | 'updateState' | 'resetSession' | 'addBadge' | 'clearScoreEvents'
> = {
  userId: '',
  sessionId: '',
  museumId: '',
  totalScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  tilesValidated: [],
  linesCompleted: 0,
  bingosCompleted: 0,
  badgesEarned: [],
  rank: 0,
  rankChange: 0,
  lastActionTimestamp: 0,
  scoreEvents: [],
};

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set) => ({
      ...initialState,
      addScoreEvent: (event) => {
        set((state) => ({ scoreEvents: [...state.scoreEvents, event] }));
      },
      updateState: (partial) => set((state) => ({ ...state, ...partial })),
      resetSession: (museumId, userId, sessionId) => {
        set({
          ...initialState,
          museumId,
          userId,
          sessionId,
          lastActionTimestamp: Date.now(),
        });
      },
      addBadge: (badge) => {
        set((state) => {
          if (state.badgesEarned.some((existing) => existing.id === badge.id)) {
            return state;
          }
          return { badgesEarned: [...state.badgesEarned, badge] };
        });
      },
      clearScoreEvents: () => set({ scoreEvents: [] }),
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
