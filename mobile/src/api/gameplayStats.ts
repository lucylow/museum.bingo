import { api } from './client';
import { GameplayEvent, LifetimeStats, SessionStats } from '../stats/types';

export const sendGameplayEventBatch = async (events: GameplayEvent[]): Promise<string[]> => {
  if (events.length === 0) {
    return [];
  }
  const { data } = await api.post<{ acceptedEventIds: string[] }>('/gameplay-stats/events/batch', { events });
  return data.acceptedEventIds ?? [];
};

export const sendSessionSummaryBatch = async (sessions: SessionStats[]): Promise<string[]> => {
  if (sessions.length === 0) {
    return [];
  }
  const { data } = await api.post<{ acceptedSessionIds: string[] }>('/gameplay-stats/sessions/batch', { sessions });
  return data.acceptedSessionIds ?? [];
};

export const fetchLifetimeStats = async (): Promise<LifetimeStats | null> => {
  const { data } = await api.get<{ lifetimeStats: LifetimeStats | null }>('/gameplay-stats/lifetime');
  return data.lifetimeStats;
};
