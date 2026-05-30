"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const firebase_1 = require("./config/firebase");
const MultiplayerRoom_1 = require("./models/MultiplayerRoom");
const eventLogger_1 = require("./analytics/eventLogger");
const anonymizer_1 = require("./analytics/anonymizer");
const gamification_1 = __importDefault(require("./routes/gamification"));
const museums_1 = __importDefault(require("./routes/museums"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const webhook_1 = __importDefault(require("./routes/webhook"));
const user_1 = __importDefault(require("./routes/user"));
const places_1 = __importDefault(require("./routes/places"));
const museumOnboarding_1 = __importDefault(require("./routes/museumOnboarding"));
const DISPLAY_NAME_MAX_LENGTH = 40;
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{3,120}$/;
function parseAllowedOrigins() {
    const fromEnv = process.env.CLIENT_URLS || process.env.CLIENT_URL || '*';
    const origins = fromEnv
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    return {
        allowAll: origins.includes('*'),
        origins,
    };
}
function sanitizeDisplayName(value) {
    return value.trim().slice(0, DISPLAY_NAME_MAX_LENGTH);
}
function isValidRoomId(value) {
    return ROOM_ID_PATTERN.test(value);
}
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
function normalizePoints(points) {
    if (!isFiniteNumber(points)) {
        return 0;
    }
    return Math.max(0, Math.min(Math.trunc(points), 500));
}
const app = (0, express_1.default)();
const corsPolicy = parseAllowedOrigins();
const isAllowedOrigin = (origin) => !origin ||
    corsPolicy.allowAll ||
    corsPolicy.origins.includes(origin) ||
    corsPolicy.origins.includes('http://localhost:3000') ||
    corsPolicy.origins.includes('http://localhost:5173');
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Origin not allowed by CORS policy'));
    },
    credentials: true,
}));
app.use('/api/webhooks', webhook_1.default);
app.use(express_1.default.json({ limit: '1mb' }));
app.use(eventLogger_1.analyticsMiddleware);
app.use('/api/gamification', gamification_1.default);
app.use('/api/museums', museums_1.default);
app.use('/api/subscription', subscription_1.default);
app.use('/api/users', user_1.default);
app.use('/api/places', places_1.default);
app.use('/api/museum-onboarding', museumOnboarding_1.default);
const anonymizer = anonymizer_1.AnonymizationService.getInstance();
app.post('/api/game/validate-tile', async (req, res) => {
    try {
        const { tileId, artworkId, points } = req.body;
        const userId = req.headers['x-user-id'];
        const sessionId = req.headers['x-session-id'];
        const museumId = req.headers['x-museum-id'];
        if (!userId || !sessionId || !museumId || !tileId) {
            res.status(400).json({ success: false, error: 'Missing required analytics headers or payload' });
            return;
        }
        await eventLogger_1.analyticsLogger.logEvent(anonymizer.anonymiseUserId(userId), anonymizer.anonymiseSessionId(sessionId), museumId, 'tile_validated', { tileId, artworkId, points: normalizePoints(points) });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ success: false, error: 'Failed to record tile validation' });
    }
});
app.post('/api/game/bingo-complete', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const sessionId = req.headers['x-session-id'];
        const museumId = req.headers['x-museum-id'];
        if (!userId || !sessionId || !museumId) {
            res.status(400).json({ success: false, error: 'Missing required analytics headers' });
            return;
        }
        await eventLogger_1.analyticsLogger.logEvent(anonymizer.anonymiseUserId(userId), anonymizer.anonymiseSessionId(sessionId), museumId, 'bingo_completed', { timestamp: Date.now() });
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ success: false, error: 'Failed to record bingo completion' });
    }
});
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: corsPolicy.allowAll ? true : corsPolicy.origins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        next(new Error('Authentication required'));
        return;
    }
    try {
        const decoded = await firebase_1.auth.verifyIdToken(token);
        socket.data.user = { uid: decoded.uid };
        next();
    }
    catch {
        next(new Error('Invalid token'));
    }
});
io.on('connection', (socket) => {
    const socketData = socket.data;
    const userId = socketData.user?.uid;
    if (!userId) {
        socket.disconnect(true);
        return;
    }
    socket.on('join-room', async ({ roomId, displayName }, callback) => {
        if (!isValidRoomId(roomId)) {
            callback?.({ success: false, error: 'Invalid room ID format' });
            return;
        }
        const safeDisplayName = sanitizeDisplayName(displayName || '');
        if (!safeDisplayName) {
            callback?.({ success: false, error: 'Display name is required' });
            return;
        }
        try {
            const room = await (0, MultiplayerRoom_1.joinRoom)(roomId, userId, safeDisplayName);
            if (!room) {
                callback?.({ success: false, error: 'Room not found or already started' });
                return;
            }
            socket.join(`room:${roomId}`);
            socketData.roomId = roomId;
            callback?.({ success: true, room });
            const sessionId = socket.handshake.headers['x-session-id'];
            if (sessionId && room.museumId) {
                await eventLogger_1.analyticsLogger.logEvent(anonymizer.anonymiseUserId(userId), anonymizer.anonymiseSessionId(sessionId), room.museumId, 'multiplayer_room_joined', { roomId });
            }
            socket.to(`room:${roomId}`).emit('player-joined', {
                userId,
                displayName: safeDisplayName,
                players: room.players,
            });
        }
        catch {
            callback?.({ success: false, error: 'Failed to join room' });
        }
    });
    socket.on('create-room', async ({ museumId, bingoCard, displayName }, callback) => {
        const safeDisplayName = sanitizeDisplayName(displayName || '');
        if (!museumId || !safeDisplayName || !Array.isArray(bingoCard) || bingoCard.length === 0) {
            callback?.({ success: false, error: 'Invalid room creation payload' });
            return;
        }
        try {
            const roomId = await (0, MultiplayerRoom_1.createRoom)(userId, safeDisplayName, museumId, bingoCard);
            socket.join(`room:${roomId}`);
            socketData.roomId = roomId;
            callback?.({ success: true, roomId });
            io.emit('room-created', { roomId, museumId, ownerId: userId });
        }
        catch {
            callback?.({ success: false, error: 'Could not create room' });
        }
    });
    socket.on('start-game', async ({ roomId }) => {
        if (!isValidRoomId(roomId)) {
            return;
        }
        const room = await (0, MultiplayerRoom_1.getRoom)(roomId);
        if (!room || room.ownerId !== userId) {
            return;
        }
        await (0, MultiplayerRoom_1.startGame)(roomId);
        io.to(`room:${roomId}`).emit('game-started', { roomId });
    });
    socket.on('tile-validated', async ({ roomId, tileId, points, newScore }) => {
        if (!isValidRoomId(roomId) || !tileId || typeof tileId !== 'string') {
            socket.emit('tile-validation-rejected', { reason: 'Invalid tile update payload' });
            return;
        }
        const room = await (0, MultiplayerRoom_1.getRoom)(roomId);
        const currentPlayer = room?.players?.[userId];
        if (!room || !currentPlayer || room.status !== 'playing') {
            socket.emit('tile-validation-rejected', { reason: 'Player is not in an active room' });
            return;
        }
        if (currentPlayer.completedTiles.includes(tileId)) {
            socket.emit('tile-validation-rejected', { reason: 'Tile was already completed' });
            return;
        }
        const normalizedPoints = normalizePoints(points);
        const computedScore = currentPlayer.score + normalizedPoints;
        const resolvedScore = isFiniteNumber(newScore)
            ? Math.max(currentPlayer.score, Math.max(Math.trunc(newScore), computedScore))
            : computedScore;
        const roomRef = firebase_1.db.collection('multiplayer_rooms').doc(roomId);
        await roomRef.update({
            [`players.${userId}.score`]: resolvedScore,
            [`players.${userId}.completedTiles`]: firebase_1.FieldValue.arrayUnion(tileId),
        });
        io.to(`room:${roomId}`).emit('score-update', {
            userId,
            tileId,
            newScore: resolvedScore,
            pointsGained: normalizedPoints,
        });
        const sessionId = socket.handshake.headers['x-session-id'];
        if (sessionId && room.museumId) {
            await eventLogger_1.analyticsLogger.logEvent(anonymizer.anonymiseUserId(userId), anonymizer.anonymiseSessionId(sessionId), room.museumId, 'tile_validated', { roomId, tileId, points: normalizedPoints, newScore: resolvedScore });
        }
    });
    socket.on('leave-room', () => {
        const roomId = socketData.roomId;
        if (!roomId) {
            return;
        }
        socket.leave(`room:${roomId}`);
        io.to(`room:${roomId}`).emit('player-left', { userId });
        socketData.roomId = undefined;
    });
});
const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
});
process.on('SIGTERM', async () => {
    await eventLogger_1.analyticsLogger.shutdown();
    process.exit(0);
});
process.on('SIGINT', async () => {
    await eventLogger_1.analyticsLogger.shutdown();
    process.exit(0);
});
