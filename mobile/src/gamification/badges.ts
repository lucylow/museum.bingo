import { Badge } from './types';

export const BADGES: Badge[] = [
  {
    id: 'first_scan',
    nameKey: 'badge.first_scan.name',
    descriptionKey: 'badge.first_scan.desc',
    icon: '🔍',
    rarity: 'common',
    unlockCondition: (state) => state.tilesValidated.length >= 1,
  },
  {
    id: 'first_streak',
    nameKey: 'badge.first_streak.name',
    descriptionKey: 'badge.first_streak.desc',
    icon: '🔥',
    rarity: 'common',
    unlockCondition: (state) => state.currentStreak >= 3,
  },
  {
    id: 'streak_master',
    nameKey: 'badge.streak_master.name',
    descriptionKey: 'badge.streak_master.desc',
    icon: '🏆',
    rarity: 'rare',
    unlockCondition: (state) => state.bestStreak >= 10,
  },
  {
    id: 'line_breaker',
    nameKey: 'badge.line_breaker.name',
    descriptionKey: 'badge.line_breaker.desc',
    icon: '📏',
    rarity: 'uncommon',
    unlockCondition: (state) => state.linesCompleted >= 1,
  },
  {
    id: 'bingo_winner',
    nameKey: 'badge.bingo_winner.name',
    descriptionKey: 'badge.bingo_winner.desc',
    icon: '🎯',
    rarity: 'rare',
    unlockCondition: (state) => state.bingosCompleted >= 1,
  },
  {
    id: 'bingo_legend',
    nameKey: 'badge.bingo_legend.name',
    descriptionKey: 'badge.bingo_legend.desc',
    icon: '👑',
    rarity: 'epic',
    unlockCondition: (state) => state.bingosCompleted >= 10,
  },
  {
    id: 'museum_explorer',
    nameKey: 'badge.museum_explorer.name',
    descriptionKey: 'badge.museum_explorer.desc',
    icon: '🏛️',
    rarity: 'uncommon',
    unlockCondition: (state) => state.tilesValidated.length >= 9,
  },
  {
    id: 'speed_finder',
    nameKey: 'badge.speed_finder.name',
    descriptionKey: 'badge.speed_finder.desc',
    icon: '⚡',
    rarity: 'epic',
    unlockCondition: () => false,
  },
];

export const getBadgesByRarity = (): Record<string, Badge[]> => {
  const grouped: Record<string, Badge[]> = {
    common: [],
    uncommon: [],
    rare: [],
    epic: [],
    legendary: [],
  };

  for (const badge of BADGES) {
    grouped[badge.rarity].push(badge);
  }

  return grouped;
};
