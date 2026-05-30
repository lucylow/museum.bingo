"use strict";
/**
 * Museum.Bingo Data Layer Architecture
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      Mobile / Web Clients                      │
 * └───────────────────────────────┬─────────────────────────────────┘
 *                                 │
 *                                 ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    Firebase Authentication                     │
 * └───────────────────────────────┬─────────────────────────────────┘
 *                                 │
 *         ┌───────────────────────┼───────────────────────┐
 *         │                       │                       │
 *         ▼                       ▼                       ▼
 * ┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
 * │   Firestore  │      │  Tower Lakehouse │      │    Redis     │
 * │ (Document DB)│      │ (Iceberg Tables) │      │ (In-Memory)  │
 * └──────────────┘      └─────────────────┘      └──────────────┘
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_LAYER_COMPONENTS = void 0;
exports.DATA_LAYER_COMPONENTS = {
    firestore: 'Document storage for profiles, sessions, and room state',
    lakehouse: 'Long-term storage for artworks and pre-computed embeddings',
    redis: 'Ephemeral multiplayer state and low-latency leaderboard cache',
};
