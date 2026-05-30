"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardCollection = exports.multiplayerRoomsCollection = exports.gameSessionsCollection = exports.museumsCollection = exports.usersCollection = void 0;
const firebase_1 = require("../../config/firebase");
// Collection references
exports.usersCollection = firebase_1.db.collection('users');
exports.museumsCollection = firebase_1.db.collection('museums');
exports.gameSessionsCollection = firebase_1.db.collection('game_sessions');
exports.multiplayerRoomsCollection = firebase_1.db.collection('multiplayer_rooms');
exports.leaderboardCollection = firebase_1.db.collection('daily_leaderboards');
