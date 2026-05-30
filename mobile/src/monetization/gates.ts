import { GateResult, MonetizationCategory, MonetizationState } from './types';

function pass(category: MonetizationCategory, reason: string): GateResult {
  return { allowed: true, category, reason };
}

function block(category: MonetizationCategory, reason: string, recommendedUpsell?: string): GateResult {
  return { allowed: false, category, reason, recommendedUpsell };
}

export function canAccessUnlimitedMuseums(state: MonetizationState | null): GateResult {
  if (!state) {
    return pass('free', 'Defaults to free access state.');
  }

  if (state.entitlements.unlimited_museums) {
    return pass('premium', 'Premium unlock includes unlimited museums.');
  }

  return block('premium', 'Free tier allows one active museum at a time.', 'premium_monthly');
}

export function canUseAdvancedHints(state: MonetizationState | null): GateResult {
  if (!state?.entitlements.advanced_ar_hints) {
    return block('premium', 'Advanced AR hints are a convenience upgrade.', 'premium_monthly');
  }
  return pass('premium', 'Advanced AR hints unlocked.');
}

export function canUseCosmeticLocker(state: MonetizationState | null): GateResult {
  if (!state?.entitlements.cosmetic_locker) {
    return block('cosmetic', 'Cosmetic locker requires a cosmetic unlock.', 'cosmetic_bundle_classic');
  }
  return pass('cosmetic', 'Cosmetic locker unlocked.');
}

export function canUseSeasonalPriority(state: MonetizationState | null): GateResult {
  if (!state?.entitlements.priority_seasonal_cards) {
    return block('seasonal', 'Priority seasonal cards are part of seasonal pass.', 'gallery_quest_pass');
  }
  return pass('seasonal', 'Seasonal priority access granted.');
}

export function canAccessPartnerSurface(state: MonetizationState | null): GateResult {
  if (!state?.entitlements.museum_partner_admin) {
    return block('partner', 'Partner analytics and curation tools require museum partner plan.', 'museum_partner');
  }
  return pass('partner', 'Museum partner surface unlocked.');
}

export function canUsePremiumRecapExport(state: MonetizationState | null): GateResult {
  if (!state?.entitlements.premium_recap_exports) {
    return block('premium', 'Premium recap export templates are optional upgrade content.', 'premium_monthly');
  }
  return pass('premium', 'Premium recap exports unlocked.');
}
