"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const handlers_1 = require("../data/sync/handlers");
const auth_1 = require("../middleware/auth");
const MultiplayerRoom_1 = require("../models/MultiplayerRoom");
const leaderboardRTDB_1 = require("../services/leaderboardRTDB");
const router = express_1.default.Router();
router.post('/create', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const { museumId, bingoCard, isPersonalized } = req.body;
    if (!museumId || !Array.isArray(bingoCard) || bingoCard.length === 0) {
        res.status(400).json({ error: 'museumId and bingoCard are required' });
        return;
    }
    const roomId = await (0, MultiplayerRoom_1.createRoom)(user.uid, user.displayName || user.email || 'Museum Player', museumId, bingoCard, Boolean(isPersonalized));
    await (0, leaderboardRTDB_1.updatePlayerScore)(roomId, user.uid, 0);
    await (0, handlers_1.onMultiplayerRoomActivated)(roomId).catch(() => undefined);
    res.json({ roomId });
});
router.post('/join', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const { roomId, displayName } = req.body;
    if (!roomId) {
        res.status(400).json({ error: 'roomId is required' });
        return;
    }
    const room = await (0, MultiplayerRoom_1.joinRoom)(roomId, user.uid, (displayName || user.displayName || 'Museum Player').trim());
    if (!room) {
        res.status(404).json({ error: 'Room not found or unavailable' });
        return;
    }
    await (0, leaderboardRTDB_1.updatePlayerScore)(roomId, user.uid, room.players[user.uid]?.score ?? 0);
    await (0, handlers_1.onMultiplayerRoomActivated)(roomId).catch(() => undefined);
    res.json({ success: true, room });
});
router.get('/:roomId', auth_1.authenticateToken, async (req, res) => {
    const room = await (0, MultiplayerRoom_1.getRoom)(req.params.roomId);
    if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }
    res.json(room);
});
router.get('/:roomId/leaderboard', auth_1.authenticateToken, async (req, res) => {
    const roomId = req.params.roomId;
    const [scores, room] = await Promise.all([(0, leaderboardRTDB_1.getLeaderboard)(roomId), (0, MultiplayerRoom_1.getRoom)(roomId)]);
    const leaderboard = scores.map((entry) => ({
        ...entry,
        displayName: room?.players?.[entry.userId]?.displayName ?? 'Player',
    }));
    res.json(leaderboard);
});
router.post('/:roomId/validate', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const { roomId } = req.params;
    const { tileId } = req.body;
    if (!tileId) {
        res.status(400).json({ success: false, message: 'tileId is required' });
        return;
    }
    const room = await (0, MultiplayerRoom_1.getRoom)(roomId);
    const currentPlayer = room?.players?.[user.uid];
    if (!room || !currentPlayer || room.status !== 'playing') {
        res.status(400).json({ success: false, message: 'Player is not in an active room' });
        return;
    }
    if (currentPlayer.completedTiles.includes(tileId)) {
        res.status(400).json({ success: false, message: 'Tile already completed' });
        return;
    }
    const newScore = currentPlayer.score + 10;
    const roomRef = firebase_1.db.collection('multiplayer_rooms').doc(roomId);
    await roomRef.update({
        [`players.${user.uid}.score`]: newScore,
        [`players.${user.uid}.completedTiles`]: firebase_1.FieldValue.arrayUnion(tileId),
    });
    await Promise.all([(0, leaderboardRTDB_1.updatePlayerScore)(roomId, user.uid, newScore), (0, leaderboardRTDB_1.markTileCompleted)(roomId, user.uid, tileId)]);
    const io = req.app.get('io');
    if (io) {
        io.to(`room:${roomId}`).emit('tile-completed', { userId: user.uid, tileId, newScore });
        const leaderboard = await (0, leaderboardRTDB_1.getLeaderboard)(roomId);
        io.to(`room:${roomId}`).emit('leaderboard-update', leaderboard.map((entry) => ({
            ...entry,
            displayName: room.players[entry.userId]?.displayName ?? 'Player',
        })));
    }
    res.json({ success: true, newScore });
});
exports.default = router;
