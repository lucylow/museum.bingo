import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Tier {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

type SubscriptionStatus = {
  isActive: boolean;
  tier: string | null;
};

export const SubscriptionScreen: React.FC = () => {
  const { user, getIdToken } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<SubscriptionStatus>({
    isActive: false,
    tier: null,
  });
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    await Promise.all([fetchTiers(), fetchSubscriptionStatus()]);
  };

  const fetchTiers = async () => {
    const response = await api.get<Tier[]>('/subscription/tiers');
    setTiers(response);
    setLoading(false);
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      return;
    }
    try {
      const token = await getIdToken();
      const response = await api.get<SubscriptionStatus>('/subscription/status', { token });
      setCurrentStatus(response);
    } catch {
      setCurrentStatus({ isActive: false, tier: null });
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe.');
      return;
    }

    setCheckoutLoading(priceId);
    try {
      const token = await getIdToken();
      const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME || 'museum.bingo';
      const successUrl = `${appScheme}://subscription/success`;
      const cancelUrl = `${appScheme}://subscription/cancel`;

      const response = await api.post<{ sessionId: string; url: string }>(
        '/subscription/create-checkout',
        { priceId, successUrl, cancelUrl },
        { token }
      );
      await Linking.openURL(response.url);
    } catch {
      Alert.alert('Error', 'Failed to start checkout process.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to manage your subscription.');
      return;
    }

    try {
      const token = await getIdToken();
      const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME || 'museum.bingo';
      const returnUrl = `${appScheme}://subscription`;

      const response = await api.post<{ url: string }>(
        '/subscription/portal',
        { returnUrl },
        { token }
      );
      await Linking.openURL(response.url);
    } catch {
      Alert.alert('Error', 'Failed to open customer portal.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upgrade Your Museum Adventure</Text>
      {currentStatus.isActive ? (
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>Current Plan: {currentStatus.tier}</Text>
          <TouchableOpacity onPress={() => void handleManageSubscription()}>
            <Text style={styles.manageLink}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {tiers.map((tier) => {
        const isCurrentTier = currentStatus.isActive && currentStatus.tier === tier.id;
        const isProcessing = checkoutLoading === tier.id;

        return (
          <View key={tier.id} style={styles.card}>
            <Text style={styles.planName}>{tier.name}</Text>
            <Text style={styles.price}>
              ${(tier.price / 100).toFixed(2)}
              <Text style={styles.interval}>/{tier.interval}</Text>
            </Text>
            {tier.features.map((feature) => (
              <Text key={`${tier.id}_${feature}`} style={styles.feature}>
                {'\u2713'} {feature}
              </Text>
            ))}
            <TouchableOpacity
              style={[styles.button, isCurrentTier ? styles.disabledButton : null]}
              onPress={() => void handleSubscribe(tier.id)}
              disabled={isProcessing || isCurrentTier}
            >
              <Text style={styles.buttonText}>
                {isProcessing ? 'Processing...' : isCurrentTier ? 'Current Plan' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={styles.footer}>Cancel anytime. 7-day free trial on all plans.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  activeBadge: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  activeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  manageLink: { color: '#fff', marginTop: 8, textDecorationLine: 'underline' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 4,
  },
  planName: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50', marginBottom: 12 },
  interval: { fontSize: 16, fontWeight: 'normal', color: '#666' },
  feature: { fontSize: 14, color: '#333', marginVertical: 4 },
  button: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 14, marginTop: 16, alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { textAlign: 'center', color: '#888', marginVertical: 20, fontSize: 12 },
});
