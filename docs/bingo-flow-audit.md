# Bingo Loop Audit (Current -> Improved)

## Current Flow
- User taps a tile in `script.js` (`selectCell`), then starts scan via `handleScanClick`.
- `ai-engine.js` runs detection (`simulateAIDetection`) and updates confidence + detection UI.
- On confirm, `technical-engine.js` validates artwork (`validateArtwork`).
- Success calls `gamification-engine.js` (`onTileValidated`) to compute points/streak/line/full-card and emit events.
- `gamification-sync.js` updates room entries and pushes room updates for leaderboard rendering.
- UI updates in `renderGamification`, `loadLeaderboard`, and success/badge toasts; particles + vibration trigger on milestones.

## Gaps Found
- Rules logic existed mostly in one place, but lacked explicit tile state model and reusable helper surface.
- Card completion state was implicit; no canonical `no_line/one_line/two_lines/blackout`.
- Leaderboard rows did not show tiles/streak/bingo status, so multiplayer momentum felt weak.
- Scan failure messaging was generic and did not provide progressive guidance.
- Accessibility/replay controls were limited (no high-contrast/reduced-motion/compact card mode toggles).

## Smallest High-Impact Changes
1. Add a reusable pure rules module (`bingo-rules.js`) for scoring/line detection/streak/badges/tile state contracts.
2. Wire gamification to that module and expose richer snapshot data for UI (completion state, next-best tile, room mode/difficulty).
3. Upgrade board and leaderboard render states in `script.js` + `style.css` for stronger feedback.
4. Improve scanner result/error moments with confidence guidance, celebration details, and mild haptic/audio hooks.
5. Persist richer room/session metadata while keeping existing architecture and sync approach.
