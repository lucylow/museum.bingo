import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import { FieldValue, db } from '../config/firebase';
import { onMultiplayerRoomActivated } from '../data/sync/handlers';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { createRoom, getRoom, joinRoom } from '../models/MultiplayerRoom';
import { getLeaderboard, markTileCompleted, updatePlayerScore } from '../services/leaderboardRTDB';

const router = express.Router();

router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { museumId, bingoCard, isPersonalized } = req.body as {
    museumId?: string;
    bingoCard?: string[][];
    isPersonalized?: boolean;
  };

  if (!museumId || !Array.isArray(bingoCard) || bingoCard.length === 0) {
    res.status(400).json({ error: 'museumId and bingoCard are required' });
    return;
  }

  const roomId = await createRoom(
    user.uid,
    user.displayName || user.email || 'Museum Player',
    museumId,
    bingoCard,
    Boolean(isPersonalized)
  );
  await updatePlayerScore(roomId, user.uid, 0);
  await onMultiplayerRoomActivated(roomId).catch(() => undefined);
  res.json({ roomId });
});

router.post('/join', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { roomId, displayName } = req.body as { roomId?: string; displayName?: string };
  if (!roomId) {
    res.status(400).json({ error: 'roomId is required' });
    return;
  }

  const room = await joinRoom(roomId, user.uid, (displayName || user.displayName || 'Museum Player').trim());
  if (!room) {
    res.status(404).json({ error: 'Room not found or unavailable' });
    return;
  }

  await updatePlayerScore(roomId, user.uid, room.players[user.uid]?.score ?? 0);
  await onMultiplayerRoomActivated(roomId).catch(() => undefined);
  res.json({ success: true, room });
});

router.get('/:roomId', authenticateToken, async (req: Request, res: Response) => {
  const room = await getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json(room);
});

router.get('/:roomId/leaderboard', authenticateToken, async (req: Request, res: Response) => {
  const roomId = req.params.roomId;
  const [scores, room] = await Promise.all([getLeaderboard(roomId), getRoom(roomId)]);

  const leaderboard = scores.map((entry) => ({
    ...entry,
    displayName: room?.players?.[entry.userId]?.displayName ?? 'Player',
  }));

  res.json(leaderboard);
});

router.post('/:roomId/validate', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { roomId } = req.params;
  const { tileId } = req.body as { tileId?: string; artworkId?: string };
  if (!tileId) {
    res.status(400).json({ success: false, message: 'tileId is required' });
    return;
  }

  const room = await getRoom(roomId);
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
  const roomRef = db.collection('multiplayer_rooms').doc(roomId);
  await roomRef.update({
    [`players.${user.uid}.score`]: newScore,
    [`players.${user.uid}.completedTiles`]: FieldValue.arrayUnion(tileId),
  });

  await Promise.all([updatePlayerScore(roomId, user.uid, newScore), markTileCompleted(roomId, user.uid, tileId)]);

  const io = req.app.get('io') as Server | undefined;
  if (io) {
    io.to(`room:${roomId}`).emit('tile-completed', { userId: user.uid, tileId, newScore });
    const leaderboard = await getLeaderboard(roomId);
    io.to(`room:${roomId}`).emit(
      'leaderboard-update',
      leaderboard.map((entry) => ({
        ...entry,
        displayName: room.players[entry.userId]?.displayName ?? 'Player',
      }))
    );
  }

  res.json({ success: true, newScore });
});

export default router;
