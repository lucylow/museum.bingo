/**
 * Scavenger clue engine.
 * Pure helpers for clue generation, objective selection, and progress tracking.
 */

const CLUE_TYPES = Object.freeze([
    "visual",
    "location",
    "style",
    "object",
    "era",
    "material",
    "artist",
    "detail",
    "challenge",
    "bonus"
]);

const CLUE_DIFFICULTY = Object.freeze({
    easy: 1,
    standard: 2,
    hard: 3
});

function t(key, params = {}) {
    if (window.I18n && typeof window.I18n.t === "function") return window.I18n.t(key, params);
    return key;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeDifficulty(raw) {
    if (!raw) return "standard";
    if (raw === "easy" || raw === "standard" || raw === "hard") return raw;
    return "standard";
}

function toClueText(item, category) {
    const name = item && item.name ? item.name : "museum artifact";
    switch (category) {
    case "visual":
        return `Look for the visual silhouette of ${name}.`;
    case "location":
        return `Search nearby gallery walls and display islands for ${name}.`;
    case "style":
        return `Find a piece with the style language of ${name}.`;
    case "object":
        return `Find the object that matches ${name}.`;
    case "era":
        return `Find something from the same era as ${name}.`;
    case "material":
        return `Look for the material cues seen in ${name}.`;
    case "artist":
        return `Find a work by the same artist or maker as ${name}.`;
    case "detail":
        return `Zoom in and find a defining detail connected to ${name}.`;
    case "challenge":
        return `Challenge clue: confirm ${name} with one smooth scan.`;
    case "bonus":
        return `Bonus route: spot ${name} for extra hunt points.`;
    default:
        return `Find ${name} in the gallery.`;
    }
}

function getHintLabel(hintLevel) {
    if (hintLevel <= 0) return t("scan.scanning");
    if (hintLevel === 1) return t("scan.hintActive");
    if (hintLevel === 2) return t("scan.almostRecognized");
    return t("scan.recognized");
}

function buildClueFromItem(item, index, options = {}) {
    const categoryPool = Array.isArray(options.categoryPool) && options.categoryPool.length
        ? options.categoryPool
        : CLUE_TYPES;
    const category = categoryPool[index % categoryPool.length];
    const difficulty = normalizeDifficulty(options.difficulty || "standard");
    const isBonus = category === "bonus" || Boolean(item && item.rarity === "rare");
    const clueId = `clue_${index + 1}`;
    return {
        id: clueId,
        title: item && item.name ? item.name : `Artifact ${index + 1}`,
        clueText: toClueText(item, category),
        whyItMatters: isBonus
            ? "Bonus clue unlocks extra rewards and replay value."
            : "Main route clue advances your card and line progress.",
        whatToLookFor: item && item.fact ? item.fact : "Shape, material, iconography, and label context.",
        difficulty,
        difficultyValue: CLUE_DIFFICULTY[difficulty],
        category,
        targetRef: item && item.id ? String(item.id) : `target_${index + 1}`,
        hintLevel: 0,
        hintLabel: getHintLabel(0),
        rewardValue: isBonus ? 90 : 50,
        route: isBonus ? "bonus" : "main",
        completed: false,
        tileIndex: index + 1,
        proximity: 0,
        actionLabel: isBonus ? "Scan bonus target" : "Scan this clue"
    };
}

function buildClueSet(items, options = {}) {
    const input = Array.isArray(items) ? items : [];
    return input.map((item, index) => buildClueFromItem(item, index, options));
}

function getClueSolveDistanceLabel(proximity) {
    const pct = clamp(Number(proximity) || 0, 0, 100);
    if (pct >= 85) return "Very close";
    if (pct >= 60) return "Close";
    if (pct >= 30) return "Warming up";
    return "Searching";
}

function bumpHintLevel(clues, clueId) {
    return (Array.isArray(clues) ? clues : []).map((clue) => {
        if (clue.id !== clueId || clue.completed) return clue;
        const nextHintLevel = clamp(Number(clue.hintLevel || 0) + 1, 0, 3);
        return {
            ...clue,
            hintLevel: nextHintLevel,
            hintLabel: getHintLabel(nextHintLevel)
        };
    });
}

function updateClueProximity(clues, clueId, proximity) {
    const normalized = clamp(Number(proximity) || 0, 0, 100);
    return (Array.isArray(clues) ? clues : []).map((clue) => {
        if (clue.id !== clueId || clue.completed) return clue;
        return { ...clue, proximity: normalized };
    });
}

function markClueCompleted(clues, tileIndex) {
    return (Array.isArray(clues) ? clues : []).map((clue) => {
        if (Number(clue.tileIndex) !== Number(tileIndex)) return clue;
        return {
            ...clue,
            completed: true,
            proximity: 100,
            actionLabel: "Clue completed"
        };
    });
}

function getCurrentObjective(clues) {
    const queue = (Array.isArray(clues) ? clues : []).filter((clue) => !clue.completed);
    if (!queue.length) {
        return {
            title: "Hunt complete",
            clueText: "Every clue on your board is complete.",
            actionLabel: t("rewards.missionComplete"),
            progress: "100%"
        };
    }
    const current = queue[0];
    const completedCount = (Array.isArray(clues) ? clues : []).length - queue.length;
    const total = Math.max(1, (Array.isArray(clues) ? clues : []).length);
    const progressPct = Math.round((completedCount / total) * 100);
    return {
        title: current.title,
        clueText: current.clueText,
        actionLabel: current.actionLabel,
        progress: `${progressPct}%`,
        clueId: current.id,
        tileIndex: current.tileIndex,
        route: current.route,
        category: current.category,
        proximityLabel: getClueSolveDistanceLabel(current.proximity),
        proximity: current.proximity
    };
}

window.ClueEngine = {
    CLUE_TYPES,
    CLUE_DIFFICULTY,
    buildClueSet,
    getCurrentObjective,
    markClueCompleted,
    bumpHintLevel,
    updateClueProximity,
    getClueSolveDistanceLabel
};
