// Museum Bingo AI: Premium AR Experience - Main Logic
// Includes modular gamification engine and realtime sync shim.

const themes = {
    art: {
        name: "Art Gallery",
        color: "#fbbf24",
        items: [
            { id: 1, name: "Oil Painting", emoji: "🖼️", fact: "Oil paintings were perfected during the Renaissance." },
            { id: 2, name: "Ancient Statue", emoji: "🗿", fact: "Easter Island Moai weigh about 80 tons!" },
            { id: 3, name: "Ceramic Vase", emoji: "🏺", fact: "Ancient Greeks used these for wine and water." },
            { id: 4, name: "Abstract Art", emoji: "🎨", fact: "Abstract art emerged in the early 1900s." },
            { id: 5, name: "Golden Mask", emoji: "🎭", fact: "Tutankhamun's mask is solid gold!" },
            { id: 6, name: "Ancient Map", emoji: "🗺️", fact: "The oldest map is from Babylon (600 BCE)." },
            { id: 7, name: "Medieval Armor", emoji: "🛡️", fact: "Knights' armor could weigh 60 pounds." },
            { id: 8, name: "Precious Jewelry", emoji: "💎", fact: "The Hope Diamond is 45.52 carats." },
            { id: 9, name: "Dinosaur Skeleton", emoji: "🦴", fact: "Sue is the most complete T-Rex fossil." }
        ]
    },
    history: {
        name: "Natural History",
        color: "#10b981",
        items: [
            { id: 10, name: "Mammoth Tusk", emoji: "🐘", fact: "Mammoths lived during the Ice Age." },
            { id: 11, name: "Ammonite Fossil", emoji: "🐚", fact: "Ammonites are extinct marine mollusks." },
            { id: 12, name: "Crystal Cluster", emoji: "🔮", fact: "Crystals grow in repeating patterns." },
            { id: 13, name: "Meteorite", emoji: "☄️", fact: "Meteorites are space rocks that hit Earth." },
            { id: 14, name: "Tribal Mask", emoji: "👺", fact: "Masks are used in many cultural rituals." },
            { id: 15, name: "Obsidian Spear", emoji: "🗡️", fact: "Obsidian is volcanic glass." },
            { id: 16, name: "Butterfly Box", emoji: "🦋", fact: "Butterflies go through metamorphosis." },
            { id: 17, name: "Ancient Coin", emoji: "🪙", fact: "Lydians invented coins around 600 BCE." },
            { id: 18, name: "Shark Tooth", emoji: "🦈", fact: "Megalodon teeth can be 7 inches long!" }
        ]
    },
    science: {
        name: "Science Center",
        color: "#3b82f6",
        items: [
            { id: 19, name: "Space Suit", emoji: "👨‍🚀", fact: "Space suits protect from extreme temps." },
            { id: 20, name: "Robot Arm", emoji: "🦾", fact: "Robots are used in car manufacturing." },
            { id: 21, name: "Microscope", emoji: "🔬", fact: "Microscopes reveal the tiny world." },
            { id: 22, name: "Tesla Coil", emoji: "⚡", fact: "Tesla coils produce high-voltage electricity." },
            { id: 23, name: "Rocket Model", emoji: "🚀", fact: "Rockets work on Newton's third law." },
            { id: 24, name: "DNA Model", emoji: "🧬", fact: "DNA is the blueprint of life." },
            { id: 25, name: "Solar Panel", emoji: "☀️", fact: "Solar panels turn light into electricity." },
            { id: 26, name: "Atom Model", emoji: "⚛️", fact: "Atoms are the building blocks of matter." },
            { id: 27, name: "VR Headset", emoji: "🥽", fact: "VR creates immersive digital worlds." }
        ]
    }
};

const themeLore = Object.freeze({
    art: {
        era: "Classical to modern eras",
        origin: "Global museum collections",
        material: "Mixed media",
        category: "Curated artwork"
    },
    history: {
        era: "Ancient to medieval periods",
        origin: "Historical civilizations",
        material: "Stone, bronze, clay, bone",
        category: "Cultural artifact"
    },
    science: {
        era: "Industrial to contemporary",
        origin: "Labs and exploration programs",
        material: "Metal, glass, composites",
        category: "Scientific object"
    }
});

const artifactLoreByName = Object.freeze({
    "Ancient Statue": { era: "Classical antiquity", origin: "Mediterranean region", material: "Marble and limestone", category: "Sculpture" },
    "Ceramic Vase": { era: "Ancient era", origin: "Greek and Near Eastern workshops", material: "Fired clay", category: "Pottery" },
    "Golden Mask": { era: "Late Bronze Age", origin: "Ancient Egypt", material: "Gold and glass inlay", category: "Ceremonial object" },
    "Ancient Map": { era: "Early classical era", origin: "Mesopotamia", material: "Clay tablet and pigment", category: "Manuscript" },
    "Medieval Armor": { era: "High medieval period", origin: "Western Europe", material: "Forged steel and leather", category: "Armor" },
    "Dinosaur Skeleton": { era: "Late Cretaceous", origin: "North American fossil beds", material: "Fossilized bone", category: "Fossil" },
    "Mammoth Tusk": { era: "Pleistocene Ice Age", origin: "Eurasian steppe", material: "Ivory", category: "Fossil" },
    "Ammonite Fossil": { era: "Jurassic period", origin: "Marine sedimentary layers", material: "Calcified shell", category: "Fossil" },
    "Tribal Mask": { era: "Early modern period", origin: "West and Central Africa", material: "Carved wood and pigment", category: "Ceremonial object" },
    "Obsidian Spear": { era: "Neolithic era", origin: "Mesoamerica", material: "Volcanic glass", category: "Ancient tool" },
    "Ancient Coin": { era: "Classical period", origin: "Lydian and Greek city-states", material: "Electrum or bronze", category: "Coin" },
    "Shark Tooth": { era: "Miocene epoch", origin: "Coastal fossil strata", material: "Mineralized dentin", category: "Fossil" }
});

let currentTheme = "art";
const DEFAULT_ROOM_ID = "DEMO42";

const gameState = {
    selectedCell: null,
    foundItems: new Set(),
    startTime: Date.now(),
    totalAttempts: 0,
    successfulScans: 0,
    aiDetections: 0,
    cameraStream: null,
    currentRiddleIndex: {},
    exp: 0,
    level: 1,
    tutorialStep: 0,
    audioCtx: null,
    isHeatVisionActive: false,
    currentUser: { uid: "guest", displayName: "Guest", isPremium: false, totalBingos: 0 },
    roomId: DEFAULT_ROOM_ID,
    gamification: null,
    syncService: null,
    usedHintSinceLastScan: false,
    scanStartedAt: null,
    nearMatchPlayedAt: 0,
    subscriptions: [],
    currentCardItems: [],
    clueDeck: [],
    currentObjectiveId: null,
    scanProximity: 0,
    winLadderBonusPoints: 0,
    winLadderEvents: [],
    lastWinStates: [],
    sessionRecap: null,
    guide: {
        activeGuideId: "nova",
        lastLine: "",
        lastBeat: null,
        lastLineAt: 0,
        recentTips: []
    },
    settings: {
        locale: (window.I18n && window.I18n.getLocale && window.I18n.getLocale()) || "en",
        roomLanguage: "en",
        cardSize: 3,
        difficultyMode: "standard",
        roomMode: "multiplayer",
        dailyChallengeEnabled: true,
        ageFriendlyMode: true,
        guideSessionType: "first_time",
        guideEnergy: "calm",
        selectedGuideId: "nova",
        compactMode: false,
        highContrast: false,
        reducedMotion: false,
        soundEnabled: true,
        vibrationEnabled: true
    }
};

function getStoredPassport() {
    try {
        const parsed = JSON.parse(localStorage.getItem("museumPassport") || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
        console.warn("Failed to parse museum passport from storage:", err);
        return {};
    }
}

const passport = getStoredPassport();

const DOM = {
    board: document.getElementById("bingo-board"),
    localeSwitcher: document.getElementById("locale-switcher"),
    scanBtn: document.getElementById("scan-btn"),
    resetBtn: document.getElementById("reset-btn"),
    scannerOverlay: document.getElementById("scanner-overlay"),
    closeScanner: document.getElementById("close-scanner"),
    confirmBtn: document.getElementById("confirm-btn"),
    statusMsg: document.getElementById("status-msg"),
    cameraFeed: document.getElementById("camera-feed"),
    detectionCanvas: document.getElementById("detection-canvas"),
    artInfo: document.getElementById("art-info"),
    foundCount: document.getElementById("found-count"),
    pointsTotal: document.getElementById("points-total"),
    currentStreak: document.getElementById("current-streak"),
    accuracy: document.getElementById("accuracy"),
    timeElapsed: document.getElementById("time-elapsed"),
    aiDetectionsDisplay: document.getElementById("ai-detections"),
    winModal: document.getElementById("win-modal"),
    riddlePanel: document.getElementById("riddle-panel"),
    riddleText: document.getElementById("riddle-text"),
    nextRiddleBtn: document.getElementById("next-riddle-btn"),
    themeSelect: document.getElementById("museum-theme"),
    viewPassportBtn: document.getElementById("view-passport"),
    closePassportBtn: document.getElementById("close-passport"),
    passportModal: document.getElementById("passport-modal"),
    passportGrid: document.getElementById("passport-grid"),
    tutorialOverlay: document.getElementById("tutorial-overlay"),
    tutorialNextBtn: document.getElementById("tutorial-next"),
    tutorialSkipBtn: document.getElementById("tutorial-skip"),
    tutorialStepIcon: document.getElementById("tutorial-step-icon"),
    tutorialStepTitle: document.getElementById("tutorial-step-title"),
    tutorialStepText: document.getElementById("tutorial-step-text"),
    userLevel: document.getElementById("user-level"),
    levelProgress: document.getElementById("level-progress"),
    finalStats: document.getElementById("final-stats"),
    playAgainBtn: document.getElementById("play-again-btn"),
    heatVisionBtn: document.getElementById("heat-vision-btn"),
    detectedObjects: document.getElementById("detected-objects"),
    confidence: document.getElementById("confidence"),
    detectionResults: document.getElementById("detection-results"),
    artEmoji: document.getElementById("art-emoji"),
    artName: document.getElementById("art-name"),
    artFact: document.getElementById("art-fact"),
    vrHud: document.getElementById("vr-hud"),
    roomCode: document.getElementById("room-code"),
    roomStatus: document.getElementById("room-status"),
    activePlayerName: document.getElementById("active-player-name"),
    tilesProgress: document.getElementById("tiles-progress"),
    bingoProgressFill: document.getElementById("bingo-progress-fill"),
    bingoLinesCount: document.getElementById("bingo-lines-count"),
    dailyChallengeProgress: document.getElementById("daily-challenge-progress"),
    badgePreviewList: document.getElementById("badge-preview-list"),
    lifetimeBadges: document.getElementById("lifetime-badges"),
    totalMuseums: document.getElementById("total-museums"),
    totalScans: document.getElementById("total-scans"),
    bestStreak: document.getElementById("best-streak"),
    totalBingos: document.getElementById("total-bingos"),
    activityFeed: document.getElementById("activity-feed"),
    successModal: document.getElementById("scan-success-modal"),
    successArtwork: document.getElementById("success-artwork"),
    successArtist: document.getElementById("success-artist"),
    successPoints: document.getElementById("success-points"),
    successStreakBonus: document.getElementById("success-streak-bonus"),
    successBadge: document.getElementById("success-badge"),
    closeSuccessModal: document.getElementById("close-success-modal"),
    successVariant: document.getElementById("success-variant"),
    successRewardLine: document.getElementById("success-reward-line"),
    badgeToast: document.getElementById("badge-toast"),
    rankMoveBanner: document.getElementById("rank-move-banner"),
    difficultyMode: document.getElementById("difficulty-mode"),
    roomMode: document.getElementById("room-mode"),
    cardSize: document.getElementById("card-size"),
    dailyToggle: document.getElementById("daily-toggle"),
    compactModeToggle: document.getElementById("compact-mode-toggle"),
    highContrastToggle: document.getElementById("high-contrast-toggle"),
    reducedMotionToggle: document.getElementById("reduced-motion-toggle"),
    soundToggle: document.getElementById("sound-toggle"),
    vibrationToggle: document.getElementById("vibration-toggle"),
    helpBtn: document.getElementById("camera-help-btn"),
    scanGuidance: document.getElementById("scan-guidance"),
    confidenceFill: document.getElementById("confidence-fill"),
    cardStatusLabel: document.getElementById("card-status-label"),
    nextBestTile: document.getElementById("next-best-tile"),
    boardStatusPill: document.getElementById("board-status-pill"),
    boardCelebrationBanner: document.getElementById("board-celebration-banner"),
    totalProgressWrap: document.getElementById("total-progress-wrap"),
    nextObjective: document.getElementById("next-objective"),
    lineProgressCount: document.getElementById("line-progress-count"),
    streakIndicator: document.getElementById("streak-indicator"),
    roomProgressFill: document.getElementById("room-progress-fill"),
    roomProgressValue: document.getElementById("room-progress-value"),
    scanStatePill: document.getElementById("scan-state-pill"),
    badgeGallery: document.getElementById("badge-gallery"),
    badgeCountPill: document.getElementById("badge-count-pill"),
    goalCards: document.getElementById("goal-cards"),
    replayModeCards: document.getElementById("replay-mode-cards"),
    shareCardBtn: document.getElementById("share-card-btn"),
    recapBadges: document.getElementById("recap-badges"),
    victoryHighlight: document.getElementById("victory-highlight"),
    clueScroll: document.getElementById("clue-scroll"),
    objectiveTitle: document.getElementById("objective-title"),
    objectiveText: document.getElementById("objective-text"),
    objectiveRoute: document.getElementById("objective-route"),
    objectiveProximity: document.getElementById("objective-proximity"),
    objectiveProgress: document.getElementById("objective-progress"),
    objectiveProgressFill: document.getElementById("objective-progress-fill"),
    objectiveAction: document.getElementById("objective-action"),
    roomLanguageChip: document.getElementById("room-language-chip"),
    ageFriendlyToggle: document.getElementById("age-friendly-toggle"),
    guideModePill: document.getElementById("guide-mode-pill"),
    guideActiveCard: document.getElementById("guide-active-card"),
    guideActions: document.getElementById("guide-actions"),
    guidePickerWrap: document.getElementById("guide-picker-wrap"),
    guideSessionType: document.getElementById("guide-session-type"),
    guideEnergy: document.getElementById("guide-energy")
};

function playSound(freq, type = "sine", duration = 0.1, volume = 0.1) {
    try {
        if (!gameState.audioCtx) gameState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (gameState.audioCtx.state === "suspended") gameState.audioCtx.resume();
        const osc = gameState.audioCtx.createOscillator();
        const gain = gameState.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, gameState.audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, gameState.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, gameState.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(gameState.audioCtx.destination);
        osc.start();
        osc.stop(gameState.audioCtx.currentTime + duration);
    } catch (e) {
        console.warn("Audio failed", e);
    }
}

const sounds = {
    click: () => playSound(600, "sine", 0.1, 0.1),
    select: () => playSound(800, "triangle", 0.15, 0.1),
    found: () => {
        playSound(523.25, "sine", 0.2, 0.1);
        setTimeout(() => playSound(659.25, "sine", 0.2, 0.1), 100);
        setTimeout(() => playSound(783.99, "sine", 0.3, 0.1), 200);
    },
    levelUp: () => {
        [440, 554, 659, 880].forEach((f, i) => {
            setTimeout(() => playSound(f, "square", 0.2, 0.05), i * 150);
        });
    }
};

function saveSettings() {
    try {
        localStorage.setItem("museumBingoSettings", JSON.stringify(gameState.settings));
    } catch (err) {
        console.warn("Failed to persist settings:", err);
    }
}

function loadSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem("museumBingoSettings") || "{}");
        if (!stored || typeof stored !== "object") return;
        gameState.settings = { ...gameState.settings, ...stored };
    } catch (err) {
        console.warn("Failed to parse settings:", err);
    }
}

