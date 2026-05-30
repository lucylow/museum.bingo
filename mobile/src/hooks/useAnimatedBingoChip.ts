import { useCallback } from 'react';
import {
  runOnJS,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const DROP_DURATION = 200;
const FADE_DURATION = 400;

export interface ChipAnimationResult {
  isAnimating: SharedValue<boolean>;
  startAnimation: (x: number, y: number, onComplete?: () => void) => void;
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
}

export const useAnimatedBingoChip = (): ChipAnimationResult => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const startAnimation = useCallback(
    (posX: number, posY: number, onComplete?: () => void) => {
      if (isAnimating.value) return;

      isAnimating.value = true;
      x.value = posX;
      y.value = posY;
      scale.value = 0.2;
      opacity.value = 0;

      const finish = () => {
        isAnimating.value = false;
        if (onComplete) onComplete();
      };

      opacity.value = withSequence(
        withTiming(1, { duration: DROP_DURATION }),
        withTiming(0, { duration: FADE_DURATION }),
      );

      scale.value = withSequence(
        withTiming(1.1, { duration: DROP_DURATION }),
        withSpring(1, { damping: 12, stiffness: 220 }),
        withTiming(0, { duration: FADE_DURATION }, (finished) => {
          'worklet';
          if (finished) {
            runOnJS(finish)();
          }
        }),
      );
    },
    [isAnimating, opacity, scale, x, y],
  );

  return {
    isAnimating,
    startAnimation,
    x,
    y,
    scale,
    opacity,
  };
};
