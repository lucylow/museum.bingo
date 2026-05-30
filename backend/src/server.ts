import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { db, auth, FieldValue } from './config/firebase';
import { createRoom, getRoom, joinRoom, startGame } from './models/MultiplayerRoom';
import { analyticsLogger, analyticsMiddleware } from './analytics/eventLogger';
import { AnonymizationService } from './analytics/anonymizer';
import gamificationRoutes from './routes/gamification';
import museumsRoutes from './routes/museums';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhook';
import userRoutes from './routes/user';
import placesRoutes from './routes/places';
import museumOnboardingRoutes from './routes/museumOnboarding';
import multiplayerRoutes from './routes/multiplayer';
import gameplayStatsRoutes from './routes/gameplayStats';
import { getLeaderboard, markTileCompleted, updatePlayerScore } from './services/leaderboardRTDB';
import { clearDisconnectedMarker, handlePlayerDisconnect } from './services/roomCleanup';

type AuthedSocketData = {
  user?: { uid: string };
  roomId?: string;
};

type TileValidatedPayload = {
  roomId: string;
  tileId: string;
  points: number;
  newScore: number;
};

type EventAck = (response: { success: boolean; error?: string; room?: unknown; roomId?: string }) => void;

const DISPLAY_NAME_MAX_LENGTH = 40;
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{3,120}$/;

function parseAllowedOrigins(): { allowAll: boolean; origins: string[] } {
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

function sanitizeDisplayName(value: string): string {
  return value.trim().slice(0, DISPLAY_NAME_MAX_LENGTH);
}

function isValidRoomId(value: string): boolean {
  return ROOM_ID_PATTERN.test(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizePoints(points: unknown): number {
  if (!isFiniteNumber(points)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.trunc(points), 500));
}

const app = express();
const corsPolicy = parseAllowedOrigins();
const isAllowedOrigin = (origin?: string): boolean =>
  !origin ||
  corsPolicy.allowAll ||
  corsPolicy.origins.includes(origin) ||
  corsPolicy.origins.includes('http://localhost:3000') ||
  corsPolicy.origins.includes('http://localhost:5173');

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS policy'));
    },
    credentials: true,
  })
);
app.use('/api/webhooks', webhookRoutes);
app.use(express.json({ limit: '1mb' }));
app.use(analyticsMiddleware);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/museums', museumsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/museum-onboarding', museumOnboardingRoutes);
app.use('/api/multiplayer', multiplayerRoutes);
app.use('/api/gameplay-stats', gameplayStatsRoutes);

const anonymizer = AnonymizationService.getInstance();

