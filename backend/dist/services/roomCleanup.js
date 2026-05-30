"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlayerDisconnect = handlePlayerDisconnect;
exports.clearDisconnectedMarker = clearDisconnectedMarker;
const firebase_1 = require("../config/firebase");
const DISCONNECT_TIMEOUT_MS = 2 * 60 * 1000;
function handlePlayerDisconnect(io, roomId, userId) {
    const roomRef = firebase_1.db.collection('multiplayer_rooms').doc(roomId);
    const disconnectedRef = roomRef.collection('disconnected').doc(userId);
    void disconnectedRef.set({ disconnectedAt: firebase_1.FieldValue.serverTimestamp() }, { merge: true });
    setTimeout(async () => {
        const disconnectedDoc = await disconnectedRef.get();
        if (!disconnectedDoc.exists) {
            return;
        }
        const disconnectedAt = disconnectedDoc.data()?.disconnectedAt;
        if (!disconnectedAt) {
            return;
        }
        const elapsed = Date.now() - disconnectedAt.toMillis();
        if (elapsed < DISCONNECT_TIMEOUT_MS) {
            return;
        }
        await roomRef.update({
            [`players.${userId}`]: firebase_1.FieldValue.delete(),
        });
        await disconnectedRef.delete();
        io.to(`room:${roomId}`).emit('player-left', { userId });
    }, DISCONNECT_TIMEOUT_MS);
}
async function clearDisconnectedMarker(roomId, userId) {
    await firebase_1.db.collection('multiplayer_rooms').doc(roomId).collection('disconnected').doc(userId).delete();
}
