# Scavenger Hunt State Map and Direction

## Current Hunt Loop (in this repository)
- Start: player lands on the main game view, chooses a tile, and receives a clue-like riddle.
- Discover: player scans through the camera overlay while confidence and fallback guidance update.
- Validate: confirmation runs through `TechnicalEngine.validateArtwork` and `GamificationEngine.onTileValidated`.
- Progress: board tile states, line progress, streak, score, badges, and leaderboard update live.
- Finish: win modal shows recap data, points, badges, and replay actions.

## Equivalent Surfaces to Requested Screens
- `CameraScreen` equivalent: scanner overlay in `index.html` + `script.js` scan-state transitions.
- `GameScreen` equivalent: board/progress/status panels in `index.html` + `script.js` render methods.
- `MultiplayerLobby` equivalent: room status and code surfaces (`room-code`, `room-status`) with realtime sync.
- `BingoCard` equivalent: `#bingo-board` grid rendered by `initGame` with tile-state classes.
- `Leaderboard` equivalent: `loadLeaderboard` with room + mock merge and rank movement banner.
- `HeatVisionOverlay` equivalent: heat-vision toggle and AR-style HUD in scanner overlay.

## Where Key Actions Happen
- Clue discovery happens when a tile is selected (`selectCell`) and hint text/riddle is shown (`showRiddle`).
- Scan validation happens in `handleConfirmClick` after confidence gating and technical validation.
- Progress clarity gaps appear when users are between clue and scan; objective context is limited.
- Tension/excitement gaps appear in early scans where fallback feedback is present but objective framing is weak.
- Multiplayer support can improve with clearer shared objective context and room progress storytelling.

## Architecture Safety (unchanged)
- Keep single-page module architecture (`script.js`, `ai-engine.js`, `gamification-engine.js`, sync shim).
- Preserve board + scan + validation + gamification + leaderboard loop.
- Preserve camera, heat vision, confetti, and realtime update behaviors.
- Extend with modular clue/objective helpers and reusable UI primitives instead of replacing core flow.

## Direction for the Next Iteration
- Clue-driven: each move starts from a clear clue card and objective callout.
- Discovery-focused: scan feedback should feel like finding, not submitting.
- Mobile-clear: compact labels, obvious next action, no hidden states.
- Progress-forward: objective, line/board completion, and route status remain visible.
- Family-friendly: plain language, quick hints, and positive fallback guidance.
- Replay-ready: bonus route clues, badge collection, and end recap tied to discoveries.
