"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRoomState = setRoomState;
exports.getRoomState = getRoomState;
exports.incrementPlayerScore = incrementPlayerScore;
exports.getRoomLeaderboard = getRoomLeaderboard;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryStrategy: (times) => Math.min(times * 50, 2000),
});
exports.default = redis;
async function setRoomState(roomId, state) {
    await redis.setex(`room:${roomId}`, 14400, JSON.stringify(state));
}
async function getRoomState(roomId) {
    const data = await redis.get(`room:${roomId}`);
    return data ? JSON.parse(data) : null;
}
async function incrementPlayerScore(roomId, userId, increment) {
    const key = `room:${roomId}:scores`;
    const newScore = await redis.hincrby(key, userId, increment);
    await redis.expire(key, 14400);
    return newScore;
}
async function getRoomLeaderboard(roomId, topN = 10) {
    const key = `room:${roomId}:scores`;
    const scores = await redis.hgetall(key);
    const entries = Object.entries(scores).map(([userId, score]) => ({
        userId,
        score: parseInt(score, 10),
    }));
    entries.sort((a, b) => b.score - a.score);
    return entries.slice(0, topN);
}
