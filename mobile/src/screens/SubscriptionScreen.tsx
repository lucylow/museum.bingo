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

type MonetizationSection = {
  id: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    name: string;
    description: string;
    unlockType: 'free' | 'premium' | 'season-pass' | 'add-on' | 'partner';
  }>;
};

type MonetizationState = {
  subscription: SubscriptionStatus;
  entitlements: Record<string, boolean>;
  activeAddOns: string[];
  suggestedUpsells: string[];
};

const ITEM_ENTITLEMENT_MAP: Record<string, string> = {
  gallery_quest_pass: 'galleryQuestPass',
  premium_card_skins: 'premiumCardSkins',
  avatar_frames: 'avatarFramesAndNameEffects',
  confetti_styles: 'specialConfettiStyles',
  family_mode: 'familyModeRooms',
  classroom_pack: 'classroomPack',
  hint_packs: 'hintPacks',
  speed_run_mode: 'speedRunMode',
  collectible_storage: 'collectibleStorageShelves',
  token_drops: 'tokenDrops',
  premium_share_cards: 'premiumShareExports',
  sponsored_challenges: 'sponsoredChallenges',
  museum_partner_subscription: 'museumWhiteLabel',
  ticket_and_shop_promotions: 'ticketAndGiftShopOffers',
  free_core: 'free_core',
  premium_unlimited: 'unlimitedMuseums',
};

export const SubscriptionScreen: React.FC = () => {
  const { user, getIdToken } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [catalog, setCatalog] = useState<MonetizationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<SubscriptionStatus>({
    isActive: false,
    tier: null,
  });
  const [monetizationState, setMonetizationState] = useState<MonetizationState | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([fetchTiers(), fetchCatalog(), fetchSubscriptionStatus()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    const response = await api.get<Tier[]>('/subscription/tiers');
    setTiers(response);
  };

  const fetchCatalog = async () => {
    const response = await api.get<MonetizationSection[]>('/subscription/catalog');
    setCatalog(response);
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      return;
    }
    try {
      const token = await getIdToken();
      const response = await api.get<MonetizationState>('/subscription/entitlements', { token });
      setCurrentStatus(response.subscription);
      setMonetizationState(response);
    } catch {
      setCurrentStatus({ isActive: false, tier: null });
      setMonetizationState(null);
    }
  };

  const isItemUnlocked = (item: MonetizationSection['items'][number]): boolean => {
    if (item.unlockType === 'free') {
      return true;
    }

    if (item.unlockType === 'premium') {
      return currentStatus.isActive;
    }

    const entitlementKey = ITEM_ENTITLEMENT_MAP[item.id];
    if (!entitlementKey) {
      return false;
    }

    return Boolean(monetizationState?.entitlements?.[entitlementKey]);
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
      <Text style={styles.title}>Membership and Rewards</Text>
      <Text style={styles.subtitle}>
        Keep core gameplay free, then unlock premium modes, cosmetics, and event rewards when you are ready.
      </Text>
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

      {catalog.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionDescription}>{section.description}</Text>
          {section.items.map((item) => {
            const unlocked = isItemUnlocked(item);
            return (
              <View key={`${section.id}_${item.id}`} style={styles.catalogItem}>
                <View style={styles.catalogHeader}>
                  <Text style={styles.catalogTitle}>{item.name}</Text>
                  <Text style={[styles.unlockBadge, unlocked ? styles.unlocked : styles.locked]}>
                    {unlocked ? 'Unlocked' : 'Locked'}
                  </Text>
                </View>
                <Text style={styles.catalogDescription}>{item.description}</Text>
                <Text style={styles.unlockHint}>Unlock path: {item.unlockType}</Text>
              </View>
            );
          })}
        </View>
      ))}

      {monetizationState?.suggestedUpsells?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Next Unlocks</Text>
          <View style={styles.upsellWrap}>
            {monetizationState.suggestedUpsells.map((upsell) => (
              <Text key={upsell} style={styles.upsellChip}>
                {upsell}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.footer}>No pay-to-win mechanics. Monetization focuses on cosmetics, optional modes, and partnerships.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 18 },
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
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionDescription: { color: '#666', marginBottom: 10 },
  catalogItem: {
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  catalogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  catalogTitle: { flex: 1, fontWeight: '600', color: '#202020' },
  catalogDescription: { color: '#555', marginTop: 4 },
  unlockBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  unlocked: { backgroundColor: '#ddf7e4', color: '#1e8e3e' },
  locked: { backgroundColor: '#f2f2f2', color: '#757575' },
  unlockHint: { marginTop: 6, fontSize: 12, color: '#888', textTransform: 'capitalize' },
  upsellWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  upsellChip: {
    backgroundColor: '#ece9ff',
    color: '#5b3cc4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: { textAlign: 'center', color: '#888', marginVertical: 20, fontSize: 12 },
});
