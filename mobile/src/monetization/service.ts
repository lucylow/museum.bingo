import { api } from '../api/client';
import { MonetizationArchitecture, MonetizationState, RevenueEventPayload } from './types';

const unwrap = <T>(response: unknown): T => {
  const maybeAxios = response as { data?: T };
  return (maybeAxios?.data ?? response) as T;
};

export const monetizationService = {
  async fetchMonetizationState(token?: string): Promise<MonetizationState> {
    const response = await api.get('/subscription/entitlements', { token });
    return unwrap<MonetizationState>(response);
  },
  async fetchArchitecture(token?: string): Promise<MonetizationArchitecture> {
    const response = await api.get('/subscription/architecture', { token });
    return unwrap<MonetizationArchitecture>(response);
  },
  async trackRevenueEvent(payload: RevenueEventPayload, token?: string): Promise<{ recorded: boolean; duplicate: boolean }> {
    const response = await api.post('/subscription/revenue-events', payload, { token });
    return unwrap<{ recorded: boolean; duplicate: boolean }>(response);
  },
};
