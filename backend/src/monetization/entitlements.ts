import { ACTIVE_SEASON_PASS, SUBSCRIPTION_TIERS } from './catalog';
import { Entitlement, FeatureFlag, TrialState } from './types';

const FEATURE_FLAGS: FeatureFlag[] = [
  'core_play_free',
  'unlimited_museums',
  'advanced_ar_hints',
  'extended_stats_history',
  'premium_badge_frames',
  'priority_seasonal_cards',
  'premium_recap_exports',
  'collectible_shelf_expanded',
  'group_room_tools',
  'museum_partner_admin',
  'sponsored_surfaces',
  'affiliate_offers',
  'cosmetic_locker',
];

type EntitlementInputs = {
  subscriptionTier: string | null;
  activeAddOns: string[];
  partnerSubscriptionLevel: 'none' | 'starter' | 'white_label' | 'enterprise';
  seasonalPassActive: boolean;
  trialState?: TrialState;
  couponCodes?: string[];
};

function tierFeatures(subscriptionTier: string | null): FeatureFlag[] {
  if (!subscriptionTier) {
    return ['core_play_free'];
  }

  const normalized = subscriptionTier.toLowerCase();
  const tier = SUBSCRIPTION_TIERS.find((entry) => {
    if (entry.id === normalized) {
      return true;
    }

    if (normalized === 'premium_monthly' && entry.id === 'premium_monthly') {
      return true;
    }
    if (normalized === 'premium_yearly' && entry.id === 'premium_yearly') {
      return true;
    }
    if (normalized === 'family_monthly' && entry.id === 'family_monthly') {
      return true;
    }

    return false;
  });

  return tier ? tier.featureFlags : ['core_play_free'];
}

function addOnFeatures(activeAddOns: string[]): FeatureFlag[] {
  const features = new Set<FeatureFlag>();
  if (activeAddOns.includes('premium_card_skins')) {
    features.add('cosmetic_locker');
    features.add('premium_badge_frames');
  }
  if (activeAddOns.includes('hint_packs')) {
    features.add('advanced_ar_hints');
  }
  if (activeAddOns.includes('premium_share_cards')) {
    features.add('premium_recap_exports');
  }
  if (activeAddOns.includes('collectible_storage')) {
    features.add('collectible_shelf_expanded');
  }
  return Array.from(features);
}

export function resolveTrialState(input?: Partial<TrialState> | null): TrialState {
  if (!input) {
    return {
      eligible: true,
      active: false,
      consumed: false,
    };
  }

  const active = Boolean(input.active);
  const consumed = Boolean(input.consumed || (input.endsAt && new Date(input.endsAt).getTime() < Date.now()));
  return {
    eligible: Boolean(input.eligible) && !consumed,
    active,
    startedAt: input.startedAt,
    endsAt: input.endsAt,
    consumed,
    offerCode: input.offerCode,
  };
}

export function resolveEntitlements(input: EntitlementInputs): Entitlement[] {
  const entitlements = new Map<FeatureFlag, Entitlement>();
  FEATURE_FLAGS.forEach((feature) => {
    entitlements.set(feature, {
      feature,
      granted: feature === 'core_play_free',
      source: 'free',
      expiresAt: null,
    });
  });

  for (const feature of tierFeatures(input.subscriptionTier)) {
    entitlements.set(feature, {
      feature,
      granted: true,
      source: feature === 'core_play_free' ? 'free' : 'subscription',
      expiresAt: null,
    });
  }

  for (const feature of addOnFeatures(input.activeAddOns)) {
    entitlements.set(feature, {
      feature,
      granted: true,
      source: 'purchase',
      expiresAt: null,
    });
  }

  if (input.seasonalPassActive || ACTIVE_SEASON_PASS.active) {
    entitlements.set('priority_seasonal_cards', {
      feature: 'priority_seasonal_cards',
      granted: true,
      source: 'season_pass',
      expiresAt: ACTIVE_SEASON_PASS.endsAt,
    });
  }

  if (input.partnerSubscriptionLevel !== 'none') {
    entitlements.set('sponsored_surfaces', {
      feature: 'sponsored_surfaces',
      granted: true,
      source: 'partner',
      expiresAt: null,
    });
    entitlements.set('affiliate_offers', {
      feature: 'affiliate_offers',
      granted: true,
      source: 'partner',
      expiresAt: null,
    });
    if (input.partnerSubscriptionLevel === 'white_label' || input.partnerSubscriptionLevel === 'enterprise') {
      entitlements.set('museum_partner_admin', {
        feature: 'museum_partner_admin',
        granted: true,
        source: 'partner',
        expiresAt: null,
      });
    }
  }

  if (input.couponCodes?.length) {
    entitlements.set('premium_recap_exports', {
      feature: 'premium_recap_exports',
      granted: true,
      source: 'coupon',
      expiresAt: null,
    });
  }

  return Array.from(entitlements.values());
}

export function toEntitlementRecord(entitlements: Entitlement[]): Record<string, boolean> {
  return entitlements.reduce<Record<string, boolean>>((acc, entitlement) => {
    acc[entitlement.feature] = entitlement.granted;
    return acc;
  }, {});
}
