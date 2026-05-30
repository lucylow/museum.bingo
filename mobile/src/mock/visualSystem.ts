import { appTheme } from '../theme/tokens';

export type MockImageType =
  | 'artwork'
  | 'museumScene'
  | 'avatar'
  | 'badge'
  | 'promo'
  | 'stat'
  | 'leaderboard'
  | 'cameraResult'
  | 'emptyState'
  | 'onboarding';

export type MockMood =
  | 'calm'
  | 'playful'
  | 'dramatic'
  | 'elegant'
  | 'celebratory'
  | 'night'
  | 'seasonal';

export type MockAspect = 'square' | 'portrait' | 'landscape' | 'banner' | 'circle';

export interface MockImageToken {
  id: string;
  type: MockImageType;
  mood: MockMood;
  aspect: MockAspect;
  category: string;
  fallbackColor: string;
  label: string;
  alt: string;
  palette: [string, string, string];
}

export const mockVisualRadii = {
  square: 14,
  portrait: 16,
  landscape: 16,
  banner: 18,
  circle: 999,
};

export const mockAspectRatio: Record<MockAspect, number> = {
  square: 1,
  portrait: 0.72,
  landscape: 1.5,
  banner: 2.1,
  circle: 1,
};

export const museumTonePalette = {
  duskBlue: '#3A4D8F',
  velvet: '#6E5AA6',
  bronze: '#B7834F',
  galleryStone: '#8392B8',
  softGold: '#E9C77A',
  mint: '#87D8C2',
  plum: '#6A3D7A',
  charcoal: '#1F2D4A',
};

export const mockFallbackColors = {
  artwork: '#2A365D',
  museumScene: '#243A61',
  avatar: '#2E4B70',
  badge: '#5D3A73',
  promo: '#25456E',
  stat: '#2E3F65',
  leaderboard: '#334E77',
  cameraResult: '#2B4E52',
  emptyState: '#2B3559',
  onboarding: '#364C85',
};

export const rarityGlow: Record<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary', string> = {
  common: '#A7B2C8',
  uncommon: '#79C99E',
  rare: '#66A8FF',
  epic: '#BB7DFF',
  legendary: '#FFC96B',
};

export const mockVisualShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 16,
  elevation: 8,
};

export const getVisualTokenKey = (token: Pick<MockImageToken, 'type' | 'mood' | 'category'>): string =>
  `${token.type}:${token.mood}:${token.category}`;

export const buildDefaultAlt = (label: string, category: string): string =>
  `${label} mock illustration for ${category} in Museum.Bingo`;

export const visualCardBorder = {
  borderWidth: 1,
  borderColor: appTheme.colors.borderSoft,
};