function playGameSound(name) {
    if (!gameState.settings.soundEnabled) return;
    if (sounds[name]) sounds[name]();
}

function t(key, params = {}) {
    if (window.I18n && typeof window.I18n.t === "function") {
        return window.I18n.t(key, params);
    }
    return key;
}

function tn(value, style = "decimal") {
    if (window.I18n && typeof window.I18n.formatters === "function") {
        return window.I18n.formatters().number(value, style);
    }
    return String(value);
}

function getTutorialSteps() {
    const guide = window.GuideEngine && typeof window.GuideEngine.selectGuide === "function"
        ? window.GuideEngine.selectGuide({
            selectedGuideId: gameState.settings.selectedGuideId || gameState.guide.activeGuideId,
            ageFriendlyMode: gameState.settings.ageFriendlyMode,
            sessionType: gameState.settings.guideSessionType,
            museumTheme: currentTheme,
            difficulty: gameState.settings.difficultyMode,
            multiplayer: gameState.settings.roomMode === "multiplayer",
            energyPreference: gameState.settings.guideEnergy
        })
        : null;
    const guideName = guide ? guide.name : "your guide";
    const onboardingMode = String(gameState.settings.guideSessionType || "first_time").replaceAll("_", " ");
    return [
        { icon: guide ? guide.avatar : "🎯", title: `${t("onboarding.welcomeTitle")} • ${guideName}`, text: `${t("onboarding.welcomeBody")} (${onboardingMode})` },
        { icon: "🖼️", title: t("onboarding.stepPickTitle"), text: `${t("onboarding.stepPickBody")} ${guideName} will suggest your next best tile.` },
        { icon: "📷", title: t("onboarding.stepScanTitle"), text: `${t("onboarding.stepScanBody")} Ask ${guideName} for hints any time.` }
    ];
}

function getReplayModes() {
    return [
        { title: "Daily Challenge", meta: "Complete the curated mission route." },
        { title: "Galaxy Theme Card", meta: "Play with a themed orbital target set." },
        { title: "Family Mode", meta: "Friendly, readable mission pacing." },
        { title: "Speed Run", meta: "Launch fast scans and beat the timer." },
        { title: "Streak Challenge", meta: "Maintain a clean 5+ signal streak." },
        { title: "Line Race", meta: "Finish one line before rival crews." },
        { title: "Room Battle", meta: "Compete live in a shared expedition." },
        { title: "Orbital Expedition", meta: "Progress through staged mission arcs." }
    ];
}

