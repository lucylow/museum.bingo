"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const dayKey = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);
const monthKey = (timestamp) => new Date(timestamp).toISOString().slice(0, 7);
const weekKey = (timestamp) => {
    const date = new Date(timestamp);
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};
const round1 = (value) => Math.round(value * 10) / 10;
const validateEvent = (event) => Boolean(event &&
    typeof event.id === 'string' &&
    event.id.length > 3 &&
    typeof event.type === 'string' &&
    typeof event.timestamp === 'number' &&
    typeof event.userId === 'string' &&
    typeof event.sessionId === 'string');
router.post('/events/batch', auth_1.authenticateToken, async (req, res) => {
    const authUser = req.user;
    const events = (req.body.events ?? []).filter(validateEvent);
    if (!authUser) {
        res.status(401).json({ acceptedEventIds: [] });
        return;
    }
    if (events.length === 0) {
        res.json({ acceptedEventIds: [] });
        return;
    }
    const acceptedEventIds = [];
    for (const event of events) {
        if (event.userId !== authUser.uid) {
            continue;
        }
        const eventRef = firebase_1.db.collection('users').doc(authUser.uid).collection('gameplay_events').doc(event.id);
        try {
            await eventRef.create({
                ...event,
                createdAt: Date.now(),
            });
            acceptedEventIds.push(event.id);
            if (event.museumId) {
                await firebase_1.db
                    .collection('users')
                    .doc(authUser.uid)
                    .collection('museum_stats')
                    .doc(event.museumId)
                    .set({
                    museumId: event.museumId,
                    lastPlayedAt: event.timestamp,
                    artworksScanned: firebase_1.FieldValue.increment(event.type === 'scan_started' ? 1 : 0),
                    tilesCompleted: firebase_1.FieldValue.increment(event.type === 'tile_completed' ? 1 : 0),
                    hintsUsed: firebase_1.FieldValue.increment(event.type === 'hint_used' ? 1 : 0),
                    badgesEarned: firebase_1.FieldValue.increment(event.type === 'badge_unlocked' ? 1 : 0),
                }, { merge: true });
            }
            if (event.roomId) {
                await firebase_1.db
                    .collection('users')
                    .doc(authUser.uid)
                    .collection('room_stats')
                    .doc(event.roomId)
                    .set({
                    roomId: event.roomId,
                    lastPlayedAt: event.timestamp,
                    playersJoined: firebase_1.FieldValue.increment(event.type === 'room_joined' ? 1 : 0),
                    activePlayers: firebase_1.FieldValue.increment(event.type === 'room_joined' ? 1 : event.type === 'room_left' ? -1 : 0),
                    totalTilesCompletedByRoom: firebase_1.FieldValue.increment(event.type === 'tile_completed' ? 1 : 0),
                }, { merge: true });
            }
        }
        catch {
            // Duplicate event IDs are intentionally ignored for idempotency.
        }
    }
    res.json({ acceptedEventIds });
});
router.post('/sessions/batch', auth_1.authenticateToken, async (req, res) => {
    const authUser = req.user;
    const sessions = (req.body.sessions ?? []);
    if (!authUser) {
        res.status(401).json({ acceptedSessionIds: [] });
        return;
    }
    if (sessions.length === 0) {
        res.json({ acceptedSessionIds: [] });
        return;
    }
    const acceptedSessionIds = [];
    for (const session of sessions) {
        if (!session || session.userId !== authUser.uid || !session.sessionId) {
            continue;
        }
        const sessionRef = firebase_1.db.collection('users').doc(authUser.uid).collection('gameplay_sessions').doc(session.sessionId);
        try {
            await sessionRef.create({
                ...session,
                createdAt: Date.now(),
            });
            acceptedSessionIds.push(session.sessionId);
            const totalsRef = firebase_1.db.collection('users').doc(authUser.uid).collection('gameplay_stats').doc('lifetime');
            const sessionStartedAt = typeof session.startedAt === 'number' ? session.startedAt : Date.now();
            const day = dayKey(sessionStartedAt);
            const week = weekKey(sessionStartedAt);
            const month = monthKey(sessionStartedAt);
            await totalsRef.set({
                userId: authUser.uid,
                totalSessions: firebase_1.FieldValue.increment(1),
                totalMuseumsVisited: firebase_1.FieldValue.increment(session.museumId ? 1 : 0),
                totalScans: firebase_1.FieldValue.increment(session.scansMade || 0),
                totalValidatedScans: firebase_1.FieldValue.increment(session.validatedScans || 0),
                totalFailedScans: firebase_1.FieldValue.increment(session.failedScans || 0),
                totalTilesCompleted: firebase_1.FieldValue.increment(session.tilesCompleted || 0),
                totalBingos: firebase_1.FieldValue.increment(session.bingosCompleted || 0),
                totalFullCardCompletions: firebase_1.FieldValue.increment(session.fullCardCompletions || 0),
                totalHintsUsed: firebase_1.FieldValue.increment(session.hintsUsed || 0),
                totalBadges: firebase_1.FieldValue.increment(session.badgesEarned || 0),
                totalRoomsJoined: firebase_1.FieldValue.increment(session.roomId ? 1 : 0),
                totalPoints: firebase_1.FieldValue.increment(session.pointsEarned || 0),
                bestStreak: firebase_1.FieldValue.increment(0),
                averageAccuracy: round1(session.accuracy || 0),
                averageTimeToValidateMs: session.averageTimeToValidateMs || 0,
                favoriteMuseum: session.museumId || null,
                fastestBingoCompletionMs: session.totalSessionDurationMs || null,
                [`dailySummaries.${day}`]: firebase_1.FieldValue.increment(session.pointsEarned || 0),
                [`weeklySummaries.${week}`]: firebase_1.FieldValue.increment(session.pointsEarned || 0),
                [`monthlySummaries.${month}`]: firebase_1.FieldValue.increment(session.pointsEarned || 0),
                lastUpdatedAt: Date.now(),
            }, { merge: true });
        }
        catch {
            // Duplicate session IDs are ignored for idempotency.
        }
    }
    res.json({ acceptedSessionIds });
});
router.get('/lifetime', auth_1.authenticateToken, async (req, res) => {
    const authUser = req.user;
    if (!authUser) {
        res.status(401).json({ lifetimeStats: null });
        return;
    }
    const snapshot = await firebase_1.db.collection('users').doc(authUser.uid).collection('gameplay_stats').doc('lifetime').get();
    res.json({ lifetimeStats: snapshot.exists ? snapshot.data() : null });
});
exports.default = router;
