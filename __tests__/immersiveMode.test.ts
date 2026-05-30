import {
  applyComfortSettings,
  defaultImmersiveSettings,
  getDirectionalCue,
  getMoveCloserCue,
  getTurnCue,
} from '../mobile/src/immersive/immersiveSystem';
import {
  classifyPerformanceTier,
  computeAdaptiveIntensity,
  shouldThrottleMotion,
} from '../mobile/src/utils/ImmersivePerformance';

describe('immersive system', () => {
  test('maps bearings to directional cues', () => {
    expect(getDirectionalCue(0)).toBe('front');
    expect(getDirectionalCue(65)).toBe('right');
    expect(getDirectionalCue(184)).toBe('behind');
    expect(getDirectionalCue(290)).toBe('left');
  });

  test('maps distance to move closer cues', () => {
    expect(getMoveCloserCue(1.2)).toBe('arrived');
    expect(getMoveCloserCue(6)).toBe('close');
    expect(getMoveCloserCue(16)).toBe('move-closer');
    expect(getMoveCloserCue(42)).toBe('far');
  });

  test('creates nuanced turn cues', () => {
    expect(getTurnCue(0)).toBe('On heading');
    expect(getTurnCue(78)).toBe('Turn slightly right');
    expect(getTurnCue(120)).toBe('Turn right');
    expect(getTurnCue(182)).toBe('Turn around');
  });

  test('comfort mode clamps motion intensity', () => {
    const comfort = applyComfortSettings({
      ...defaultImmersiveSettings,
      comfortMode: true,
      motionSensitivity: 0.7,
      cameraTiltStrength: 0.8,
      floatingIntensity: 0.72,
    });
    expect(comfort.motionSensitivity).toBeLessThanOrEqual(0.24);
    expect(comfort.cameraTiltStrength).toBeLessThanOrEqual(0.22);
    expect(comfort.floatingIntensity).toBeLessThanOrEqual(0.2);
  });
});

describe('immersive performance safeguards', () => {
  test('classifies frame times into expected tiers', () => {
    expect(classifyPerformanceTier(16.7)).toBe('high');
    expect(classifyPerformanceTier(24)).toBe('medium');
    expect(classifyPerformanceTier(34)).toBe('low');
    expect(classifyPerformanceTier(47)).toBe('fallback2D');
  });

  test('reduces intensity on lower tiers', () => {
    const base = { motion: 1, depth: 1, glow: 1 };
    expect(computeAdaptiveIntensity('high', base)).toEqual(base);
    expect(computeAdaptiveIntensity('low', base)).toEqual({ motion: 0.5, depth: 0.55, glow: 0.75 });
    expect(computeAdaptiveIntensity('fallback2D', base)).toEqual({ motion: 0, depth: 0, glow: 0.22 });
  });

  test('throttles motion during camera and low tiers', () => {
    expect(shouldThrottleMotion(true, 'high')).toBe(true);
    expect(shouldThrottleMotion(false, 'low')).toBe(true);
    expect(shouldThrottleMotion(false, 'high')).toBe(false);
  });
});
