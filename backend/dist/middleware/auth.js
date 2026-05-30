"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = void 0;
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
const firebase_1 = require("../config/firebase");
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        res.status(401).json({ error: 'Missing bearer token' });
        return;
    }
    try {
        const decoded = await firebase_1.auth.verifyIdToken(token);
        req.user = { uid: decoded.uid, email: decoded.email };
        next();
    }
    catch {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
}
exports.verifyFirebaseToken = authenticateToken;
async function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        next();
        return;
    }
    try {
        const decoded = await firebase_1.auth.verifyIdToken(token);
        req.user = { uid: decoded.uid, email: decoded.email };
    }
    catch {
        // Ignore optional auth failures.
    }
    next();
}
