import { useEffect, useMemo, useState } from 'react';
import { CompassService } from '../services/CompassService';

interface MotionState {
  tiltX: number;
  tiltY: number;
  heading: number;
  quality: 'reliable' | 'unreliable';
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const useDeviceMotion = (enabled: boolean, intensity = 0.5): MotionState => {
  const [motion, setMotion] = useState<MotionState>({
    tiltX: 0,
    tiltY: 0,
    heading: 0,
    quality: 'unreliable',
  });

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void CompassService.getInstance()
      .initialize()
      .then(() => {
        if (!active) return;
        unsubscribe = CompassService.getInstance().addListener((reading) => {
          // Heading acts as a lightweight orientation source for subtle parallax.
          const normalizedHeading = ((reading.heading % 360) + 360) % 360;
          const rad = (normalizedHeading * Math.PI) / 180;
          const x = clamp(Math.sin(rad) * intensity, -1, 1);
          const y = clamp(Math.cos(rad) * intensity * 0.65, -1, 1);
          setMotion({
            tiltX: x,
            tiltY: y,
            heading: normalizedHeading,
            quality: reading.quality,
          });
        });
      })
      .catch(() => {
        // Keep static motion when sensor initialization fails.
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [enabled, intensity]);

  return useMemo(() => motion, [motion]);
};
