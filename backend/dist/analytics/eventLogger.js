"use strict";
/**
 * Event logging service for Museum.Bingo backend.
 * Captures anonymized behavioral events and batches writes to Firestore.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsMiddleware = exports.analyticsLogger = void 0;
const uuid_1 = require("uuid");
const firebase_1 = require("../config/firebase");
class AnalyticsEventLogger {
    constructor() {
        this.eventBuffer = [];
        this.flushInterval = null;
        this.batchSize = 100;
        this.flushIntervalMs = 5000;
        this.startFlushInterval();
    }
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            void this.flushToFirestore();
        }, this.flushIntervalMs);
    }
    async logEvent(userId, sessionId, museumId, eventType, metadata = {}, locationHash) {
        const event = {
            event_id: (0, uuid_1.v4)(),
            user_id: userId,
            session_id: sessionId,
            museum_id: museumId,
            event_type: eventType,
            timestamp: Date.now(),
            metadata: this.sanitizeMetadata(metadata),
            location_hash: locationHash,
        };
        this.eventBuffer.push(event);
        if (this.eventBuffer.length >= this.batchSize) {
            await this.flushToFirestore();
        }
    }
    sanitizeMetadata(metadata) {
        const disallowed = new Set(['email', 'phone', 'name', 'ip', 'user_agent', 'uid']);
        return Object.entries(metadata).reduce((acc, [key, value]) => {
            if (!disallowed.has(key)) {
                acc[key] = value;
            }
            return acc;
        }, {});
    }
    async flushToFirestore() {
        if (this.eventBuffer.length === 0) {
            return;
        }
        const eventsToWrite = [...this.eventBuffer];
        this.eventBuffer = [];
        const batch = firebase_1.db.batch();
        const collectionRef = firebase_1.db.collection('analytics_events');
        for (const event of eventsToWrite) {
            batch.set(collectionRef.doc(event.event_id), event);
        }
        try {
            await batch.commit();
            // eslint-disable-next-line no-console
            console.log(`Flushed ${eventsToWrite.length} analytics events to Firestore`);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to flush analytics events:', error);
            this.eventBuffer.unshift(...eventsToWrite);
        }
    }
    async shutdown() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        await this.flushToFirestore();
    }
}
exports.analyticsLogger = new AnalyticsEventLogger();
const analyticsMiddleware = async (req, _res, next) => {
    const user = req.user;
    const anonymizedUserId = user?.analyticsId;
    const sessionId = req.headers['x-session-id'];
    const museumId = req.headers['x-museum-id'];
    if (anonymizedUserId && sessionId && museumId) {
        await exports.analyticsLogger.logEvent(anonymizedUserId, sessionId, museumId, 'session_start', {
            path: req.path,
            method: req.method,
        });
    }
    next();
};
exports.analyticsMiddleware = analyticsMiddleware;
