"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onArtworkCreated = onArtworkCreated;
exports.onMultiplayerRoomActivated = onMultiplayerRoomActivated;
exports.syncScoresToFirestore = syncScoresToFirestore;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../../config/firebase");
const client_1 = __importStar(require("../redis/client"));
const client_2 = require("../s3/client");
async function onArtworkCreated(snapshot) {
    const artwork = snapshot.data();
    if (!artwork || artwork.imageS3Key || !artwork.tempImageBase64) {
        return;
    }
    const museumId = String(artwork.museumId || '');
    const artworkId = String(artwork.id || '');
    if (!museumId || !artworkId) {
        return;
    }
    const imageBuffer = Buffer.from(String(artwork.tempImageBase64), 'base64');
    const s3Key = await (0, client_2.uploadArtworkImage)(museumId, artworkId, imageBuffer);
    await snapshot.ref.update({
        imageS3Key: s3Key,
        tempImageBase64: firestore_1.FieldValue.delete(),
    });
}
async function onMultiplayerRoomActivated(roomId) {
    const roomDoc = await firebase_1.db.collection('multiplayer_rooms').doc(roomId).get();
    if (!roomDoc.exists) {
        return;
    }
    await (0, client_1.setRoomState)(roomId, {
        ...roomDoc.data(),
        cachedAt: Date.now(),
    });
}
async function syncScoresToFirestore(roomId) {
    const scores = await client_1.default.hgetall(`room:${roomId}:scores`);
    const roomRef = firebase_1.db.collection('multiplayer_rooms').doc(roomId);
    const batch = firebase_1.db.batch();
    for (const [userId, score] of Object.entries(scores)) {
        batch.update(roomRef, {
            [`players.${userId}.score`]: parseInt(score, 10),
        });
    }
    await batch.commit();
}
