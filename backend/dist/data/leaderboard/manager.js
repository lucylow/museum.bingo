"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardManager = exports.LeaderboardManager = void 0;
const firestore_1 = require("firebase-admin/firestore");
const client_1 = __importDefault(require("../redis/client"));
const schema_1 = require("../firestore/schema");
class LeaderboardManager {
    constructor() {
        this.dailyKey = (museumId) => `leaderboard:daily:${museumId}`;
    }
    async recordScore(museumId, userId, scoreIncrement) {
        const key = this.dailyKey(museumId);
        await client_1.default.zincrby(key, scoreIncrement, userId);
        await client_1.default.expire(key, 86400);
    }
    async getDailyTop(museumId, limit = 100) {
        const key = this.dailyKey(museumId);
        const results = await client_1.default.zrevrange(key, 0, limit - 1, 'WITHSCORES');
        const leaderboard = [];
        for (let i = 0; i < results.length; i += 2) {
            leaderboard.push({
                userId: results[i],
                score: parseInt(results[i + 1], 10),
            });
        }
        return leaderboard;
    }
    async snapshotDailyLeaderboard(museumId) {
        const top = await this.getDailyTop(museumId, 500);
        const snapshotId = `${museumId}_${new Date().toISOString().slice(0, 13)}`;
        await schema_1.leaderboardCollection.doc(snapshotId).set({
            museumId,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
            topPlayers: top,
        });
    }
}
exports.LeaderboardManager = LeaderboardManager;
exports.leaderboardManager = new LeaderboardManager();
