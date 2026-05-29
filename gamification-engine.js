/**
 * Gamification Engine
 * Keeps game rules separate from rendering logic.
 */

const DEFAULT_SCORING_CONFIG = Object.freeze({
    hintDeductionPoints: 5,
    deductHintUsage: true
});

const EVENT_TYPES = Object.freeze({
    TILE_VALIDATED: "tile_validated",
    TILE_FAILED: "tile_failed",
    HINT_USED: "hint_used",
    STREAK_UPDATED: "streak_updated",
    BADGE_UNLOCKED: "badge_unlocked",
    BINGO_COMPLETED: "bingo_completed",
    ROOM_JOINED: "room_joined",
    ROOM_LEFT: "room_left",
    LEADERBOARD_CHANGED: "leaderboard_changed",
    SCAN_FAILED: "scan_failed"
});

function toSet(input) {
    if (input instanceof Set) return input;
    if (Array.isArray(input)) return new Set(input);
    return new Set();
}

function startOfDayIso(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function createGamificationEngine(config = {}) {
    const rules = window.BingoRules;
    if (!rules) throw new Error("BingoRules is required before creating the gamification engine.");

    const scoringConfig = { ...DEFAULT_SCORING_CONFIG, ...(config.scoring || {}) };
    const gridSize = Number(config.gridSize) || 3;
    const totalTiles = gridSize * gridSize;
    const listeners = new Set();
    const difficultyMode = config.difficultyMode || "standard";
    const roomMode = config.roomMode || "multiplayer";
    const dailyChallengeEnabled = config.dailyChallengeEnabled !== false;
    const streakResetMs = rules.DIFFICULTY_PRESETS[difficultyMode]
        ? rules.DIFFICULTY_PRESETS[difficultyMode].streakResetMs
        : rules.DIFFICULTY_PRESETS.standard.streakResetMs;

    const initialLifetime = {
        totalScans: 0,
        totalBingos: 0,
        totalMuseumsCompleted: 0,
        bestStreak: 0,
        badges: [],
        recentActivity: []
    };

    const state = {
        points: 0,
        streak: 0,
        bestSessionStreak: 0,
        completedTiles: new Set(),
        hintedTiles: new Set(),
        missedTiles: new Set(),
        bonusTiles: new Set(),
        bingoLines: new Set(),
        hasFullCard: false,
        completionState: rules.CARD_COMPLETION_STATES.NO_LINE,
        nextBestTile: null,
        badges: [],
        rank: null,
        rankDelta: 0,
        leaderboard: [],
        daily: {
            day: startOfDayIso(),
            completedTiles: new Set(),
            sessionsCompleted: 0,
            streakDays: 0,
            challengeCompleted: false
        },
        lifetime: { ...initialLifetime, ...(config.lifetime || {}) },
        session: {
            id: config.sessionId || `session_${Date.now()}`,
            startedAt: new Date().toISOString(),
            firstCompletionAt: null,
            museumId: config.museumId || "met_nyc",
            roomId: config.roomId || "DEMO42",
            userId: config.userId || "guest",
            playerName: config.playerName || "Guest",
            difficultyMode,
            roomMode,
            dailyChallengeEnabled
        },
        lastSuccessAt: null,
        events: []
    };

    state.lifetime.badges = Array.isArray(state.lifetime.badges) ? state.lifetime.badges : [];
    state.lifetime.recentActivity = Array.isArray(state.lifetime.recentActivity) ? state.lifetime.recentActivity : [];

    function emit(eventName, payload) {
        listeners.forEach((listener) => {
            try {
                listener(eventName, payload);
            } catch (err) {
                console.warn("Gamification listener failed:", err);
            }
        });
    }

    function pushEvent(type, payload = {}) {
        const event = {
            id: `${type}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
            type,
            sessionId: state.session.id,
            roomId: state.session.roomId,
            userId: state.session.userId,
            timestamp: new Date().toISOString(),
            payload
        };
        state.events.push(event);
        state.lifetime.recentActivity = [event, ...state.lifetime.recentActivity].slice(0, 12);
        emit("event", event);
        return event;
    }

    function getTileStates() {
        const tileStates = [];
        for (let tileId = 1; tileId <= totalTiles; tileId++) {
            let stateValue = rules.TILE_STATES.LOCKED;
            if (state.completedTiles.has(tileId)) stateValue = rules.TILE_STATES.MATCHED;
            else if (state.bonusTiles.has(tileId)) stateValue = rules.TILE_STATES.BONUS;
            else if (state.hintedTiles.has(tileId)) stateValue = rules.TILE_STATES.HINTED;
            else if (state.missedTiles.has(tileId)) stateValue = rules.TILE_STATES.MISSED;
            if (state.nextBestTile === tileId && !state.completedTiles.has(tileId)) {
                stateValue = rules.TILE_STATES.ACTIVE;
            }
            tileStates.push({ tileId, state: stateValue });
        }
        return tileStates;
    }

    function getStateSnapshot() {
        return {
            ...state,
            completedTiles: Array.from(state.completedTiles),
            hintedTiles: Array.from(state.hintedTiles),
            missedTiles: Array.from(state.missedTiles),
            bonusTiles: Array.from(state.bonusTiles),
            bingoLines: Array.from(state.bingoLines),
            tileStates: getTileStates(),
            daily: {
                ...state.daily,
                completedTiles: Array.from(state.daily.completedTiles)
            }
        };
    }

    function persistableState() {
        const snapshot = getStateSnapshot();
        return {
            points: snapshot.points,
            streak: snapshot.streak,
            bestSessionStreak: snapshot.bestSessionStreak,
            completedTiles: snapshot.completedTiles,
            hintedTiles: snapshot.hintedTiles,
            missedTiles: snapshot.missedTiles,
            bonusTiles: snapshot.bonusTiles,
            completionState: snapshot.completionState,
            lifetime: snapshot.lifetime,
            badges: snapshot.badges,
            daily: snapshot.daily,
            session: {
                difficultyMode: snapshot.session.difficultyMode,
                roomMode: snapshot.session.roomMode,
                dailyChallengeEnabled: snapshot.session.dailyChallengeEnabled
            }
        };
    }

    function getProgressRatio() {
        return state.completedTiles.size / totalTiles;
    }

    function getLineCount() {
        return state.bingoLines.size;
    }

    function ensureDailyWindow() {
        const today = startOfDayIso();
        if (state.daily.day === today) return;
        state.daily.day = today;
        state.daily.completedTiles = new Set();
        state.daily.sessionsCompleted = 0;
        state.daily.challengeCompleted = false;
    }

    function recalculateCompletionState() {
        const completedLines = rules.getCompletedLines(state.completedTiles, gridSize);
        state.bingoLines = new Set(completedLines);
        state.completionState = rules.getCardCompletionState({
            completedLinesCount: completedLines.length,
            completedTilesCount: state.completedTiles.size,
            totalTiles
        });
        state.hasFullCard = rules.isFullBoardComplete(state.completedTiles, totalTiles);
        state.nextBestTile = rules.getNextBestTileHint(state.completedTiles, gridSize);
    }

    function addBadge(badgeDefinition) {
        if (!badgeDefinition || !badgeDefinition.id) return null;
        const existsInSession = state.badges.some((b) => b.id === badgeDefinition.id);
        if (existsInSession) return null;
        const badge = {
            id: badgeDefinition.id,
            name: badgeDefinition.name,
            description: badgeDefinition.description,
            icon: badgeDefinition.icon,
            rarity: badgeDefinition.rarity,
            earnedAt: new Date().toISOString()
        };
        state.badges.push(badge);
        if (!state.lifetime.badges.some((b) => b.id === badge.id)) {
            state.lifetime.badges.push(badge);
        }
        pushEvent(EVENT_TYPES.BADGE_UNLOCKED, { badgeId: badge.id, badgeName: badge.name });
        return badge;
    }

    function evaluateAchievements(context) {
        const unlocked = [];
        const candidateBadges = rules.evaluateBadgeUnlocks({
            lifetimeScans: state.lifetime.totalScans,
            completedTiles: state.completedTiles.size,
            lineCount: state.bingoLines.size,
            isFullCard: state.hasFullCard,
            scanDurationMs: context.scanDurationMs || Number.MAX_SAFE_INTEGER,
            streak: state.streak,
            rank: state.rank,
            awardedBadgeIds: state.badges.map((badge) => badge.id)
        });
        candidateBadges.forEach((candidate) => {
            const badge = addBadge(candidate);
            if (badge) unlocked.push(badge);
        });
        return unlocked;
    }

    function applyLeaderboard(entries) {
        const previousRank = state.rank || null;
        const sorted = [...entries].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return (a.firstCompletionAt || Number.MAX_SAFE_INTEGER) - (b.firstCompletionAt || Number.MAX_SAFE_INTEGER);
        });
        state.leaderboard = sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
        const myEntry = state.leaderboard.find((entry) => entry.userId === state.session.userId);
        if (myEntry) {
            state.rank = myEntry.rank;
            state.rankDelta = previousRank ? previousRank - myEntry.rank : 0;
        }
        pushEvent(EVENT_TYPES.LEADERBOARD_CHANGED, {
            rank: state.rank,
            rankDelta: state.rankDelta,
            totalPlayers: state.leaderboard.length
        });
        evaluateAchievements({ scanDurationMs: Number.MAX_SAFE_INTEGER });
    }

    function getDailyProgress() {
        return {
            completed: state.daily.completedTiles.size,
            total: totalTiles,
            streakDays: state.daily.streakDays,
            challengeCompleted: state.daily.challengeCompleted
        };
    }

    function onHintUsed(payload = {}) {
        const tileId = Number(payload.tileId);
        if (Number.isInteger(tileId) && tileId >= 1 && tileId <= totalTiles && !state.completedTiles.has(tileId)) {
            state.hintedTiles.add(tileId);
        }
        pushEvent(EVENT_TYPES.HINT_USED, payload);
    }

    function onScanFailed(payload = {}) {
        const previous = state.streak;
        state.streak = 0;
        const tileId = Number(payload.tileId);
        if (Number.isInteger(tileId) && tileId >= 1 && tileId <= totalTiles && !state.completedTiles.has(tileId)) {
            state.missedTiles.add(tileId);
        }
        pushEvent(EVENT_TYPES.SCAN_FAILED, payload);
        pushEvent(EVENT_TYPES.TILE_FAILED, payload);
        pushEvent(EVENT_TYPES.STREAK_UPDATED, {
            previous,
            current: state.streak,
            change: rules.detectStreakChange(previous, state.streak)
        });
    }

    function onRoomJoined(payload = {}) {
        pushEvent(EVENT_TYPES.ROOM_JOINED, {
            ...payload,
            roomMode: state.session.roomMode
        });
    }

    function onRoomLeft(payload = {}) {
        pushEvent(EVENT_TYPES.ROOM_LEFT, payload);
    }

    function onTileValidated(payload = {}) {
        ensureDailyWindow();

        const now = Date.now();
        const shouldResetStreak = state.lastSuccessAt && ((now - state.lastSuccessAt) > streakResetMs);
        const streakBeforeValidation = shouldResetStreak ? 0 : state.streak;
        if (shouldResetStreak) state.streak = 0;

        const result = rules.calculateScoreAfterValidation({
            completedTilesBefore: state.completedTiles,
            tileId: Number(payload.tileId),
            gridSize,
            streakBefore: streakBeforeValidation,
            usedHint: scoringConfig.deductHintUsage && Boolean(payload.usedHint),
            hasFullCardBefore: state.hasFullCard,
            difficultyMode: state.session.difficultyMode
        });

        if (!result.accepted) {
            return { accepted: false, reason: result.reason || "duplicate_or_invalid_tile" };
        }

        state.completedTiles = toSet(result.completedTilesAfter);
        state.daily.completedTiles.add(Number(payload.tileId));
        const previousStreak = state.streak;
        state.streak = result.streakAfter;
        state.lastSuccessAt = now;
        state.bestSessionStreak = Math.max(state.bestSessionStreak, state.streak);
        state.lifetime.bestStreak = Math.max(state.lifetime.bestStreak, state.streak);
        state.lifetime.totalScans += 1;

        recalculateCompletionState();

        let pointsEarned = result.score.pointsEarned;
        if (state.bonusTiles.has(Number(payload.tileId))) {
            pointsEarned += 30;
            state.bonusTiles.delete(Number(payload.tileId));
        }
        state.points += pointsEarned;

        if (result.score.lineBonus > 0) {
            pushEvent(EVENT_TYPES.BINGO_COMPLETED, {
                lines: state.bingoLines.size,
                completionState: state.completionState
            });
            state.lifetime.totalBingos += 1;
        }

        if (state.hasFullCard) {
            state.lifetime.totalMuseumsCompleted += 1;
            state.daily.sessionsCompleted += 1;
            if (dailyChallengeEnabled && !state.daily.challengeCompleted) {
                state.daily.challengeCompleted = true;
                state.daily.streakDays += 1;
            }
        }

        if (!state.session.firstCompletionAt) {
            state.session.firstCompletionAt = now;
        }

        const event = pushEvent(EVENT_TYPES.TILE_VALIDATED, {
            tileId: payload.tileId,
            artworkName: payload.artworkName || null,
            artist: payload.artist || null,
            pointsEarned,
            streak: state.streak,
            streakBonus: result.score.streakBonus,
            lineBonus: result.score.lineBonus,
            fullCardBonus: result.score.fullCardBonus,
            hintPenalty: result.score.hintPenalty
        });

        pushEvent(EVENT_TYPES.STREAK_UPDATED, {
            previous: previousStreak,
            current: state.streak,
            change: rules.detectStreakChange(previousStreak, state.streak)
        });

        const unlockedBadges = evaluateAchievements({ scanDurationMs: payload.scanDurationMs || Number.MAX_SAFE_INTEGER });

        return {
            accepted: true,
            pointsEarned,
            streak: state.streak,
            streakBonus: result.score.streakBonus,
            firstLineBonus: result.score.lineBonus,
            fullCardBonus: result.score.fullCardBonus,
            hintPenalty: result.score.hintPenalty,
            completedTiles: state.completedTiles.size,
            totalTiles,
            hasFullCard: state.hasFullCard,
            bingoLines: state.bingoLines.size,
            completionState: state.completionState,
            nextBestTile: state.nextBestTile,
            unlockedBadges,
            event
        };
    }

    function getRoomEntry() {
        return {
            userId: state.session.userId,
            playerName: state.session.playerName,
            points: state.points,
            completedTiles: state.completedTiles.size,
            streak: state.streak,
            bingoStatus: state.completionState,
            firstCompletionAt: state.session.firstCompletionAt || Number.MAX_SAFE_INTEGER
        };
    }

    function hydrate(savedState = {}) {
        if (savedState && typeof savedState === "object") {
            state.points = Number(savedState.points) || 0;
            state.streak = Number(savedState.streak) || 0;
            state.bestSessionStreak = Number(savedState.bestSessionStreak) || 0;
            state.completedTiles = toSet(savedState.completedTiles);
            state.hintedTiles = toSet(savedState.hintedTiles);
            state.missedTiles = toSet(savedState.missedTiles);
            state.bonusTiles = toSet(savedState.bonusTiles);
            state.completionState = savedState.completionState || state.completionState;
            state.lifetime = {
                ...state.lifetime,
                ...(savedState.lifetime || {})
            };
            state.badges = Array.isArray(savedState.badges) ? savedState.badges : [];
            if (savedState.daily) {
                state.daily = {
                    ...state.daily,
                    ...savedState.daily,
                    completedTiles: toSet(savedState.daily.completedTiles)
                };
            }
            if (savedState.session) {
                state.session = {
                    ...state.session,
                    ...savedState.session
                };
            }
            recalculateCompletionState();
        }
    }

    recalculateCompletionState();

    return {
        config: scoringConfig,
        events: EVENT_TYPES,
        achievements: rules.BADGE_DEFINITIONS,
        on: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        onTileValidated,
        onHintUsed,
        onScanFailed,
        onRoomJoined,
        onRoomLeft,
        applyLeaderboard,
        getRoomEntry,
        getDailyProgress,
        getProgressRatio,
        getLineCount,
        getStateSnapshot,
        persistableState,
        hydrate
    };
}

window.GamificationEngine = {
    createGamificationEngine,
    EVENT_TYPES,
    ACHIEVEMENT_DEFINITIONS: window.BingoRules ? window.BingoRules.BADGE_DEFINITIONS : [],
    DEFAULT_SCORING_CONFIG
};
