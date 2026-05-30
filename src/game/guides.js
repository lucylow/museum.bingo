/**
 * Character guide roster and pure selection/dialogue helpers.
 * Keeps copy strategy separate from UI rendering.
 */

const GUIDE_BEATS = Object.freeze([
    "welcome",
    "explain",
    "hint",
    "celebrate",
    "nudge",
    "compare",
    "recap",
    "ask",
    "encourage",
    "focus"
]);

const GUIDE_MOODS = Object.freeze([
    "playful",
    "calm",
    "expert",
    "energetic",
    "story"
]);

const GUIDE_CAST = Object.freeze([
    {
        id: "nova",
        name: "Nova",
        avatar: "🧭",
        personality: "Playful explorer who turns clues into mini missions.",
        visualStyle: { gradient: "from-indigo-500 to-cyan-400", accent: "#60a5fa", surface: "#1e3a8a" },
        voiceTone: "playful",
        expertiseFocus: "exploration and confidence building",
        favoriteClueKinds: ["visual", "location", "challenge"],
        introLine: "I am Nova. Let's find one great object at a time.",
        celebrateLine: "Nice find! You are reading the gallery like a pro.",
        hintLine: "Tiny move: shift left and fill the frame with the object.",
        recapLine: "You built a strong discovery trail today.",
        moodVariants: {
            playful: "Adventure mode on.",
            calm: "Slow and steady works too.",
            expert: "Focus on form, material, and context.",
            energetic: "Fast lock. Keep the streak rolling.",
            story: "Each object is a chapter in the museum story."
        },
        a11yShort: "Nova helps with quick, playful scan tips."
    },
    {
        id: "iris",
        name: "Iris",
        avatar: "🏛️",
        personality: "Calm docent who explains why objects matter.",
        visualStyle: { gradient: "from-amber-500 to-orange-300", accent: "#f59e0b", surface: "#78350f" },
        voiceTone: "calm",
        expertiseFocus: "context and educational framing",
        favoriteClueKinds: ["era", "artist", "material"],
        introLine: "Welcome. I will guide you through highlights with simple context.",
        celebrateLine: "Excellent observation. That find adds real historical context.",
        hintLine: "Try reducing glare and reading the object silhouette first.",
        recapLine: "You connected clues to context, not just points.",
        moodVariants: {
            playful: "Let's discover one little detail together.",
            calm: "Take your time. The museum rewards patience.",
            expert: "Compare era, material, and iconography.",
            energetic: "Quick check, then confirm and move on.",
            story: "This room tells a bigger story when viewed together."
        },
        a11yShort: "Iris gives calm, clear museum context."
    },
    {
        id: "pico",
        name: "Pico",
        avatar: "🦊",
        personality: "Kid-friendly helper with short, cheerful prompts.",
        visualStyle: { gradient: "from-pink-500 to-fuchsia-300", accent: "#ec4899", surface: "#831843" },
        voiceTone: "playful",
        expertiseFocus: "family and school group support",
        favoriteClueKinds: ["object", "detail", "visual"],
        introLine: "Hi! I keep clues short so everyone can jump in.",
        celebrateLine: "You got it! That was a great museum detective move.",
        hintLine: "Step closer and keep one object in the middle.",
        recapLine: "You found cool things and learned as you played.",
        moodVariants: {
            playful: "Let's try the next clue!",
            calm: "Nice and easy. You are doing great.",
            expert: "Check one clear detail before you scan.",
            energetic: "Fast find! Ready for one more?",
            story: "This one links to what you found earlier."
        },
        a11yShort: "Pico keeps guidance extra short and family-friendly."
    },
    {
        id: "atlas",
        name: "Atlas",
        avatar: "📚",
        personality: "History expert who gives concise educational notes.",
        visualStyle: { gradient: "from-emerald-500 to-teal-300", accent: "#10b981", surface: "#064e3b" },
        voiceTone: "expert",
        expertiseFocus: "history and interpretation",
        favoriteClueKinds: ["era", "style", "artist"],
        introLine: "I am Atlas. I focus on short facts that sharpen your eye.",
        celebrateLine: "Confirmed. You identified a key artifact correctly.",
        hintLine: "Compare period markers and material before confirming.",
        recapLine: "Your session shows strong pattern recognition.",
        moodVariants: {
            playful: "A quick fact makes this clue easier.",
            calm: "Observe first, then validate.",
            expert: "Anchor to period, maker, and medium.",
            energetic: "High confidence window detected.",
            story: "This object bridges two museum themes."
        },
        a11yShort: "Atlas gives concise expert context."
    },
    {
        id: "quill",
        name: "Quill",
        avatar: "🕵️",
        personality: "Artifact detective who spots hidden details.",
        visualStyle: { gradient: "from-slate-500 to-zinc-300", accent: "#94a3b8", surface: "#1f2937" },
        voiceTone: "story",
        expertiseFocus: "detail spotting and clue sequencing",
        favoriteClueKinds: ["detail", "challenge", "bonus"],
        introLine: "Quill here. We solve this board clue by clue.",
        celebrateLine: "Case closed. You found an important detail.",
        hintLine: "Try a slight angle and isolate one strong shape.",
        recapLine: "You solved the room with smart sequencing.",
        moodVariants: {
            playful: "Detective mode: on.",
            calm: "One clue at a time.",
            expert: "Use elimination and line pressure.",
            energetic: "Fast track unlocked. Keep momentum.",
            story: "This clue connects to your previous discovery."
        },
        a11yShort: "Quill guides with detective-style detail hints."
    },
    {
        id: "blaze",
        name: "Blaze",
        avatar: "⚡",
        personality: "Fast-paced mission lead for competitive rooms.",
        visualStyle: { gradient: "from-rose-500 to-amber-300", accent: "#fb7185", surface: "#881337" },
        voiceTone: "energetic",
        expertiseFocus: "streaks and multiplayer momentum",
        favoriteClueKinds: ["challenge", "bonus", "location"],
        introLine: "Blaze online. We move fast, stay clear, and stack points.",
        celebrateLine: "Locked! Keep pressure on the leaderboard.",
        hintLine: "Quick reset: center target, stabilize, confirm.",
        recapLine: "You pushed pace and converted opportunities.",
        moodVariants: {
            playful: "Let's speedrun this row.",
            calm: "Controlled speed beats rushed scans.",
            expert: "Prioritize one-away tiles first.",
            energetic: "Huge momentum. Keep chaining.",
            story: "This run had a strong opening and finish."
        },
        a11yShort: "Blaze gives high-energy competitive guidance."
    }
]);

