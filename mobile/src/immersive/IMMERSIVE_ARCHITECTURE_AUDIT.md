# Immersive / VR Flow Audit (Page 1)

## Current architecture map

- **Camera overlays**
  - `screens/CameraScreen.tsx` already has scanning state, confidence bar, and result card.
  - `screens/CameraScreenWithHeatVision.tsx` adds viewfinder corners, scan line states, chip drop, heat-vision target panel, and compass overlay.
- **Heat-vision hints**
  - `hooks/useHeatVision.ts` + `services/HeatVisionTargetService.ts` provide nearest-target logic, relative bearing, and distance updates.
  - `components/SkiaCompassOverlay.tsx` renders directional guidance.
- **Celebration / depth-adjacent effects**
  - `hooks/useBingoCelebration.ts` + `components/ARConfettiView.tsx` provide AR confetti fallback with haptics/audio.
- **Bingo board**
  - `components/TranslatedBingoCard.tsx` is rich but mostly flat 2D cards with glow and pulse.
- **Multiplayer + leaderboard**
  - `screens/MultiplayerGameScreen.tsx` and `components/MultiplayerLeaderboard.tsx` are data-complete but largely flat.
- **Motion / sensors**
  - `services/CompassService.ts` exists and already streams heading quality data.

## Upgrade targets

- **Should become spatial**
  - Solo bingo board and tile focus states.
  - Camera scan HUD and target hint overlays.
  - Multiplayer room presence and rank emphasis.
  - Artwork cards used in scan/target flows.
- **Should remain mostly flat**
  - Dense settings forms and account/subscription screens.
  - Long text-heavy stats/history lists where readability is more important than motion.
- **Depth layering opportunities**
  - Near: actionable overlays, active tile, scan reticle, confirm cards.
  - Mid: bingo board and floating artwork cards.
  - Far: ambient gallery planes, particles, and low-contrast architectural backdrop.
- **Optional / motion safety**
  - Immersive mode is opt-in, with comfort toggle and reduced-motion controls.
  - Automatic fallback path to cleaner 2D when performance or motion comfort degrades.
