import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';
import { configureGoogleSignIn, getFirebaseAuth, GoogleSignin } from '../config/firebase';
import { clearTokens, saveTokens } from '../utils/secureStorage';

export type AuthProvider = 'email' | 'google' | 'apple';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: FirebaseAuthTypes.UserInfo[];
}

class AuthService {
  private auth = getFirebaseAuth();

  constructor() {
    configureGoogleSignIn();
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
    await this.persistTokens(userCredential.user);
    return this.mapFirebaseUser(userCredential.user);
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
    await this.persistTokens(userCredential.user);
    return this.mapFirebaseUser(userCredential.user);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await this.auth.sendPasswordResetEmail(email);
  }

  async signInWithGoogle(): Promise<User> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const idToken = result.idToken;
    if (!idToken) {
      throw new Error('Google Sign-In failed - missing id token');
    }

    const googleCredential = this.auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await this.auth.signInWithCredential(googleCredential);
    await this.persistTokens(userCredential.user);
    return this.mapFirebaseUser(userCredential.user);
  }

  async signInWithApple(): Promise<User> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const { identityToken, nonce } = appleAuthRequestResponse;
    if (!identityToken) {
      throw new Error('Apple Sign-In failed - missing identity token');
    }

    const appleCredential = this.auth.AppleAuthProvider.credential(identityToken, nonce);
    const userCredential = await this.auth.signInWithCredential(appleCredential);
    await this.persistTokens(userCredential.user);
    return this.mapFirebaseUser(userCredential.user);
  }

  async getCurrentUser(): Promise<User | null> {
    const user = this.auth.currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  async getCurrentIdToken(forceRefresh = false): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return user.getIdToken(forceRefresh);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await clearTokens();
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore: if user didn't use Google provider there may be no active Google session.
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return this.auth.onAuthStateChanged((user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  private async persistTokens(user: FirebaseAuthTypes.User): Promise<void> {
    const idToken = await user.getIdToken();
    await saveTokens(idToken, user.refreshToken);
  }

  private mapFirebaseUser(user: FirebaseAuthTypes.User): User {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      providerData: user.providerData,
    };
  }
}

export const authService = new AuthService();
