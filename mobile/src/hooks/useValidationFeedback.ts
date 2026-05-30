import { useCallback, useRef } from 'react';
import { soundService } from '../services/SoundService';
import { useHapticFeedback, type HapticType } from './useHapticFeedback';

export type FeedbackIntensity = 'subtle' | 'normal' | 'celebratory';

interface FeedbackConfig {
  haptic: HapticType;
  sound: 'chipDrop' | 'fanfare';
}

const FEEDBACK_CONFIG: Record<FeedbackIntensity, FeedbackConfig> = {
  subtle: { haptic: 'impactLight', sound: 'chipDrop' },
  normal: { haptic: 'impactMedium', sound: 'chipDrop' },
  celebratory: { haptic: 'impactHeavy', sound: 'fanfare' },
};

export const useValidationFeedback = () => {
  const { trigger: triggerHaptic } = useHapticFeedback();
  const lastFeedbackTime = useRef(0);
  const debounceMs = 300;

  const triggerFeedback = useCallback(
    (intensity: FeedbackIntensity = 'normal') => {
      const now = Date.now();
      if (now - lastFeedbackTime.current < debounceMs) return;
      lastFeedbackTime.current = now;

      const config = FEEDBACK_CONFIG[intensity];
      triggerHaptic(config.haptic);

      if (config.sound === 'chipDrop') {
        soundService.playChipDrop();
      } else {
        soundService.playCelebration();
      }
    },
    [triggerHaptic],
  );

  return { triggerFeedback };
};
