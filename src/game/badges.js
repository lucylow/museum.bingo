/**
 * Badge definitions + pure unlock evaluator.
 */

const BADGES = Object.freeze([
    {
        id: "first_scan",
        name: "First Scan",
        description: "Complete your first artwork scan.",
        icon: "scan",
        rarity: "common",
        displayPriority: 100,
        unlockCondition: (p) => p.tilesFound >= 1
    },
    {
        id: "first_tile",
        name: "First Tile",
        description: "Mark your first bingo tile.",
        icon: "tile",
        rarity: "common",
        displayPriority: 95,
        unlockCondition: (p) => p.tilesFound >= 1
    },
    {
        id: "three_in_a_row",
        name: "Three-in-a-Row",
        description: "Complete one line.",
        icon: "line",
        rarity: "uncommon",
        displayPriority: 90,
        unlockCondition: (p) => p.lineCount >= 1
    },
    {
        id: "bingo",
        name: "Bingo",
        description: "Complete the card.",
        icon: "trophy",
        rarity: "rare",
        displayPriority: 80,
        unlockCondition: (p) => p.bingoComplete
    },
    {
        id: "full_card",
        name: "Full Card",
        description: "Finish every tile on the board.",
        icon: "grid",
        rarity: "epic",
        displayPriority: 70,
        unlockCondition: (p) => p.hasFullCard === true || p.bingoComplete
    },
    {
        id: "streak_master",
        name: "Streak Master",
        description: "Build a long streak.",
        icon: "flame",
        rarity: "rare",
        displayPriority: 60,
        unlockCondition: (p) => p.bestStreak >= 5
    },
    {
        id: "speed_finder",
        name: "Speed Finder",
        description: "Win fast and clean.",
        icon: "bolt",
        rarity: "rare",
        displayPriority: 55,
        unlockCondition: (p) => p.tilesFound >= 5 && p.currentScore >= 500
    },
    {
        id: "daily_explorer",
        name: "Daily Explorer",
        description: "Complete the daily challenge.",
        icon: "calendar",
        rarity: "uncommon",
        displayPriority: 50,
        unlockCondition: (p) => p.dailyChallengeComplete === true
    }
]);

function evaluateUnlockedBadges(progressSnapshot, alreadyAwardedBadgeIds) {
    const awarded = new Set(Array.isArray(alreadyAwardedBadgeIds) ? alreadyAwardedBadgeIds : []);
    return BADGES
        .filter((badge) => {
            if (awarded.has(badge.id)) return false;
            try {
                return badge.unlockCondition(progressSnapshot);
            } catch (err) {
                console.warn("Badge unlock condition failed:", err);
                return false;
            }
        })
        .sort((a, b) => b.displayPriority - a.displayPriority);
}

window.WinBadges = {
    BADGES,
    evaluateUnlockedBadges
};
