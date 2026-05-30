# Museum.Bingo Monetization Audit (Page 1)

This note captures the intentional monetization model before implementation changes.

## Existing surfaces where monetization naturally fits

- `mobile/src/screens/SubscriptionScreen.tsx`
  - Existing plan list, checkout launch, restore/manage links, unlock catalog, upsell chips.
- `mobile/src/components/RequirePremium.tsx`
  - Existing guard pattern for premium-only experiences.
- `mobile/src/screens/MultiplayerLobby.tsx`
  - Room creation and join surfaces for family/group and classroom upsells.
- `mobile/src/screens/MuseumSelectorScreen.tsx`
  - Museum selection flow for free-vs-unlimited museum gating.
- `mobile/src/screens/GameScreenWithGamification.tsx`
  - Badge shelf, stats, and in-session rewards that support cosmetic and seasonal upsells.
- `mobile/src/components/stats/SessionRecapModal.tsx`
  - Recap/share surface for export templates and premium recap unlocks.
- `mobile/src/components/MultiplayerLeaderboard.tsx`
  - Cosmetic name effects and avatar frame enhancements (visual only).
- `backend/src/routes/subscription.ts` + `backend/src/services/subscriptionService.ts`
  - Subscription/entitlement APIs and Stripe integration baseline.
- `backend/src/routes/webhook.ts`
  - Idempotent Stripe webhook processing and subscription event persistence.

## What is currently free

- Core game loop (scan, validate, score, bingo completion).
- Core multiplayer join/create flow and room participation.
- Basic museum discovery and selection.
- Standard leaderboard, badges, and recap access.
- Existing sign-in and profile identity surfaces.

## What should stay free forever (non-negotiable)

- Ability to play a complete bingo session.
- Basic hints, core stats, standard recap, and standard badge shelf.
- Multiplayer participation without requiring payment or wallet setup.
- Fair scoring outcomes unaffected by purchases.

## What can become premium (convenience, cosmetics, content depth only)

- Unlimited museum switching and deeper history retention.
- Advanced AR hint variants and extended hint packs.
- Premium recap templates/high-resolution exports.
- Cosmetic frames/skins/confetti/name effects.
- Seasonal pass premium track rewards (cosmetic/status only).
- Expanded collectible shelf capacity.

## What can be bundled for families/groups

- Family pack (shared rooms, organizer controls, larger participant caps).
- Classroom/field-trip pack (group objectives + shared recap).
- Friend group co-op pack (co-op goals, group summaries).

## What can be sponsored

- Clearly labeled sponsored challenge tiles/rewards.
- Museum cafe/gift-shop offer cards in recap and win moments.
- Museum partner event banners outside critical scan UI.

## What can be sold as cosmetic/convenience

- Card skins, avatar frames, badge frames, confetti/victory styles.
- Profile card themes and room banners.
- Optional extra recap export formats and shelf display slots.

## Guardrails to preserve trust and delight

- No pay-to-win stats multipliers.
- No interruptions during active tile scanning.
- Upsells shown only at natural moments (recap, unlock, lobby, season panel).
- Transparent labeling for sponsored and affiliate content.
- Entitlements and billing logic remain separate from gameplay-scoring logic.
