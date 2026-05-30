"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlayerScore = updatePlayerScore;
exports.markTileCompleted = markTileCompleted;
exports.getLeaderboard = getLeaderboard;
const firebase_1 = require("../config/firebase");
/**
 * Ephemeral leaderboard data for low-latency updates.
 * /rooms/{roomId}/scores/{userId} = number
 * /rooms/{roomId}/progress/{userId}/{tileId} = true
 */
async function updatePlayerScore(roomId, userId, newScore) {
    await firebase_1.rtdb.ref(`rooms/${roomId}/scores/${userId}`).set(newScore);
}
async function markTileCompleted(roomId, userId, tileId) {
    await firebase_1.rtdb.ref(`rooms/${roomId}/progress/${userId}/${tileId}`).set(true);
}
async function getLeaderboard(roomId) {
    const snapshot = await firebase_1.rtdb.ref(`rooms/${roomId}/scores`).once('value');
    const scores = (snapshot.val() || {});
    return Object.entries(scores)
        .map(([userId, score]) => ({ userId, score: Number(score) || 0 }))
        .sort((a, b) => b.score - a.score);
}
