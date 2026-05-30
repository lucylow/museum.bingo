# Gameplay Stats Event Flow Audit

## Existing event paths

- `scan start`
  - `mobile/src/screens/CameraScreen.tsx` frame processor starts scanning after recognizer init.
  - `mobile/src/screens/CameraScreenWithHeatVision.tsx` frame processor loops for recognition.
- `scan success / failure`
  - `CameraScreen.tsx` and `CameraScreenWithHeatVision.tsx` call `onArtworkValidated` after recognition.
  - Success path already influences tile completion; failure path currently only implicit in returned boolean.
- `tile validation`
  - `mobile/src/screens/GameScreenWithGamification.tsx` runs `scanAndValidateArtwork`, then `GamificationEngine.processTileValidation`.
  - `mobile/src/screens/MultiplayerGameScreen.tsx` emits `tile-validated` socket event.
  - `backend/src/server.ts` validates tile idempotency and writes room score/progress.
- `hint usage`
  - Heat-vision toggle in `mobile/src/hooks/useHeatVision.ts` and `mobile/src/screens/CameraScreenWithHeatVision.tsx`.
- `streak changes`
  - `mobile/src/gamification/GamificationEngine.ts` computes streak and multiplier.
  - `mobile/src/store/gamificationStore.ts` persists streak state.
- `line completion / bingo completion`
  - `GamificationEngine.processTileValidation` updates line and bingo counters.
  - `GameScreenWithGamification.tsx` triggers celebration when bingo is true.
- `badge unlocks`
  - `GamificationEngine.checkAndUnlockBadges` and `mobile/src/gamification/badges.ts`.
  - `GameScreenWithGamification.tsx` shows `BadgeUnlockToast`.
- `room joins / leaves`
  - `mobile/src/screens/MultiplayerLobby.tsx` emits `join-room` and `create-room`.
  - `mobile/src/screens/MultiplayerGameScreen.tsx` emits `leave-room` on unmount.
  - `backend/src/server.ts` handles `join-room`, `leave-room`, and disconnect cleanup.
- `leaderboard updates`
  - `mobile/src/components/MultiplayerLeaderboard.tsx` listens to `score-update`, `player-joined`, `player-left`.
  - `backend/src/server.ts` emits `score-update` and `leaderboard-update`.
- `session end`
  - Not centralized yet. Session closure currently inferred when leaving multiplayer screen or completing bingo.

## Capture strategy for stats layer

- `local-only`
  - transient UI feedback (`PointsPopup`, chip animation, confetti visibility).
  - frame-level recognition attempts not tied to user action.
- `must sync to backend`
  - all gameplay events required for aggregates: scans, tile/line/bingo completion, streak updates, room events, rank changes, badge unlocks, session start/end.
  - session summaries and lifetime aggregates.
- `immediate UI updates`
  - streak, accuracy, points, rank changes, hints used, badges earned.
  - session recap and profile stat cards.

## Low-friction insertion points

- Camera flows: capture `scan_started`, `scan_success`, `scan_failure`.
- Gamification flow (`handleTileValidation`): capture `tile_completed`, `streak_updated`, `line_completed`, `bingo_completed`, `badge_unlocked`.
- Multiplayer flow: capture `room_joined`, `room_left`, `leaderboard_rank_changed`.
- Screen lifecycle hooks: start session on gameplay entry and end session on unmount/exit.
