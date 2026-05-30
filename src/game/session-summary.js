/**
 * Session recap builder.
 */

function buildSessionOutcome(input) {
    const i18n = window.I18n;
    const t = (key, params = {}) => (i18n && typeof i18n.t === "function" ? i18n.t(key, params) : key);
    const headline = input.primaryWinState === "BINGO_COMPLETE"
        ? t("rewards.bingoComplete")
        : input.primaryWinState === "ROOM_VICTORY"
            ? t("multiplayer.title")
            : t("rewards.missionComplete");

    const shareText = `Museum.Bingo · ${t("stats.points", { count: input.totalScore })} · ${t("stats.tiles", { count: input.tilesFound })} · ${t("stats.streak", { count: input.streakBest })}`;

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
            rankInRoom: input.rankInRoom,
            activeGuideId: input.activeGuideId,
            activeGuideName: input.activeGuideName,
            mostUsefulGuideTip: input.mostUsefulGuideTip,
            whatYouLearned: input.whatYouLearned || [],
            nextTimeSuggestion: input.nextTimeSuggestion || ""
        }
    };
}

window.SessionSummary = {
    buildSessionOutcome
};
