import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useMonetization } from '../hooks/useMonetization';
import {
  canAccessPartnerSurface,
  canUseCosmeticLocker,
  canUsePremiumRecapExport,
  canUseSeasonalPriority,
} from '../monetization/gates';
import { monetizationService } from '../monetization/service';
import { Offer, PurchaseProduct } from '../monetization/types';

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
  const { loading, state: monetizationState, architecture, refresh } = useMonetization();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [catalog, setCatalog] = useState<Array<{ id: string; title: string; description: string; items: Array<{ id: string; name: string; description: string; unlockType: string }> }>>([]);
  const [currentStatus, setCurrentStatus] = useState<SubscriptionStatus>({
    isActive: false,
    tier: null,
  });
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const loadData = async () => {
    try {
      await Promise.all([fetchTiers(), fetchCatalog(), fetchSubscriptionStatus(), refresh()]);
    } finally {
      setBootstrapped(true);
    }
  };

  useEffect(() => {
    if (!bootstrapped) {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped]);

  const fetchTiers = async () => {
    const response = await api.get('/subscription/tiers');
    const payload = (response as unknown as { data?: Tier[] }).data ?? (response as Tier[]);
    setTiers(payload);
  };

  const fetchCatalog = async () => {
    const response = await api.get('/subscription/catalog');
    const payload =
      (response as unknown as { data?: Array<{ id: string; title: string; description: string; items: Array<{ id: string; name: string; description: string; unlockType: string }> }> }).data ??
      (response as Array<{ id: string; title: string; description: string; items: Array<{ id: string; name: string; description: string; unlockType: string }> }>);
    setCatalog(payload);
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      return;
    }
    try {
      const token = await getIdToken();
      const state = await monetizationService.fetchMonetizationState(token);
      setCurrentStatus(state.subscription);
    } catch {
      setCurrentStatus({ isActive: false, tier: null });
    }
  };

  const trackRevenue = async (payload: {
    eventType:
      | 'offer_viewed'
      | 'trial_started'
      | 'subscription_purchased'
      | 'plan_upgraded'
      | 'cosmetic_purchased'
      | 'season_pass_purchased'
      | 'sponsor_offer_claimed'
      | 'museum_partner_activated'
      | 'recap_export_unlocked';
    bucket: string;
    productId?: string;
    offerId?: string;
    amountCents?: number;
  }) => {
    if (!user) {
      return;
    }
    try {
      const token = await getIdToken();
      await monetizationService.trackRevenueEvent(
        {
          ...payload,
          idempotencyKey: `${payload.eventType}-${payload.offerId || payload.productId || 'general'}-${Date.now().toString()}`,
          metadata: { source: 'subscription_screen' },
        },
        token
      );
    } catch {
      // Best effort analytics; do not block UX.
    }
  };

  const isItemUnlocked = (item: { id: string; unlockType: string }): boolean => {
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
      const payload = (response as unknown as { data?: { sessionId: string; url: string } }).data ?? (response as { sessionId: string; url: string });
      await trackRevenue({ eventType: 'subscription_purchased', bucket: 'freemium_upgrade', productId: priceId });
      await Linking.openURL(payload.url);
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
      const payload = (response as unknown as { data?: { url: string } }).data ?? (response as { url: string });
      await Linking.openURL(payload.url);
    } catch {
      Alert.alert('Error', 'Failed to open customer portal.');
    }
  };

  const allProducts = architecture?.products ?? [];
  const seasonPass = monetizationState?.seasonPass ?? architecture?.seasonPass;
  const seasonGate = canUseSeasonalPriority(monetizationState);
  const cosmeticGate = canUseCosmeticLocker(monetizationState);
  const partnerGate = canAccessPartnerSurface(monetizationState);
  const recapGate = canUsePremiumRecapExport(monetizationState);

  const topOffer = useMemo(() => {
    const offers = monetizationState?.offers ?? architecture?.offers ?? [];
    return offers[0] ?? null;
  }, [architecture?.offers, monetizationState?.offers]);

  if (loading || !bootstrapped) {
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
      <View style={styles.trustPanel}>
        {(architecture?.plan.trustPrinciples ?? [
          'Core bingo is always free.',
          'No pay-to-win mechanics.',
          'Premium is convenience and style only.',
        ]).map((principle) => (
          <Text key={principle} style={styles.trustPoint}>
            {'\u2022'} {principle}
          </Text>
        ))}
      </View>

      {currentStatus.isActive ? (
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>Current Plan: {currentStatus.tier}</Text>
          <TouchableOpacity onPress={() => void handleManageSubscription()}>
            <Text style={styles.manageLink}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Upgrade Path</Text>
        <Text style={styles.sectionDescription}>
          Frequent museum visitors unlock richer stats, AR hints, cosmetics, and recap exports while core play stays free.
        </Text>
        {monetizationState?.trialState?.eligible ? (
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={() => {
              void trackRevenue({ eventType: 'trial_started', bucket: 'freemium_upgrade' });
              Alert.alert(
                'Intro trial available',
                'Start with a friendly trial and cancel anytime from billing settings.'
              );
            }}
          >
            <Text style={styles.inlineButtonText}>
              {monetizationState.trialState.active ? 'Trial Active' : 'Start Intro Trial'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {tiers.map((tier) => {
        const isCurrentTier = currentStatus.isActive && currentStatus.tier === tier.id;
        const isProcessing = checkoutLoading === tier.id || checkoutLoading === tier.id.toLowerCase();

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seasonal Pass: {seasonPass?.name || 'Gallery Quest Pass'}</Text>
        <Text style={styles.sectionDescription}>
          Free and premium reward tracks with cosmetic unlocks, themed collectibles, and recap frames.
        </Text>
        {(seasonPass?.rewardTrack ?? []).map((reward) => (
          <View key={reward.id} style={styles.trackRow}>
            <Text style={styles.trackTitle}>
              {reward.label} ({reward.tier})
            </Text>
            <Text style={styles.trackMeta}>
              {reward.requiredPoints} pts • {reward.rewardType} • {reward.claimState}
            </Text>
          </View>
        ))}
        <Text style={styles.unlockHint}>{seasonGate.reason}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cosmetics Store and Locker</Text>
        <Text style={styles.sectionDescription}>
          Card skins, avatar frames, confetti styles, room banners, and profile themes stay visual-only.
        </Text>
        {allProducts
          .filter((product) => product.bucket === 'cosmetic_shop')
          .map((product: PurchaseProduct) => (
            <View key={product.id} style={styles.catalogItem}>
              <View style={styles.catalogHeader}>
                <Text style={styles.catalogTitle}>{product.name}</Text>
                <Text style={[styles.unlockBadge, isItemUnlocked({ id: product.id, unlockType: 'add-on' }) ? styles.unlocked : styles.locked]}>
                  {isItemUnlocked({ id: product.id, unlockType: 'add-on' }) ? 'Owned/Unlocked' : 'Shop'}
                </Text>
              </View>
              <Text style={styles.catalogDescription}>{product.description}</Text>
            </View>
          ))}
        <Text style={styles.unlockHint}>{cosmeticGate.reason}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family and Group Packs</Text>
        <Text style={styles.sectionDescription}>
          Family rooms, classroom controls, group leaderboards, co-op objectives, and shared recap moments.
        </Text>
        {(monetizationState?.bundles ?? architecture?.bundles ?? []).map((bundle) => (
          <View key={bundle.id} style={styles.catalogItem}>
            <Text style={styles.catalogTitle}>{bundle.name}</Text>
            <Text style={styles.catalogDescription}>{bundle.description}</Text>
            <Text style={styles.unlockHint}>
              ${(bundle.bundlePriceCents / 100).toFixed(2)} • Audience: {bundle.audience.join(', ')}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Museum Partner Subscription (B2B)</Text>
        <Text style={styles.sectionDescription}>
          White-label branding, exhibit prompt curation, branded AR overlays, season scheduling, and visitor analytics.
        </Text>
        <View style={styles.catalogItem}>
          <Text style={styles.catalogTitle}>Partner Dashboard Snapshot</Text>
          <Text style={styles.catalogDescription}>Top prompts, dwell time, completion rate, repeat visitors, and sponsor placement controls.</Text>
          <Text style={styles.unlockHint}>{partnerGate.reason}</Text>
        </View>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reward-Based Upsells</Text>
        <Text style={styles.sectionDescription}>Optional, post-reward moments only. No interruptive upsells during active scanning.</Text>
        {(monetizationState?.offers ?? architecture?.offers ?? []).map((offer) => (
          <TouchableOpacity
            key={offer.id}
            style={styles.catalogItem}
            onPress={() => {
              setSelectedOffer(offer);
              setPaywallVisible(true);
              void trackRevenue({ eventType: 'offer_viewed', bucket: offer.bucket, offerId: offer.id });
            }}
          >
            <Text style={styles.catalogTitle}>{offer.title}</Text>
            <Text style={styles.catalogDescription}>{offer.description}</Text>
            <Text style={styles.unlockHint}>Shown at: {offer.triggerMoments.join(', ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sponsored Challenges</Text>
        <Text style={styles.sectionDescription}>Clearly labeled placements in challenge cards, reward panels, and recaps.</Text>
        {(monetizationState?.sponsoredChallenges ?? architecture?.sponsoredChallenges ?? []).map((challenge) => (
          <View key={challenge.id} style={styles.catalogItem}>
            <Text style={styles.catalogTitle}>
              {challenge.sponsorLabel}: {challenge.sponsorName}
            </Text>
            <Text style={styles.catalogDescription}>{challenge.rewardCopy}</Text>
            <Text style={styles.unlockHint}>Fairness: {challenge.fairnessNotes.join(' | ')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Digital Collectibles (Cosmetic and Status Only)</Text>
        <Text style={styles.sectionDescription}>
          Seasonal token drops and shelf displays celebrate achievement memories, never investing or gameplay advantage.
        </Text>
        <View style={styles.catalogItem}>
          <Text style={styles.catalogTitle}>Collectible Shelf Slots</Text>
          <Text style={styles.catalogDescription}>
            Free shelf slots stay available. Premium and bundles add optional display capacity.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shareable Recap Exports</Text>
        <Text style={styles.sectionDescription}>
          Free users keep a standard recap card. Premium adds poster templates, animated exports, and high-resolution frames.
        </Text>
        <TouchableOpacity
          style={styles.inlineButton}
          onPress={() => {
            if (recapGate.allowed) {
              void trackRevenue({ eventType: 'recap_export_unlocked', bucket: 'shareable_recap_export' });
              Alert.alert('Export ready', 'Premium recap export unlocked for sharing.');
              return;
            }
            Alert.alert('Premium recap export', recapGate.reason);
          }}
        >
          <Text style={styles.inlineButtonText}>
            {recapGate.allowed ? 'Export Premium Recap Poster' : 'See Premium Recap Templates'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ticket, Shop, and Affiliate Offers</Text>
        <Text style={styles.sectionDescription}>
          Museum-context offers on win and recap moments: ticket bundles, gift-shop promos, cafe coupons, and membership links.
        </Text>
        {(architecture?.coupons ?? []).map((coupon) => (
          <TouchableOpacity
            key={coupon.code}
            style={styles.catalogItem}
            onPress={() => {
              setCopiedCoupon(coupon.code);
              Alert.alert('Coupon saved', `${coupon.code} is ready for museum partner offers.`);
            }}
          >
            <Text style={styles.catalogTitle}>{coupon.code}</Text>
            <Text style={styles.catalogDescription}>{coupon.description}</Text>
            <Text style={styles.unlockHint}>
              {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `$${(coupon.discountValue / 100).toFixed(2)} off`}
            </Text>
          </TouchableOpacity>
        ))}
        {copiedCoupon ? <Text style={styles.unlockHint}>Selected coupon: {copiedCoupon}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Billing, Entitlements, and Analytics Reliability</Text>
        <Text style={styles.sectionDescription}>
          Revenue events use idempotency keys, entitlements are centralized, and reconnect-safe state lives in backend subscription APIs.
        </Text>
        <Text style={styles.unlockHint}>
          Tracked events: offer viewed, trial started, purchased, upgraded, cosmetic purchased, season pass purchased, sponsor claimed, partner activated, recap export unlocked.
        </Text>
      </View>

      <Text style={styles.footer}>No pay-to-win mechanics. Monetization focuses on cosmetics, optional modes, and partnerships.</Text>

      <Modal visible={paywallVisible} transparent animationType="slide" onRequestClose={() => setPaywallVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedOffer?.title || topOffer?.title || 'Upgrade at your own pace'}</Text>
            <Text style={styles.modalBody}>
              {(selectedOffer?.description || topOffer?.description || 'Unlock convenience and style while core bingo stays free.') +
                ' You can continue playing without upgrading.'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => void handleSubscribe('PREMIUM_MONTHLY')}>
              <Text style={styles.buttonText}>See Premium Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setPaywallVisible(false)}>
              <Text style={styles.secondaryText}>Keep Playing Free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 18 },
  trustPanel: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  trustPoint: { color: '#2d3a4e', marginBottom: 5, fontSize: 13 },
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
  inlineButton: {
    marginTop: 8,
    backgroundColor: '#eef4ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  inlineButtonText: { color: '#2c59d3', fontWeight: '700' },
  trackRow: {
    borderWidth: 1,
    borderColor: '#e8ebf5',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  trackTitle: { fontWeight: '700', color: '#1f2937' },
  trackMeta: { color: '#65748b', marginTop: 4, fontSize: 12 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, color: '#202020' },
  modalBody: { color: '#555', marginBottom: 16 },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d0d7e8',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  secondaryText: { color: '#364a72', fontWeight: '700' },
  footer: { textAlign: 'center', color: '#888', marginVertical: 20, fontSize: 12 },
});
