/**
 * Session recap builder.
 */

function buildSessionOutcome(input) {
    const headline = input.primaryWinState === "BINGO_COMPLETE"
        ? "Bingo!"
        : input.primaryWinState === "ROOM_VICTORY"
            ? "Room Victory!"
            : "Session Complete";

    const shareText = `I scored ${input.totalScore} in Museum.Bingo with ${input.tilesFound} tiles, ${input.linesCompleted} lines, and ${input.streakBest} best streak.`;

    return {
        primaryWinState: input.primaryWinState,
        secondaryWinStates: input.secondaryWinStates || [],
        recapHeadline: headline,
        shareText,
        summary: {
            sessionId: input.sessionId,
            userId: input.userId,
            museumId: input.museumId,
            roomId: input.roomId,
            totalScore: input.totalScore,
            tilesFound: input.tilesFound,
            streakBest: input.streakBest,
            linesCompleted: input.linesCompleted,
            bingosCompleted: input.bingosCompleted,
            badgesEarned: input.badgesEarned,
            durationMs: input.durationMs,
            favoriteArtworkId: input.favoriteArtworkId,
            rankInRoom: input.rankInRoom
        }
    };
}

window.SessionSummary = {
    buildSessionOutcome
};
