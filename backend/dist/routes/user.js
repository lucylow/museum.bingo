"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/me', auth_1.verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'No authenticated user' });
        return;
    }
    const userDoc = await firebase_1.db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
        const newUser = {
            uid: user.uid,
            email: user.email ?? null,
            displayName: null,
            photoURL: null,
            createdAt: firebase_1.FieldValue.serverTimestamp(),
        };
        await firebase_1.db.collection('users').doc(user.uid).set(newUser);
        res.json(newUser);
        return;
    }
    res.json(userDoc.data());
});
exports.default = router;
