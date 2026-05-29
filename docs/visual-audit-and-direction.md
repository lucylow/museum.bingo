# Museum Bingo Visual Audit and Direction

## Current design language
- Gold-on-midnight glassmorphism with playful emoji iconography and celebratory moments.
- Rich feature coverage exists (scan, board, multiplayer, badges), but visual treatment is uneven between sections.
- Motion exists but is mostly isolated to individual effects, not a coherent hierarchy of micro/mid/major moments.

## Where hierarchy currently breaks down
- Too many cards use similar weight, so high-priority content (active tile, next objective, room changes) competes visually.
- Bingo board states are not fully differentiated for near-win, line completion context, or end-card context.
- Multiplayer and leaderboard rows are readable but not strongly social; local-player emphasis and room momentum are subtle.

## Where feedback is too subtle
- Scan feedback variants are narrow (success vs generic low confidence), so recovery guidance lacks clarity.
- Tile progression cues (one-away, line almost complete, line complete) are not clear at a glance.
- Rank movement and score changes are present but ephemeral and not tied to row-level reactions.

## AR / scan / multiplayer clarity opportunities
- Camera overlay can expose state phases: scanning, almost recognized, recognized, hint active, low confidence.
- Scan success can communicate reward type explicitly: normal, streak, line, bingo, full card.
- Room activity can feel more alive via compact feed events, room progress bars, and local overtakes.

## What remains unchanged for architecture stability
- Keep current single-page web architecture and module boundaries (`script.js`, `gamification-engine.js`, sync shim).
- Preserve bingo and scoring logic, room sync eventing, and existing win-rule ladder.
- Reuse current camera/scanner flow and improve presentation around it instead of replacing it.

## Visual direction
- Immersive but readable: stronger framing, cleaner spacing, and higher contrast labels.
- Bold but not noisy: concentrated glow and color roles by status rather than blanket saturation.
- Playful but museum-safe: celebration where earned, calm guidance when scans fail.
- Mobile-first clarity: larger chips, legible labels, compact but tap-safe tiles.
- Motion system: fast for micro feedback, medium for status updates, dramatic for milestones.

## Top visual priorities
1. Make bingo tile states and line progress instantly understandable.
2. Upgrade scan success and fallback guidance into clear, reward-oriented variants.
3. Improve camera overlay hierarchy with readable state labels and confidence treatment.
4. Make multiplayer + leaderboard reactions socially alive but lightweight.
5. Add collectible-feeling badge shelf, unlock toasts, and recap surfaces.
6. Strengthen victory flow with richer recap and clear replay pathways.
