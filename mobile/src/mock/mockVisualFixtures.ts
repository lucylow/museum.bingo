import { MOCK_ARTWORKS, MOCK_AVATARS, MOCK_BADGE_ART, MOCK_EVENT_THEMES, MOCK_MUSEUMS } from './mockVisualContent';

/**
 * Story-style fixtures for visual QA and snapshot rendering.
 * These are lightweight and framework-agnostic, so screens/components can import
 * a stable dataset during demo mode or manual visual tests.
 */
export const mockVisualFixtures = {
  artworkCard: MOCK_ARTWORKS[0],
  museumCard: MOCK_MUSEUMS[0],
  leaderboardAvatars: MOCK_AVATARS.slice(0, 3),
  badgeShelf: [MOCK_BADGE_ART.first_scan, MOCK_BADGE_ART.bingo, MOCK_BADGE_ART.full_card_completion],
  recapTheme: MOCK_EVENT_THEMES[2],
  fallbackTheme: MOCK_EVENT_THEMES[1],
};
