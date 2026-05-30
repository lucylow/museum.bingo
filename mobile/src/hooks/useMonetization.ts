import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { monetizationService } from '../monetization/service';
import { MonetizationArchitecture, MonetizationState } from '../monetization/types';

type UseMonetizationResult = {
  loading: boolean;
  state: MonetizationState | null;
  architecture: MonetizationArchitecture | null;
  refresh: () => Promise<void>;
};

export function useMonetization(): UseMonetizationResult {
  const { getIdToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<MonetizationState | null>(null);
  const [architecture, setArchitecture] = useState<MonetizationArchitecture | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const token = user ? await getIdToken() : undefined;
      const [nextState, nextArchitecture] = await Promise.all([
        monetizationService.fetchMonetizationState(token),
        monetizationService.fetchArchitecture(token),
      ]);
      setState(nextState);
      setArchitecture(nextArchitecture);
    } catch {
      setState(null);
      setArchitecture(null);
    } finally {
      setLoading(false);
    }
  }, [getIdToken, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      loading,
      state,
      architecture,
      refresh,
    }),
    [architecture, loading, refresh, state]
  );
}
