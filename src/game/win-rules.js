/**
 * Pure win ladder rules engine.
 * Input: current gameplay context
 * Output: states, events, reward payload, and progress labels
 */

function winNow() {
    return Date.now();
}

function evaluateWinRules(ctx) {
    const states = [];
    const events = [];
    let points = Math.max(0, Number(ctx.scoreAfter) - Number(ctx.scoreBefore));
    let confetti = "none";
    let haptic = "light";
    let sound = "tick";

    if (ctx.tileMatched) {
        states.push("TILE_FOUND");
        events.push({
            type: "tile_found",
            state: "TILE_FOUND",
            tileId: ctx.tileId,
            scoreDelta: points,
            timestamp: winNow()
        });
        sound = "pop";
    }

    if (ctx.tileConfirmed) {
        states.push("TILE_CONFIRMED");
        events.push({
            type: "tile_confirmed",
            state: "TILE_CONFIRMED",
            tileId: ctx.tileId,
            scoreDelta: points,
            timestamp: winNow()
        });
        haptic = "light";
    }

    if (ctx.streak > 0) {
        states.push("STREAK_ACTIVE");
        events.push({
            type: "streak_changed",
            state: "STREAK_ACTIVE",
            scoreDelta: 0,
            timestamp: winNow(),
            details: { streak: ctx.streak }
        });

        if (ctx.streak >= 3) {
            states.push("STREAK_BONUS");
            events.push({
                type: "streak_changed",
                state: "STREAK_BONUS",
                scoreDelta: 0,
                timestamp: winNow(),
                details: { streak: ctx.streak, bonus: true }
            });
            points += Math.min(25, ctx.streak * 3);
            sound = "ding";
            haptic = "medium";
        }
    }

    if (ctx.newLinesCompleted === 1) {
        states.push("LINE_COMPLETE");
        events.push({
            type: "line_completed",
            state: "LINE_COMPLETE",
            lineId: "line-1",
            scoreDelta: 0,
            timestamp: winNow()
        });
        points += 50;
        confetti = "soft";
        sound = "ding";
        haptic = "medium";
    }

    if (ctx.totalLinesCompleted >= 2) {
        states.push("TWO_LINES_COMPLETE");
        events.push({
            type: "line_completed",
            state: "TWO_LINES_COMPLETE",
            scoreDelta: 0,
            timestamp: winNow(),
            details: { totalLinesCompleted: ctx.totalLinesCompleted }
        });
        points += 75;
        confetti = "soft";
        sound = "ding";
    }

    if (ctx.tilesFound > 0 && ctx.tilesFound < ctx.tilesTotal) {
        states.push("FULL_CARD_PROGRESS");
        events.push({
            type: "card_progress",
            state: "FULL_CARD_PROGRESS",
            scoreDelta: 0,
            timestamp: winNow(),
            details: { tilesFound: ctx.tilesFound, tilesTotal: ctx.tilesTotal }
        });
    }

    if (ctx.bingoComplete) {
        states.push("BINGO_COMPLETE");
        events.push({
            type: "bingo_completed",
            state: "BINGO_COMPLETE",
            scoreDelta: 0,
            timestamp: winNow()
        });
        points += 150;
        confetti = "big";
        sound = "fanfare";
        haptic = "heavy";
    }

    if (ctx.roomVictory) {
        states.push("ROOM_VICTORY");
        events.push({
            type: "room_victory",
            state: "ROOM_VICTORY",
            roomId: ctx.roomId || "room",
            scoreDelta: 0,
            timestamp: winNow()
        });
        points += 100;
        confetti = "big";
        sound = "fanfare";
    }

    if (ctx.dailyChallengeComplete) {
        states.push("DAILY_CHALLENGE_COMPLETE");
        events.push({
            type: "daily_challenge_complete",
            state: "DAILY_CHALLENGE_COMPLETE",
            scoreDelta: 0,
            timestamp: winNow()
        });
        points += 125;
        confetti = "big";
    }

    if (ctx.badgeUnlockedId) {
        states.push("BADGE_UNLOCKED");
        events.push({
            type: "badge_unlocked",
            state: "BADGE_UNLOCKED",
            badgeId: ctx.badgeUnlockedId,
            scoreDelta: 0,
            timestamp: winNow()
        });
        sound = "ding";
    }

    if (ctx.sessionComplete) {
        states.push("SESSION_COMPLETE");
        events.push({
            type: "session_complete",
            state: "SESSION_COMPLETE",
            scoreDelta: 0,
            timestamp: winNow()
        });
        sound = "fanfare";
        confetti = "big";
    }

    const nextObjective = ctx.bingoComplete
        ? "Collect your recap and badges"
        : ctx.totalLinesCompleted > 0
            ? "Finish another line"
            : ctx.streak > 0
                ? "Keep the streak alive"
                : "Find the next tile";

    const progressLabel = ctx.tilesFound >= ctx.tilesTotal
        ? "Card complete"
        : `${ctx.tilesFound}/${ctx.tilesTotal} tiles`;

    return {
        states,
        events,
        reward: {
            points,
            confetti,
            haptic,
            sound
        },
        nextObjective,
        progressLabel
    };
}

function buildProgressSnapshot(input) {
    return {
        tilesFound: input.tilesFound,
        tilesTotal: input.tilesTotal,
        streak: input.streak,
        bestStreak: input.bestStreak,
        lineCount: input.lineCount,
        bingoComplete: input.bingoComplete,
        currentScore: input.currentScore,
        roomPosition: input.roomPosition,
        dailyChallengeComplete: input.dailyChallengeComplete,
        hasFullCard: input.hasFullCard
    };
}

window.WinRulesLadder = {
    evaluateWinRules,
    buildProgressSnapshot
};
