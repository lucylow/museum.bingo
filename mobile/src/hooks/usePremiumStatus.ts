import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
      const response = await api.get<SubscriptionStatus>('/subscription/status', { token });
      setIsPremium(response.isActive);
      setTier(response.tier);
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
