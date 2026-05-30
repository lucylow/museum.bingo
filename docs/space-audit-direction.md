# Museum.Bingo Space Direction Audit

## Current Experience Audit

- **Current design language**: premium glassmorphism with amber accents, museum-forward copy, and light AR styling.
- **Where hierarchy is weak**: scan-state and mission priority can compete with decorative UI; some status labels blend into surrounding cards.
- **Where 3D depth improves comprehension**: bingo tiles, board progress, scan overlay framing, and leaderboard rank movement benefit from layered depth cues and orbital framing.
- **Where progress is hard to understand**: room race pace, next objective clarity, and “distance to completion” are present but not consistently visualized as one mission narrative.
- **Where wonder/scale is missing**: atmospheric cosmic context is limited; existing visuals feel premium but not fully spatial or expedition-like.
- **Architecture-safe elements to preserve**: current camera + validation flow, Bingo rules + tile states, multiplayer sync + leaderboard merge logic, badge evaluation pipeline, session summary builder, and settings accessibility toggles.

## 3D Space Product Direction

- **Immersive but readable**: layered starfield + orbit surfaces with compact labels and high-contrast text.
- **Futuristic but not messy**: restrained glows, clean framing, and controlled motion timing.
- **Cosmic and museum-friendly**: preserve educational artifact context while reframing finds as “discoveries.”
- **Mobile-first clarity**: larger touch targets, compact cards, no tiny mission-critical text, safe-area conscious spacing.
- **Motion style**: glide/dock/pulse rhythms over chaotic spins; dramatic effects reserved for line/bingo/full-card milestones.
- **Safety and performance**: no heavy 3D dependency shift; keep existing architecture and scanning reliability intact.
