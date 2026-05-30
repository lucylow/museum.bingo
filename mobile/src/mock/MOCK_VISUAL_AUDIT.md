# Museum.Bingo Mock Visual Audit

This audit maps every currently weak visual or placeholder-heavy surface that should use the shared mock visual system.

## 1) Home and Museum Selection
- `screens/HomeScreen.tsx`: text-only hero and museum status card; no museum scene, no onboarding illustration.
- `screens/MuseumSelectorScreen.tsx`: museum list rows are plain white cards with no venue pictures or active glow.

## 2) Camera and Recognition
- `screens/CameraScreen.tsx`: recognition result is text only; no artwork preview card, no framed confirmation art.

## 3) Multiplayer and Leaderboard
- `components/MultiplayerLeaderboard.tsx`: rows show only medal/text/score with no avatars, rank movement visuals, or player state indicators.
- `screens/MultiplayerLobby.tsx`: room flow has no room banner, no player portraits, and no promo/event imagery.
- `screens/MultiplayerGameScreen.tsx`: status strip is data-heavy but lacks room banner image context.

## 4) Badges and Rewards
- `gamification/badges.ts`: badge visuals are emoji-only and not collectible-grade.
- `components/BadgeUnlockToast.tsx`: reward toast has icon text but no premium badge art frame.

## 5) Session Recap and Stats
- `components/stats/SessionRecapModal.tsx`: recap is numbers-only with no memory-card style image summary.

## 6) Auth/Onboarding-like Entry Surface
- `components/SignInScreen.tsx`: entry screen lacks hero artwork, onboarding illustration, and branded visual narrative.

## 7) Artwork Detail and Empty States
- `components/ArtworkInfoPanel.tsx`: artwork details lack thumbnail or museum label card.
- Several empty states (`Home`, `MuseumSelector`, `MultiplayerLeaderboard`, `SessionRecap`) currently use plain text with no companion illustration.

## 8) Consistency Risks to Fix
- Inconsistent color/shape language across cards.
- Mismatched placeholder patterns and typography tone.
- No shared metadata for image type, mood, aspect, category, fallback color, label, and alt text.
