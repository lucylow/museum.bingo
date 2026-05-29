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
    winLadderBonusPoints: 0,
    winLadderEvents: [],
    lastWinStates: [],
    sessionRecap: null,
    settings: {
        cardSize: 3,
        difficultyMode: "standard",
        roomMode: "multiplayer",
        dailyChallengeEnabled: true,
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
    nextBestTile: document.getElementById("next-best-tile")
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

const tutorialSteps = [
    { icon: "🎯", title: "Welcome Explorer!", text: "Ready to discover the secrets of the museum? Let's show you how to use your AI scanner." },
    { icon: "🖼️", title: "Pick an Object", text: "Tap any tile on the bingo board to select an art piece. You'll get a special AI riddle to solve!" },
    { icon: "📷", title: "Scan & Find", text: "Click 'AI SCAN' and point your camera at the real art piece. Our AI will identify it instantly!" }
];

const GameManager = {
    setStatusMessage(message) {
        if (!DOM.statusMsg) return;
        DOM.statusMsg.innerHTML = message;
    },

    setElementHidden(element, hidden) {
        if (!element) return;
        element.classList.toggle("hidden", hidden);
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
        gameState.gamification = engineFactory({
            userId: gameState.currentUser.uid,
            playerName: gameState.currentUser.displayName,
            roomId: gameState.roomId,
            museumId: currentTheme,
            gridSize: gameState.settings.cardSize,
            difficultyMode: gameState.settings.difficultyMode,
            roomMode: gameState.settings.roomMode,
            dailyChallengeEnabled: gameState.settings.dailyChallengeEnabled,
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
            points: Number(entry.points || 0) + Number(gameState.winLadderBonusPoints || 0)
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
        if (DOM.tilesProgress) DOM.tilesProgress.textContent = `${snapshot.completedTiles.length}/${totalTiles} TILES`;
        if (DOM.bingoProgressFill) DOM.bingoProgressFill.style.width = `${Math.round(ratio * 100)}%`;
        if (DOM.bingoLinesCount) DOM.bingoLinesCount.textContent = String(snapshot.bingoLines.length);
        if (DOM.cardStatusLabel) DOM.cardStatusLabel.textContent = String(snapshot.completionState || "no_line").replaceAll("_", " ").toUpperCase();
        const daily = gameState.gamification.getDailyProgress();
        if (DOM.dailyChallengeProgress) {
            DOM.dailyChallengeProgress.textContent = daily.challengeCompleted
                ? `Complete! +200 bonus ready`
                : `${daily.completed}/${totalTiles} complete`;
        }
        if (DOM.roomCode) DOM.roomCode.textContent = `ROOM ${gameState.roomId}`;
        if (DOM.activePlayerName) DOM.activePlayerName.textContent = gameState.currentUser.displayName;
        if (DOM.nextBestTile) {
            DOM.nextBestTile.textContent = snapshot.nextBestTile
                ? `Next best tile: #${snapshot.nextBestTile}`
                : "Next best tile: any";
        }
        this.renderBadgePreviews(snapshot.badges);
        this.renderProfileStats(snapshot);
        this.updateBoardTileStates(snapshot.tileStates || []);
        this.loadLeaderboard();
    },

    updateBoardTileStates(tileStates) {
        if (!Array.isArray(tileStates)) return;
        const stateByTile = new Map(tileStates.map((tile) => [Number(tile.tileId), tile.state]));
        document.querySelectorAll(".cell").forEach((cell) => {
            const tileId = Number(cell.dataset.tileIndex);
            const state = stateByTile.get(tileId) || "locked";
            cell.dataset.state = state;
            cell.classList.toggle("found", state === "matched");
        });
    },

    renderBadgePreviews(badges) {
        if (!DOM.badgePreviewList) return;
        DOM.badgePreviewList.innerHTML = "";
        if (!badges.length) {
            DOM.badgePreviewList.innerHTML = '<span class="text-xs text-amber-100">Keep scanning to unlock badges.</span>';
            return;
        }
        badges.slice(-6).forEach((badge) => {
            const badgeEl = document.createElement("div");
            badgeEl.className = "glass-badge bg-white/5 text-amber-100";
            badgeEl.textContent = `${badge.icon} ${badge.name}`;
            DOM.badgePreviewList.appendChild(badgeEl);
        });
    },

    renderProfileStats(snapshot) {
        if (DOM.lifetimeBadges) DOM.lifetimeBadges.textContent = String(snapshot.lifetime.badges.length);
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
            item.textContent = `${event.type} • ${new Date(event.timestamp).toLocaleTimeString()}`;
            DOM.activityFeed.appendChild(item);
        });
    },

    showScanSuccessModal(item, scoringResult) {
        if (!DOM.successModal) return;
        if (DOM.successArtwork) DOM.successArtwork.textContent = item.name;
        if (DOM.successArtist) DOM.successArtist.textContent = item.artist || "Unknown artist";
        if (DOM.successPoints) DOM.successPoints.textContent = `+${scoringResult.pointsEarned}`;
        if (DOM.successStreakBonus) DOM.successStreakBonus.textContent = `+${scoringResult.streakBonus}`;
        if (DOM.successBadge) {
            const firstBadge = scoringResult.unlockedBadges && scoringResult.unlockedBadges[0];
            if (firstBadge) {
                DOM.successBadge.classList.remove("hidden");
                DOM.successBadge.innerHTML = `<p class="text-xs text-amber-200">BADGE UNLOCKED</p><p class="text-amber-100 font-bold">${firstBadge.icon} ${firstBadge.name}</p>`;
            } else {
                DOM.successBadge.classList.add("hidden");
                DOM.successBadge.innerHTML = "";
            }
        }
        DOM.successModal.classList.remove("hidden");
    },

    hideScanSuccessModal() {
        if (DOM.successModal) DOM.successModal.classList.add("hidden");
    },

    showBadgeToast(badge) {
        if (!DOM.badgeToast || !badge) return;
        DOM.badgeToast.innerHTML = `<p class="text-xs text-amber-200">NEW BADGE</p><p class="font-bold text-amber-100">${badge.icon} ${badge.name}</p><p class="text-[11px] text-amber-200">${badge.description}</p>`;
        DOM.badgeToast.classList.remove("hidden");
        this.createParticles(window.innerWidth - 80, 120, "#fbbf24", 15);
        setTimeout(() => DOM.badgeToast.classList.add("hidden"), 2600);
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

    buildWinRuleContext({ snapshotBefore, snapshotAfter, tileIndex, scoreResult }) {
        const linesBefore = snapshotBefore && Array.isArray(snapshotBefore.bingoLines) ? snapshotBefore.bingoLines.length : 0;
        const linesAfter = snapshotAfter && Array.isArray(snapshotAfter.bingoLines) ? snapshotAfter.bingoLines.length : linesBefore;
        const tilesFound = snapshotAfter && Array.isArray(snapshotAfter.completedTiles) ? snapshotAfter.completedTiles.length : gameState.foundItems.size;
        const tilesTotal = gameState.settings.cardSize * gameState.settings.cardSize;
        const isBlackout = snapshotAfter && snapshotAfter.completionState === "blackout";
        const hasFullCard = Boolean(snapshotAfter && snapshotAfter.hasFullCard);
        const bingoComplete = hasFullCard || isBlackout;
        const roomVictory = Boolean(snapshotAfter && snapshotAfter.rank === 1 && bingoComplete);
        const dailyChallengeComplete = Boolean(snapshotAfter && snapshotAfter.daily && snapshotAfter.daily.challengeCompleted);
        return {
            tileMatched: true,
            tileConfirmed: true,
            tileId: String(tileIndex),
            roomId: gameState.roomId,
            streak: Number(snapshotAfter && snapshotAfter.streak) || 0,
            bestStreak: Number(snapshotAfter && snapshotAfter.bestSessionStreak) || 0,
            newLinesCompleted: Math.max(0, linesAfter - linesBefore),
            totalLinesCompleted: linesAfter,
            tilesFound,
            tilesTotal,
            bingoComplete,
            roomVictory,
            dailyChallengeComplete,
            badgeUnlockedId: scoreResult && Array.isArray(scoreResult.unlockedBadges) && scoreResult.unlockedBadges[0]
                ? scoreResult.unlockedBadges[0].id
                : undefined,
            sessionComplete: bingoComplete,
            scoreBefore: Number(snapshotBefore && snapshotBefore.points) || 0,
            scoreAfter: Number(snapshotAfter && snapshotAfter.points) || 0,
            roomRank: Number(snapshotAfter && snapshotAfter.rank) || undefined
        };
    },

    evaluateAndApplyWinLadder(payload) {
        if (!window.WinRulesLadder || typeof window.WinRulesLadder.evaluateWinRules !== "function") {
            return null;
        }
        const ctx = this.buildWinRuleContext(payload);
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
        document.body.classList.toggle("high-contrast", gameState.settings.highContrast);
        document.body.classList.toggle("reduced-motion", gameState.settings.reducedMotion);
        if (!DOM.board || !DOM.statusMsg) {
            console.error("Critical UI elements are missing; game cannot initialize safely.");
            return;
        }
        this.initGame();
        this.bindEvents();
        this.initGamification();
        this.loadLeaderboard();
        if (!localStorage.getItem("museumBingoTutorialSeen")) {
            this.showTutorialStep();
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
            item.textContent = "Leaderboard unavailable right now.";
            list.appendChild(item);
            return;
        }
        merged.forEach((player, i) => {
            const item = document.createElement("div");
            const isCurrent = player.userId === gameState.currentUser.uid;
            const streak = Number(player.streak) || 0;
            const bingoStatus = String(player.bingoStatus || "no_line").replaceAll("_", " ");
            item.className = `flex items-center justify-between p-3 glass-card ${isCurrent ? "bg-amber-400/10 border-amber-300/40" : "bg-white/5"}`;
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-amber-300 font-bold">#${i + 1}</span>
                    <span class="text-white">${player.playerName || player.displayName || "Player"}</span>
                    ${isCurrent ? '<span class="text-[10px] text-green-300">● NOW PLAYING</span>' : ""}
                </div>
                <div class="text-right">
                    <span class="text-amber-400 font-black block">${player.points || 0} pts</span>
                    <span class="text-[10px] text-amber-100 block">${player.completedTiles || 0} tiles • 🔥${streak}</span>
                    <span class="text-[10px] text-amber-200 block">${bingoStatus}</span>
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
        DOM.board.innerHTML = "";
        DOM.board.className = `col-span-3 grid ${size === 4 ? "grid-cols-4 gap-4" : "grid-cols-3 gap-6"} ${gameState.settings.compactMode ? "compact-mode" : ""}`;
        items.forEach((item, index) => {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.id = String(item.id);
            cell.dataset.tileIndex = String(index + 1);
            const isFound = gameState.foundItems.has(item.id);
            if (isFound) cell.classList.add("found");
            cell.innerHTML = `<span>${item.emoji || "🧩"}</span><div class="cell-name">${item.name}</div><div class="tile-meta">#${index + 1}</div>`;
            cell.onclick = () => this.selectCell(cell, item);
            DOM.board.appendChild(cell);
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
                saveSettings();
                this.initGamification();
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
                this.setStatusMessage("Need help? Hold steady, move closer, reduce glare, and try a slight angle change.");
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
        if (DOM.heatVisionBtn) DOM.heatVisionBtn.onclick = this.toggleHeatVision.bind(this);
        if (DOM.closeSuccessModal) DOM.closeSuccessModal.onclick = this.hideScanSuccessModal.bind(this);
        window.addEventListener("museum-bingo-near-match", (event) => {
            const now = Date.now();
            if (now - gameState.nearMatchPlayedAt < 1200) return;
            gameState.nearMatchPlayedAt = now;
            playSound(720, "triangle", 0.09, 0.06);
            if (DOM.scanGuidance && event && event.detail && Number.isFinite(event.detail.confidence)) {
                DOM.scanGuidance.textContent = `Near match (${event.detail.confidence}%). Hold steady and confirm when ready.`;
            }
        });
        window.addEventListener("beforeunload", this.cleanupCamera.bind(this));
    },

    selectCell(element, item) {
        if (element.classList.contains("found")) return;
        playGameSound("select");
        document.querySelectorAll(".cell").forEach((c) => c.classList.remove("active"));
        element.classList.add("active");
        gameState.selectedCell = { element, item };
        this.showRiddle(item.id);
        this.setStatusMessage(`<span class="text-lg">🎯</span> Find the <strong>${item.name}</strong>!`);
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
        if (gameState.gamification) {
            gameState.gamification.onHintUsed({
                tileId: Number(gameState.selectedCell.element.dataset.tileIndex || 0),
                reason: "next_riddle"
            });
        }
        const artId = gameState.selectedCell.item.id;
        const riddles = this.getRiddlesForArt(artId);
        gameState.currentRiddleIndex[artId] = (gameState.currentRiddleIndex[artId] + 1) % riddles.length;
        this.showRiddle(artId);
    },

    async handleScanClick() {
        if (!gameState.selectedCell || !gameState.selectedCell.item) {
            this.setStatusMessage("⚠️ Please select an art piece first!");
            return;
        }
        gameState.totalAttempts++;
        gameState.scanStartedAt = Date.now();
        if (DOM.scanGuidance) DOM.scanGuidance.textContent = "Scanning... hold steady and frame the artwork.";
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
            const result = await simulateAIDetection(DOM.cameraFeed, DOM.detectionCanvas, gameState.selectedCell.item);
            const confidence = Number(result && result.confidence);
            const detectionCount = Number(result && result.detectionCount) || 0;
            if (!Number.isFinite(confidence)) throw new Error("AI detection returned invalid confidence");
            gameState.aiDetections += detectionCount;
            if (DOM.confidenceFill) DOM.confidenceFill.style.width = `${Math.floor(Math.max(0, Math.min(confidence, 100)))}%`;
            if (confidence >= 80) this.showDetectionResult();
            else {
                const tileIndex = Number(gameState.selectedCell && gameState.selectedCell.element && gameState.selectedCell.element.dataset.tileIndex || 0);
                if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "confidence_low", confidence, tileId: tileIndex });
                this.setStatusMessage("Still searching. Try moving closer, reducing glare, or using a different angle.");
                if (DOM.scanGuidance) DOM.scanGuidance.textContent = "Low confidence: move closer and reduce reflections.";
                this.closeScannerModal();
            }
        } catch (err) {
            const tileIndex = Number(gameState.selectedCell && gameState.selectedCell.element && gameState.selectedCell.element.dataset.tileIndex || 0);
            if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "scanner_error", tileId: tileIndex });
            console.error("AI detection failed unexpectedly:", err);
            this.setStatusMessage("⚠️ Scanner unavailable right now. Please try again.");
            this.closeScannerModal();
        }
    },

    showDetectionResult() {
        if (!gameState.selectedCell || !gameState.selectedCell.item) return;
        const item = gameState.selectedCell.item;
        if (DOM.artInfo) DOM.artInfo.classList.remove("hidden");
        if (DOM.artEmoji) DOM.artEmoji.textContent = item.emoji;
        if (DOM.artName) DOM.artName.textContent = item.name;
        if (DOM.artFact) DOM.artFact.textContent = item.fact;
        if (DOM.confirmBtn) DOM.confirmBtn.classList.remove("hidden");
        if (DOM.scanGuidance) DOM.scanGuidance.textContent = "Match found. Confirm to validate this tile.";
        if (typeof speakText === "function") speakText(`Found ${item.name}! ${item.fact}`, 0.85);
    },

    async handleConfirmClick() {
        if (!gameState.selectedCell || !gameState.selectedCell.item) {
            this.setStatusMessage("⚠️ No selected object to validate.");
            return;
        }
        if (DOM.confirmBtn) {
            DOM.confirmBtn.disabled = true;
            DOM.confirmBtn.textContent = "VALIDATING...";
        }
        try {
            const item = gameState.selectedCell.item;
            const hasValidator = window.TechnicalEngine && typeof window.TechnicalEngine.validateArtwork === "function";
            if (!hasValidator) throw new Error("Validation engine is unavailable");
            const validation = await window.TechnicalEngine.validateArtwork(null, item);
            if (validation.success) {
                playGameSound("found");
                gameState.foundItems.add(item.id);
                gameState.successfulScans++;
                gameState.selectedCell.element.classList.add("found");
                gameState.selectedCell.element.classList.remove("active");
                this.addExp(50);
                this.stampPassport(item);

                const scanDuration = gameState.scanStartedAt ? (Date.now() - gameState.scanStartedAt) : Number.MAX_SAFE_INTEGER;
                const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
                const snapshotBefore = gameState.gamification ? gameState.gamification.getStateSnapshot() : null;
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
                this.closeScannerModal();
                this.setStatusMessage(`<span class="text-lg">✅</span> Great! You found the <strong>${item.name}</strong>!`);
                if (DOM.riddlePanel) DOM.riddlePanel.classList.add("hidden");
                this.updateStats();
                this.checkWin();

                if (scoreResult && scoreResult.accepted) {
                    const winResult = this.evaluateAndApplyWinLadder({
                        snapshotBefore,
                        snapshotAfter,
                        tileIndex,
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
                    if ((winResult && winResult.reward && winResult.reward.confetti && winResult.reward.confetti !== "none")
                        || scoreResult.firstLineBonus > 0
                        || scoreResult.fullCardBonus > 0) {
                        this.createParticles(window.innerWidth / 2, window.innerHeight / 2, "#fbbf24", 40);
                    }
                    if (!winResult && gameState.settings.vibrationEnabled && navigator.vibrate) navigator.vibrate([40, 20, 40]);
                }

                if (gameState.foundItems.size >= 3) {
                    const rewardsPanel = document.getElementById("rewards-panel");
                    if (rewardsPanel) rewardsPanel.classList.remove("hidden");
                }
            } else {
                const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
                if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "validator_rejected", tileId: tileIndex });
                this.setStatusMessage("Not quite yet. Try a closer shot with less glare.");
            }
        } catch (err) {
            const tileIndex = Number(gameState.selectedCell.element.dataset.tileIndex || 0);
            if (gameState.gamification) gameState.gamification.onScanFailed({ reason: "validator_error", tileId: tileIndex });
            console.error("Validation failed unexpectedly:", err);
            this.setStatusMessage("⚠️ Validation service error. Please scan again.");
        } finally {
            if (DOM.confirmBtn) {
                DOM.confirmBtn.disabled = false;
                DOM.confirmBtn.textContent = "✓ FOUND IT!";
            }
        }
    },

    closeScannerModal() {
        this.setElementHidden(DOM.scannerOverlay, true);
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
        this.initGame();
        this.initGamification();
        this.setStatusMessage("👉 Select an art piece to begin your journey");
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
        if (window.SessionSummary && typeof window.SessionSummary.buildSessionOutcome === "function" && snapshot && snapshot.session) {
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
                secondaryWinStates: gameState.lastWinStates
            });
        }
        DOM.finalStats.innerHTML = `
            <div class="flex justify-between mb-3 text-amber-100"><span>⏱️ Time:</span><strong class="text-amber-300">${elapsed}s</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>📊 Scans:</span><strong class="text-amber-300">${gameState.successfulScans}/${gameState.totalAttempts}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🏅 Points:</span><strong class="text-amber-300">${points}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🤖 AI Detections:</span><strong class="text-amber-300">${gameState.aiDetections}</strong></div>
            <div class="flex justify-between text-amber-100"><span>🎯 Accuracy:</span><strong class="text-amber-300">${scanAccuracy}%</strong></div>
        `;
        DOM.winModal.classList.remove("hidden");
        if (typeof speakText === "function") speakText("Congratulations! You won the museum bingo game!", 1);
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
        this.setStatusMessage(`<span class="text-2xl animate-bounce">🌟</span> LEVEL UP! You are now Level ${gameState.level}!`);
        if (typeof speakText === "function") speakText(`Level up! You are now level ${gameState.level}`);
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
            if (typeof speakText === "function") speakText("Heat vision activated. Look for the orange glow.");
            this.startHeatVisionLoop();
        } else {
            if (DOM.cameraFeed) DOM.cameraFeed.style.filter = "none";
            if (DOM.vrHud) DOM.vrHud.classList.add("hidden");
        }
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
