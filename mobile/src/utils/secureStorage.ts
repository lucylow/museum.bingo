import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'firebase_id_token';
const REFRESH_TOKEN_KEY = 'firebase_refresh_token';

export const saveTokens = async (idToken: string, refreshToken?: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, idToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getIdToken = async (): Promise<string | null> => SecureStore.getItemAsync(TOKEN_KEY);

export const getRefreshToken = async (): Promise<string | null> =>
  SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};
