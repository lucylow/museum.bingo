import Stripe from 'stripe';
import { db } from '../config/firebase';
import { PRICE_IDS, stripe } from '../stripe/config';
import {
  ACTIVE_SEASON_PASS,
  MONETIZATION_BUNDLES,
  MONETIZATION_COUPONS,
  MONETIZATION_OFFERS,
  MONETIZATION_PLAN,
  PURCHASE_PRODUCTS,
  SPONSORED_CHALLENGES,
} from '../monetization/catalog';
import { resolveEntitlements, resolveTrialState, toEntitlementRecord } from '../monetization/entitlements';
import { TrialState } from '../monetization/types';

type SubscriptionStatus = {
  isActive: boolean;
  tier: string | null;
  expiresAt: Date | null;
};

type PartnerSubscriptionLevel = 'none' | 'starter' | 'white_label' | 'enterprise';

type MonetizationEntitlements = {
  unlimitedMuseums: boolean;
  advancedArHints: boolean;
  extendedStatsHistory: boolean;
  galleryQuestPass: boolean;
  premiumCardSkins: boolean;
  avatarFramesAndNameEffects: boolean;
  specialConfettiStyles: boolean;
  familyModeRooms: boolean;
  classroomPack: boolean;
  groupLeaderboardsAndCoop: boolean;
  hintPacks: boolean;
  bonusDailyChallengeCards: boolean;
  speedRunMode: boolean;
  collectibleStorageShelves: boolean;
  tokenDrops: boolean;
  premiumShareExports: boolean;
  sponsoredChallenges: boolean;
  ticketAndGiftShopOffers: boolean;
  museumWhiteLabel: boolean;
  brandedArOverlays: boolean;
  visitorEngagementAnalytics: boolean;
};

type MonetizationState = {
  subscription: SubscriptionStatus;
  entitlements: MonetizationEntitlements;
  activeAddOns: string[];
  partnerSubscriptionLevel: PartnerSubscriptionLevel;
  trialState: TrialState;
  seasonPass: typeof ACTIVE_SEASON_PASS;
  offers: typeof MONETIZATION_OFFERS;
  bundles: typeof MONETIZATION_BUNDLES;
  sponsoredChallenges: typeof SPONSORED_CHALLENGES;
  suggestedUpsells: string[];
};

