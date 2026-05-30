export type ImmersivePerformanceTier = 'high' | 'medium' | 'low' | 'fallback2D';

export const classifyPerformanceTier = (averageFrameMs: number): ImmersivePerformanceTier => {
  if (averageFrameMs > 44) return 'fallback2D';
  if (averageFrameMs > 30) return 'low';
  if (averageFrameMs > 21) return 'medium';
  return 'high';
};

export const computeAdaptiveIntensity = (
  tier: ImmersivePerformanceTier,
  base: { motion: number; depth: number; glow: number },
): { motion: number; depth: number; glow: number } => {
  if (tier === 'fallback2D') {
    return { motion: 0, depth: 0, glow: 0.22 };
  }
  if (tier === 'low') {
    return { motion: base.motion * 0.5, depth: base.depth * 0.55, glow: base.glow * 0.75 };
  }
  if (tier === 'medium') {
    return { motion: base.motion * 0.8, depth: base.depth * 0.82, glow: base.glow * 0.92 };
  }
  return base;
};

export const shouldThrottleMotion = (cameraActive: boolean, tier: ImmersivePerformanceTier): boolean =>
  cameraActive || tier === 'low' || tier === 'fallback2D';
