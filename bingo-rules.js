/**
 * Bingo Rules Engine (pure helpers only)
 * No UI side effects, no storage, no network.
 */

const TILE_STATES = Object.freeze({
    LOCKED: "locked",
    ACTIVE: "active",
    MATCHED: "matched",
    BONUS: "bonus",
    HINTED: "hinted",
    MISSED: "missed"
});

const CARD_COMPLETION_STATES = Object.freeze({
    NO_LINE: "no_line",
    ONE_LINE: "one_line",
    TWO_LINES: "two_lines",
    BLACKOUT: "blackout"
});

const DIFFICULTY_PRESETS = Object.freeze({
    easy: {
        tilePoints: 90,
        lineBonus: 180,
        extraLineBonus: 140,
        fullCardBonus: 420,
        streakBaseBonus: 18,
        streakStepBonus: 8,
        streakResetMs: 90000
    },
    standard: {
        tilePoints: 100,
        lineBonus: 250,
        extraLineBonus: 180,
        fullCardBonus: 500,
        streakBaseBonus: 20,
        streakStepBonus: 10,
        streakResetMs: 70000
    },
    challenge: {
        tilePoints: 120,
        lineBonus: 300,
        extraLineBonus: 240,
        fullCardBonus: 650,
        streakBaseBonus: 24,
        streakStepBonus: 12,
        streakResetMs: 50000
    }
});

const ROOM_MODES = Object.freeze({
    solo: "solo",
    multiplayer: "multiplayer",
    family: "family"
});

const BADGE_DEFINITIONS = Object.freeze([
    { id: "first_scan", name: "First Scan", description: "Complete your first successful scan.", icon: "📸", rarity: "common" },
    { id: "first_tile", name: "First Tile", description: "Validate your first bingo tile.", icon: "🧩", rarity: "common" },
    { id: "three_in_a_row", name: "Three in a Row", description: "Complete your first bingo line.", icon: "🎯", rarity: "rare" },
    { id: "bingo", name: "Bingo", description: "Complete any line on your card.", icon: "🎉", rarity: "rare" },
    { id: "full_card", name: "Full Card", description: "Complete the entire bingo card.", icon: "🗺️", rarity: "epic" },
    { id: "speed_finder", name: "Speed Finder", description: "Validate a tile in under 10 seconds.", icon: "⚡", rarity: "rare" },
    { id: "streak_master", name: "Streak Master", description: "Reach a streak of 5.", icon: "🔥", rarity: "epic" },
    { id: "room_champion", name: "Room Champion", description: "Finish #1 in your room.", icon: "👑", rarity: "legendary" },
    { id: "museum_explorer", name: "Museum Explorer", description: "Complete a full museum card.", icon: "🏛️", rarity: "epic" }
]);

function resolveDifficulty(mode) {
    return DIFFICULTY_PRESETS[mode] || DIFFICULTY_PRESETS.standard;
}

function computeWinPatterns(gridSize) {
    const size = Number(gridSize) || 3;
    const patterns = [];
    for (let row = 0; row < size; row++) {
        const rowPattern = [];
        for (let col = 0; col < size; col++) rowPattern.push((row * size) + col + 1);
        patterns.push(rowPattern);
    }
    for (let col = 0; col < size; col++) {
        const colPattern = [];
        for (let row = 0; row < size; row++) colPattern.push((row * size) + col + 1);
        patterns.push(colPattern);
    }
    const diagonalA = [];
    const diagonalB = [];
    for (let i = 0; i < size; i++) {
        diagonalA.push((i * size) + i + 1);
        diagonalB.push((i * size) + (size - i - 1) + 1);
    }
    patterns.push(diagonalA, diagonalB);
    return patterns;
}

function toSet(values) {
    if (values instanceof Set) return values;
    if (Array.isArray(values)) return new Set(values);
    return new Set();
}

function getCompletedLines(completedTileIds, gridSize) {
    const completed = toSet(completedTileIds);
    const patterns = computeWinPatterns(gridSize);
    const completedLines = [];
    patterns.forEach((pattern, index) => {
        if (pattern.every((tileId) => completed.has(tileId))) completedLines.push(index);
    });
    return completedLines;
}

function isLineCompleted(completedTileIds, linePattern) {
    const completed = toSet(completedTileIds);
    return Array.isArray(linePattern) && linePattern.every((tileId) => completed.has(tileId));
}

function isFullBoardComplete(completedTileIds, totalTiles) {
    const completed = toSet(completedTileIds);
    return completed.size >= totalTiles;
}

function getCardCompletionState({ completedLinesCount, completedTilesCount, totalTiles }) {
    if (completedTilesCount >= totalTiles) return CARD_COMPLETION_STATES.BLACKOUT;
    if (completedLinesCount >= 2) return CARD_COMPLETION_STATES.TWO_LINES;
    if (completedLinesCount >= 1) return CARD_COMPLETION_STATES.ONE_LINE;
    return CARD_COMPLETION_STATES.NO_LINE;
}

function detectStreakChange(previousStreak, nextStreak) {
    if (nextStreak > previousStreak) return "increased";
    if (nextStreak < previousStreak) return "decreased";
    return "unchanged";
}

