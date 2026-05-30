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
    { id: "first_scan", name: "First Discovery", description: "Complete your first confirmed artifact scan.", icon: "🧭", rarity: "common" },
    { id: "first_tile", name: "First Artifact", description: "Lock in your first artifact tile.", icon: "🏺", rarity: "common" },
    { id: "three_in_a_row", name: "Three Finds in a Row", description: "Complete your first bingo line.", icon: "🔥", rarity: "uncommon" },
    { id: "bingo", name: "Relic Hunter", description: "Complete any line on your card.", icon: "🗿", rarity: "rare" },
    { id: "full_card", name: "Full Card", description: "Complete the entire bingo card.", icon: "🏆", rarity: "epic" },
    { id: "speed_finder", name: "Speed Explorer", description: "Validate a tile in under 10 seconds.", icon: "⏱️", rarity: "rare" },
    { id: "streak_master", name: "Streak Master", description: "Reach a streak of 5.", icon: "⚡", rarity: "epic" },
    { id: "room_champion", name: "Room Champion", description: "Finish #1 in your room.", icon: "👑", rarity: "legendary" },
    { id: "museum_explorer", name: "Museum Regular", description: "Complete a full museum card.", icon: "🎫", rarity: "epic" }
]);

const NFT_TOKEN_DEFINITIONS = Object.freeze([
    {
        id: "nft_first_scan",
        name: "Genesis Scan",
        description: "Mint-ready collectible for your first confirmed scan.",
        icon: "🪙",
        rarity: "common",
        tier: 1,
        utility: "Profile flair: Genesis explorer ring",
        category: "milestone",
        optionalMint: true
    },
    {
        id: "nft_line_unlock",
        name: "Line Relic",
        description: "Collectible badge unlocked after completing your first bingo line.",
        icon: "📏",
        rarity: "uncommon",
        tier: 2,
        utility: "Unlocks one bonus challenge slot",
        category: "line_completion",
        optionalMint: true
    },
    {
        id: "nft_streak_master",
        name: "Streak Sigil",
        description: "Status token for building a five-scan streak.",
        icon: "⚡",
        rarity: "rare",
        tier: 3,
        utility: "Animated streak profile border",
        category: "streak",
        optionalMint: true
    },
    {
        id: "nft_full_card_relic",
        name: "Full Card Relic",
        description: "Rare collectible unlocked for completing the full bingo card.",
        icon: "🏺",
        rarity: "epic",
        tier: 4,
        utility: "Access to rare-card multiplayer rooms",
        category: "full_card",
        optionalMint: true
    },
    {
        id: "nft_room_trophy",
        name: "Room Trophy",
        description: "Trophy collectible for winning your multiplayer room.",
        icon: "🏆",
        rarity: "legendary",
        tier: 5,
        utility: "Leaderboard trophy frame",
        category: "multiplayer_win",
        optionalMint: true
    }
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

function getSeasonalTokenDefinition(seasonId) {
    const safeSeason = String(seasonId || "season_genesis").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    return {
        id: `nft_daily_${safeSeason}`,
        name: "Seasonal Curator Pass",
        description: `Seasonal collectible for completing a daily challenge in ${safeSeason.replaceAll("_", " ")}.`,
        icon: "🧩",
        rarity: "rare",
        tier: 3,
        utility: "Seasonal profile flair and event room access",
        category: "seasonal_daily",
        seasonId: safeSeason,
        optionalMint: true
    };
}

function evaluateNftUnlocks(context) {
    const unlocked = [];
    const {
        lifetimeScans,
        lineCount,
        isFullCard,
        streak,
        rank,
        dailyChallengeCompleted,
        seasonId,
        awardedTokenIds
    } = context;
    const earned = toSet(awardedTokenIds);
    function maybeUnlock(definition) {
        if (!definition || !definition.id || earned.has(definition.id)) return;
        unlocked.push({ ...definition, earnedAt: new Date().toISOString() });
    }
    if (lifetimeScans >= 1) maybeUnlock(NFT_TOKEN_DEFINITIONS.find((token) => token.id === "nft_first_scan"));
    if (lineCount >= 1) maybeUnlock(NFT_TOKEN_DEFINITIONS.find((token) => token.id === "nft_line_unlock"));
    if (streak >= 5) maybeUnlock(NFT_TOKEN_DEFINITIONS.find((token) => token.id === "nft_streak_master"));
    if (isFullCard) maybeUnlock(NFT_TOKEN_DEFINITIONS.find((token) => token.id === "nft_full_card_relic"));
    if (rank === 1 && isFullCard) maybeUnlock(NFT_TOKEN_DEFINITIONS.find((token) => token.id === "nft_room_trophy"));
    if (dailyChallengeCompleted) maybeUnlock(getSeasonalTokenDefinition(seasonId));
    return unlocked;
}

window.BingoRules = {
    TILE_STATES,
    CARD_COMPLETION_STATES,
    DIFFICULTY_PRESETS,
    ROOM_MODES,
    BADGE_DEFINITIONS,
    NFT_TOKEN_DEFINITIONS,
    computeWinPatterns,
    getCompletedLines,
    isLineCompleted,
    isFullBoardComplete,
    getCardCompletionState,
    detectStreakChange,
    getStreakBonus,
    calculateScoreAfterValidation,
    getNextBestTileHint,
    evaluateBadgeUnlocks,
    getSeasonalTokenDefinition,
    evaluateNftUnlocks
};
