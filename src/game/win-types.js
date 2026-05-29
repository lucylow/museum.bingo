/**
 * Win ladder shared constants and JSDoc typedefs.
 * Kept framework-agnostic so any UI layer can consume it.
 */

const WIN_STATES = Object.freeze([
    "TILE_FOUND",
    "TILE_CONFIRMED",
    "STREAK_ACTIVE",
    "STREAK_BONUS",
    "LINE_COMPLETE",
    "TWO_LINES_COMPLETE",
    "FULL_CARD_PROGRESS",
    "BINGO_COMPLETE",
    "ROOM_VICTORY",
    "DAILY_CHALLENGE_COMPLETE",
    "BADGE_UNLOCKED",
    "SESSION_COMPLETE"
]);

const WIN_EVENT_TYPES = Object.freeze([
    "tile_found",
    "tile_confirmed",
    "streak_changed",
    "line_completed",
    "card_progress",
    "bingo_completed",
    "room_victory",
    "daily_challenge_complete",
    "badge_unlocked",
    "session_complete"
]);

const WIN_ANIMATIONS = Object.freeze([
    "tile_pop",
    "tile_drop",
    "streak_burst",
    "line_glow",
    "two_line_sweep",
    "progress_ring",
    "confetti_soft",
    "confetti_big",
    "room_banner",
    "badge_toast",
    "victory_recap"
]);

window.WinTypes = {
    WIN_STATES,
    WIN_EVENT_TYPES,
    WIN_ANIMATIONS
};
