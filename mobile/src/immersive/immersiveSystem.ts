import { appTheme } from '../theme/tokens';

export type ImmersiveLayer = 'near' | 'mid' | 'far';
export type ImmersiveSceneMode = 'classicGallery' | 'modernGallery' | 'nightMuseum' | 'familyFun' | 'challenge';

export interface LayerToken {
  zOffset: number;
  scale: number;
  parallaxFactor: number;
  blur: number;
}

export interface ImmersiveSettings {
  enabled: boolean;
  comfortMode: boolean;
  reducedMotion: boolean;
  minimalOverlayMode: boolean;
  highContrastUI: boolean;
  motionSensitivity: number;
  cameraTiltStrength: number;
  floatingIntensity: number;
  depthIntensity: number;
  animationSpeed: number;
  lightingContrast: number;
  lowPowerMode: boolean;
}

export const defaultImmersiveSettings: ImmersiveSettings = {
  enabled: false,
  comfortMode: false,
  reducedMotion: false,
  minimalOverlayMode: false,
  highContrastUI: false,
  motionSensitivity: 0.45,
  cameraTiltStrength: 0.4,
  floatingIntensity: 0.38,
  depthIntensity: 0.5,
  animationSpeed: 1,
  lightingContrast: 0.55,
  lowPowerMode: false,
};

export const immersiveTokens = {
  depth: {
    near: { zOffset: 18, scale: 1.02, parallaxFactor: 1.18, blur: 0 },
    mid: { zOffset: 0, scale: 1, parallaxFactor: 0.72, blur: 0.2 },
    far: { zOffset: -18, scale: 0.96, parallaxFactor: 0.42, blur: 0.9 },
  } as Record<ImmersiveLayer, LayerToken>,
  card: {
    scaleFocused: 1.06,
    scaleIdle: 1,
    rotationMaxDeg: 6,
    framedBorderWidth: 1,
    shadowSoftness: 20,
  },
  glow: {
    ambient: 'rgba(109, 185, 255, 0.16)',
    target: 'rgba(255, 190, 113, 0.34)',
    success: 'rgba(97, 226, 148, 0.30)',
  },
  motion: {
    easingInOut: appTheme.motion.normal,
    sceneTransitionMs: 560,
    focusTransitionMs: 280,
    tilePulseMs: 880,
    ringPulseMs: 1500,
    pointerBreathMs: 1300,
    updateThrottleMs: 65,
  },
  spacing: {
    safeTop: 56,
    safeBottom: 28,
    panelGap: 12,
    cardDepthStep: 22,
    tileDepthStep: 8,
  },
  pointer: {
    size: 30,
    ringSize: 46,
    opacity: 0.82,
  },
};

export const sceneModePalette: Record<ImmersiveSceneMode, { bgTop: string; bgBottom: string; accent: string; particle: string }> = {
  classicGallery: {
    bgTop: '#0C152B',
    bgBottom: '#151F3B',
    accent: '#D6A66A',
    particle: 'rgba(255, 220, 172, 0.24)',
  },
  modernGallery: {
    bgTop: '#0A1A2D',
    bgBottom: '#112E47',
    accent: '#8CE0FF',
    particle: 'rgba(140, 224, 255, 0.22)',
  },
  nightMuseum: {
    bgTop: '#070A19',
    bgBottom: '#1A2048',
    accent: '#9D8BFF',
    particle: 'rgba(157, 139, 255, 0.24)',
  },
  familyFun: {
    bgTop: '#162648',
    bgBottom: '#29406D',
    accent: '#FFCC6D',
    particle: 'rgba(255, 204, 109, 0.24)',
  },
  challenge: {
    bgTop: '#1A122E',
    bgBottom: '#2A1E4A',
    accent: '#FF7FA8',
    particle: 'rgba(255, 127, 168, 0.26)',
  },
};

export const applyComfortSettings = (settings: ImmersiveSettings): ImmersiveSettings => {
  if (!settings.comfortMode && !settings.reducedMotion) {
    return settings;
  }
  return {
    ...settings,
    motionSensitivity: Math.min(settings.motionSensitivity, 0.24),
    cameraTiltStrength: Math.min(settings.cameraTiltStrength, 0.22),
    floatingIntensity: Math.min(settings.floatingIntensity, 0.2),
    depthIntensity: Math.min(settings.depthIntensity, 0.36),
    animationSpeed: Math.min(settings.animationSpeed, 0.78),
  };
};

export const getDirectionalCue = (relativeBearing: number): 'front' | 'left' | 'right' | 'behind' => {
  const normalized = ((relativeBearing % 360) + 360) % 360;
  if (normalized <= 40 || normalized >= 320) return 'front';
  if (normalized > 40 && normalized < 140) return 'right';
  if (normalized >= 140 && normalized <= 220) return 'behind';
  return 'left';
};

export const getMoveCloserCue = (distanceMeters: number): 'arrived' | 'close' | 'move-closer' | 'far' => {
  if (distanceMeters < 3) return 'arrived';
  if (distanceMeters < 9) return 'close';
  if (distanceMeters < 30) return 'move-closer';
  return 'far';
};

export const computeParallaxShift = (
  layer: ImmersiveLayer,
  tiltX: number,
  tiltY: number,
  settings: ImmersiveSettings,
): { x: number; y: number } => {
  const comfort = applyComfortSettings(settings);
  const token = immersiveTokens.depth[layer];
  const intensity = comfort.depthIntensity * comfort.motionSensitivity * token.parallaxFactor;
  return {
    x: tiltX * 26 * intensity,
    y: tiltY * 20 * intensity,
  };
};
