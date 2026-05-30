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
    id: 'first_tile',
    nameKey: 'badge.first_tile.name',
    descriptionKey: 'badge.first_tile.desc',
    icon: '◧',
    rarity: 'common',
    unlockCondition: (state) => state.tilesValidated.length >= 1,
  },
  {
    id: 'streak_master',
    nameKey: 'badge.streak_master.name',
    descriptionKey: 'badge.streak_master.desc',
    icon: '✦',
    rarity: 'rare',
    unlockCondition: (state) => state.bestStreak >= 10,
  },
  {
    id: 'daily_challenge',
    nameKey: 'badge.daily_challenge.name',
    descriptionKey: 'badge.daily_challenge.desc',
    icon: '☼',
    rarity: 'uncommon',
    unlockCondition: (state) => state.linesCompleted >= 1,
  },
  {
    id: 'bingo',
    nameKey: 'badge.bingo.name',
    descriptionKey: 'badge.bingo.desc',
    icon: '◎',
    rarity: 'rare',
    unlockCondition: (state) => state.bingosCompleted >= 1,
  },
  {
    id: 'room_champion',
    nameKey: 'badge.room_champion.name',
    descriptionKey: 'badge.room_champion.desc',
    icon: '♛',
    rarity: 'epic',
    unlockCondition: (state) => state.rank === 1,
  },
  {
    id: 'museum_explorer',
    nameKey: 'badge.museum_explorer.name',
    descriptionKey: 'badge.museum_explorer.desc',
    icon: '⌂',
    rarity: 'uncommon',
    unlockCondition: (state) => state.tilesValidated.length >= 9,
  },
  {
    id: 'full_card_completion',
    nameKey: 'badge.full_card_completion.name',
    descriptionKey: 'badge.full_card_completion.desc',
    icon: '◉',
    rarity: 'legendary',
    unlockCondition: (state) => state.tilesValidated.length >= 25,
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
