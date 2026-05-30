# Space Mission Quality Checklist

## Visual + Motion Checks

- Tile state transitions: locked -> unconfirmed -> confirmed -> line glow -> full-card glow.
- One-away pulse remains readable on small phones and does not overpower labels.
- Scan success modal variants render correctly for normal, bonus, streak, line, bingo, and full-card events.
- Rank movement and points pop feel smooth and do not block interaction.
- Victory recap transitions remain legible with reduced motion enabled.

## Camera + Overlay Checks

- Scanner states display expected pills and border tones: scanning, aiming/almost, recognized, hint active, low confidence.
- Heat-vision HUD updates target/signal/confidence values when active.
- Overlay glow does not obscure camera feed or target region.
- Fallback guidance copy appears for: almost there, move closer, too much glare, try another angle, not a match yet.

## Multiplayer + Rewards Checks

- Room status cards render avatar, score, tile progress, and mission log entry.
- Leaderboard highlights local player and milestone distance.
- Badge shelf renders lock/unlock and rarity treatment.
- Badge toast appears for unlock and auto-hides.
- Recap includes mission title, score, streak, rank, and latest badge.

## Responsive + Accessibility Checks

- Action bar remains reachable and readable on narrow screens.
- Board labels and chips remain readable at <= 390px widths.
- High-contrast mode maintains border and text visibility.
- Reduced-motion mode suppresses celebratory animations safely.
- Safe-area spacing is respected on devices with bottom insets.
