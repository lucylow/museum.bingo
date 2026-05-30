export type MonetizationCategory = 'free' | 'premium' | 'cosmetic' | 'seasonal' | 'partner';

export type SubscriptionTier =
  | 'free'
  | 'premium_monthly'
  | 'premium_yearly'
  | 'family_monthly'
  | 'museum_partner'
  | null;

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

export type PurchaseProduct = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  billingInterval?: 'month' | 'year' | 'one_time';
  bucket: string;
  linkedFeatures: FeatureFlag[];
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  bucket: string;
  triggerMoments: string[];
};

export type Coupon = {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
};

export type Bundle = {
  id: string;
  name: string;
  description: string;
  bundlePriceCents: number;
  audience: string[];
};

export type ClaimState = 'locked' | 'claimable' | 'claimed' | 'expired';

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
  placementZones: string[];
  rewardCopy: string;
  fairnessNotes: string[];
  active: boolean;
};

export type TrialState = {
  eligible: boolean;
  active: boolean;
  startedAt?: string;
  endsAt?: string;
  consumed: boolean;
  offerCode?: string;
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

export type RevenueEventPayload = {
  eventType: RevenueEventType;
  bucket: string;
  productId?: string;
  offerId?: string;
  couponCode?: string;
  amountCents?: number;
  currency?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type MonetizationState = {
  subscription: {
    isActive: boolean;
    tier: string | null;
    expiresAt?: string | null;
  };
  entitlements: Record<string, boolean>;
  activeAddOns: string[];
  partnerSubscriptionLevel?: string;
  trialState?: TrialState;
  seasonPass?: SeasonPass;
  offers?: Offer[];
  bundles?: Bundle[];
  sponsoredChallenges?: SponsoredChallenge[];
  suggestedUpsells: string[];
};

export type MonetizationArchitecture = {
  plan: {
    version: string;
    trustPrinciples: string[];
  };
  products: PurchaseProduct[];
  offers: Offer[];
  coupons: Coupon[];
  bundles: Bundle[];
  seasonPass: SeasonPass;
  sponsoredChallenges: SponsoredChallenge[];
};

export type GateResult = {
  allowed: boolean;
  category: MonetizationCategory;
  reason: string;
  recommendedUpsell?: string;
};
