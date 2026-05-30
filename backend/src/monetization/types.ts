export type SubscriptionTierId = 'free' | 'premium_monthly' | 'premium_yearly' | 'family_monthly' | 'museum_partner';

export type MonetizationBucket =
  | 'freemium_upgrade'
  | 'seasonal_pass'
  | 'cosmetic_shop'
  | 'family_group_pack'
  | 'museum_partner_subscription'
  | 'reward_upsell'
  | 'sponsored_challenge'
  | 'collectible_marketplace'
  | 'shareable_recap_export'
  | 'ticket_giftshop_affiliate';

export type FeatureFlag =
  | 'core_play_free'
  | 'unlimited_museums'
  | 'advanced_ar_hints'
  | 'extended_stats_history'
  | 'premium_badge_frames'
  | 'priority_seasonal_cards'
  | 'premium_recap_exports'
  | 'collectible_shelf_expanded'
  | 'group_room_tools'
  | 'museum_partner_admin'
  | 'sponsored_surfaces'
  | 'affiliate_offers'
  | 'cosmetic_locker';

export type ClaimState = 'locked' | 'claimable' | 'claimed' | 'expired';

export type TrialState = {
  eligible: boolean;
  active: boolean;
  startedAt?: string;
  endsAt?: string;
  consumed: boolean;
  offerCode?: string;
};

export type Entitlement = {
  feature: FeatureFlag;
  granted: boolean;
  source: 'free' | 'subscription' | 'season_pass' | 'purchase' | 'partner' | 'sponsor' | 'coupon';
  expiresAt?: string | null;
};

export type PurchaseProvider = 'stripe' | 'apple_iap' | 'google_play' | 'manual';

export type PurchaseProduct = {
  id: string;
  sku: string;
  name: string;
  description: string;
  bucket: MonetizationBucket;
  provider: PurchaseProvider;
  priceCents: number;
  currency: string;
  billingInterval?: 'month' | 'year' | 'one_time';
  featured?: boolean;
  tags?: string[];
  linkedFeatures: FeatureFlag[];
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  bucket: MonetizationBucket;
  productIds: string[];
  audience: Array<'new_user' | 'returning' | 'family' | 'museum_partner' | 'free_user' | 'premium_user'>;
  startsAt?: string;
  endsAt?: string;
  triggerMoments: Array<'post_bingo' | 'recap' | 'lobby' | 'settings' | 'season_panel' | 'museum_select'>;
};

export type Coupon = {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  validProductIds: string[];
  sponsorLabel?: string;
  expiresAt?: string;
};

export type Bundle = {
  id: string;
  name: string;
  description: string;
  productIds: string[];
  bundlePriceCents: number;
  currency: string;
  audience: Array<'family' | 'classroom' | 'friends' | 'field_trip'>;
};

export type SeasonPassReward = {
  id: string;
  label: string;
  tier: 'free' | 'premium';
  requiredPoints: number;
  claimState: ClaimState;
  rewardType: 'badge' | 'cosmetic' | 'collectible' | 'recap_frame' | 'challenge_boost';
};

export type SeasonPass = {
  id: string;
  name: string;
  theme: string;
  artworkToken: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  progressPoints: number;
  rewardTrack: SeasonPassReward[];
  premiumTrackUnlocked: boolean;
};

export type SponsoredChallenge = {
  id: string;
  sponsorName: string;
  sponsorLabel: string;
  placementZones: Array<'challenge_card' | 'reward_panel' | 'recap_screen' | 'partner_dashboard' | 'offer_surface'>;
  rewardCopy: string;
  fairnessNotes: string[];
  active: boolean;
};

export type SubscriptionTier = {
  id: SubscriptionTierId;
  name: string;
  tagline: string;
  productId?: string;
  monthlyEquivalentCents?: number;
  featureFlags: FeatureFlag[];
  limits: {
    maxMuseums: number | 'unlimited';
    hintTokensPerSession: number;
    statsHistoryDays: number;
    collectibleShelfSlots: number;
  };
  targetAudience: string[];
};

export type MonetizationPlan = {
  version: string;
  updatedAt: string;
  trustPrinciples: string[];
  freeForeverFeatures: FeatureFlag[];
  tiers: SubscriptionTier[];
  buckets: MonetizationBucket[];
};

export type RevenueEventType =
  | 'offer_viewed'
  | 'trial_started'
  | 'subscription_purchased'
  | 'plan_upgraded'
  | 'cosmetic_purchased'
  | 'season_pass_purchased'
  | 'sponsor_offer_claimed'
  | 'museum_partner_activated'
  | 'recap_export_unlocked';

export type RevenueEvent = {
  eventId: string;
  userId: string;
  eventType: RevenueEventType;
  bucket: MonetizationBucket;
  productId?: string;
  offerId?: string;
  couponCode?: string;
  amountCents?: number;
  currency?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
