# Museum.Bingo Localization Audit and Strategy

## Page 1 audit

Current language surface gaps:

- Hardcoded copy appears across `index.html`, `script.js`, `ai-engine.js`, `technical-engine.js`, `src/game/clues.js`, `src/game/badges.js`, and `src/game/session-summary.js`.
- Language switching is missing at session level; there is no persisted locale preference.
- Scan states, fallback prompts, and success messages are English-only and repeated in multiple modules.
- Tutorial, leaderboard, room/lobby cards, badge text, recap text, and settings labels are English-only.
- Educational content (`item.fact`, clue explanations, and artifact metadata labels) is English-only.
- Several UI labels use fixed wording and compact chips that can overflow in longer translations (especially board cells, status pills, scan guidance, leaderboard rows, and action buttons).
- Voice/TTS and hints currently read only English copy.

Architecture safety notes (what should remain unchanged):

- Keep the existing gameplay loop, scan-confirm flow, bingo board generation, win ladder, and reward flow.
- Keep Firestore/Socket-like sync shim shape and room score update behavior.
- Keep existing gamification state engine contracts (`GamificationEngine`, `BingoRules`, `WinRulesLadder`).
- Add localization as an overlay layer (pure translation + formatting helpers + UI wrappers), not a rewrite.

## Multilingual product direction

- Language-first UX: locale is explicit, persistent, visible, and switchable during active play.
- Small-phone readable: short copy, text-fit wrappers, responsive chips, and safe wrapping for long locales.
- Mixed-language friendly rooms: per-player display locale with room language context badge.
- Explicit fallback policy: missing keys/content fall back to English with a calm, non-blocking translation badge.
- Directionality aware: locale controls `lang` + `dir`, with RTL-safe layout treatment.
- Culturally respectful clarity: simple sentence structure, minimal idioms, and educational chunks optimized for non-native speakers and family groups.
