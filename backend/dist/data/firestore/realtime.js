"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToGameSession = subscribeToGameSession;
exports.validateTile = validateTile;
exports.createMultiplayerRoom = createMultiplayerRoom;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../../config/firebase");
const schema_1 = require("./schema");
function subscribeToGameSession(sessionId, onUpdate) {
    const doc = schema_1.gameSessionsCollection.doc(sessionId);
    const unsubscribe = doc.onSnapshot((snapshot) => {
        if (!snapshot.exists) {
            return;
        }
        onUpdate({ id: snapshot.id, ...snapshot.data() });
    });
    return unsubscribe;
}
async function validateTile(sessionId, userId, tileId) {
    const sessionRef = schema_1.gameSessionsCollection.doc(sessionId);
    const userRef = schema_1.usersCollection.doc(userId);
    return firebase_1.db.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists) {
            throw new Error('Session not found');
        }
        const session = sessionDoc.data();
        const completedTiles = session.completedTiles || [];
        const score = session.score || 0;
        if (completedTiles.includes(tileId)) {
            return { success: false, newScore: score };
        }
        const newScore = score + 10;
        transaction.update(sessionRef, {
            completedTiles: firestore_1.FieldValue.arrayUnion(tileId),
            score: newScore,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        transaction.set(userRef, {
            totalBingos: firestore_1.FieldValue.increment(1),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { success: true, newScore };
    });
}
async function createMultiplayerRoom(museumId, ownerId, ownerName) {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const roomRef = schema_1.multiplayerRoomsCollection.doc(roomId);
    await roomRef.set({
        roomId,
        museumId,
        ownerId,
        players: {
            [ownerId]: { userId: ownerId, displayName: ownerName, score: 0 },
        },
        status: 'waiting',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return roomId;
}
