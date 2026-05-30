import { MockImageToken, buildDefaultAlt, museumTonePalette } from './visualSystem';

export interface MockArtworkCard {
  id: string;
  title: string;
  artist: string;
  museumLabel: string;
  period: string;
  token: MockImageToken;
}

export interface MockMuseumCard {
  id: string;
  name: string;
  locationLabel: string;
  promptCount: number;
  roomCount: number;
  visitStatus: 'visited' | 'active' | 'new';
  token: MockImageToken;
}

export interface MockAvatarProfile {
  id: string;
  label: string;
  initials: string;
  frame: 'basic' | 'winner' | 'streak' | 'legend';
  token: MockImageToken;
}

export interface MockEventTheme {
  id: string;
  name: string;
  accent: string;
  token: MockImageToken;
}

const artToken = (
  id: string,
  label: string,
  mood: MockImageToken['mood'],
  palette: [string, string, string],
  category = 'curated artwork',
): MockImageToken => ({
  id,
  type: 'artwork',
  mood,
  aspect: 'portrait',
  category,
  fallbackColor: palette[0],
  label,
  alt: buildDefaultAlt(label, category),
  palette,
});

const museumToken = (
  id: string,
  label: string,
  mood: MockImageToken['mood'],
  palette: [string, string, string],
): MockImageToken => ({
  id,
  type: 'museumScene',
  mood,
  aspect: 'landscape',
  category: 'museum venue',
  fallbackColor: palette[0],
  label,
  alt: buildDefaultAlt(label, 'museum venue'),
  palette,
});

const avatarToken = (
  id: string,
  label: string,
  mood: MockImageToken['mood'],
  palette: [string, string, string],
): MockImageToken => ({
  id,
  type: 'avatar',
  mood,
  aspect: 'circle',
  category: 'player avatar',
  fallbackColor: palette[0],
  label,
  alt: buildDefaultAlt(label, 'player profile'),
  palette,
});

const badgeToken = (
  id: string,
  label: string,
  mood: MockImageToken['mood'],
  palette: [string, string, string],
): MockImageToken => ({
  id,
  type: 'badge',
  mood,
  aspect: 'square',
  category: 'collectible badge',
  fallbackColor: palette[0],
  label,
  alt: buildDefaultAlt(label, 'badge reward'),
  palette,
});

export const MOCK_ARTWORKS: MockArtworkCard[] = [
  {
    id: 'gallery-dawn-fragments',
    title: 'Dawn Fragments in Bronze Light',
    artist: 'Isla Navarro',
    museumLabel: 'Grand Atrium Collection',
    period: 'Contemporary',
    token: artToken('art-01', 'Bronze Dawn', 'elegant', ['#293057', '#7C5EA8', '#E4B174']),
  },
  {
    id: 'prismatic-echoes',
    title: 'Prismatic Echoes Over Marble',
    artist: 'Kenji Matsuo',
    museumLabel: 'Modern Wing',
    period: '2018',
    token: artToken('art-02', 'Prismatic Echoes', 'dramatic', ['#253C63', '#3A8BBF', '#9BD9D2']),
  },
  {
    id: 'ink-garden',
    title: 'Ink Garden, Northern Study',
    artist: 'Mireya Solano',
    museumLabel: 'Sketches & Studies',
    period: 'Mixed Media',
    token: artToken('art-03', 'Ink Garden', 'calm', ['#344A61', '#6E8AAC', '#B6C7D8']),
  },
  {
    id: 'velvet-geometry',
    title: 'Velvet Geometry No. 5',
    artist: 'Armand Lee',
    museumLabel: 'Pattern Room',
    period: 'Digital Textile',
    token: artToken('art-04', 'Velvet Geometry', 'playful', ['#5A3A78', '#A45E9D', '#F2C47E']),
  },
];

export const MOCK_MUSEUMS: MockMuseumCard[] = [
  {
    id: 'met-cloisters-mock',
    name: 'Met Cloisters Night Gallery',
    locationLabel: 'Upper Manhattan',
    promptCount: 25,
    roomCount: 6,
    visitStatus: 'active',
    token: museumToken('museum-01', 'Cloisters Hall', 'elegant', ['#2D365E', '#5A6FA5', '#E2C67B']),
  },
  {
    id: 'frick-arcade-mock',
    name: 'Frick Grand Arcade',
    locationLabel: 'Fifth Avenue',
    promptCount: 24,
    roomCount: 5,
    visitStatus: 'visited',
    token: museumToken('museum-02', 'Frick Arcade', 'calm', ['#293C58', '#7A93A8', '#D9C89F']),
  },
  {
    id: 'new-museum-glow-mock',
    name: 'New Museum Lumen Floors',
    locationLabel: 'Bowery',
    promptCount: 28,
    roomCount: 7,
    visitStatus: 'new',
    token: museumToken('museum-03', 'Lumen Floors', 'playful', ['#253A63', '#6A5EAF', '#98D6C4']),
  },
];