const SAFE_LENGTH = 160;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function pickGuideById(guideId) {
    return GUIDE_CAST.find((guide) => guide.id === guideId) || null;
}

function getGuideTone(context = {}) {
    const preference = context.energyPreference;
    if (preference === "calm") return "calm";
    if (preference === "energetic") return "energetic";
    if (context.ageFriendlyMode) return "playful";
    if (context.sessionType === "school") return "story";
    if (context.difficulty === "challenge") return "expert";
    return "playful";
}

function scoreGuideFit(guide, context = {}) {
    let score = 0;
    if (context.ageFriendlyMode && guide.id === "pico") score += 5;
    if (context.sessionType === "school" && (guide.id === "iris" || guide.id === "atlas")) score += 4;
    if (context.sessionType === "family" && (guide.id === "pico" || guide.id === "nova")) score += 4;
    if (context.sessionType === "solo" && (guide.id === "quill" || guide.id === "iris")) score += 3;
    if (context.multiplayer && guide.id === "blaze") score += 5;
    if (context.difficulty === "challenge" && (guide.id === "atlas" || guide.id === "blaze")) score += 4;
    if (context.museumTheme === "history" && (guide.id === "atlas" || guide.id === "iris")) score += 3;
    if (context.museumTheme === "art" && (guide.id === "nova" || guide.id === "quill")) score += 2;
    if (context.museumTheme === "science" && (guide.id === "nova" || guide.id === "blaze")) score += 2;
    if (context.energyPreference === "calm" && (guide.id === "iris" || guide.id === "atlas")) score += 4;
    if (context.energyPreference === "energetic" && (guide.id === "blaze" || guide.id === "nova")) score += 4;
    return score;
}

function selectGuide(context = {}) {
    if (context.selectedGuideId) {
        const selected = pickGuideById(context.selectedGuideId);
        if (selected) return selected;
    }
    const ranked = GUIDE_CAST
        .map((guide) => ({ guide, score: scoreGuideFit(guide, context) }))
        .sort((a, b) => b.score - a.score);
    return ranked[0] ? ranked[0].guide : GUIDE_CAST[0];
}

function trimLine(text) {
    const raw = String(text || "").trim();
    if (raw.length <= SAFE_LENGTH) return raw;
    return `${raw.slice(0, SAFE_LENGTH - 1)}…`;
}

function getGuideMoodLine(guide, context = {}) {
    const tone = getGuideTone(context);
    const moodMap = guide && guide.moodVariants ? guide.moodVariants : {};
    return trimLine(moodMap[tone] || guide.introLine || "Let's explore.");
}

function shouldThrottleDialogue({ beat, now, lastLineAt, lastBeat, minGapMs = 3500 }) {
    if (!now || !lastLineAt) return false;
    if (beat && beat === lastBeat) return (now - lastLineAt) < minGapMs * 1.2;
    return (now - lastLineAt) < minGapMs;
}

function renderGuideLine({ guide, beat = "encourage", context = {}, previousLine = "" }) {
    const safeGuide = guide || GUIDE_CAST[0];
    const moodLine = getGuideMoodLine(safeGuide, context);
    const itemName = context.itemName ? ` ${context.itemName}` : "";
    const rowHint = context.rowHint ? ` ${context.rowHint}` : "";

    let line = "";
    if (beat === "welcome") line = `${safeGuide.introLine} ${moodLine}`;
    else if (beat === "hint") line = `${safeGuide.hintLine} ${context.hintAction || ""}`.trim();
    else if (beat === "celebrate") line = `${safeGuide.celebrateLine}${itemName ? ` ${itemName} matters here.` : ""}`;
    else if (beat === "recap") line = `${safeGuide.recapLine} ${context.recapFocus || ""}`.trim();
    else if (beat === "focus") line = `Try tile ${context.nextTile || "next"} first.${rowHint}`;
    else if (beat === "compare") line = `You are ${context.distance || "close"} to the next line.`;
    else if (beat === "ask") line = `Need a calmer pace? You can switch my tone anytime.`;
    else if (beat === "explain") line = `${moodLine} Scan, confirm, and fill the board to build lines.`;
    else line = `${moodLine} ${context.nudge || "Keep going."}`;

    const trimmed = trimLine(line);
    if (trimmed === previousLine) {
        return trimLine(`${moodLine} ${context.altNudge || "Nice progress."}`);
    }
    return trimmed;
}

window.GuideEngine = {
    GUIDE_BEATS,
    GUIDE_MOODS,
    GUIDE_CAST,
    selectGuide,
    pickGuideById,
    getGuideTone,
    getGuideMoodLine,
    renderGuideLine,
    shouldThrottleDialogue,
    clamp
};