export class SubscriptionService {
  static async createCheckoutSession(
    userId: string,
    customerEmail: string,
    priceId: keyof typeof PRICE_IDS,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const customerId = await this.getOrCreateCustomerId(userId, customerEmail);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[priceId], quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      metadata: { userId },
    });

    if (!session.url) {
      throw new Error('Stripe checkout session did not return a URL');
    }

    return { sessionId: session.id, url: session.url };
  }

  static async createCustomerPortalSession(userId: string, returnUrl: string): Promise<string> {
    const userDoc = await db.collection('users').doc(userId).get();
    const customerId = userDoc.data()?.stripeCustomerId as string | undefined;
    if (!customerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<void> {
    if (cancelAtPeriodEnd) {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
      return;
    }

    await stripe.subscriptions.cancel(subscriptionId);
  }

  static async getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const userDoc = await db.collection('users').doc(userId).get();
    const subscriptionId = userDoc.data()?.stripeSubscriptionId as string | undefined;
    if (!subscriptionId) {
      return { isActive: false, tier: null, expiresAt: null };
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return this.mapSubscriptionStatus(subscription);
  }

  static async getUserMonetizationState(userId: string): Promise<MonetizationState> {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() as
      | {
          stripeSubscriptionId?: string;
          monetizationAddOns?: string[];
          seasonalPassActive?: boolean;
          partnerSubscriptionLevel?: PartnerSubscriptionLevel;
          trialState?: Partial<TrialState>;
          promoCodes?: string[];
        }
      | undefined;

    const subscriptionId = userData?.stripeSubscriptionId;
    let subscription: SubscriptionStatus = { isActive: false, tier: null, expiresAt: null };
    if (subscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      subscription = this.mapSubscriptionStatus(stripeSubscription);
    }

    const activeAddOns = Array.isArray(userData?.monetizationAddOns) ? userData?.monetizationAddOns : [];
    const partnerSubscriptionLevel: PartnerSubscriptionLevel = userData?.partnerSubscriptionLevel || 'none';
    const seasonalPassActive = Boolean(userData?.seasonalPassActive) || subscription.tier === 'PREMIUM_YEARLY';
    const trialState = resolveTrialState(userData?.trialState || null);
    const promoCodes = Array.isArray(userData?.promoCodes) ? userData?.promoCodes : [];

    const normalizedEntitlements = resolveEntitlements({
      subscriptionTier: this.normalizeTierName(subscription.tier),
      activeAddOns,
      seasonalPassActive,
      partnerSubscriptionLevel,
      trialState,
      couponCodes: promoCodes,
    });
    const entitlementRecord = toEntitlementRecord(normalizedEntitlements);
    const entitlements = this.buildMonetizationEntitlements(subscription, entitlementRecord, activeAddOns, seasonalPassActive, partnerSubscriptionLevel);

    return {
      subscription,
      entitlements,
      activeAddOns,
      partnerSubscriptionLevel,
      trialState,
      seasonPass: { ...ACTIVE_SEASON_PASS, premiumTrackUnlocked: entitlements.galleryQuestPass },
      offers: MONETIZATION_OFFERS,
      bundles: MONETIZATION_BUNDLES,
      sponsoredChallenges: SPONSORED_CHALLENGES,
      suggestedUpsells: this.buildSuggestedUpsells(entitlements),
    };
  }

  static getMonetizationArchitecture() {
    return {
      plan: MONETIZATION_PLAN,
      products: PURCHASE_PRODUCTS,
      offers: MONETIZATION_OFFERS,
      coupons: MONETIZATION_COUPONS,
      bundles: MONETIZATION_BUNDLES,
      seasonPass: ACTIVE_SEASON_PASS,
      sponsoredChallenges: SPONSORED_CHALLENGES,
    };
  }

  static getTierFromPriceId(priceId: string | null | undefined): string | null {
    if (!priceId) {
      return null;
    }

    const tierKey = Object.keys(PRICE_IDS).find((key) => {
      const candidate = PRICE_IDS[key as keyof typeof PRICE_IDS];
      return candidate === priceId;
    });

    return tierKey || null;
  }

  static mapSubscriptionStatus(subscription: Stripe.Subscription): SubscriptionStatus {
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const priceId = subscription.items.data[0]?.price?.id;
    const tier = this.getTierFromPriceId(priceId);
    const expiresAt = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    return { isActive, tier, expiresAt };
  }

  private static normalizeTierName(tier: string | null): string | null {
    if (!tier) {
      return null;
    }

    if (tier === 'PREMIUM_MONTHLY') return 'premium_monthly';
    if (tier === 'PREMIUM_YEARLY') return 'premium_yearly';
    if (tier === 'FAMILY_MONTHLY') return 'family_monthly';
    return tier.toLowerCase();
  }

  private static buildMonetizationEntitlements(
    subscription: SubscriptionStatus,
    resolvedEntitlements: Record<string, boolean>,
    activeAddOns: string[],
    seasonalPassActive: boolean,
    partnerSubscriptionLevel: PartnerSubscriptionLevel
  ): MonetizationEntitlements {
    const hasPremium = subscription.isActive || Boolean(resolvedEntitlements.unlimited_museums);
    const hasFamilyPlan = subscription.tier === 'FAMILY_MONTHLY';
    const hasAddOn = (addOnId: string): boolean => activeAddOns.includes(addOnId);
    const hasPartnerAccess = partnerSubscriptionLevel !== 'none';

    return {
      unlimitedMuseums: hasPremium,
      advancedArHints: hasPremium || Boolean(resolvedEntitlements.advanced_ar_hints),
      extendedStatsHistory: hasPremium || Boolean(resolvedEntitlements.extended_stats_history),
      galleryQuestPass: seasonalPassActive,
      premiumCardSkins: hasPremium || hasAddOn('premium_card_skins') || Boolean(resolvedEntitlements.cosmetic_locker),
      avatarFramesAndNameEffects: hasPremium || hasAddOn('avatar_frames') || Boolean(resolvedEntitlements.cosmetic_locker),
      specialConfettiStyles: hasPremium || hasAddOn('confetti_styles') || Boolean(resolvedEntitlements.cosmetic_locker),
      familyModeRooms: hasPremium || hasFamilyPlan,
      classroomPack: hasFamilyPlan || hasAddOn('classroom_pack'),
      groupLeaderboardsAndCoop: hasPremium || hasFamilyPlan || Boolean(resolvedEntitlements.group_room_tools),
      hintPacks: hasAddOn('hint_packs'),
      bonusDailyChallengeCards: hasPremium || hasAddOn('bonus_daily_challenges'),
      speedRunMode: hasPremium || hasAddOn('speed_run_mode'),
      collectibleStorageShelves:
        hasPremium || hasAddOn('collectible_storage') || Boolean(resolvedEntitlements.collectible_shelf_expanded),
      tokenDrops: seasonalPassActive || hasAddOn('token_drops'),
      premiumShareExports: hasPremium || hasAddOn('premium_share_cards') || Boolean(resolvedEntitlements.premium_recap_exports),
      sponsoredChallenges: hasPartnerAccess || hasAddOn('sponsored_challenges') || Boolean(resolvedEntitlements.sponsored_surfaces),
      ticketAndGiftShopOffers:
        hasPartnerAccess || hasAddOn('ticket_and_shop_promotions') || Boolean(resolvedEntitlements.affiliate_offers),
      museumWhiteLabel: partnerSubscriptionLevel === 'white_label' || partnerSubscriptionLevel === 'enterprise',
      brandedArOverlays: hasPartnerAccess,
      visitorEngagementAnalytics: hasPartnerAccess || Boolean(resolvedEntitlements.museum_partner_admin),
    };
  }

  private static buildSuggestedUpsells(entitlements: MonetizationEntitlements): string[] {
    const suggestions: string[] = [];

    if (!entitlements.galleryQuestPass) {
      suggestions.push('gallery_quest_pass');
    }
    if (!entitlements.premiumCardSkins) {
      suggestions.push('premium_card_skins');
    }
    if (!entitlements.hintPacks) {
      suggestions.push('hint_packs');
    }
    if (!entitlements.collectibleStorageShelves) {
      suggestions.push('collectible_storage');
    }
    if (!entitlements.premiumShareExports) {
      suggestions.push('premium_share_cards');
    }

    return suggestions;
  }

  private static async getOrCreateCustomerId(userId: string, email: string): Promise<string> {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const existingId = userDoc.data()?.stripeCustomerId as string | undefined;
    if (existingId) {
      return existingId;
    }

    const customer = await stripe.customers.create({ email, metadata: { userId } });
    await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
    return customer.id;
  }
}
