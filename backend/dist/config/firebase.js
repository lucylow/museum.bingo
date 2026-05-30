"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldValue = exports.Timestamp = exports.auth = exports.rtdb = exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const database_1 = require("firebase-admin/database");
const firestore_1 = require("firebase-admin/firestore");
Object.defineProperty(exports, "Timestamp", { enumerable: true, get: function () { return firestore_1.Timestamp; } });
Object.defineProperty(exports, "FieldValue", { enumerable: true, get: function () { return firestore_1.FieldValue; } });
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '../../serviceAccountKey.json';
if (!firebase_admin_1.default.apps.length) {
    // Supports either ADC or local JSON key file in development.
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.applicationDefault(),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
        });
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
        const serviceAccount = require(serviceAccountPath);
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
        });
    }
}
exports.db = (0, firestore_1.getFirestore)();
exports.rtdb = (0, database_1.getDatabase)();
exports.auth = firebase_admin_1.default.auth();
