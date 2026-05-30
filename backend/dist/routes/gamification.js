"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/validate', auth_1.authenticateToken, async (req, res) => {
    const { museumId, tileId, artworkId, isNewLine, isBingo, newScore, newStreak, newBadges = [], previousScore = 0, } = req.body;
    const userId = req.user?.uid;
    const sessionId = req.headers['x-session-id'];
    if (!userId || !museumId || !tileId || typeof newScore !== 'number' || typeof newStreak !== 'number') {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
    }
    await firebase_1.db
        .collection('users')
        .doc(userId)
        .set({
        totalScore: newScore,
        currentStreak: newStreak,
        lastActionTimestamp: Date.now(),
    }, { merge: true });
    await firebase_1.db.collection('gamification_events').add({
        userId,
        museumId,
        sessionId: sessionId ?? null,
        tileId,
        artworkId: artworkId ?? null,
        eventType: 'tile_validated',
        isNewLine: Boolean(isNewLine),
        isBingo: Boolean(isBingo),
        scoreDelta: newScore - previousScore,
        streakAfter: newStreak,
        badgesUnlocked: newBadges,
        timestamp: Date.now(),
    });
    if (Array.isArray(newBadges) && newBadges.length > 0) {
        const batch = firebase_1.db.batch();
        for (const badge of newBadges) {
            const docRef = firebase_1.db.collection('users').doc(userId).collection('badges').doc();
            batch.set(docRef, badge);
        }
        await batch.commit();
    }
    await firebase_1.db
        .collection('leaderboards')
        .doc(`museum_${museumId}`)
        .set({
        [userId]: newScore,
    }, { merge: true });
    res.json({ success: true });
});
router.get('/leaderboard/:museumId', auth_1.authenticateToken, async (req, res) => {
    const { museumId } = req.params;
    const snapshot = await firebase_1.db.collection('leaderboards').doc(`museum_${museumId}`).get();
    const scores = (snapshot.data() || {});
    const leaderboard = Object.entries(scores)
        .map(([userId, score]) => ({ userId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);
    res.json(leaderboard);
});
router.get('/badges/:userId', auth_1.authenticateToken, async (req, res) => {
    const { userId } = req.params;
    const snapshot = await firebase_1.db.collection('users').doc(userId).collection('badges').get();
    const badges = snapshot.docs.map((doc) => doc.data());
    res.json(badges);
});
exports.default = router;
