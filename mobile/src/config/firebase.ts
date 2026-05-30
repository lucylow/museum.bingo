import { FirebaseApp, initializeApp } from '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | undefined;
let googleConfigured = false;

export const initializeFirebase = (): void => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
};

export const configureGoogleSignIn = (): void => {
  if (googleConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  });

  googleConfigured = true;
};

export const getFirebaseAuth = (): FirebaseAuthTypes.Module => {
  initializeFirebase();
  return auth();
};

export { GoogleSignin };
