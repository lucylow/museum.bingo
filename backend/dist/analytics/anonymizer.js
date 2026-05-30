"use strict";
/**
 * GDPR-oriented anonymization utilities for analytics identifiers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymizationService = void 0;
exports.prepareAnalyticsUser = prepareAnalyticsUser;
const crypto_1 = require("crypto");
class AnonymizationService {
    constructor() {
        this.salt = process.env.ANONYMISATION_SALT || (0, crypto_1.randomBytes)(32).toString('hex');
    }
    static getInstance() {
        if (!AnonymizationService.instance) {
            AnonymizationService.instance = new AnonymizationService();
        }
        return AnonymizationService.instance;
    }
    anonymiseUserId(originalId) {
        return (0, crypto_1.createHash)('sha256').update(`${originalId}:${this.salt}`).digest('hex');
    }
    anonymiseSessionId(sessionId) {
        return (0, crypto_1.createHash)('sha256').update(`${sessionId}:session_scope`).digest('hex').slice(0, 16);
    }
    blurLocation(lat, lng, precision = 0.01) {
        const blurredLat = Math.round(lat / precision) * precision;
        const blurredLng = Math.round(lng / precision) * precision;
        return (0, crypto_1.createHash)('sha256').update(`${blurredLat},${blurredLng}`).digest('hex').slice(0, 8);
    }
    rotateSalt() {
        this.salt = (0, crypto_1.randomBytes)(32).toString('hex');
        // eslint-disable-next-line no-console
        console.log(`[ANON] Salt rotated at ${new Date().toISOString()}`);
    }
}
exports.AnonymizationService = AnonymizationService;
function prepareAnalyticsUser(originalUid) {
    const anonymizer = AnonymizationService.getInstance();
    return {
        analyticsId: anonymizer.anonymiseUserId(originalUid),
        saltRotatedAt: new Date().toISOString().split('T')[0],
    };
}
