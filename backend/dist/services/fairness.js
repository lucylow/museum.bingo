"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePersonalizedCard = generatePersonalizedCard;
exports.createPersonalizedRoom = createPersonalizedRoom;
exports.addPlayerWithPersonalizedCard = addPlayerWithPersonalizedCard;
const firebase_1 = require("../config/firebase");
function generatePersonalizedCard(basePrompts, size) {
    const shuffled = [...basePrompts];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, size * size);
    const card = [];
    for (let row = 0; row < size; row += 1) {
        card.push(selected.slice(row * size, (row + 1) * size));
    }
    return card;
}
async function createPersonalizedRoom(ownerId, displayName, museumId, basePrompts, size) {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ownerCard = generatePersonalizedCard(basePrompts, size);
    const roomRef = firebase_1.db.collection('multiplayer_rooms').doc(roomId);
    await roomRef.set({
        roomId,
        museumId,
        ownerId,
        isPersonalized: true,
        status: 'waiting',
        createdAt: firebase_1.FieldValue.serverTimestamp(),
        players: {
            [ownerId]: {
                userId: ownerId,
                displayName,
                score: 0,
                completedTiles: [],
                joinedAt: firebase_1.FieldValue.serverTimestamp(),
            },
        },
    });
    await roomRef.collection('playerCards').doc(ownerId).set({ card: ownerCard });
    return roomId;
}
async function addPlayerWithPersonalizedCard(roomId, userId, displayName, basePrompts, size) {
    const card = generatePersonalizedCard(basePrompts, size);
    const roomRef = firebase_1.db.collection('multiplayer_rooms').doc(roomId);
    await roomRef.update({
        [`players.${userId}`]: {
            userId,
            displayName,
            score: 0,
            completedTiles: [],
            joinedAt: firebase_1.FieldValue.serverTimestamp(),
        },
    });
    await roomRef.collection('playerCards').doc(userId).set({ card });
}
