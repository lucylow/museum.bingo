"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachMultiplayerSocketHandlers = attachMultiplayerSocketHandlers;
const firebase_1 = require("../config/firebase");
const MultiplayerRoom_1 = require("../models/MultiplayerRoom");
const leaderboardRTDB_1 = require("../services/leaderboardRTDB");
function attachMultiplayerSocketHandlers(io) {
    io.on('connection', (socket) => {
        const socketData = socket.data;
        const userId = socketData.user?.uid;
        if (!userId) {
            return;
        }
        socket.on('join-room', async ({ roomId }) => {
            const room = await (0, MultiplayerRoom_1.getRoom)(roomId);
            if (!room) {
                return;
            }
            socket.join(`room:${roomId}`);
            socketData.roomId = roomId;
            const leaderboard = await (0, leaderboardRTDB_1.getLeaderboard)(roomId);
            socket.emit('leaderboard-update', leaderboard);
        });
        socket.on('tile-validated', async ({ roomId, tileId, newScore }) => {
            await firebase_1.db.collection('multiplayer_rooms').doc(roomId).update({
                [`players.${userId}.score`]: newScore,
                [`players.${userId}.completedTiles`]: firebase_1.FieldValue.arrayUnion(tileId),
            });
            await Promise.all([(0, leaderboardRTDB_1.updatePlayerScore)(roomId, userId, newScore), (0, leaderboardRTDB_1.markTileCompleted)(roomId, userId, tileId)]);
            io.to(`room:${roomId}`).emit('tile-completed', { userId, tileId, newScore });
            const leaderboard = await (0, leaderboardRTDB_1.getLeaderboard)(roomId);
            io.to(`room:${roomId}`).emit('leaderboard-update', leaderboard);
        });
    });
}