const GameManager = {
    setStatusMessage(message) {
        if (!DOM.statusMsg) return;
        DOM.statusMsg.innerHTML = message;
    },

    setElementHidden(element, hidden) {
        if (!element) return;
        element.classList.toggle("hidden", hidden);
    },

    updateLocaleUi() {
        if (!window.I18n) return;
        const locale = window.I18n.getLocale();
        gameState.settings.locale = locale;
        const direction = window.I18n.getDirection(locale);
        const pack = window.I18n.getLanguagePack(locale);
        document.documentElement.setAttribute("lang", locale);
        document.documentElement.setAttribute("dir", direction);
        if (DOM.localeSwitcher) {
            const supported = window.I18n.getSupportedLanguages();
            if (!DOM.localeSwitcher.options.length) {
                supported.forEach((lang) => {
                    const option = document.createElement("option");
                    option.value = lang.code;
                    option.textContent = `${lang.nativeName} / ${lang.englishName}`;
                    DOM.localeSwitcher.appendChild(option);
                });
            }
            DOM.localeSwitcher.value = locale;
            DOM.localeSwitcher.setAttribute("aria-label", t("accessibility.switchLanguage"));
            DOM.localeSwitcher.title = t("language.current", {
                language: getLanguageLabel(locale)
            });
        }
        if (DOM.roomLanguageChip) {
            DOM.roomLanguageChip.textContent = String(gameState.settings.roomLanguage || locale).toUpperCase();
            DOM.roomLanguageChip.title = t("language.roomLanguage");
        }
        this.applyStaticTranslations();
        const status = this.getTranslationStatusNode(pack.translationState);
        if (DOM.statusMsg && status) {
            DOM.statusMsg.prepend(status);
        }
    },

    applyStaticTranslations() {
        if (DOM.scanBtn) DOM.scanBtn.textContent = `📷 ${t("gameplay.scanButton")}`;
        if (DOM.resetBtn) DOM.resetBtn.textContent = `🔄 ${t("gameplay.resetButton")}`;
        if (DOM.closeSuccessModal) DOM.closeSuccessModal.textContent = t("scan.successContinue");
        if (DOM.helpBtn) DOM.helpBtn.textContent = t("scan.helpMe");
        if (DOM.roomCode) DOM.roomCode.textContent = t("gameplay.roomCode", { roomId: gameState.roomId });
    },

    getTranslationStatusNode(state) {
        if (!window.DesignSystem || typeof window.DesignSystem.TranslationBadge !== "function") return null;
        return window.DesignSystem.TranslationBadge({
            label: state === "complete" ? t("multiplayer.translatedBadge") : t("language.incomplete"),
            state
        });
    },

    setScanState(state, label, tone = "ar") {
        const overlay = DOM.scannerOverlay;
        if (overlay) {
            overlay.classList.remove(
                "scan-state-aiming",
                "scan-state-scanning",
                "scan-state-almost",
                "scan-state-recognized",
                "scan-state-success-burst",
                "scan-state-mystery-preview",
                "scan-state-hint-active",
                "scan-state-low-confidence"
            );
            if (state) overlay.classList.add(`scan-state-${state}`);
        }
        if (DOM.scanStatePill) {
            DOM.scanStatePill.className = `status-pill status-pill--${tone}`;
            DOM.scanStatePill.textContent = label;
        }
    },

    buildGuideContext(extra = {}) {
        return {
            selectedGuideId: gameState.settings.selectedGuideId || gameState.guide.activeGuideId,
            ageFriendlyMode: Boolean(gameState.settings.ageFriendlyMode),
            sessionType: gameState.settings.guideSessionType,
            userMode: gameState.settings.roomMode,
            museumTheme: currentTheme,
            difficulty: gameState.settings.difficultyMode,
            multiplayer: gameState.settings.roomMode === "multiplayer",
            energyPreference: gameState.settings.guideEnergy,
            ...extra
        };
    },

    getActiveGuide() {
        if (!window.GuideEngine || typeof window.GuideEngine.selectGuide !== "function") return null;
        const guide = window.GuideEngine.selectGuide(this.buildGuideContext());
        if (guide && guide.id !== gameState.guide.activeGuideId) {
            gameState.guide.activeGuideId = guide.id;
            gameState.settings.selectedGuideId = guide.id;
        }
        return guide;
    },

    setActiveGuide(guideId, reason = "manual") {
        if (!window.GuideEngine || typeof window.GuideEngine.pickGuideById !== "function") return;
        const selected = window.GuideEngine.pickGuideById(guideId);
        if (!selected) return;
        gameState.guide.activeGuideId = selected.id;
        gameState.settings.selectedGuideId = selected.id;
        saveSettings();
        this.renderGuideSurface();
        if (reason === "manual") {
            const line = this.emitGuideBeat("welcome", { nudge: `${selected.name} is ready to guide this run.` }, { force: true, speak: false });
            if (line) this.setStatusMessage(`🧭 ${line}`);
        }
    },

    emitGuideBeat(beat, context = {}, options = {}) {
        const guide = this.getActiveGuide();
        if (!guide || !window.GuideEngine || typeof window.GuideEngine.renderGuideLine !== "function") return "";
        const now = Date.now();
        const throttled = window.GuideEngine.shouldThrottleDialogue({
            beat,
            now,
            lastLineAt: gameState.guide.lastLineAt,
            lastBeat: gameState.guide.lastBeat,
            minGapMs: options.minGapMs || 2800
        });
        if (throttled && !options.force) return "";
        const text = window.GuideEngine.renderGuideLine({
            guide,
            beat,
            context: this.buildGuideContext(context),
            previousLine: gameState.guide.lastLine
        });
        if (!text) return "";
        gameState.guide.lastLine = text;
        gameState.guide.lastBeat = beat;
        gameState.guide.lastLineAt = now;
        gameState.guide.recentTips = [text, ...gameState.guide.recentTips].slice(0, 6);
        this.renderGuideSurface(beat, text);
        if (options.speak !== false && typeof speakText === "function") {
            speakText(`${guide.name}: ${text}`, 0.9);
        }
        return text;
    },

    getGuideSuggestion(snapshot) {
        if (!snapshot) return "Pick any tile to start your mission.";
        if (snapshot.hasFullCard) return "Open recap and capture your favorite discovery.";
        if (snapshot.nextBestTile) return `Try tile #${snapshot.nextBestTile}; it gives the best line pressure.`;
        if (snapshot.streak >= 3) return "Great streak. Keep scans steady to protect momentum.";
        return "Use one clue card and one clean scan to build progress.";
    },

    renderGuideSurface(beat = "encourage", line = "") {
        if (!window.DesignSystem) return;
        const guide = this.getActiveGuide();
        if (!guide) return;
        const renderedLine = line || gameState.guide.lastLine || guide.introLine;
        if (DOM.guideActiveCard) {
            DOM.guideActiveCard.innerHTML = "";
            DOM.guideActiveCard.appendChild(window.DesignSystem.GuideCard({
                name: guide.name,
                role: guide.expertiseFocus,
                text: renderedLine,
                emoji: guide.avatar,
                beat,
                tone: guide.voiceTone === "calm" ? "neutral" : "accent"
            }));
        }
        if (DOM.guideModePill) DOM.guideModePill.textContent = gameState.settings.guideSessionType.replaceAll("_", "-");
        if (DOM.guideActions) {
            DOM.guideActions.innerHTML = "";
            const row = window.DesignSystem.GuideActionRow({
                actions: [
                    { id: "help", label: "Help me scan" },
                    { id: "next", label: "Suggest next tile" },
                    { id: "tone", label: "Switch tone" },
                    { id: "auto", label: "Auto-pick guide" }
                ]
            });
            row.querySelectorAll("[data-action]").forEach((button) => {
                button.addEventListener("click", () => {
                    if (button.dataset.action === "help") {
                        const tip = this.emitGuideBeat("hint", { hintAction: "Move closer, reduce glare, and re-center." }, { force: true, speak: false });
                        if (tip) this.setStatusMessage(`🧭 ${tip}`);
                    } else if (button.dataset.action === "next") {
                        const snapshot = gameState.gamification ? gameState.gamification.getStateSnapshot() : null;
                        const suggestion = this.getGuideSuggestion(snapshot);
                        const tip = this.emitGuideBeat("focus", { nudge: suggestion, nextTile: snapshot && snapshot.nextBestTile }, { force: true, speak: false });
                        if (tip) this.setStatusMessage(`🧭 ${tip}`);
                    } else if (button.dataset.action === "tone") {
                        gameState.settings.guideEnergy = gameState.settings.guideEnergy === "calm" ? "energetic" : "calm";
                        if (DOM.guideEnergy) DOM.guideEnergy.value = gameState.settings.guideEnergy;
                        saveSettings();
                        this.emitGuideBeat("ask", {}, { force: true, speak: false });
                    } else if (button.dataset.action === "auto") {
                        if (window.GuideEngine && typeof window.GuideEngine.selectGuide === "function") {
                            const autoGuide = window.GuideEngine.selectGuide(this.buildGuideContext({ selectedGuideId: undefined }));
                            if (autoGuide) this.setActiveGuide(autoGuide.id, "auto");
                        }
                    }
                });
            });
            DOM.guideActions.appendChild(row);
        }
        if (DOM.guidePickerWrap && window.GuideEngine && Array.isArray(window.GuideEngine.GUIDE_CAST)) {
            DOM.guidePickerWrap.innerHTML = "";
            const picker = window.DesignSystem.GuidePicker({
                guides: window.GuideEngine.GUIDE_CAST,
                selectedGuideId: guide.id
            });
            picker.querySelectorAll(".guide-picker__chip").forEach((chip) => {
                chip.addEventListener("click", () => this.setActiveGuide(chip.dataset.guideId || "", "manual"));
            });
            DOM.guidePickerWrap.appendChild(picker);
        }
    },

    getArtifactStory(item) {
        const themeDefaults = themeLore[currentTheme] || themeLore.art;
        const byName = artifactLoreByName[item && item.name] || {};
        return {
            era: item && item.era ? item.era : (byName.era || themeDefaults.era),
            origin: item && item.origin ? item.origin : (byName.origin || themeDefaults.origin),
            material: item && item.material ? item.material : (byName.material || themeDefaults.material),
            category: item && item.category ? item.category : (byName.category || themeDefaults.category)
        };
    },

    getLocalizedArtifact(item) {
        if (!item) return { title: "", details: "", translationState: "missing" };
        if (!window.ContentLocalization || typeof window.ContentLocalization.getLocalizedArtifactContent !== "function") {
            return { title: item.name || "Artifact", details: item.fact || "", translationState: "missing" };
        }
        const locale = window.I18n && window.I18n.getLocale ? window.I18n.getLocale() : "en";
        const localized = window.ContentLocalization.getLocalizedArtifactContent(item, locale);
        const details = this.getArtifactStory(item);
        const content = localized.content || {};
        const summary = `${content.shortExplanation || item.fact || ""} ${content.lookClosely || ""}`.trim();
        const contextNote = `${content.whyItMatters || ""}`.trim();
        return {
            title: content.title || item.name || "Artifact",
            details: [summary, contextNote, `${details.era} · ${details.origin}`].filter(Boolean).join(" "),
            glossary: content.glossaryTerm || "",
            translationState: localized.translationState || "missing"
        };
    },

    getSpaceMissionContext(item) {
        const details = this.getArtifactStory(item);
        const zoneByTheme = {
            art: "Nebula Gallery",
            history: "Asteroid Archive",
            science: "Orbital Lab"
        };
        return {
            zone: zoneByTheme[currentTheme] || "Deep Space Gallery",
            category: details.category,
            signal: details.material
        };
    },

    getScanFallbackState(confidence) {
        if (confidence >= 65) {
            return {
                state: "almost",
                label: t("scan.almostRecognized"),
                tone: "accent",
                guidance: t("scan.guidanceAlmost"),
                statusMessage: t("scan.guidanceAlmost")
            };
        }
        if (confidence >= 50) {
            return {
                state: "low-confidence",
                label: t("scan.guidanceMoveCloser"),
                tone: "warning",
                guidance: t("scan.guidanceMoveCloser"),
                statusMessage: t("scan.guidanceMoveCloser")
            };
        }
        if (confidence >= 30) {
            return {
                state: "low-confidence",
                label: t("scan.guidanceGlare"),
                tone: "danger",
                guidance: t("scan.guidanceGlare"),
                statusMessage: t("scan.guidanceGlare")
            };
        }
        if (confidence >= 15) {
            return {
                state: "low-confidence",
                label: t("scan.guidanceTryAngle"),
                tone: "danger",
                guidance: t("scan.guidanceTryAngle"),
                statusMessage: t("scan.guidanceTryAngle")
            };
        }
        return {
            state: "low-confidence",
            label: t("scan.guidanceNoMatch"),
            tone: "danger",
            guidance: t("scan.guidanceNoMatch"),
            statusMessage: t("scan.guidanceNoMatch")
        };
    },

    renderCelebrationBanner(snapshot) {
        if (!DOM.boardCelebrationBanner || !window.DesignSystem) return;
        const hasFullCard = Boolean(snapshot.hasFullCard);
        const lines = Number(snapshot.bingoLines.length || 0);
        const streak = Number(snapshot.streak || 0);
        DOM.boardCelebrationBanner.innerHTML = "";
        if (!hasFullCard && lines < 1 && streak < 3) {
            DOM.boardCelebrationBanner.classList.add("hidden");
            return;
        }
        DOM.boardCelebrationBanner.classList.remove("hidden");
        let title = "Momentum building";
        let text = "Keep scanning to lock your next line.";
        if (lines >= 1) {
            title = lines >= 2 ? "Multiple lines complete" : "Line complete";
            text = "You are in striking distance of bingo.";
        }
        if (hasFullCard) {
            title = "Full card complete";
            text = "Every tile is confirmed. Enjoy your victory recap.";
        } else if (streak >= 5) {
            title = "Streak fire";
            text = `Streak ${streak}. Keep the rhythm for bonus points.`;
        }
        const banner = window.DesignSystem.CelebrationBanner({ title, text, tone: hasFullCard ? "success" : "warning" });
        DOM.boardCelebrationBanner.appendChild(banner);
    },

    getLineInsights(snapshot) {
        const size = gameState.settings.cardSize;
        const completedTiles = new Set(snapshot.completedTiles || []);
        const patterns = window.BingoRules ? window.BingoRules.computeWinPatterns(size) : [];
        const lineCompleteTiles = new Set();
        const lineNearTiles = new Set();
        const oneAwayTiles = new Set();
        patterns.forEach((pattern) => {
            const matchedCount = pattern.filter((tileId) => completedTiles.has(tileId)).length;
            if (matchedCount === pattern.length) {
                pattern.forEach((tileId) => lineCompleteTiles.add(tileId));
                return;
            }
            if (matchedCount === pattern.length - 1) {
                pattern.forEach((tileId) => {
                    if (!completedTiles.has(tileId)) oneAwayTiles.add(tileId);
                    else lineNearTiles.add(tileId);
                });
            }
        });
        return { lineCompleteTiles, lineNearTiles, oneAwayTiles };
    },

    getGamificationStorageKey() {
        return `museumBingoGamification_${gameState.currentUser.uid}`;
    },

    loadGamificationState() {
        try {
            return JSON.parse(localStorage.getItem(this.getGamificationStorageKey()) || "{}");
        } catch (err) {
            console.warn("Failed to parse gamification state:", err);
            return {};
        }
    },

    persistGamificationState() {
        if (!gameState.gamification) return;
        try {
            localStorage.setItem(this.getGamificationStorageKey(), JSON.stringify(gameState.gamification.persistableState()));
        } catch (err) {
            console.warn("Failed to persist gamification state:", err);
        }
    },

    initGamification() {
        const engineFactory = window.GamificationEngine && window.GamificationEngine.createGamificationEngine;
        const syncFactory = window.GamificationSync && window.GamificationSync.createGamificationSyncService;
        if (typeof engineFactory !== "function" || typeof syncFactory !== "function") {
            console.warn("Gamification modules unavailable.");
            return;
        }
        gameState.subscriptions.forEach((unsub) => {
            if (typeof unsub === "function") unsub();
        });
        gameState.subscriptions = [];

        gameState.syncService = syncFactory({ roomId: gameState.roomId });
        const seasonId = gameState.settings.activeSeasonId
            || `season_${new Date().getUTCFullYear()}_q${Math.floor(new Date().getUTCMonth() / 3) + 1}`;
        gameState.gamification = engineFactory({
            userId: gameState.currentUser.uid,
            playerName: gameState.currentUser.displayName,
            roomId: gameState.roomId,
            museumId: currentTheme,
            gridSize: gameState.settings.cardSize,
            difficultyMode: gameState.settings.difficultyMode,
            roomMode: gameState.settings.roomMode,
            dailyChallengeEnabled: gameState.settings.dailyChallengeEnabled,
            seasonId,
            scoring: { deductHintUsage: false, hintDeductionPoints: 5 }
        });
        gameState.gamification.hydrate(this.loadGamificationState());

        const engineUnsub = gameState.gamification.on((eventName, payload) => {
            if (eventName === "event" && gameState.syncService) {
                gameState.syncService.persistEvent(payload);
            }
            this.persistGamificationState();
            this.renderGamification();
        });

        const roomUnsub = gameState.syncService.subscribeToRoomUpdates((entries) => {
            if (!gameState.gamification) return;
            gameState.gamification.applyLeaderboard(entries);
            this.loadLeaderboard();
            if (gameState.gamification.getStateSnapshot().rankDelta > 0) {
                this.showRankMovement(gameState.gamification.getStateSnapshot().rankDelta);
            }
        });

        gameState.subscriptions.push(engineUnsub, roomUnsub);
        gameState.gamification.onRoomJoined({ roomId: gameState.roomId });
        this.syncRoomScore();
        this.renderGamification();
    },

    syncRoomScore() {
        if (!gameState.gamification || !gameState.syncService) return;
        const entry = gameState.gamification.getRoomEntry();
        const mergedEntry = {
            ...entry,
            points: Number(entry.points || 0) + Number(gameState.winLadderBonusPoints || 0),
            locale: gameState.settings.locale,
            roomLanguage: gameState.settings.roomLanguage
        };
        const entries = gameState.syncService.updateRoomEntry(mergedEntry);
        gameState.gamification.applyLeaderboard(entries);
    },

    renderGamification() {
        if (!gameState.gamification) return;
        const snapshot = gameState.gamification.getStateSnapshot();
        const ratio = gameState.gamification.getProgressRatio();
        const totalTiles = gameState.settings.cardSize * gameState.settings.cardSize;
        const displayPoints = Number(snapshot.points || 0) + Number(gameState.winLadderBonusPoints || 0);
        if (DOM.pointsTotal) DOM.pointsTotal.textContent = String(displayPoints);
        if (DOM.currentStreak) DOM.currentStreak.textContent = String(snapshot.streak);
        if (DOM.tilesProgress) DOM.tilesProgress.textContent = `${snapshot.completedTiles.length}/${totalTiles}`;
        if (DOM.bingoProgressFill) DOM.bingoProgressFill.style.width = `${Math.round(ratio * 100)}%`;
        if (DOM.bingoLinesCount) DOM.bingoLinesCount.textContent = String(snapshot.bingoLines.length);
        if (DOM.cardStatusLabel) DOM.cardStatusLabel.textContent = String(snapshot.completionState || "no_line").replaceAll("_", " ").toUpperCase();
        const daily = gameState.gamification.getDailyProgress();
        if (DOM.dailyChallengeProgress) {
            DOM.dailyChallengeProgress.textContent = daily.challengeCompleted
                ? `Complete! +200 bonus ready`
                : `${daily.completed}/${totalTiles} complete`;
        }
        if (DOM.roomCode) DOM.roomCode.textContent = t("gameplay.roomCode", { roomId: gameState.roomId });
        if (DOM.activePlayerName) DOM.activePlayerName.textContent = gameState.currentUser.displayName;
        if (DOM.nextBestTile) {
            DOM.nextBestTile.textContent = snapshot.nextBestTile
                ? t("gameplay.nextBestOne", { tile: snapshot.nextBestTile })
                : t("gameplay.nextBestAny");
        }
        this.renderBoardProgress(snapshot, ratio);
        this.renderCelebrationBanner(snapshot);
        this.renderObjectiveSurface();
        this.renderClueDeck();
        this.renderGoalCards(snapshot);
        this.renderReplayModeCards();
        this.renderBadgePreviews(snapshot.badges, snapshot.nftTokens);
        this.renderBadgeGallery(snapshot.badges, snapshot.nftTokens);
        this.renderProfileStats(snapshot);
        this.updateBoardTileStates(snapshot);
        this.loadLeaderboard();
        this.renderRoomStatus(snapshot);
        this.renderGuideSurface();
    },

    updateBoardTileStates(snapshot) {
        if (!snapshot || !Array.isArray(snapshot.tileStates)) return;
        const stateByTile = new Map(snapshot.tileStates.map((tile) => [Number(tile.tileId), tile.state]));
        const completedTiles = new Set(snapshot.completedTiles || []);
        const lineInsights = this.getLineInsights(snapshot);
        const isFullCard = Boolean(snapshot.hasFullCard);
        document.querySelectorAll(".cell").forEach((cell) => {
            const tileId = Number(cell.dataset.tileIndex);
            const state = stateByTile.get(tileId) || "locked";
            cell.dataset.state = state;
            cell.classList.toggle("found", state === "matched");
            cell.classList.toggle("state-bonus", state === "bonus");
            cell.classList.toggle("state-confirmed", state === "matched");
            cell.classList.toggle("state-one-away", lineInsights.oneAwayTiles.has(tileId));
            cell.classList.toggle("state-line-complete", lineInsights.lineCompleteTiles.has(tileId));
            cell.classList.toggle("state-line-near", lineInsights.lineNearTiles.has(tileId));
            cell.classList.toggle("state-full-card", isFullCard && completedTiles.has(tileId));
        });
    },

    renderBoardProgress(snapshot, ratio) {
        if (!window.DesignSystem) return;
        const totalTiles = gameState.settings.cardSize * gameState.settings.cardSize;
        const completedTiles = Number(snapshot.completedTiles.length || 0);
        const lineCount = Number(snapshot.bingoLines.length || 0);
        const tone = snapshot.hasFullCard ? "success" : (lineCount > 0 ? "warning" : "neutral");
        if (DOM.totalProgressWrap) {
            DOM.totalProgressWrap.innerHTML = "";
            const bar = window.DesignSystem.ProgressBar({
                label: `${completedTiles}/${totalTiles} tiles`,
                value: completedTiles,
                max: totalTiles,
                tone: snapshot.hasFullCard ? "success" : "warning"
            });
            DOM.totalProgressWrap.appendChild(bar);
        }
        if (DOM.boardStatusPill) {
            DOM.boardStatusPill.className = `status-pill status-pill--${tone}`;
            DOM.boardStatusPill.textContent = String(snapshot.completionState || "no_line").replaceAll("_", " ");
        }
        if (DOM.lineProgressCount) DOM.lineProgressCount.textContent = String(lineCount);
        if (DOM.streakIndicator) DOM.streakIndicator.textContent = String(snapshot.streak || 0);
        if (DOM.nextObjective) {
            const distanceToCompletion = Math.max(0, totalTiles - completedTiles);
            const objective = snapshot.hasFullCard
                ? t("gameplay.objectiveDone")
                : snapshot.nextBestTile
                    ? t("gameplay.objectiveLock", { tile: snapshot.nextBestTile, remaining: distanceToCompletion })
                    : t("gameplay.objectiveStart", { remaining: distanceToCompletion });
            DOM.nextObjective.textContent = objective;
        }
        if (DOM.roomProgressFill) DOM.roomProgressFill.style.width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
        if (DOM.roomProgressValue) DOM.roomProgressValue.textContent = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
        if (snapshot.hasFullCard) {
            this.emitGuideBeat("celebrate", { nudge: "Full card complete. Open your victory recap." }, { speak: false, minGapMs: 6000 });
        } else if (snapshot.nextBestTile) {
            const oneAway = lineCount > 0 ? "You are one-away on at least one line." : "Build your first line.";
            this.emitGuideBeat("focus", { nextTile: snapshot.nextBestTile, rowHint: oneAway }, { speak: false, minGapMs: 5200 });
        }
    },

    renderBadgePreviews(badges, tokens = []) {
        if (!DOM.badgePreviewList) return;
        DOM.badgePreviewList.innerHTML = "";
        const timeline = [
            ...(Array.isArray(badges) ? badges.map((badge) => ({ ...badge, collectibleType: "badge" })) : []),
            ...(Array.isArray(tokens) ? tokens.map((token) => ({ ...token, collectibleType: "token" })) : [])
        ].sort((a, b) => new Date(b.earnedAt || 0).getTime() - new Date(a.earnedAt || 0).getTime());
        if (!timeline.length) {
            DOM.badgePreviewList.innerHTML = `<span class="text-xs text-amber-100">${t("scan.scanning")}</span>`;
            return;
        }
        timeline.slice(0, 6).forEach((collectible) => {
            const normalized = collectible.collectibleType === "badge" && window.WinBadges && typeof window.WinBadges.localizeBadgeDefinition === "function"
                ? window.WinBadges.localizeBadgeDefinition(collectible, gameState.settings.locale)
                : collectible;
            const prefix = collectible.collectibleType === "token" ? "NFT" : "Badge";
            const badgeEl = document.createElement("div");
            badgeEl.className = "glass-badge bg-white/5 text-amber-100";
            badgeEl.textContent = `${normalized.icon} ${normalized.name} · ${prefix}`;
            DOM.badgePreviewList.appendChild(badgeEl);
        });
    },

    renderBadgeGallery(badges, tokens = []) {
        if (!DOM.badgeGallery) return;
        DOM.badgeGallery.innerHTML = "";
        const badgeDefs = (window.WinBadges && Array.isArray(window.WinBadges.BADGES)) ? window.WinBadges.BADGES : [];
        const tokenDefs = (window.GamificationEngine && Array.isArray(window.GamificationEngine.TOKEN_DEFINITIONS))
            ? window.GamificationEngine.TOKEN_DEFINITIONS
            : [];
        const earnedBadges = new Map((badges || []).map((badge) => [badge.id, badge]));
        const earnedTokens = new Map((tokens || []).map((token) => [token.id, token]));
        const badgeSource = badgeDefs.length ? badgeDefs : (badges || []);
        const seasonalTokenSource = Array.from(earnedTokens.values()).filter((token) => !tokenDefs.some((def) => def.id === token.id));
        const tokenSource = [...tokenDefs, ...seasonalTokenSource];
        if (!badgeSource.length && !tokenSource.length) {
            DOM.badgeGallery.innerHTML = '<div class="goal-card"><p class="goal-card__title">No badges yet</p><p class="goal-card__meta">Complete scans to unlock your shelf.</p></div>';
            return;
        }
        const gallerySource = [
            ...badgeSource.slice(0, 9).map((def) => ({ ...def, collectibleType: "badge" })),
            ...tokenSource.slice(0, 6).map((def) => ({ ...def, collectibleType: "token" }))
        ];
        gallerySource.forEach((entry) => {
            const localizedBadge = entry.collectibleType === "badge" && window.WinBadges && typeof window.WinBadges.localizeBadgeDefinition === "function"
                ? window.WinBadges.localizeBadgeDefinition(entry, gameState.settings.locale)
                : entry;
            const icon = localizedBadge.icon && localizedBadge.icon.length <= 2 ? localizedBadge.icon : "🏅";
            const title = localizedBadge.name || entry.name || entry.id || "Collectible";
            const rarity = entry.rarity || "common";
            const unlocked = entry.collectibleType === "badge" ? earnedBadges.has(entry.id) : earnedTokens.has(entry.id);
            const earnedCollectible = entry.collectibleType === "badge" ? earnedBadges.get(entry.id) : earnedTokens.get(entry.id);
            const unlockedAt = earnedCollectible && earnedCollectible.earnedAt
                ? new Date(earnedCollectible.earnedAt).toLocaleDateString()
                : "";
            const utilityTag = entry.collectibleType === "token" && entry.utility ? ` • ${entry.utility}` : "";
            const typeLabel = entry.collectibleType === "token" ? "NFT" : "Badge";
            const node = window.DesignSystem && window.DesignSystem.BadgeIcon
                ? window.DesignSystem.BadgeIcon({
                    icon,
                    rarity,
                    label: `${typeLabel} · ${title}${unlockedAt ? ` • ${unlockedAt}` : ""}${unlocked ? utilityTag : " (locked)"}`
                })
                : document.createElement("div");
            if (!unlocked) node.style.opacity = "0.55";
            DOM.badgeGallery.appendChild(node);
        });
        if (DOM.badgeCountPill) {
            DOM.badgeCountPill.textContent = `${earnedBadges.size} badges · ${earnedTokens.size} NFTs`;
        }
        if (DOM.badgePreviewList && window.DesignSystem && window.DesignSystem.ProgressBar) {
            const progressWrap = document.createElement("div");
            progressWrap.className = "w-full";
            const unlockedTotal = earnedBadges.size + earnedTokens.size;
            const maxTotal = Math.max(1, badgeSource.length + tokenSource.length);
            progressWrap.appendChild(window.DesignSystem.ProgressBar({
                label: "Reward progress",
                value: unlockedTotal,
                max: maxTotal,
                tone: unlockedTotal >= 5 ? "success" : "accent",
                compact: true
            }));
            DOM.badgePreviewList.appendChild(progressWrap);
        }
    },

    renderGoalCards(snapshot) {
        if (!DOM.goalCards) return;
        const completedTiles = Number(snapshot.completedTiles.length || 0);
        const totalTiles = gameState.settings.cardSize * gameState.settings.cardSize;
        const lineCount = Number(snapshot.bingoLines.length || 0);
        const streak = Number(snapshot.streak || 0);
        const hasHintFreeRun = Boolean(snapshot.scansWithHint === 0);
        const goals = [
            {
                title: "Finish one line",
                progress: lineCount > 0 ? "Done" : "In progress"
            },
            {
                title: "Keep a five-scan streak",
                progress: `${Math.min(5, streak)}/5`
            },
            {
                title: "Beat your last score",
                progress: `${snapshot.points} pts this round`
            },
            {
                title: "Complete full card",
                progress: `${completedTiles}/${totalTiles}`
            },
            {
                title: "Complete card with no hints",
                progress: hasHintFreeRun ? "On track" : "Hints used"
            },
            {
                title: "Discover a rare target",
                progress: snapshot.lastRarityHit ? snapshot.lastRarityHit : "Hunt active"
            }
        ];
        DOM.goalCards.innerHTML = goals.map((goal) => `
            <div class="goal-card">
                <p class="goal-card__title">${goal.title}</p>
                <p class="goal-card__meta">${goal.progress}</p>
            </div>
        `).join("");
    },

    renderReplayModeCards() {
        if (!DOM.replayModeCards) return;
        const replayModes = getReplayModes();
        DOM.replayModeCards.innerHTML = replayModes.map((mode) => `
            <div class="replay-card">
                <p class="replay-card__title">${mode.title}</p>
                <p class="replay-card__meta">${mode.meta}</p>
            </div>
        `).join("");
    },

    renderProfileStats(snapshot) {
        const lifetimeBadges = Number(snapshot.lifetime.badges.length || 0);
        const lifetimeTokens = Number(snapshot.lifetime.nftTokens && snapshot.lifetime.nftTokens.length || 0);
        if (DOM.lifetimeBadges) DOM.lifetimeBadges.textContent = String(lifetimeBadges + lifetimeTokens);
        if (DOM.totalMuseums) DOM.totalMuseums.textContent = String(snapshot.lifetime.totalMuseumsCompleted || 0);
        if (DOM.totalScans) DOM.totalScans.textContent = String(snapshot.lifetime.totalScans || 0);
        if (DOM.bestStreak) DOM.bestStreak.textContent = String(snapshot.lifetime.bestStreak || 0);
        if (DOM.totalBingos) DOM.totalBingos.textContent = String(snapshot.lifetime.totalBingos || 0);
        this.renderActivityFeed(snapshot.lifetime.recentActivity || []);
    },

    renderActivityFeed(events) {
        if (!DOM.activityFeed) return;
        DOM.activityFeed.innerHTML = "";
        if (!events.length) {
            DOM.activityFeed.innerHTML = '<div class="text-xs text-amber-100">No activity yet. Start scanning!</div>';
            return;
        }
        events.slice(0, 8).forEach((event) => {
            const item = document.createElement("div");
            item.className = "glass-card bg-white/5 p-2 text-xs text-amber-100";
            const guide = this.getActiveGuide();
            const typeLabel = String(event.type || "activity").replaceAll("_", " ");
            const readable = typeLabel === "tile_validated"
                ? "Discovery confirmed"
                : typeLabel === "line_completed"
                    ? "Orbital line completed"
                    : typeLabel === "bingo_complete"
                        ? "Mission bingo complete"
                        : typeLabel;
            item.textContent = `${guide ? `${guide.name}: ` : ""}${readable} • ${new Date(event.timestamp).toLocaleTimeString()}`;
            DOM.activityFeed.appendChild(item);
        });
    },

    showScanSuccessModal(item, scoringResult) {
        if (!DOM.successModal) return;
        DOM.successModal.classList.remove("success-line", "success-bingo", "success-full-card");
        const details = this.getArtifactStory(item);
        const mission = this.getSpaceMissionContext(item);
        const localizedArtifact = this.getLocalizedArtifact(item);
        if (DOM.successArtwork) DOM.successArtwork.textContent = localizedArtifact.title || item.name;
        if (DOM.successArtist) DOM.successArtist.textContent = `${mission.zone} • ${details.era}`;
        if (DOM.successPoints) DOM.successPoints.textContent = `+${scoringResult.pointsEarned}`;
        if (DOM.successStreakBonus) DOM.successStreakBonus.textContent = `+${scoringResult.streakBonus}`;
        const isBonusArtifact = item.category === "Bonus artifact" || item.rarity === "rare" || item.rarity === "legendary";
        let variant = "Discovery confirmed";
        let rewardLine = `Signal locked • ${details.category} • ${details.material}`;
        let guideBeat = "celebrate";
        if (scoringResult.fullCardBonus > 0) {
            variant = "Mission board completed";
            rewardLine = "All orbital slots docked. Commander recap unlocked.";
            DOM.successModal.classList.add("success-full-card");
            guideBeat = "recap";
        } else if (scoringResult.completionState === "blackout" || scoringResult.hasFullCard) {
            variant = "Bingo trajectory complete";
            rewardLine = "Mission bingo reached. Recap and rewards are ready.";
            DOM.successModal.classList.add("success-bingo");
            guideBeat = "celebrate";
        } else if (scoringResult.firstLineBonus > 0) {
            variant = "Orbital line completed";
            rewardLine = "Docking line secured. You are closing in on mission bingo.";
            DOM.successModal.classList.add("success-line");
            guideBeat = "focus";
        } else if (isBonusArtifact) {
            variant = "Bonus discovery";
            rewardLine = `Rare signal acquired in ${mission.zone}. ${details.material} from ${details.origin}.`;
            guideBeat = "celebrate";
        } else if ((scoringResult.streak || 0) >= 3) {
            variant = "Streak maintained";
            rewardLine = `Signal chain x${scoringResult.streak}. Keep momentum for bigger rewards.`;
            guideBeat = "encourage";
        }
        const guideLine = this.emitGuideBeat(guideBeat, {
            itemName: item.name,
            nudge: item.fact,
            rowHint: scoringResult.nextBestTile ? `Try tile #${scoringResult.nextBestTile} next.` : ""
        }, { force: true, speak: false });
        if (guideLine) {
            rewardLine = `${guideLine} ${item.fact}`;
        }
        if (DOM.successVariant) DOM.successVariant.textContent = variant;
        if (DOM.successRewardLine) DOM.successRewardLine.textContent = rewardLine;
        if (DOM.successBadge) {
            const firstToken = scoringResult.unlockedTokens && scoringResult.unlockedTokens[0];
            const firstBadge = scoringResult.unlockedBadges && scoringResult.unlockedBadges[0];
            if (firstToken) {
                DOM.successBadge.classList.remove("hidden");
                DOM.successBadge.innerHTML = `<p class="text-xs text-amber-200">NFT TOKEN UNLOCKED</p><p class="text-amber-100 font-bold">${firstToken.icon || "🪙"} ${firstToken.name}</p><p class="text-[11px] text-cyan-200">${firstToken.utility || "Collectible ready to display."}</p>`;
                if (DOM.successVariant) DOM.successVariant.textContent = "NFT collectible unlocked";
            } else if (firstBadge) {
                DOM.successBadge.classList.remove("hidden");
                DOM.successBadge.innerHTML = `<p class="text-xs text-amber-200">BADGE UNLOCKED</p><p class="text-amber-100 font-bold">${firstBadge.icon} ${firstBadge.name}</p>`;
                if (DOM.successVariant) DOM.successVariant.textContent = "Badge unlocked";
            } else {
                DOM.successBadge.classList.add("hidden");
                DOM.successBadge.innerHTML = "";
            }
        }
        DOM.successModal.classList.remove("hidden");
    },

    hideScanSuccessModal() {
        if (!DOM.successModal) return;
        DOM.successModal.classList.add("hidden");
        DOM.successModal.classList.remove("success-line", "success-bingo", "success-full-card");
    },

    showBadgeToast(badge) {
        if (!DOM.badgeToast || !badge) return;
        const localizedBadge = window.WinBadges && typeof window.WinBadges.localizeBadgeDefinition === "function"
            ? window.WinBadges.localizeBadgeDefinition(badge, gameState.settings.locale)
            : badge;
        const guide = this.getActiveGuide();
        const earnedLine = guide ? `${guide.name}: You earned this because your recent scans were consistent.` : "You earned this badge.";
        DOM.badgeToast.innerHTML = `<p class="text-xs text-amber-200">${t("rewards.newBadge")}</p><p class="font-bold text-amber-100">${localizedBadge.icon} ${localizedBadge.name}</p><p class="text-[11px] text-amber-200">${localizedBadge.description}</p><p class="text-[11px] text-cyan-200 mt-1">${earnedLine}</p>`;
        DOM.badgeToast.classList.remove("hidden");
        this.createParticles(window.innerWidth - 80, 120, "#fbbf24", 15);
        setTimeout(() => DOM.badgeToast.classList.add("hidden"), 2600);
    },

    showTokenToast(token) {
        if (!DOM.badgeToast || !token) return;
        const utilityLine = token.utility || "Collectible ready in your profile gallery.";
        DOM.badgeToast.innerHTML = `<p class="text-xs text-amber-200">New NFT collectible</p><p class="font-bold text-amber-100">${token.icon || "🪙"} ${token.name}</p><p class="text-[11px] text-amber-200">${token.description || ""}</p><p class="text-[11px] text-cyan-200 mt-1">${utilityLine}</p>`;
        DOM.badgeToast.classList.remove("hidden");
        this.createParticles(window.innerWidth - 80, 120, "#22d3ee", 18);
        setTimeout(() => DOM.badgeToast.classList.add("hidden"), 3000);
    },

    showRankMovement(rankDelta) {
        if (!DOM.rankMoveBanner || rankDelta <= 0) return;
        DOM.rankMoveBanner.textContent = `⬆️ Rank up! +${rankDelta} positions`;
        DOM.rankMoveBanner.classList.remove("hidden");
        setTimeout(() => DOM.rankMoveBanner.classList.add("hidden"), 1800);
    },

    triggerWinHaptics(haptic) {
        if (!gameState.settings.vibrationEnabled || !navigator.vibrate) return;
        if (haptic === "heavy") navigator.vibrate([60, 30, 60]);
        else if (haptic === "medium") navigator.vibrate([40, 20, 40]);
        else if (haptic === "light") navigator.vibrate(25);
    },

    triggerWinSound(sound) {
        if (!gameState.settings.soundEnabled) return;
        if (sound === "fanfare") playGameSound("levelUp");
        else if (sound === "ding" || sound === "pop") playGameSound("found");
        else playGameSound("click");
    },

    triggerWinConfetti(confetti) {
        if (confetti === "none") return;
        const count = confetti === "big" ? 45 : 20;
        this.createParticles(window.innerWidth / 2, window.innerHeight / 2, "#fbbf24", count);
    },

    pushWinEvents(result, context) {
        if (!result || !Array.isArray(result.events) || !result.events.length) return;
        gameState.winLadderEvents = [...result.events, ...gameState.winLadderEvents].slice(0, 120);
        if (!gameState.syncService) return;
        gameState.syncService.persistEvent({
            type: "win_event",
            sessionId: context.sessionId,
            roomId: context.roomId,
            userId: context.userId,
            events: result.events,
            scoreDelta: result.reward.points,
            progress: context.progress,
            timestamp: new Date().toISOString()
        });
    },

    buildOptimisticWinRuleContext({ snapshotBefore, tileIndex, usedHint }) {
        const rules = window.BingoRules;
        const totalTiles = gameState.settings.cardSize * gameState.settings.cardSize;
        const linesBefore = snapshotBefore && Array.isArray(snapshotBefore.bingoLines) ? snapshotBefore.bingoLines.length : 0;
        const calc = rules && typeof rules.calculateScoreAfterValidation === "function"
            ? rules.calculateScoreAfterValidation({
                completedTilesBefore: snapshotBefore && snapshotBefore.completedTiles ? snapshotBefore.completedTiles : [],
                tileId: Number(tileIndex),
                gridSize: gameState.settings.cardSize,
                streakBefore: Number(snapshotBefore && snapshotBefore.streak) || 0,
                usedHint: Boolean(usedHint),
                hasFullCardBefore: Boolean(snapshotBefore && snapshotBefore.hasFullCard),
                difficultyMode: gameState.settings.difficultyMode
            })
            : null;
        const linesAfter = calc && Array.isArray(calc.linesAfter) ? calc.linesAfter.length : linesBefore;
        const tilesFound = calc && Array.isArray(calc.completedTilesAfter)
            ? calc.completedTilesAfter.length
            : ((snapshotBefore && Array.isArray(snapshotBefore.completedTiles) ? snapshotBefore.completedTiles.length : 0) + 1);
        const bingoComplete = Boolean(calc && calc.completionState === "blackout");
        return {
            tileMatched: true,
            tileConfirmed: true,
            tileId: String(tileIndex),
            roomId: gameState.roomId,
            streak: calc ? Number(calc.streakAfter) : (Number(snapshotBefore && snapshotBefore.streak) || 0) + 1,
            bestStreak: Math.max(
                Number(snapshotBefore && snapshotBefore.bestSessionStreak) || 0,
                calc ? Number(calc.streakAfter) : (Number(snapshotBefore && snapshotBefore.streak) || 0) + 1
            ),
            newLinesCompleted: Math.max(0, linesAfter - linesBefore),
            totalLinesCompleted: linesAfter,
            tilesFound,
            tilesTotal: totalTiles,
            bingoComplete,
            roomVictory: Boolean(snapshotBefore && snapshotBefore.rank === 1 && bingoComplete),
            dailyChallengeComplete: Boolean(snapshotBefore && snapshotBefore.daily && snapshotBefore.daily.challengeCompleted),
            sessionComplete: bingoComplete,
            scoreBefore: Number(snapshotBefore && snapshotBefore.points) || 0,
            scoreAfter: (Number(snapshotBefore && snapshotBefore.points) || 0) + Number(calc && calc.score ? calc.score.pointsEarned : 0),
            roomRank: Number(snapshotBefore && snapshotBefore.rank) || undefined
        };
    },

    enrichWinContextAfterValidation(ctx, { snapshotAfter, scoreResult }) {
        const enriched = { ...ctx };
        if (snapshotAfter) {
            const linesAfter = Array.isArray(snapshotAfter.bingoLines) ? snapshotAfter.bingoLines.length : enriched.totalLinesCompleted;
            enriched.streak = Number(snapshotAfter.streak) || enriched.streak;
            enriched.bestStreak = Number(snapshotAfter.bestSessionStreak) || enriched.bestStreak;
            enriched.totalLinesCompleted = linesAfter;
            enriched.tilesFound = Array.isArray(snapshotAfter.completedTiles) ? snapshotAfter.completedTiles.length : enriched.tilesFound;
            enriched.bingoComplete = Boolean(snapshotAfter.hasFullCard || snapshotAfter.completionState === "blackout");
            enriched.roomVictory = Boolean(snapshotAfter.rank === 1 && enriched.bingoComplete);
            enriched.dailyChallengeComplete = Boolean(snapshotAfter.daily && snapshotAfter.daily.challengeCompleted);
            enriched.sessionComplete = enriched.bingoComplete;
            enriched.scoreAfter = Number(snapshotAfter.points) || enriched.scoreAfter;
            enriched.roomRank = Number(snapshotAfter.rank) || enriched.roomRank;
        }
        if (scoreResult && Array.isArray(scoreResult.unlockedBadges) && scoreResult.unlockedBadges[0]) {
            enriched.badgeUnlockedId = scoreResult.unlockedBadges[0].id;
        }
        if (scoreResult && Array.isArray(scoreResult.unlockedTokens) && scoreResult.unlockedTokens[0]) {
            enriched.tokenUnlockedId = scoreResult.unlockedTokens[0].id;
        }
        return enriched;
    },

    evaluateAndApplyWinLadder(ctx) {
        if (!window.WinRulesLadder || typeof window.WinRulesLadder.evaluateWinRules !== "function") {
            return null;
        }
        const result = window.WinRulesLadder.evaluateWinRules(ctx);
        gameState.winLadderBonusPoints += Number(result.reward.points || 0);
        gameState.lastWinStates = Array.isArray(result.states) ? result.states : [];
        this.triggerWinHaptics(result.reward.haptic);
        this.triggerWinSound(result.reward.sound);
        this.triggerWinConfetti(result.reward.confetti);
        this.pushWinEvents(result, {
            sessionId: gameState.gamification ? gameState.gamification.getStateSnapshot().session.id : `session_${Date.now()}`,
            roomId: gameState.roomId,
            userId: gameState.currentUser.uid,
            progress: {
                tilesFound: ctx.tilesFound,
                streak: ctx.streak,
                lineCount: ctx.totalLinesCompleted,
                bingoComplete: ctx.bingoComplete
            }
        });
        this.setStatusMessage(`<span class="text-lg">🏁</span> ${result.nextObjective} · ${result.progressLabel}`);
        return result;
    },

    stopCameraStream() {
        if (!gameState.cameraStream) return;
        gameState.cameraStream.getTracks().forEach((track) => track.stop());
        gameState.cameraStream = null;
    },

    init() {
        loadSettings();
        if (localStorage.getItem("museumBingoTutorialSeen") && gameState.settings.guideSessionType === "first_time") {
            gameState.settings.guideSessionType = "returning";
        }
        gameState.guide.activeGuideId = gameState.settings.selectedGuideId || gameState.guide.activeGuideId;
        if (window.I18n && typeof window.I18n.setLocale === "function") {
            window.I18n.setLocale(gameState.settings.locale || window.I18n.getLocale());
        }
        if (!gameState.settings.roomLanguage) {
            gameState.settings.roomLanguage = gameState.settings.locale || "en";
        }
        document.body.classList.toggle("high-contrast", gameState.settings.highContrast);
        document.body.classList.toggle("reduced-motion", gameState.settings.reducedMotion);
        if (!DOM.board || !DOM.statusMsg) {
            console.error("Critical UI elements are missing; game cannot initialize safely.");
            return;
        }
        this.initGame();
        this.bindEvents();
        this.updateLocaleUi();
        this.renderReplayModeCards();
        this.renderGoalCards({ completedTiles: [], bingoLines: [], streak: 0, points: 0 });
        this.initGamification();
        this.renderGuideSurface();
        this.loadLeaderboard();
        this.emitGuideBeat("welcome", { nudge: "I can help with mission setup, scans, and recap." }, { force: true, speak: false });
        if (!localStorage.getItem("museumBingoTutorialSeen")) {
            this.showTutorialStep();
        }
        if (window.I18n && typeof window.I18n.onChange === "function") {
            window.I18n.onChange(() => {
                this.updateLocaleUi();
                this.renderGamification();
                this.renderClueDeck();
                this.renderObjectiveSurface();
                this.loadLeaderboard();
                this.renderGuideSurface();
            });
        }
        setInterval(this.updateStats.bind(this), 1000);
    },

    getRiddlesForArt(artId) {
        try {
            if (typeof riddleDatabase !== "undefined" && riddleDatabase && Array.isArray(riddleDatabase[artId])) {
                return riddleDatabase[artId];
            }
        } catch (err) {
            console.warn("Riddle database unavailable, using fallback riddles:", err);
        }
        return ["Can you find this art piece?"];
    },

    initClueDeck(items) {
        if (!window.ClueEngine || typeof window.ClueEngine.buildClueSet !== "function") {
            gameState.clueDeck = [];
            gameState.currentObjectiveId = null;
            return;
        }
        gameState.clueDeck = window.ClueEngine.buildClueSet(items, {
            difficulty: gameState.settings.difficultyMode === "challenge" ? "hard" : "standard"
        });
        const firstOpen = gameState.clueDeck.find((clue) => !clue.completed);
        gameState.currentObjectiveId = firstOpen ? firstOpen.id : null;
        this.renderClueDeck();
        this.renderObjectiveSurface();
    },

    getCurrentObjective() {
        if (!window.ClueEngine || typeof window.ClueEngine.getCurrentObjective !== "function") {
            return null;
        }
        if (gameState.currentObjectiveId) {
            const selected = gameState.clueDeck.find((clue) => clue.id === gameState.currentObjectiveId && !clue.completed);
            if (selected) {
                return {
                    title: selected.title,
                    clueText: selected.clueText,
                    actionLabel: selected.actionLabel,
                    progress: `${Math.round((gameState.clueDeck.filter((clue) => clue.completed).length / Math.max(1, gameState.clueDeck.length)) * 100)}%`,
                    clueId: selected.id,
                    tileIndex: selected.tileIndex,
                    route: selected.route,
                    category: selected.category,
                    proximityLabel: window.ClueEngine.getClueSolveDistanceLabel(selected.proximity),
                    proximity: selected.proximity
                };
            }
        }
        return window.ClueEngine.getCurrentObjective(gameState.clueDeck);
    },

    renderObjectiveSurface() {
        const objective = this.getCurrentObjective();
        if (!objective) return;
        if (DOM.objectiveTitle) DOM.objectiveTitle.textContent = objective.title || t("gameplay.selectTilePrompt");
        if (DOM.objectiveText) DOM.objectiveText.textContent = objective.clueText || t("scan.scanning");
        if (DOM.objectiveRoute) {
            const tone = objective.route === "bonus" ? "accent" : "warning";
            DOM.objectiveRoute.className = `status-pill status-pill--${tone}`;
            DOM.objectiveRoute.textContent = `${objective.route || "main"} route`;
        }
        if (DOM.objectiveProximity) DOM.objectiveProximity.textContent = objective.proximityLabel || t("scan.scanning");
        if (DOM.objectiveProgress) DOM.objectiveProgress.textContent = objective.progress || "0%";
        if (DOM.objectiveAction) DOM.objectiveAction.textContent = objective.actionLabel || t("scan.scanning");
        if (DOM.objectiveProgressFill) {
            const progressValue = Number.parseInt(String(objective.progress || "0"), 10);
            const safeProgress = Number.isFinite(progressValue) ? Math.max(0, Math.min(progressValue, 100)) : 0;
            DOM.objectiveProgressFill.style.width = `${safeProgress}%`;
        }
    },

    renderClueDeck() {
        if (!DOM.clueScroll) return;
        DOM.clueScroll.innerHTML = "";
        if (!Array.isArray(gameState.clueDeck) || !gameState.clueDeck.length) {
            DOM.clueScroll.innerHTML = `<div class="goal-card"><p class="goal-card__title">${t("gameplay.noClues")}</p><p class="goal-card__meta">${t("gameplay.resetTrail")}</p></div>`;
            return;
        }
        gameState.clueDeck.forEach((clue) => {
            const selectedTileIndex = Number(gameState.selectedCell && gameState.selectedCell.element && gameState.selectedCell.element.dataset.tileIndex || 0);
            const isSelected = selectedTileIndex > 0 && Number(clue.tileIndex) === selectedTileIndex;
            const wrapper = window.DesignSystem && window.DesignSystem.ClueCard
                ? window.DesignSystem.ClueCard({
                    title: clue.title,
                    clueText: clue.clueText,
                    category: clue.category,
                    difficulty: clue.difficulty,
                    route: clue.route,
                    actionLabel: clue.completed ? "Completed" : clue.actionLabel,
                    whyItMatters: clue.whyItMatters,
                    whatToLookFor: clue.whatToLookFor,
                    proximityLabel: window.ClueEngine ? window.ClueEngine.getClueSolveDistanceLabel(clue.proximity) : "Searching"
                })
                : document.createElement("article");
            if (!window.DesignSystem || !window.DesignSystem.ClueCard) {
                wrapper.className = "goal-card";
                wrapper.innerHTML = `<p class="goal-card__title">${clue.title}</p><p class="goal-card__meta">${clue.clueText}</p>`;
            }
            if (clue.completed) wrapper.classList.add("clue-card--completed");
            if (isSelected) wrapper.classList.add("clue-card--active");
            DOM.clueScroll.appendChild(wrapper);
        });
    },

    loadMockUser(uid) {
        const users = window.MOCK_DATA && Array.isArray(window.MOCK_DATA.users) ? window.MOCK_DATA.users : [];
        const user = users.find((u) => u.uid === uid);
        if (user) {
            gameState.currentUser = user;
            gameState.exp = user.totalBingos * 100;
            gameState.level = Math.floor(gameState.exp / 100) + 1;
            const mockUserInfo = document.getElementById("mock-user-info");
            if (mockUserInfo) {
                mockUserInfo.textContent = `Logged in as: ${user.displayName} (${user.isPremium ? "Premium" : "Standard"})`;
            }
            this.initGamification();
            this.updateStats();
            playGameSound("levelUp");
        } else {
            console.warn("Requested mock user was not found:", uid);
        }
    },

    getBaseLeaderboardData() {
        const mockLeaders = window.MOCK_DATA &&
            Array.isArray(window.MOCK_DATA.leaderboards) &&
            window.MOCK_DATA.leaderboards[0] &&
            Array.isArray(window.MOCK_DATA.leaderboards[0].topPlayers)
            ? window.MOCK_DATA.leaderboards[0].topPlayers.map((p) => ({
                userId: p.userId,
                playerName: p.displayName,
                points: p.score,
                completedTiles: 0,
                firstCompletionAt: Number.MAX_SAFE_INTEGER
            }))
            : [];
        return mockLeaders;
    },

    renderRoomStatus(snapshot) {
        if (!DOM.roomStatus) return;
        const entries = gameState.syncService ? gameState.syncService.getRoomEntries() : [];
        DOM.roomStatus.innerHTML = "";
        if (!entries.length) {
            DOM.roomStatus.innerHTML = `<div class="goal-card"><p class="goal-card__title">${t("multiplayer.lobbyReady")}</p><p class="goal-card__meta">${t("multiplayer.invitePlayers")}</p></div>`;
            this.emitGuideBeat("welcome", { nudge: "Room is ready. Invite players and choose your mission pace." }, { speak: false, minGapMs: 9000 });
            return;
        }
        if (window.DesignSystem && window.DesignSystem.MultiLingualNotice && gameState.settings.roomLanguage !== gameState.settings.locale) {
            const notice = window.DesignSystem.MultiLingualNotice({
                title: t("multiplayer.translatedBadge"),
                body: t("multiplayer.languageMismatch"),
                tone: "warning"
            });
            DOM.roomStatus.appendChild(notice);
        }
        const sorted = [...entries].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
        sorted.slice(0, 6).forEach((entry) => {
            const initials = (entry.playerName || "P")
                .split(" ")
                .map((part) => part[0] || "")
                .join("")
                .slice(0, 2)
                .toUpperCase();
            const card = document.createElement("div");
            const isCurrent = entry.userId === gameState.currentUser.uid;
            card.className = `glass-card p-3 min-w-[168px] ${isCurrent ? "border-emerald-300/50" : ""}`;
            card.innerHTML = `
                <div class="flex items-center gap-2 mb-1">
                    <div class="avatar-ring ${isCurrent ? "avatar-ring--active" : ""}"><span>${initials}</span></div>
                    <p class="text-xs text-amber-100 font-bold">${entry.playerName || t("multiplayer.playerFallback")}</p>
                    <span class="language-pill">${String(entry.locale || gameState.settings.roomLanguage || "en").toUpperCase()}</span>
                </div>
                <p class="text-[11px] text-amber-200">${entry.completedTiles || 0} tiles • ${entry.points || 0} pts</p>
                <p class="text-[10px] text-amber-100">${String(entry.bingoStatus || "launching").replaceAll("_", " ")}</p>
            `;
            DOM.roomStatus.appendChild(card);
        });
        const recentWinEvent = gameState.winLadderEvents[0];
        if (recentWinEvent && recentWinEvent.type) {
            const log = document.createElement("div");
            log.className = "goal-card min-w-[210px]";
            const guide = this.getActiveGuide();
            log.innerHTML = `
                <p class="goal-card__title">Mission log</p>
                <p class="goal-card__meta">${guide ? `${guide.name}: ` : ""}${String(recentWinEvent.type).replaceAll("_", " ")} • ${new Date(recentWinEvent.timestamp || Date.now()).toLocaleTimeString()}</p>
            `;
            DOM.roomStatus.appendChild(log);
        }
    },

    loadLeaderboard() {
        const list = document.getElementById("leaderboard-list");
        if (!list) return;
        list.innerHTML = "";

        const base = this.getBaseLeaderboardData();
        const roomEntries = gameState.syncService ? gameState.syncService.getRoomEntries() : [];
        const merged = [...base];
        roomEntries.forEach((entry) => {
            const idx = merged.findIndex((m) => m.userId === entry.userId);
            if (idx >= 0) merged[idx] = entry;
            else merged.push(entry);
        });
        merged.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return (a.firstCompletionAt || Number.MAX_SAFE_INTEGER) - (b.firstCompletionAt || Number.MAX_SAFE_INTEGER);
        });

        if (!merged.length) {
            const item = document.createElement("div");
            item.className = "p-3 text-amber-100 text-sm";
            item.textContent = t("multiplayer.leaderboardUnavailable");
            list.appendChild(item);
            return;
        }
        merged.forEach((player, i) => {
            const item = document.createElement("div");
            const isCurrent = player.userId === gameState.currentUser.uid;
            const streak = Number(player.streak) || 0;
            const bingoStatus = String(player.bingoStatus || "no_line").replaceAll("_", " ");
            const milestone = Math.ceil((Number(player.points || 0) + 1) / 250) * 250;
            const toMilestone = Math.max(0, milestone - Number(player.points || 0));
            const totalTiles = gameState.settings.cardSize * gameState.settings.cardSize;
            const toBingo = Math.max(0, totalTiles - Number(player.completedTiles || 0));
            const initials = (player.playerName || player.displayName || "P")
                .split(" ")
                .map((part) => part[0] || "")
                .join("")
                .slice(0, 2)
                .toUpperCase();
            item.className = `flex items-center justify-between p-3 glass-card ${isCurrent ? "bg-amber-400/10 border-amber-300/40 points-pop" : "bg-white/5"}`;
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-amber-300 font-bold">#${i + 1}</span>
                    <div class="avatar-ring ${isCurrent ? "avatar-ring--active" : ""}"><span>${initials}</span></div>
                    <span class="text-white">${player.playerName || player.displayName || "Player"}</span>
                    <span class="language-pill">${String(player.locale || gameState.settings.roomLanguage || "en").toUpperCase()}</span>
                    ${isCurrent ? `<span class="text-[10px] text-green-300">● ${t("multiplayer.nowPlaying")}</span>` : ""}
                </div>
                <div class="text-right">
                    <span class="text-amber-400 font-black block">${player.points || 0} pts</span>
                    <span class="text-[10px] text-amber-100 block">${player.completedTiles || 0} tiles • 🔥${streak}</span>
                    <span class="text-[10px] text-amber-200 block">${bingoStatus}</span>
                    <span class="text-[10px] text-indigo-200 block">${t("multiplayer.milestoneToGo", { points: toMilestone })}</span>
                    <span class="text-[10px] text-cyan-200 block">${toBingo} to bingo</span>
                </div>
            `;
            list.appendChild(item);
        });
    },

    getCurrentCardItems() {
        const size = gameState.settings.cardSize;
        if (gameState.currentCardItems.length === size * size) return gameState.currentCardItems;
        const fallbackTheme = themes[currentTheme] && Array.isArray(themes[currentTheme].items) ? themes[currentTheme].items : [];
        if (size === 3) {
            gameState.currentCardItems = fallbackTheme.slice(0, 9).map((item) => ({
                ...item,
                prompt: item.name,
                icon: item.emoji
            }));
            return gameState.currentCardItems;
        }
        if (window.TechnicalEngine && typeof window.TechnicalEngine.generateCard === "function") {
            const generated = window.TechnicalEngine.generateCard(size, {
                mode: gameState.settings.roomMode === "family"
                    ? "family"
                    : (gameState.settings.difficultyMode === "challenge" ? "challenge" : "standard"),
                funnyPrompts: true,
                educationalPrompts: true
            }).map((prompt, index) => ({
                id: `generated_${size}_${index}`,
                name: prompt.text,
                prompt: prompt.text,
                emoji: prompt.emoji || "🧩",
                icon: prompt.emoji || "🧩",
                fact: `Category: ${prompt.category}`
            }));
            gameState.currentCardItems = generated;
            return generated;
        }
        gameState.currentCardItems = fallbackTheme.slice(0, size * size).map((item) => ({
            ...item,
            prompt: item.name,
            icon: item.emoji
        }));
        return gameState.currentCardItems;
    },

    initGame() {
        const theme = themes[currentTheme];
        if (!theme || !Array.isArray(theme.items)) {
            console.error("Invalid theme configuration:", currentTheme);
            return;
        }
        const size = gameState.settings.cardSize;
        const items = this.getCurrentCardItems();
        this.initClueDeck(items);
        DOM.board.innerHTML = "";
        DOM.board.className = `col-span-3 grid ${size === 4 ? "grid-cols-4 gap-4" : "grid-cols-3 gap-6"} ${gameState.settings.compactMode ? "compact-mode" : ""}`;
        items.forEach((item, index) => {
            const localizedArtifact = this.getLocalizedArtifact(item);
            const cell = document.createElement("div");
            cell.className = "cell cell-enter";
            cell.dataset.id = String(item.id);
            cell.dataset.tileIndex = String(index + 1);
            const isFound = gameState.foundItems.has(item.id);
            if (isFound) cell.classList.add("found");
            cell.innerHTML = `<span>${item.emoji || "🧩"}</span><div class="cell-name text-fit">${localizedArtifact.title}</div><div class="tile-meta">#${index + 1}</div>`;
            cell.onclick = () => this.selectCell(cell, item);
            DOM.board.appendChild(cell);
            setTimeout(() => cell.classList.remove("cell-enter"), 320);
        });
        this.updateStats();
        this.applyThemeColors(theme.color);
    },

    applyThemeColors(color) {
        document.documentElement.style.setProperty("--gold", color);
        if (document.querySelector("h1")) {
            document.querySelector("h1").style.backgroundImage = `linear-gradient(to right, ${color}, white)`;
        }
    },

    bindEvents() {
        if (DOM.localeSwitcher && window.I18n && typeof window.I18n.setLocale === "function") {
            DOM.localeSwitcher.onchange = (e) => {
                window.I18n.setLocale(e.target.value);
                gameState.settings.locale = window.I18n.getLocale();
                saveSettings();
            };
        }
        if (DOM.difficultyMode) {
            DOM.difficultyMode.value = gameState.settings.difficultyMode;
            DOM.difficultyMode.onchange = (e) => {
                gameState.settings.difficultyMode = e.target.value;
                saveSettings();
                this.initGamification();
            };
        }
        if (DOM.roomMode) {
            DOM.roomMode.value = gameState.settings.roomMode;
            DOM.roomMode.onchange = (e) => {
                gameState.settings.roomMode = e.target.value;
                if (gameState.settings.roomMode === "family") gameState.settings.guideSessionType = "family";
                else if (gameState.settings.roomMode === "solo") gameState.settings.guideSessionType = "solo";
                else gameState.settings.guideSessionType = "competitive";
                if (DOM.guideSessionType) DOM.guideSessionType.value = gameState.settings.guideSessionType;
                saveSettings();
                this.initGamification();
                this.renderGuideSurface();
            };
        }
        if (DOM.cardSize) {
            DOM.cardSize.value = String(gameState.settings.cardSize);
            DOM.cardSize.onchange = (e) => {
                const value = Number(e.target.value);
                gameState.settings.cardSize = value === 4 ? 4 : 3;
                gameState.currentCardItems = [];
                gameState.foundItems = new Set();
                saveSettings();
                this.initGame();
                this.initGamification();
            };
        }
        if (DOM.dailyToggle) {
            DOM.dailyToggle.checked = gameState.settings.dailyChallengeEnabled;
            DOM.dailyToggle.onchange = (e) => {
                gameState.settings.dailyChallengeEnabled = Boolean(e.target.checked);
                saveSettings();
                this.initGamification();
            };
        }
        if (DOM.ageFriendlyToggle) {
            DOM.ageFriendlyToggle.checked = gameState.settings.ageFriendlyMode;
            DOM.ageFriendlyToggle.onchange = (e) => {
                gameState.settings.ageFriendlyMode = Boolean(e.target.checked);
                saveSettings();
                this.renderGuideSurface();
            };
        }
        if (DOM.guideSessionType) {
            DOM.guideSessionType.value = gameState.settings.guideSessionType;
            DOM.guideSessionType.onchange = (e) => {
                gameState.settings.guideSessionType = e.target.value;
                saveSettings();
                this.renderGuideSurface();
                this.emitGuideBeat("explain", { nudge: "I will adapt my guidance to this session mode." }, { force: true, speak: false });
            };
        }
        if (DOM.guideEnergy) {
            DOM.guideEnergy.value = gameState.settings.guideEnergy;
            DOM.guideEnergy.onchange = (e) => {
                gameState.settings.guideEnergy = e.target.value;
                saveSettings();
                this.renderGuideSurface();
            };
        }
        if (DOM.compactModeToggle) {
            DOM.compactModeToggle.checked = gameState.settings.compactMode;
            DOM.compactModeToggle.onchange = (e) => {
                gameState.settings.compactMode = Boolean(e.target.checked);
                saveSettings();
                this.initGame();
            };
        }
        if (DOM.highContrastToggle) {
            DOM.highContrastToggle.checked = gameState.settings.highContrast;
            DOM.highContrastToggle.onchange = (e) => {
                gameState.settings.highContrast = Boolean(e.target.checked);
                document.body.classList.toggle("high-contrast", gameState.settings.highContrast);
                saveSettings();
            };
        }
        if (DOM.reducedMotionToggle) {
            DOM.reducedMotionToggle.checked = gameState.settings.reducedMotion;
            DOM.reducedMotionToggle.onchange = (e) => {
                gameState.settings.reducedMotion = Boolean(e.target.checked);
                document.body.classList.toggle("reduced-motion", gameState.settings.reducedMotion);
                saveSettings();
            };
        }
        if (DOM.soundToggle) {
            DOM.soundToggle.checked = gameState.settings.soundEnabled;
            DOM.soundToggle.onchange = (e) => {
                gameState.settings.soundEnabled = Boolean(e.target.checked);
                saveSettings();
            };
        }
        if (DOM.vibrationToggle) {
            DOM.vibrationToggle.checked = gameState.settings.vibrationEnabled;
            DOM.vibrationToggle.onchange = (e) => {
                gameState.settings.vibrationEnabled = Boolean(e.target.checked);
                saveSettings();
            };
        }
        if (DOM.helpBtn) {
            DOM.helpBtn.onclick = () => {
                const tip = this.emitGuideBeat("hint", {
                    hintAction: "Hold steady, move closer, reduce glare, and try a slight angle change."
                }, { force: true, speak: false });
                this.setStatusMessage(tip ? `🧭 ${tip}` : "Need help? Hold steady, move closer, reduce glare, and try a slight angle change.");
            };
        }
        if (DOM.themeSelect) {
            DOM.themeSelect.onchange = (e) => {
                playGameSound("click");
                currentTheme = e.target.value;
                gameState.foundItems = new Set();
                gameState.currentCardItems = [];
                this.initGame();
                this.initGamification();
                this.renderGuideSurface();
            };
        }
        if (DOM.viewPassportBtn) {
            DOM.viewPassportBtn.onclick = () => {
                if (!DOM.passportGrid || !DOM.passportModal) return;
                DOM.passportGrid.innerHTML = "";
                Object.keys(themes).forEach((themeKey) => {
                    const theme = themes[themeKey];
                    const foundInTheme = passport[themeKey] || [];
                    const stamp = document.createElement("div");
                    stamp.className = "glass-card p-4 text-center";
                    stamp.innerHTML = `
                        <div class="text-3xl mb-2">${foundInTheme.length >= 9 ? "🏆" : "🎫"}</div>
                        <div class="text-xs font-bold text-amber-300">${theme.name}</div>
                        <div class="text-[10px] text-amber-100">${foundInTheme.length}/9 FOUND</div>
                    `;
                    DOM.passportGrid.appendChild(stamp);
                });
                DOM.passportModal.classList.remove("hidden");
            };
        }
        if (DOM.closePassportBtn) DOM.closePassportBtn.onclick = () => DOM.passportModal.classList.add("hidden");
        if (DOM.scanBtn) DOM.scanBtn.onclick = this.handleScanClick.bind(this);
        if (DOM.closeScanner) DOM.closeScanner.onclick = this.closeScannerModal.bind(this);
        if (DOM.confirmBtn) DOM.confirmBtn.onclick = this.handleConfirmClick.bind(this);
        if (DOM.resetBtn) DOM.resetBtn.onclick = this.resetGame.bind(this);
        if (DOM.nextRiddleBtn) DOM.nextRiddleBtn.addEventListener("click", this.showNextRiddle.bind(this));
        if (DOM.tutorialNextBtn) DOM.tutorialNextBtn.onclick = this.nextTutorialStep.bind(this);
        if (DOM.tutorialSkipBtn) DOM.tutorialSkipBtn.onclick = this.closeTutorial.bind(this);
        if (DOM.playAgainBtn) DOM.playAgainBtn.onclick = () => location.reload();
        if (DOM.shareCardBtn) {
            DOM.shareCardBtn.onclick = async () => {
                const text = gameState.sessionRecap && gameState.sessionRecap.shareText
                    ? gameState.sessionRecap.shareText
                    : `I scored ${DOM.pointsTotal ? DOM.pointsTotal.textContent : 0} in Museum.Bingo.`;
                try {
                    if (navigator.share) await navigator.share({ title: "Museum Bingo", text });
                    else if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(text);
                        this.setStatusMessage(t("rewards.shareCopied"));
                    }
                } catch (err) {
                    console.warn("Share action was cancelled or unavailable:", err);
                }
            };
        }
        if (DOM.heatVisionBtn) DOM.heatVisionBtn.onclick = this.toggleHeatVision.bind(this);
        if (DOM.closeSuccessModal) DOM.closeSuccessModal.onclick = this.hideScanSuccessModal.bind(this);
        window.addEventListener("museum-bingo-near-match", (event) => {
            const now = Date.now();
            if (now - gameState.nearMatchPlayedAt < 1200) return;
            gameState.nearMatchPlayedAt = now;
            playSound(720, "triangle", 0.09, 0.06);
            this.setScanState("almost", t("scan.almostRecognized"), "accent");
            if (DOM.scanGuidance && event && event.detail && Number.isFinite(event.detail.confidence)) {
                DOM.scanGuidance.textContent = `${t("scan.almostRecognized")} (${event.detail.confidence}%). ${t("scan.guidanceAlmost")}`;
            }
            this.emitGuideBeat("encourage", { nudge: "Great progress. One clean frame should lock it." }, { speak: false });
        });
        window.addEventListener("beforeunload", this.cleanupCamera.bind(this));
    },

    selectCell(element, item) {
        if (element.classList.contains("found")) return;
        playGameSound("select");
        document.querySelectorAll(".cell").forEach((c) => c.classList.remove("active"));
        element.classList.add("active");
        gameState.selectedCell = { element, item };
        this.setScanState("mystery-preview", t("scan.mysteryTarget"), "accent");
        const clue = gameState.clueDeck.find((entry) => Number(entry.tileIndex) === Number(element.dataset.tileIndex));
        if (clue) gameState.currentObjectiveId = clue.id;
        this.showRiddle(item.id);
        this.renderObjectiveSurface();
        this.renderClueDeck();
        const localizedArtifact = this.getLocalizedArtifact(item);
        const guideLine = this.emitGuideBeat("focus", {
            itemName: localizedArtifact.title || item.name,
            nextTile: Number(element.dataset.tileIndex || 0),
            nudge: "Find the key shape, then confirm for points."
        }, { speak: false, force: true });
        this.setStatusMessage(guideLine
            ? `<span class="text-lg">🧭</span> ${guideLine}`
            : `<span class="text-lg">🎯</span> ${t("gameplay.tileFound", { name: localizedArtifact.title || item.name })}`);
    },

    showRiddle(artId) {
        if (!gameState.currentRiddleIndex[artId]) gameState.currentRiddleIndex[artId] = 0;
        const riddles = this.getRiddlesForArt(artId);
        const riddle = riddles[gameState.currentRiddleIndex[artId]];
        if (DOM.riddleText) DOM.riddleText.textContent = riddle;
        if (DOM.riddlePanel) DOM.riddlePanel.classList.remove("hidden");
        if (typeof speakText === "function") speakText(riddle, 0.9);
    },

    showNextRiddle() {
        if (!gameState.selectedCell) return;
        gameState.usedHintSinceLastScan = true;
        this.setScanState("hint-active", t("scan.hintActive"), "warning");
        if (gameState.gamification) {
            gameState.gamification.onHintUsed({
                tileId: Number(gameState.selectedCell.element.dataset.tileIndex || 0),
                reason: "next_riddle"
            });
        }
        if (window.ClueEngine && typeof window.ClueEngine.bumpHintLevel === "function") {
            const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
            const clue = gameState.clueDeck.find((entry) => Number(entry.tileIndex) === tileIndex);
            if (clue) {
                gameState.clueDeck = window.ClueEngine.bumpHintLevel(gameState.clueDeck, clue.id);
                this.renderClueDeck();
                this.renderObjectiveSurface();
            }
        }
        const artId = gameState.selectedCell.item.id;
        const riddles = this.getRiddlesForArt(artId);
        gameState.currentRiddleIndex[artId] = (gameState.currentRiddleIndex[artId] + 1) % riddles.length;
        this.showRiddle(artId);
        this.emitGuideBeat("hint", { hintAction: "Use this clue, then scan with the object centered." }, { speak: false });
    },

    async handleScanClick() {
        if (!gameState.selectedCell || !gameState.selectedCell.item) {
            this.setStatusMessage(`⚠️ ${t("gameplay.noSelection")}`);
            return;
        }
        gameState.totalAttempts++;
        gameState.scanStartedAt = Date.now();
        this.setScanState("aiming", t("scan.aiming"), "ar");
        if (DOM.scanGuidance) DOM.scanGuidance.textContent = t("scan.guidanceAiming");
        if (DOM.confidenceFill) DOM.confidenceFill.style.width = "0%";
        this.setElementHidden(DOM.scannerOverlay, false);
        this.setElementHidden(DOM.artInfo, true);
        this.setElementHidden(DOM.confirmBtn, true);
        this.setElementHidden(DOM.detectionResults, true);
        const scanBorder = document.querySelector(".scan-border");
        try {
            if (scanBorder) scanBorder.classList.add("scanning-active");
            if (!gameState.cameraStream) {
                if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
                    throw new Error("Camera API not supported in this browser");
                }
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                gameState.cameraStream = stream;
                if (DOM.cameraFeed) {
                    DOM.cameraFeed.srcObject = stream;
                    DOM.cameraFeed.onloadedmetadata = () => {
                        if (DOM.detectionCanvas) {
                            DOM.detectionCanvas.width = DOM.cameraFeed.videoWidth;
                            DOM.detectionCanvas.height = DOM.cameraFeed.videoHeight;
                        }
                    };
                }
            }
            await this.startAIDetection();
        } catch (err) {
            console.warn("Camera failed, using fallback", err);
            await this.startAIDetection();
        } finally {
            if (scanBorder) scanBorder.classList.remove("scanning-active");
        }
    },

    async startAIDetection() {
        try {
            if (!gameState.selectedCell || !gameState.selectedCell.item) throw new Error("No selected target available for AI detection");
            if (typeof simulateAIDetection !== "function") throw new Error("AI detection engine is unavailable");
            this.setScanState("scanning", t("scan.scanning"), "ar");
            const result = await simulateAIDetection(DOM.cameraFeed, DOM.detectionCanvas, gameState.selectedCell.item);
            const confidence = Number(result && result.confidence);
            const detectionCount = Number(result && result.detectionCount) || 0;
            if (!Number.isFinite(confidence)) throw new Error("AI detection returned invalid confidence");
            gameState.aiDetections += detectionCount;
            gameState.scanProximity = Math.floor(Math.max(0, Math.min(confidence, 100)));
            if (window.ClueEngine && typeof window.ClueEngine.updateClueProximity === "function" && gameState.selectedCell) {
                const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
                const clue = gameState.clueDeck.find((entry) => Number(entry.tileIndex) === tileIndex);
                if (clue) {
                    gameState.clueDeck = window.ClueEngine.updateClueProximity(gameState.clueDeck, clue.id, gameState.scanProximity);
                    this.renderObjectiveSurface();
                    this.renderClueDeck();
                }
            }
            if (DOM.confidenceFill) DOM.confidenceFill.style.width = `${Math.floor(Math.max(0, Math.min(confidence, 100)))}%`;
            if (DOM.confidence) DOM.confidence.textContent = `${Math.floor(Math.max(0, Math.min(confidence, 100)))}%`;
            if (gameState.isHeatVisionActive) {
                this.updateHeatVisionHud({
                    signal: confidence,
                    confidence,
                    target: gameState.selectedCell && gameState.selectedCell.item ? gameState.selectedCell.item.name : "Unknown"
                });
            }
            if (confidence >= 80) this.showDetectionResult();
            else {
                const tileIndex = Number(gameState.selectedCell && gameState.selectedCell.element && gameState.selectedCell.element.dataset.tileIndex || 0);
                if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "confidence_low", confidence, tileId: tileIndex });
                const fallback = this.getScanFallbackState(confidence);
                this.setScanState(fallback.state, fallback.label, fallback.tone);
                const guideFallback = this.emitGuideBeat("hint", {
                    hintAction: fallback.guidance,
                    nudge: fallback.statusMessage
                }, { speak: false, force: true });
                this.setStatusMessage(guideFallback ? `🧭 ${guideFallback}` : fallback.statusMessage);
                if (DOM.scanGuidance) DOM.scanGuidance.textContent = fallback.guidance;
                if (gameState.isHeatVisionActive) {
                    this.updateHeatVisionHud({
                        signal: confidence,
                        confidence,
                        target: fallback.label
                    });
                }
                this.closeScannerModal();
            }
        } catch (err) {
            const tileIndex = Number(gameState.selectedCell && gameState.selectedCell.element && gameState.selectedCell.element.dataset.tileIndex || 0);
            if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "scanner_error", tileId: tileIndex });
            console.error("AI detection failed unexpectedly:", err);
            this.setScanState("low-confidence", t("scan.scannerError"), "danger");
            if (DOM.scanGuidance) DOM.scanGuidance.textContent = "Scanner error. Try another angle or restart scan.";
            this.setStatusMessage(`⚠️ ${t("scan.scannerError")}`);
            this.closeScannerModal();
        }
    },

    showDetectionResult() {
        if (!gameState.selectedCell || !gameState.selectedCell.item) return;
        const item = gameState.selectedCell.item;
        const details = this.getArtifactStory(item);
        const localizedArtifact = this.getLocalizedArtifact(item);
        gameState.selectedCell.element.classList.add("state-unconfirmed");
        this.setScanState("success-burst", t("scan.signalLocked"), "success");
        if (DOM.artInfo) DOM.artInfo.classList.remove("hidden");
        if (DOM.artEmoji) DOM.artEmoji.textContent = item.emoji;
        if (DOM.artName) DOM.artName.textContent = localizedArtifact.title || item.name;
        if (DOM.artFact) {
            const fallback = localizedArtifact.translationState !== "complete" ? ` ${t("scan.fallbackMissingContent")}` : "";
            DOM.artFact.textContent = `${localizedArtifact.details || `${item.fact} ${details.era} ${details.origin} ${details.material}`}${fallback}`;
        }
        if (DOM.confirmBtn) DOM.confirmBtn.classList.remove("hidden");
        if (DOM.scanGuidance) DOM.scanGuidance.textContent = t("scan.recognized");
        if (gameState.isHeatVisionActive) {
            this.updateHeatVisionHud({ signal: 100, confidence: 100, target: "Signal locked" });
        }
        const guideLine = this.emitGuideBeat("explain", {
            itemName: item.name,
            nudge: `${item.fact} Confirm to lock this tile.`
        }, { force: true });
        if (!guideLine && typeof speakText === "function") speakText(t("gameplay.tileFound", { name: localizedArtifact.title || item.name }), 0.85);
    },

    async handleConfirmClick() {
        if (!gameState.selectedCell || !gameState.selectedCell.item) {
            this.setStatusMessage(`⚠️ ${t("gameplay.noSelection")}`);
            return;
        }
        if (DOM.confirmBtn) {
            DOM.confirmBtn.disabled = true;
            DOM.confirmBtn.textContent = t("gameplay.validating");
        }
        try {
            const item = gameState.selectedCell.item;
            const localizedArtifact = this.getLocalizedArtifact(item);
            const hasValidator = window.TechnicalEngine && typeof window.TechnicalEngine.validateArtwork === "function";
            if (!hasValidator) throw new Error("Validation engine is unavailable");
            const validation = await window.TechnicalEngine.validateArtwork(null, item);
            if (validation.success) {
                playGameSound("found");
                gameState.foundItems.add(item.id);
                gameState.successfulScans++;
                gameState.selectedCell.element.classList.add("tile-dock");
                gameState.selectedCell.element.classList.add("found");
                gameState.selectedCell.element.classList.remove("active");
                setTimeout(() => {
                    if (gameState.selectedCell && gameState.selectedCell.element) {
                        gameState.selectedCell.element.classList.remove("tile-dock");
                    }
                }, 620);
                this.addExp(50);
                this.stampPassport(item);

                const scanDuration = gameState.scanStartedAt ? (Date.now() - gameState.scanStartedAt) : Number.MAX_SAFE_INTEGER;
                const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
                const snapshotBefore = gameState.gamification ? gameState.gamification.getStateSnapshot() : null;
                const optimisticWinContext = this.buildOptimisticWinRuleContext({
                    snapshotBefore,
                    tileIndex,
                    usedHint: gameState.usedHintSinceLastScan
                });
                const winResult = this.evaluateAndApplyWinLadder(optimisticWinContext);
                const scoreResult = gameState.gamification
                    ? gameState.gamification.onTileValidated({
                        tileId: tileIndex,
                        artworkName: item.name,
                        artist: item.artist || "Unknown artist",
                        scanDurationMs: scanDuration,
                        usedHint: gameState.usedHintSinceLastScan
                    })
                    : null;
                const snapshotAfter = gameState.gamification ? gameState.gamification.getStateSnapshot() : null;

                gameState.usedHintSinceLastScan = false;
                if (window.ClueEngine && typeof window.ClueEngine.markClueCompleted === "function") {
                    gameState.clueDeck = window.ClueEngine.markClueCompleted(gameState.clueDeck, tileIndex);
                    const nextOpen = gameState.clueDeck.find((clueEntry) => !clueEntry.completed);
                    gameState.currentObjectiveId = nextOpen ? nextOpen.id : null;
                    this.renderClueDeck();
                    this.renderObjectiveSurface();
                }
                this.closeScannerModal();
                this.setStatusMessage(`<span class="text-lg">✅</span> ${t("gameplay.tileFound", { name: localizedArtifact.title || item.name })}`);
                if (DOM.riddlePanel) DOM.riddlePanel.classList.add("hidden");
                this.updateStats();
                this.checkWin();

                if (scoreResult && scoreResult.accepted) {
                    this.enrichWinContextAfterValidation(optimisticWinContext, {
                        snapshotAfter,
                        scoreResult
                    });
                    if (DOM.pointsTotal) {
                        DOM.pointsTotal.classList.add("points-pop");
                        setTimeout(() => DOM.pointsTotal.classList.remove("points-pop"), 450);
                    }
                    this.showScanSuccessModal(item, scoreResult);
                    this.syncRoomScore();
                    if (Array.isArray(scoreResult.unlockedBadges)) {
                        scoreResult.unlockedBadges.forEach((badge) => this.showBadgeToast(badge));
                    }
                    if (Array.isArray(scoreResult.unlockedTokens)) {
                        scoreResult.unlockedTokens.forEach((token) => this.showTokenToast(token));
                    }
                    if ((winResult && winResult.reward && winResult.reward.confetti && winResult.reward.confetti !== "none")
                        || scoreResult.firstLineBonus > 0
                        || scoreResult.fullCardBonus > 0) {
                        this.createParticles(window.innerWidth / 2, window.innerHeight / 2, "#fbbf24", 40);
                    }
                    if (!winResult && gameState.settings.vibrationEnabled && navigator.vibrate) navigator.vibrate([40, 20, 40]);
                } else if (winResult) {
                    gameState.winLadderBonusPoints = Math.max(0, gameState.winLadderBonusPoints - Number(winResult.reward.points || 0));
                    gameState.lastWinStates = [];
                }

                if (gameState.foundItems.size >= 3) {
                    const rewardsPanel = document.getElementById("rewards-panel");
                    if (rewardsPanel) rewardsPanel.classList.remove("hidden");
                }
            } else {
                const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
                if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "validator_rejected", tileId: tileIndex });
                this.setStatusMessage(t("scan.guidanceNoMatch"));
            }
        } catch (err) {
            const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
            if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "validator_error", tileId: tileIndex });
            console.error("Validation failed unexpectedly:", err);
            this.setStatusMessage(`⚠️ ${t("scan.scannerError")}`);
        } finally {
            if (DOM.confirmBtn) {
                DOM.confirmBtn.disabled = false;
                DOM.confirmBtn.textContent = t("gameplay.foundIt");
            }
        }
    },

    closeScannerModal() {
        this.setElementHidden(DOM.scannerOverlay, true);
        this.setScanState("", t("scan.scanning"), "ar");
        document.querySelectorAll(".cell.state-unconfirmed").forEach((cell) => cell.classList.remove("state-unconfirmed"));
        this.stopCameraStream();
    },

    stampPassport(item) {
        if (!item || !item.id) return;
        if (!passport[currentTheme]) passport[currentTheme] = [];
        if (!passport[currentTheme].includes(item.id)) {
            passport[currentTheme].push(item.id);
            try {
                localStorage.setItem("museumPassport", JSON.stringify(passport));
            } catch (err) {
                console.warn("Failed to persist museum passport:", err);
            }
        }
    },

    resetGame() {
        gameState.foundItems = new Set();
        gameState.currentCardItems = [];
        gameState.startTime = Date.now();
        gameState.totalAttempts = 0;
        gameState.successfulScans = 0;
        gameState.aiDetections = 0;
        gameState.selectedCell = null;
        gameState.exp = 0;
        gameState.level = 1;
        gameState.currentRiddleIndex = {};
        gameState.usedHintSinceLastScan = false;
        gameState.winLadderBonusPoints = 0;
        gameState.winLadderEvents = [];
        gameState.lastWinStates = [];
        gameState.sessionRecap = null;
        gameState.clueDeck = [];
        gameState.currentObjectiveId = null;
        gameState.scanProximity = 0;
        this.initGame();
        this.initGamification();
        this.setStatusMessage(`👉 ${t("gameplay.selectTilePrompt")}`);
        if (DOM.riddlePanel) DOM.riddlePanel.classList.add("hidden");
        this.closeScannerModal();
        this.updateLevelUI();
    },

    checkWin() {
        const cells = Array.from(document.querySelectorAll(".cell"));
        const found = cells.map((c) => c.classList.contains("found"));
        const size = gameState.settings.cardSize;
        const winPatterns = window.BingoRules
            ? window.BingoRules.computeWinPatterns(size).map((line) => line.map((tileId) => tileId - 1))
            : [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        const hasWon = winPatterns.some((pattern) => pattern.every((idx) => found[idx]));
        if (hasWon) setTimeout(this.showWinModal.bind(this), 500);
    },

    showWinModal() {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const scanAccuracy = gameState.totalAttempts > 0 ? Math.round((gameState.successfulScans / gameState.totalAttempts) * 100) : 0;
        if (!DOM.finalStats || !DOM.winModal) return;
        const snapshot = gameState.gamification ? gameState.gamification.getStateSnapshot() : null;
        const basePoints = snapshot ? snapshot.points : 0;
        const points = Number(basePoints || 0) + Number(gameState.winLadderBonusPoints || 0);
        const completionTitle = snapshot && snapshot.hasFullCard ? t("rewards.missionComplete") : t("rewards.bingoComplete");
        const winTitle = DOM.winModal.querySelector("h2");
        if (winTitle) winTitle.textContent = completionTitle;
        if (window.SessionSummary && typeof window.SessionSummary.buildSessionOutcome === "function" && snapshot && snapshot.session) {
            const guide = this.getActiveGuide();
            const learned = [
                `You identified ${Array.isArray(snapshot.completedTiles) ? snapshot.completedTiles.length : 0} objects using scan feedback.`,
                `Your strongest momentum was streak ${Number(snapshot.bestSessionStreak || 0)}.`,
                `Most useful tip: ${gameState.guide.recentTips[0] || "Steady framing improves confidence."}`
            ];
            gameState.sessionRecap = window.SessionSummary.buildSessionOutcome({
                sessionId: snapshot.session.id,
                userId: snapshot.session.userId,
                museumId: snapshot.session.museumId,
                roomId: snapshot.session.roomId,
                totalScore: points,
                tilesFound: Array.isArray(snapshot.completedTiles) ? snapshot.completedTiles.length : 0,
                streakBest: Number(snapshot.bestSessionStreak || 0),
                linesCompleted: Array.isArray(snapshot.bingoLines) ? snapshot.bingoLines.length : 0,
                bingosCompleted: Number(snapshot.lifetime && snapshot.lifetime.totalBingos) || 0,
                badgesEarned: Array.isArray(snapshot.badges) ? snapshot.badges.map((badge) => badge.id) : [],
                durationMs: elapsed * 1000,
                primaryWinState: "BINGO_COMPLETE",
                secondaryWinStates: gameState.lastWinStates,
                activeGuideId: guide ? guide.id : null,
                activeGuideName: guide ? guide.name : null,
                mostUsefulGuideTip: gameState.guide.recentTips[0] || "",
                whatYouLearned: learned,
                nextTimeSuggestion: this.getGuideSuggestion(snapshot)
            });
        }
        const topBadge = snapshot && Array.isArray(snapshot.badges) && snapshot.badges.length
            ? snapshot.badges[snapshot.badges.length - 1].name
            : "None";
        const favoriteDiscovery = gameState.selectedCell && gameState.selectedCell.item
            ? gameState.selectedCell.item.name
            : "Unknown";
        const guide = this.getActiveGuide();
        const guideTip = gameState.guide.recentTips[0] || "Steady framing keeps scans accurate.";
        const mostValuableTarget = gameState.currentCardItems && gameState.currentCardItems.length
            ? gameState.currentCardItems[0].name
            : "Target #1";
        DOM.finalStats.innerHTML = `
            <div class="flex justify-between mb-3 text-amber-100"><span>🛰️ Mission:</span><strong class="text-amber-300">${completionTitle}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>⏱️ Time:</span><strong class="text-amber-300">${elapsed}s</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>📊 Scans:</span><strong class="text-amber-300">${gameState.successfulScans}/${gameState.totalAttempts}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🏅 Points:</span><strong class="text-amber-300">${points}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🔥 Best streak:</span><strong class="text-amber-300">${snapshot ? snapshot.bestSessionStreak : 0}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🤖 AI Detections:</span><strong class="text-amber-300">${gameState.aiDetections}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🎯 Accuracy:</span><strong class="text-amber-300">${scanAccuracy}%</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>📈 Lines:</span><strong class="text-amber-300">${snapshot ? snapshot.bingoLines.length : 0}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🏁 Room rank:</span><strong class="text-amber-300">#${snapshot && snapshot.rank ? snapshot.rank : "-"}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>⭐ Favorite discovery:</span><strong class="text-amber-300">${favoriteDiscovery}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>💠 Most valuable target:</span><strong class="text-amber-300">${mostValuableTarget}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🧭 Guide:</span><strong class="text-amber-300">${guide ? guide.name : "None"}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>📚 What you learned:</span><strong class="text-amber-300">${favoriteDiscovery} matters in ${currentTheme} collections.</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>💡 Most useful tip:</span><strong class="text-amber-300">${guideTip}</strong></div>
            <div class="flex justify-between text-amber-100"><span>🏅 Latest badge:</span><strong class="text-amber-300">${topBadge}</strong></div>
        `;
        if (DOM.victoryHighlight) {
            const isFull = Boolean(snapshot && snapshot.hasFullCard);
            DOM.victoryHighlight.textContent = isFull ? "Full card complete" : "Bingo complete";
            DOM.victoryHighlight.className = `status-pill ${isFull ? "status-pill--success" : "status-pill--warning"} mb-4 inline-flex`;
        }
        if (DOM.recapBadges) {
            DOM.recapBadges.innerHTML = "";
            const recentBadges = snapshot && Array.isArray(snapshot.badges) ? snapshot.badges.slice(-4) : [];
            const learnedCards = gameState.sessionRecap && gameState.sessionRecap.summary && Array.isArray(gameState.sessionRecap.summary.whatYouLearned)
                ? gameState.sessionRecap.summary.whatYouLearned.slice(0, 2).map((line) => `<div class="lesson-card"><p class="lesson-card__title">📝 What your guide noticed</p><p class="lesson-card__text">${line}</p></div>`).join("")
                : "";
            DOM.recapBadges.innerHTML = recentBadges.length
                ? `<p class="text-xs text-amber-200 mb-2">${t("rewards.unlockedThisSession")}</p><div class="flex flex-wrap gap-2">${recentBadges.map((badge) => `<span class="glass-badge text-xs bg-white/5">${badge.icon} ${badge.name}</span>`).join("")}</div>`
                : `<p class="text-xs text-amber-100">${t("rewards.noBadgesThisRound")}</p>`;
            if (learnedCards) {
                DOM.recapBadges.innerHTML += `<div class="grid grid-cols-1 gap-2 mt-3">${learnedCards}</div>`;
            }
        }
        DOM.winModal.classList.remove("hidden");
        const finaleLine = this.emitGuideBeat("recap", {
            recapFocus: `Favorite discovery: ${favoriteDiscovery}. Try ${mostValuableTarget} first next round.`
        }, { force: true, speak: false });
        if (typeof speakText === "function") speakText(finaleLine || t("rewards.missionComplete"), 1);
    },

    updateStats() {
        if (!DOM.foundCount || !DOM.timeElapsed || !DOM.accuracy || !DOM.aiDetectionsDisplay) return;
        const totalTiles = gameState.settings.cardSize * gameState.settings.cardSize;
        DOM.foundCount.textContent = `${gameState.foundItems.size}/${totalTiles}`;
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        DOM.timeElapsed.textContent = `${elapsed}s`;
        const scanAccuracy = gameState.totalAttempts > 0 ? Math.round((gameState.successfulScans / gameState.totalAttempts) * 100) : 0;
        DOM.accuracy.textContent = `${scanAccuracy}%`;
        DOM.aiDetectionsDisplay.textContent = gameState.aiDetections;
        this.renderGamification();
    },

    showTutorialStep() {
        const tutorialSteps = getTutorialSteps();
        const step = tutorialSteps[gameState.tutorialStep];
        if (!step || !DOM.tutorialStepIcon || !DOM.tutorialStepTitle || !DOM.tutorialStepText || !DOM.tutorialOverlay) return;
        DOM.tutorialStepIcon.textContent = step.icon;
        DOM.tutorialStepTitle.textContent = step.title;
        DOM.tutorialStepText.textContent = step.text;
        const dots = document.querySelectorAll(".tutorial-dot");
        dots.forEach((dot, i) => {
            dot.className = `tutorial-dot w-2 h-2 rounded-full ${i === gameState.tutorialStep ? "bg-amber-400" : "bg-white/20"}`;
        });
        DOM.tutorialOverlay.classList.remove("hidden");
        if (typeof speakText === "function") speakText(step.text);
    },

    nextTutorialStep() {
        const tutorialSteps = getTutorialSteps();
        playGameSound("click");
        gameState.tutorialStep++;
        if (gameState.tutorialStep < tutorialSteps.length) this.showTutorialStep();
        else this.closeTutorial();
    },

    closeTutorial() {
        if (DOM.tutorialOverlay) DOM.tutorialOverlay.classList.add("hidden");
        try {
            localStorage.setItem("museumBingoTutorialSeen", "true");
        } catch (err) {
            console.warn("Unable to persist tutorial state:", err);
        }
    },

    addExp(amount) {
        gameState.exp += amount;
        const expToLevel = gameState.level * 100;
        if (gameState.exp >= expToLevel) {
            gameState.level++;
            gameState.exp -= expToLevel;
            this.showLevelUp();
        }
        this.updateLevelUI();
    },

    updateLevelUI() {
        if (!DOM.userLevel || !DOM.levelProgress) return;
        DOM.userLevel.textContent = `LVL ${gameState.level}`;
        const expToLevel = gameState.level * 100;
        const progress = (gameState.exp / expToLevel) * 100;
        DOM.levelProgress.style.width = `${progress}%`;
    },

    showLevelUp() {
        playGameSound("levelUp");
        this.setStatusMessage(`<span class="text-2xl animate-bounce">🌟</span> ${t("gameplay.levelUp", { level: gameState.level })}`);
        if (typeof speakText === "function") speakText(t("gameplay.levelUp", { level: gameState.level }));
        this.createParticles(window.innerWidth / 2, window.innerHeight / 2, "#fbbf24", 30);
    },

    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement("div");
            particle.className = "particle";
            particle.style.backgroundColor = color;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            particle.style.setProperty("--tx", `${tx}px`);
            particle.style.setProperty("--ty", `${ty}px`);
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    },

    toggleHeatVision() {
        gameState.isHeatVisionActive = !gameState.isHeatVisionActive;
        if (DOM.heatVisionBtn) {
            DOM.heatVisionBtn.classList.toggle("bg-orange-500", gameState.isHeatVisionActive);
            DOM.heatVisionBtn.textContent = gameState.isHeatVisionActive ? "🔥 HEAT VISION ON" : "🔍 HEAT VISION";
        }
        if (gameState.isHeatVisionActive) {
            if (typeof speakText === "function") speakText(t("scan.scanning"));
            this.updateHeatVisionHud({ signal: 22, target: "Acquiring", confidence: 0 });
            this.startHeatVisionLoop();
        } else {
            if (DOM.cameraFeed) DOM.cameraFeed.style.filter = "none";
            if (DOM.vrHud) DOM.vrHud.classList.add("hidden");
        }
    },

    updateHeatVisionHud({ signal = 0, target = "Unknown", confidence = 0 } = {}) {
        if (!DOM.vrHud) return;
        const lines = DOM.vrHud.querySelectorAll(".vr-hud-text");
        if (!lines || lines.length < 3) return;
        const clampedSignal = Math.max(0, Math.min(100, Math.round(signal)));
        const clampedConfidence = Math.max(0, Math.min(100, Math.round(confidence)));
        lines[0].textContent = `TARGET: ${target.toUpperCase()}`;
        lines[1].textContent = `SIGNAL: ${clampedSignal}%`;
        lines[2].textContent = `CONFIDENCE: ${clampedConfidence}%`;
    },

    startHeatVisionLoop() {
        if (!gameState.isHeatVisionActive) return;
        if (DOM.cameraFeed) DOM.cameraFeed.style.filter = "sepia(1) saturate(5) hue-rotate(-50deg)";
        if (DOM.vrHud) DOM.vrHud.classList.remove("hidden");
        requestAnimationFrame(this.startHeatVisionLoop.bind(this));
    },

    cleanupCamera() {
        this.stopCameraStream();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
};

window.addEventListener("load", () => {
    GameManager.init();
});

window.GameManager = GameManager;

window.toggleHeatVision = function() {
    GameManager.toggleHeatVision();
};
