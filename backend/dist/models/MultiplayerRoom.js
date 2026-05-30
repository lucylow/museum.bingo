"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.getRoom = getRoom;
exports.startGame = startGame;
const firebase_1 = require("../config/firebase");
const roomsCollection = firebase_1.db.collection('multiplayer_rooms');
function createRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
async function createRoom(ownerId, displayName, museumId, bingoCard, isPersonalized = false) {
    const roomId = createRoomId();
    const roomData = {
        roomId,
        museumId,
        ownerId,
        bingoCard,
        isPersonalized,
        status: 'waiting',
        createdAt: firebase_1.Timestamp.now(),
        players: {
            [ownerId]: {
                userId: ownerId,
                displayName,
                score: 0,
                completedTiles: [],
                joinedAt: firebase_1.Timestamp.now(),
            },
        },
    };
    await roomsCollection.doc(roomId).set(roomData);
    return roomId;
}
async function joinRoom(roomId, userId, displayName) {
    const roomRef = roomsCollection.doc(roomId);
    const doc = await roomRef.get();
    if (!doc.exists) {
        return null;
    }
    const room = doc.data();
    if (room.status !== 'waiting') {
        return null;
    }
    const existingPlayer = room.players[userId];
    const playerRecord = existingPlayer || {
        userId,
        displayName,
        score: 0,
        completedTiles: [],
        joinedAt: firebase_1.Timestamp.now(),
    };
    await roomRef.update({
        [`players.${userId}`]: playerRecord,
    });
    const refreshed = await roomRef.get();
    return refreshed.exists ? refreshed.data() : null;
}
async function getRoom(roomId) {
    const doc = await roomsCollection.doc(roomId).get();
    return doc.exists ? doc.data() : null;
}
async function startGame(roomId) {
    await roomsCollection.doc(roomId).update({
        status: 'playing',
        startedAt: firebase_1.Timestamp.now(),
    });
}