app.post('/api/game/validate-tile', async (req, res) => {
  try {
    const { tileId, artworkId, points } = req.body as {
      tileId?: string;
      artworkId?: string;
      points?: number;
    };
    const userId = req.headers['x-user-id'] as string | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;
    const museumId = req.headers['x-museum-id'] as string | undefined;

    if (!userId || !sessionId || !museumId || !tileId) {
      res.status(400).json({ success: false, error: 'Missing required analytics headers or payload' });
      return;
    }

    await analyticsLogger.logEvent(
      anonymizer.anonymiseUserId(userId),
      anonymizer.anonymiseSessionId(sessionId),
      museumId,
      'tile_validated',
      { tileId, artworkId, points: normalizePoints(points) }
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to record tile validation' });
  }
});

app.post('/api/game/bingo-complete', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;
    const museumId = req.headers['x-museum-id'] as string | undefined;

    if (!userId || !sessionId || !museumId) {
      res.status(400).json({ success: false, error: 'Missing required analytics headers' });
      return;
    }

    await analyticsLogger.logEvent(
      anonymizer.anonymiseUserId(userId),
      anonymizer.anonymiseSessionId(sessionId),
      museumId,
      'bingo_completed',
      { timestamp: Date.now() }
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to record bingo completion' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsPolicy.allowAll ? '*' : corsPolicy.origins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    (socket.data as AuthedSocketData).user = { uid: decoded.uid };
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const socketData = socket.data as AuthedSocketData;
  const userId = socketData.user?.uid;
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  socket.on(
    'join-room',
    async ({ roomId, displayName }: { roomId: string; displayName: string }, callback?: EventAck) => {
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
        const room = await joinRoom(roomId, userId, safeDisplayName);
        if (!room) {
          callback?.({ success: false, error: 'Room not found or already started' });
          return;
        }

        socket.join(`room:${roomId}`);
        socketData.roomId = roomId;
        await clearDisconnectedMarker(roomId, userId);
        await updatePlayerScore(roomId, userId, room.players[userId]?.score ?? 0);
        callback?.({ success: true, room });
        const leaderboard = await getLeaderboard(roomId);
        socket.emit(
          'leaderboard-update',
          leaderboard.map((entry) => ({
            ...entry,
            displayName: room.players[entry.userId]?.displayName ?? 'Player',
          }))
        );

        const sessionId = socket.handshake.headers['x-session-id'] as string | undefined;
        if (sessionId && room.museumId) {
          await analyticsLogger.logEvent(
            anonymizer.anonymiseUserId(userId),
            anonymizer.anonymiseSessionId(sessionId),
            room.museumId,
            'multiplayer_room_joined',
            { roomId }
          );
        }

        socket.to(`room:${roomId}`).emit('player-joined', {
          userId,
          displayName: safeDisplayName,
          players: room.players,
        });
      } catch {
        callback?.({ success: false, error: 'Failed to join room' });
      }
    }
  );

  socket.on(
    'create-room',
    async (
      { museumId, bingoCard, displayName }: { museumId: string; bingoCard: string[][]; displayName: string },
      callback?: EventAck
    ) => {
      const safeDisplayName = sanitizeDisplayName(displayName || '');
      if (!museumId || !safeDisplayName || !Array.isArray(bingoCard) || bingoCard.length === 0) {
        callback?.({ success: false, error: 'Invalid room creation payload' });
        return;
      }

      try {
        const roomId = await createRoom(userId, safeDisplayName, museumId, bingoCard);
        socket.join(`room:${roomId}`);
        socketData.roomId = roomId;
        await updatePlayerScore(roomId, userId, 0);
        callback?.({ success: true, roomId });
        io.emit('room-created', { roomId, museumId, ownerId: userId });
      } catch {
        callback?.({ success: false, error: 'Could not create room' });
      }
    }
  );

  socket.on('start-game', async ({ roomId }: { roomId: string }) => {
    if (!isValidRoomId(roomId)) {
      return;
    }

    const room = await getRoom(roomId);
    if (!room || room.ownerId !== userId) {
      return;
    }

    await startGame(roomId);
    io.to(`room:${roomId}`).emit('game-started', { roomId });
  });

  socket.on('tile-validated', async ({ roomId, tileId, points, newScore }: TileValidatedPayload) => {
    if (!isValidRoomId(roomId) || !tileId || typeof tileId !== 'string') {
      socket.emit('tile-validation-rejected', { reason: 'Invalid tile update payload' });
      return;
    }

    const room = await getRoom(roomId);
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

    const roomRef = db.collection('multiplayer_rooms').doc(roomId);
    await roomRef.update({
      [`players.${userId}.score`]: resolvedScore,
      [`players.${userId}.completedTiles`]: FieldValue.arrayUnion(tileId),
    });
    await Promise.all([
      updatePlayerScore(roomId, userId, resolvedScore),
      markTileCompleted(roomId, userId, tileId),
    ]);

    io.to(`room:${roomId}`).emit('score-update', {
      userId,
      tileId,
      newScore: resolvedScore,
      pointsGained: normalizedPoints,
    });
    io.to(`room:${roomId}`).emit('tile-completed', {
      userId,
      tileId,
      newScore: resolvedScore,
    });
    const leaderboard = await getLeaderboard(roomId);
    io.to(`room:${roomId}`).emit(
      'leaderboard-update',
      leaderboard.map((entry) => ({
        ...entry,
        displayName: room.players[entry.userId]?.displayName ?? 'Player',
      }))
    );

    const sessionId = socket.handshake.headers['x-session-id'] as string | undefined;
    if (sessionId && room.museumId) {
      await analyticsLogger.logEvent(
        anonymizer.anonymiseUserId(userId),
        anonymizer.anonymiseSessionId(sessionId),
        room.museumId,
        'tile_validated',
        { roomId, tileId, points: normalizedPoints, newScore: resolvedScore }
      );
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

  socket.on('request-sync', async ({ roomId }: { roomId: string }) => {
    if (!isValidRoomId(roomId)) {
      return;
    }
    const room = await getRoom(roomId);
    if (!room) {
      return;
    }
    const leaderboard = await getLeaderboard(roomId);
    socket.emit('state-sync', {
      room,
      leaderboard: leaderboard.map((entry) => ({
        ...entry,
        displayName: room.players[entry.userId]?.displayName ?? 'Player',
      })),
    });
  });

  socket.on('disconnect', () => {
    const roomId = socketData.roomId;
    if (!roomId) {
      return;
    }
    handlePlayerDisconnect(io, roomId, userId);
  });
});

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await analyticsLogger.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await analyticsLogger.shutdown();
  process.exit(0);
});
