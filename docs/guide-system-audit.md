# Character Guide System Audit and Direction

## Page 1 Audit: Current Experience

### Current design language
- Premium glassmorphism UI with space-mission framing, strong gold accents, and animated feedback.
- Compact scoreboard cards, progress bars, status pills, and modal-based milestone moments.
- Existing reusable primitives in `src/ui/design-system.js` and modular game logic in `src/game/*`.

### Where the app feels flat or under-guided
- The player receives system feedback, but little persistent "human" guidance across moments.
- Onboarding is functional but generic; it does not introduce a memorable companion.
- Scan fallback states provide useful text but can feel technical instead of supportive.
- Multiplayer room and leaderboard updates are data-rich but socially cold.
- Win/recap is strong visually, but learning summaries feel more like telemetry than memory.

### Where users need explanation, encouragement, or direction
- First mission selection and first scan expectations.
- "What should I scan next?" when one-away, near-line, or bonus opportunities appear.
- Why a found object matters in one educational sentence.
- Scan uncertainty states (glare/angle/distance) with clear, friendly micro-actions.
- Shared room milestones so players understand momentum and room objective.

### Where guidance could become intrusive
- Repeating the same line for every scan event.
- Long dialogue blocks on small screens.
- Guide overlays that block camera view or board touch targets.
- Overly energetic copy during calm/family/school sessions.

### Where progress is hard to understand
- Objective hierarchy between clue, line pressure, and next-best tile can be fragmented.
- Leaderboard movement is visible, but social context ("who just did what") is light.
- Recap includes many metrics without a curated "what you learned" narrative.

### Architecture safety: what should remain unchanged
- Keep current `index.html` + `script.js` runtime, `src/game/*` engines, and `src/ui/design-system.js`.
- Preserve camera scan flow, heat-vision assist, confetti, win ladder, room sync, and leaderboard pipeline.
- Keep game logic pure where possible; UI should consume model outputs without embedding rules.
- Avoid replacing existing multiplayer/gamification state shapes to protect local-storage and sync behavior.

## Guide System Direction

- **Friendly and memorable:** introduce a small cast with distinct roles and short signature lines.
- **Museum-appropriate:** prioritize observation, context, and curiosity over noisy game chatter.
- **Educational, not preachy:** one-sentence context at useful moments (scan success, recap, next target).
- **Works for family/school/casual:** guide selection supports age-friendly and session-mode tone changes.
- **Visually distinct, not distracting:** compact avatar, name-tag, and bubble surfaces with safe-area spacing.
- **Adaptive tone:** playful, calm, expert, energetic, and story-driven variants based on context.
- **Control stays with player:** guides suggest and celebrate; they do not hijack scan/board actions.
- **Short by default:** mobile-first microcopy, repetition throttling, and context-aware beat routing.
