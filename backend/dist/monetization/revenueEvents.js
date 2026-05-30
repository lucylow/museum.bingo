"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackRevenueEvent = trackRevenueEvent;
const firebase_1 = require("../config/firebase");
function normalizeIdempotencyKey(key) {
    return key.trim().slice(0, 160);
}
async function trackRevenueEvent(event) {
    const key = normalizeIdempotencyKey(event.idempotencyKey);
    if (!key) {
        throw new Error('Revenue event requires idempotency key');
    }
    const docId = `${event.userId}_${key}`;
    const ref = firebase_1.db.collection('revenue_events').doc(docId);
    const shouldWrite = await firebase_1.db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (snapshot.exists) {
            return false;
        }
        tx.set(ref, {
            ...event,
            idempotencyKey: key,
            createdAt: event.createdAt,
            serverTimestamp: firebase_1.FieldValue.serverTimestamp(),
        });
        return true;
    });
    return { recorded: shouldWrite, duplicate: !shouldWrite };
}
