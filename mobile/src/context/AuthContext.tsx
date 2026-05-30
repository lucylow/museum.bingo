import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthProvider as AuthProviderType, authService, User } from '../services/AuthService';
import { getIdToken as getStoredIdToken } from '../utils/secureStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const handleAuthOperation = async (operation: () => Promise<User>, provider: AuthProviderType) => {
    setError(null);
    setIsLoading(true);

    try {
      await operation();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to sign in with ${provider}`;
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = (email: string, password: string) =>
    handleAuthOperation(() => authService.signUpWithEmail(email, password), 'email');

  const signIn = (email: string, password: string) =>
    handleAuthOperation(() => authService.signInWithEmail(email, password), 'email');

  const signInWithGoogle = () => handleAuthOperation(() => authService.signInWithGoogle(), 'google');

  const signInWithApple = () => handleAuthOperation(() => authService.signInWithApple(), 'apple');

  const resetPassword = async (email: string) => {
    setError(null);
    setIsLoading(true);

    try {
      await authService.sendPasswordResetEmail(email);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const getIdToken = async (forceRefresh = false): Promise<string> => {
    try {
      return await authService.getCurrentIdToken(forceRefresh);
    } catch {
      const fallbackToken = await getStoredIdToken();
      if (!fallbackToken) {
        throw new Error('No auth token available');
      }
      return fallbackToken;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    getIdToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
