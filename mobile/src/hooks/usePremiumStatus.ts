import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { monetizationService } from '../monetization/service';

type SubscriptionStatus = {
  isActive: boolean;
  tier: string | null;
  expiresAt?: string | null;
};

export const usePremiumStatus = (): {
  isPremium: boolean;
  loading: boolean;
  tier: string | null;
  refresh: () => Promise<void>;
} => {
  const { getIdToken } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      try {
        const state = await monetizationService.fetchMonetizationState(token);
        setIsPremium(Boolean(state.subscription.isActive));
        setTier(state.subscription.tier);
      } catch {
        const response = await api.get<SubscriptionStatus>('/subscription/status', { token });
        const payload = (response as unknown as { data?: SubscriptionStatus }).data ?? (response as SubscriptionStatus);
        setIsPremium(payload.isActive);
        setTier(payload.tier);
      }
    } catch {
      setIsPremium(false);
      setTier(null);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { isPremium, loading, tier, refresh };
};