function getStreakBonus(streak, difficultyMode) {
    const cfg = resolveDifficulty(difficultyMode);
    return cfg.streakBaseBonus + Math.max(0, (streak - 1) * cfg.streakStepBonus);
}

function getLineBonus(linesBefore, linesAfter, difficultyMode) {
    const cfg = resolveDifficulty(difficultyMode);
    if (linesAfter <= linesBefore) return 0;
    const newlyCompleted = linesAfter - linesBefore;
    let bonus = 0;
    if (linesBefore === 0) {
        bonus += cfg.lineBonus;
        if (newlyCompleted > 1) bonus += (newlyCompleted - 1) * cfg.extraLineBonus;
    } else {
        bonus += newlyCompleted * cfg.extraLineBonus;
    }
    return bonus;
}

function getTilePoints(difficultyMode) {
    return resolveDifficulty(difficultyMode).tilePoints;
}

function getFullCardBonus(difficultyMode) {
    return resolveDifficulty(difficultyMode).fullCardBonus;
}

function calculateScoreAfterValidation({
    completedTilesBefore,
    tileId,
    gridSize,
    streakBefore,
    usedHint,
    hasFullCardBefore,
    difficultyMode
}) {
    const totalTiles = gridSize * gridSize;
    const beforeSet = toSet(completedTilesBefore);
    if (beforeSet.has(tileId)) {
        return { accepted: false, reason: "duplicate_tile" };
    }
    if (!Number.isInteger(tileId) || tileId < 1 || tileId > totalTiles) {
        return { accepted: false, reason: "invalid_tile" };
    }

    const afterSet = new Set(beforeSet);
    afterSet.add(tileId);

    const linesBefore = getCompletedLines(beforeSet, gridSize);
    const linesAfter = getCompletedLines(afterSet, gridSize);
    const streakAfter = streakBefore + 1;
    const tilePoints = getTilePoints(difficultyMode);
    const streakBonus = getStreakBonus(streakAfter, difficultyMode);
    const lineBonus = getLineBonus(linesBefore.length, linesAfter.length, difficultyMode);
    const fullCardReached = !hasFullCardBefore && isFullBoardComplete(afterSet, totalTiles);
    const fullCardBonus = fullCardReached ? getFullCardBonus(difficultyMode) : 0;
    const hintPenalty = usedHint ? 5 : 0;
    const pointsEarned = Math.max(0, tilePoints + streakBonus + lineBonus + fullCardBonus - hintPenalty);
    const completionState = getCardCompletionState({
        completedLinesCount: linesAfter.length,
        completedTilesCount: afterSet.size,
        totalTiles
    });

    return {
        accepted: true,
        tileId,
        completedTilesAfter: Array.from(afterSet),
        linesAfter,
        completionState,
        streakBefore,
        streakAfter,
        streakChange: detectStreakChange(streakBefore, streakAfter),
        score: {
            tilePoints,
            streakBonus,
            lineBonus,
            fullCardBonus,
            hintPenalty,
            pointsEarned
        }
    };
}

function getNextBestTileHint(completedTileIds, gridSize) {
    const completed = toSet(completedTileIds);
    const patterns = computeWinPatterns(gridSize);
    let bestTile = null;
    let bestProgress = -1;

    patterns.forEach((pattern) => {
        const matched = pattern.filter((id) => completed.has(id)).length;
        if (matched <= bestProgress) return;
        const candidate = pattern.find((id) => !completed.has(id));
        if (!candidate) return;
        bestProgress = matched;
        bestTile = candidate;
    });

    return bestTile;
}

function evaluateBadgeUnlocks(context) {
    const unlocked = [];
    const { lifetimeScans, completedTiles, lineCount, isFullCard, scanDurationMs, streak, rank, awardedBadgeIds } = context;
    const earned = toSet(awardedBadgeIds);
    function maybeUnlock(id) {
        if (earned.has(id)) return;
        const found = BADGE_DEFINITIONS.find((badge) => badge.id === id);
        if (!found) return;
        unlocked.push({ ...found, earnedAt: new Date().toISOString() });
    }
    if (lifetimeScans >= 1) maybeUnlock("first_scan");
    if (completedTiles >= 1) maybeUnlock("first_tile");
    if (lineCount >= 1) {
        maybeUnlock("three_in_a_row");
        maybeUnlock("bingo");
    }
    if (isFullCard) {
        maybeUnlock("full_card");
        maybeUnlock("museum_explorer");
    }
    if (scanDurationMs <= 10000) maybeUnlock("speed_finder");
    if (streak >= 5) maybeUnlock("streak_master");
    if (rank === 1 && isFullCard) maybeUnlock("room_champion");
    return unlocked;
}

window.BingoRules = {
    TILE_STATES,
    CARD_COMPLETION_STATES,
    DIFFICULTY_PRESETS,
    ROOM_MODES,
    BADGE_DEFINITIONS,
    computeWinPatterns,
    getCompletedLines,
    isLineCompleted,
    isFullBoardComplete,
    getCardCompletionState,
    detectStreakChange,
    getStreakBonus,
    calculateScoreAfterValidation,
    getNextBestTileHint,
    evaluateBadgeUnlocks
};
