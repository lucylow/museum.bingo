import { useCallback, useEffect, useRef, useState } from 'react';
import { arConfetti } from '../native/ARConfetti';
import { soundService } from '../services/SoundService';
import { useHapticFeedback } from './useHapticFeedback';

interface CelebrationOptions {
  duration?: number;
  onComplete?: () => void;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
}

export const useBingoCelebration = () => {
  const [isCelebrating, setIsCelebrating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { trigger: triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      void arConfetti.stop();
    };
  }, []);

  const triggerCelebration = useCallback(
    async (options: CelebrationOptions = {}) => {
      if (isCelebrating) return false;
      setIsCelebrating(true);

      const duration = options.duration ?? 4000;

      if (options.soundEnabled !== false) {
        void soundService.init().then(() => {
          soundService.playCelebration();
        });
      }
      if (options.hapticEnabled !== false) {
        triggerHaptic('impactHeavy');
      }

      await arConfetti.start({
        onError: () => {
          // AR fallback UI is handled by ARConfettiView.
        },
      });

      timeoutRef.current = setTimeout(() => {
        void arConfetti.stop();
        setIsCelebrating(false);
        options.onComplete?.();
      }, duration);

      return true;
    },
    [isCelebrating, triggerHaptic],
  );

  return {
    triggerCelebration,
    isCelebrating,
  };
};
