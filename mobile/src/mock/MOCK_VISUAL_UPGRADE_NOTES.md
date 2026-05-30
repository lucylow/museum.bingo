# Mock Visual Upgrade Notes (Pages 2-15)

## Page 2 — Shared visual system
- Added `mock/visualSystem.ts` with image type/mood/aspect/category/fallback/label/alt metadata and reusable ratios/radii/shadows.
- Added centralized content in `mock/mockVisualContent.ts`.

## Page 3 — Artwork thumbnails
- Added curated artwork mock set with title/artist/museum label metadata.
- Wired artwork visuals into camera result and artwork info panels.

## Page 4 — Museum and venue pictures
- Upgraded museum selection cards with hero visuals, status, room/prompt metadata.
- Added museum hero visual treatment to home and selector flows.

## Page 5 — Avatars
- Added reusable avatar component with seeded identity, initials, status dot, and rank frame treatment.
- Wired avatars into leaderboard and multiplayer activity feed.

## Page 6 — Badges and rewards
- Upgraded badge catalog IDs to collectible-focused set.
- Added badge art component + rarity-aware visual frames in reward toast and reward shelf.

## Page 7 — Camera result preview
- Added framed artwork preview card with confidence/points metadata to scan success state.

## Page 8 — Leaderboard and room activity visuals
- Added avatars, movement indicator, streak/tile metadata, and leaderboard empty-state illustration.
- Added room activity banner in multiplayer game.

## Page 9 — Onboarding and hero visuals
- Added sign-in hero illustration and home hero promo/event banner.

## Page 10 — Empty states and loading pictures
- Added reusable empty state component and applied to home, museum selector, leaderboard, lobby history, badge shelf, and recap.

## Page 11 — Seasonal/themed sets
- Added reusable event themes: spring quest, night mode challenge, family day.
- Applied these sets across home, lobby, game, recap, and auth entry.

## Page 12 — Session recap visuals
- Added session memory hero card and recap timeline thumbnails in recap modal.

## Page 13 — Data consistency
- Centralized mock names/titles/themes/avatars/badges in one source (`mockVisualContent.ts`) so screens reuse the same visual identity.

## Page 14 — Responsive handling/fallbacks
- Added aspect-ratio-driven rendering with shared radii and fallback colors.
- Added deterministic seeded fallback for artwork and avatar visuals.
- Added basic light/dark caption adaptation in `MockImageFrame`.

## Page 15 — Final polish + fixtures
- Added audit + upgrade notes documents for maintainability.
- Added story-style fixtures in `mock/mockVisualFixtures.ts` for visual QA and snapshot demos.
