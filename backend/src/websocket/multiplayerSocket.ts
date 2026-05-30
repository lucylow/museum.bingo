import { Server, Socket } from 'socket.io';
import { FieldValue, db } from '../config/firebase';
import { getRoom } from '../models/MultiplayerRoom';
import { getLeaderboard, markTileCompleted, updatePlayerScore } from '../services/leaderboardRTDB';

type SocketData = {
  user?: { uid: string };
  roomId?: string;
};

export function attachMultiplayerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const socketData = socket.data as SocketData;
    const userId = socketData.user?.uid;
    if (!userId) {
      return;
    }

    socket.on('join-room', async ({ roomId }: { roomId: string }) => {
      const room = await getRoom(roomId);
      if (!room) {
        return;
      }
      socket.join(`room:${roomId}`);
      socketData.roomId = roomId;
      const leaderboard = await getLeaderboard(roomId);
      socket.emit('leaderboard-update', leaderboard);
    });

    socket.on('tile-validated', async ({ roomId, tileId, newScore }: { roomId: string; tileId: string; newScore: number }) => {
      await db.collection('multiplayer_rooms').doc(roomId).update({
        [`players.${userId}.score`]: newScore,
        [`players.${userId}.completedTiles`]: FieldValue.arrayUnion(tileId),
      });
      await Promise.all([updatePlayerScore(roomId, userId, newScore), markTileCompleted(roomId, userId, tileId)]);

      io.to(`room:${roomId}`).emit('tile-completed', { userId, tileId, newScore });
      const leaderboard = await getLeaderboard(roomId);
      io.to(`room:${roomId}`).emit('leaderboard-update', leaderboard);
    });
  });
}
