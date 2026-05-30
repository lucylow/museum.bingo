import { Alert, Linking } from 'react-native';

export const LINKING_PREFIXES = ['museum.bingo://', 'https://museum.bingo'];

export function handleSubscriptionDeepLink(url: string): void {
  if (url.includes('/subscription/success')) {
    Alert.alert('Subscription Activated', 'Thank you for upgrading. Premium features are now available.');
    return;
  }

  if (url.includes('/subscription/cancel')) {
    Alert.alert('Checkout Cancelled', 'No worries, you can subscribe anytime.');
  }
}

export async function getInitialDeepLink(): Promise<string | null> {
  const url = await Linking.getInitialURL();
  if (url) {
    handleSubscriptionDeepLink(url);
  }
  return url;
}

export function subscribeToDeepLinks(listener: (url: string) => void): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleSubscriptionDeepLink(url);
    listener(url);
  });

  return () => subscription.remove();
}