export const MOCK_AVATARS: MockAvatarProfile[] = [
  {
    id: 'ava-01',
    label: 'Maya North',
    initials: 'MN',
    frame: 'winner',
    token: avatarToken('avatar-01', 'Maya Portrait', 'playful', ['#30567D', '#6B8CC2', '#F1C58A']),
  },
  {
    id: 'ava-02',
    label: 'Theo Park',
    initials: 'TP',
    frame: 'streak',
    token: avatarToken('avatar-02', 'Theo Portrait', 'calm', ['#2D496A', '#5F80A7', '#9DD8C7']),
  },
  {
    id: 'ava-03',
    label: 'Rina Vale',
    initials: 'RV',
    frame: 'legend',
    token: avatarToken('avatar-03', 'Rina Portrait', 'dramatic', ['#4C376D', '#8C5FAE', '#E7B86F']),
  },
  {
    id: 'ava-04',
    label: 'Noah Kim',
    initials: 'NK',
    frame: 'basic',
    token: avatarToken('avatar-04', 'Noah Portrait', 'elegant', ['#30515C', '#5F93A0', '#DCC3A3']),
  },
];

export const MOCK_BADGE_ART: Record<string, MockImageToken> = {
  first_scan: badgeToken('badge-first-scan', 'First Scan', 'playful', ['#2D4E69', '#5A9CD8', '#9FE4E0']),
  first_tile: badgeToken('badge-first-tile', 'First Tile', 'calm', ['#38506A', '#68A68F', '#C7E2A5']),
  bingo: badgeToken('badge-bingo', 'Bingo', 'celebratory', ['#3A2E69', '#8D6AE3', '#F6C773']),
  room_champion: badgeToken('badge-room-champion', 'Room Champion', 'dramatic', ['#3F335B', '#9C79D8', '#FFC271']),
  streak_master: badgeToken('badge-streak-master', 'Streak Master', 'celebratory', ['#2A3D63', '#4E8DE0', '#F7B761']),
  museum_explorer: badgeToken('badge-museum-explorer', 'Museum Explorer', 'elegant', ['#29455D', '#4C8397', '#B8DDCE']),
  daily_challenge: badgeToken('badge-daily-challenge', 'Daily Challenge', 'playful', ['#304B7A', '#6D7DE0', '#FFCC9A']),
  full_card_completion: badgeToken('badge-full-card', 'Full Card Completion', 'celebratory', ['#3F2D62', '#8A4FE1', '#FFE09A']),
};

export const MOCK_EVENT_THEMES: MockEventTheme[] = [
  {
    id: 'spring-museum-quest',
    name: 'Spring Museum Quest',
    accent: '#8FD4A8',
    token: {
      id: 'theme-spring',
      type: 'promo',
      mood: 'seasonal',
      aspect: 'banner',
      category: 'event theme',
      fallbackColor: '#2E5560',
      label: 'Spring Quest',
      alt: buildDefaultAlt('Spring Quest', 'seasonal event'),
      palette: ['#2E5560', '#71B798', '#F0D58E'],
    },
  },
  {
    id: 'night-mode-challenge',
    name: 'Night Mode Challenge',
    accent: museumTonePalette.velvet,
    token: {
      id: 'theme-night',
      type: 'promo',
      mood: 'night',
      aspect: 'banner',
      category: 'event theme',
      fallbackColor: '#202E52',
      label: 'Night Challenge',
      alt: buildDefaultAlt('Night Challenge', 'night event'),
      palette: ['#202E52', '#5A6AC4', '#8DD7D6'],
    },
  },
  {
    id: 'family-day',
    name: 'Family Day Gallery Run',
    accent: '#E8B76E',
    token: {
      id: 'theme-family',
      type: 'promo',
      mood: 'playful',
      aspect: 'banner',
      category: 'event theme',
      fallbackColor: '#4B4468',
      label: 'Family Day',
      alt: buildDefaultAlt('Family Day', 'weekend event'),
      palette: ['#4B4468', '#9D82D1', '#F0C984'],
    },
  },
];

export const MOCK_EMPTY_STATES = {
  noRooms: {
    title: 'No rooms live yet',
    body: 'Start a room to invite friends into this gallery run.',
  },
  noBadges: {
    title: 'No badges yet',
    body: 'Scan your first artwork to unlock your shelf.',
  },
  noHistory: {
    title: 'No scan history yet',
    body: 'Your recap cards appear after your first completed tile.',
  },
  noLeaderboard: {
    title: 'No leaderboard activity',
    body: 'Invite friends and scores will appear in real time.',
  },
  noMuseum: {
    title: 'No museum selected',
    body: 'Pick a museum to load rooms, prompts, and exhibits.',
  },
};

export const MOCK_PLAYER_NAMES = [
  'Maya North',
  'Theo Park',
  'Rina Vale',
  'Noah Kim',
  'Ada Bloom',
  'Sora Lin',
];

export const getMockAvatarBySeed = (seed: string): MockAvatarProfile => {
  const hash = Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return MOCK_AVATARS[hash % MOCK_AVATARS.length];
};

export const getMockArtworkBySeed = (seed: string): MockArtworkCard => {
  const hash = Array.from(seed).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return MOCK_ARTWORKS[hash % MOCK_ARTWORKS.length];
};
