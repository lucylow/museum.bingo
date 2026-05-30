import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '../../serviceAccountKey.json';

if (!admin.apps.length) {
  // Supports either ADC or local JSON key file in development.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  }
}

export const db = getFirestore();
export const rtdb = getDatabase();
export const auth = admin.auth();
export { Timestamp, FieldValue };
