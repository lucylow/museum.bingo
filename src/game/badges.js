/**
 * Badge definitions + pure unlock evaluator.
 */

const BADGES = Object.freeze([
    {
        id: "first_scan",
        name: "First Scan",
        description: "Complete your first confirmed artifact scan.",
        icon: "🚀",
        rarity: "common",
        displayPriority: 100,
        unlockCondition: (p) => p.tilesFound >= 1
    },
    {
        id: "first_tile",
        name: "First Discovery",
        description: "Lock in your first artifact tile.",
        icon: "📡",
        rarity: "common",
        displayPriority: 95,
        unlockCondition: (p) => p.tilesFound >= 1
    },
    {
        id: "three_in_a_row",
        name: "Three-in-a-Row",
        description: "Keep the streak alive across three scans.",
        icon: "🔥",
        rarity: "uncommon",
        displayPriority: 90,
        unlockCondition: (p) => p.bestStreak >= 3
    },
    {
        id: "artifact_sleuth",
        name: "Artifact Detective",
        description: "Confirm five artifacts in one session.",
        icon: "🪐",
        rarity: "uncommon",
        displayPriority: 86,
        unlockCondition: (p) => p.tilesFound >= 5
    },
    {
        id: "relic_hunter",
        name: "Streak Master",
        description: "Complete two lines in a single card.",
        icon: "🌟",
        rarity: "rare",
        displayPriority: 84,
        unlockCondition: (p) => p.lineCount >= 2
    },
    {
        id: "bingo",
        name: "Full Card",
        description: "Complete the full board of discoveries.",
        icon: "🏆",
        rarity: "rare",
        displayPriority: 80,
        unlockCondition: (p) => p.bingoComplete
    },
    {
        id: "streak_master",
        name: "Guide Favorite",
        description: "Build a five-scan discovery streak.",
        icon: "🛸",
        rarity: "epic",
        displayPriority: 70,
        unlockCondition: (p) => p.bestStreak >= 5
    },
    {
        id: "speed_finder",
        name: "Speed Explorer",
        description: "Score big with fast confident scans.",
        icon: "⏱️",
        rarity: "rare",
        displayPriority: 58,
        unlockCondition: (p) => p.tilesFound >= 5 && p.currentScore >= 500
    },
    {
        id: "room_champion",
        name: "Room Champion",
        description: "Finish the round in first place.",
        icon: "👑",
        rarity: "legendary",
        displayPriority: 54,
        unlockCondition: (p) => Number(p.rank) === 1 && p.bingoComplete
    },
    {
        id: "daily_explorer",
        name: "Daily Explorer",
        description: "Complete the daily challenge.",
        icon: "📅",
        rarity: "uncommon",
        displayPriority: 50,
        unlockCondition: (p) => p.dailyChallengeComplete === true
    },
    {
        id: "museum_explorer",
        name: "Museum Regular",
        description: "Complete a full museum card and keep returning.",
        icon: "🏛️",
        rarity: "epic",
        displayPriority: 46,
        unlockCondition: (p) => p.hasFullCard === true || p.bingoComplete
    },
    {
        id: "helpful_roommate",
        name: "Helpful Explorer",
        description: "Keep the room on track with steady progress.",
        icon: "🤝",
        rarity: "uncommon",
        displayPriority: 44,
        unlockCondition: (p) => (Number(p.lineCount || 0) >= 1) && (Number(p.rank || 9) <= 3)
    }
]);

const BADGE_LOCALIZATION = Object.freeze({
    es: {
        first_scan: { name: "Primer escaneo", description: "Completa tu primer escaneo confirmado." },
        first_tile: { name: "Primera casilla", description: "Asegura tu primera casilla." },
        three_in_a_row: { name: "Tres seguidas", description: "Mantén una racha de tres escaneos." },
        bingo: { name: "Carton completo", description: "Completa una linea o carton de bingo." }
    },
    zh: {
        first_scan: { name: "首次扫描", description: "完成第一次确认扫描。" },
        first_tile: { name: "首个格子", description: "锁定第一个格子。" },
        three_in_a_row: { name: "三连击", description: "保持三次连续发现。" },
        bingo: { name: "宾果达成", description: "完成一条线或整张卡。" }
    },
    ar: {
        first_scan: { name: "اول مسح", description: "اكمل اول مسح مؤكد." },
        first_tile: { name: "اول خانة", description: "ثبت اول خانة." },
        three_in_a_row: { name: "ثلاثة متتالية", description: "حافظ على سلسلة من ثلاث عمليات مسح." },
        bingo: { name: "اكتمال البنغو", description: "اكمل خطا او البطاقة كاملة." }
    }
});

function localizeBadgeDefinition(badge, locale) {
    const safeLocale = String(locale || "en").toLowerCase().split("-")[0];
    const localized = BADGE_LOCALIZATION[safeLocale] && BADGE_LOCALIZATION[safeLocale][badge.id];
    if (!localized) return badge;
    return {
        ...badge,
        name: localized.name || badge.name,
        description: localized.description || badge.description
    };
}

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
    localizeBadgeDefinition,
    evaluateUnlockedBadges
};
