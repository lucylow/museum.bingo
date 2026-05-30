import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveEntitlements, resolveTrialState, toEntitlementRecord } from '../src/monetization/entitlements';

test('free tier keeps core gameplay only', () => {
  const entitlements = resolveEntitlements({
    subscriptionTier: 'free',
    activeAddOns: [],
    seasonalPassActive: false,
    partnerSubscriptionLevel: 'none',
  });
  const record = toEntitlementRecord(entitlements);

  assert.equal(record.core_play_free, true);
  assert.equal(record.unlimited_museums, false);
  assert.equal(record.advanced_ar_hints, false);
});

test('premium tier unlocks convenience and recap features', () => {
  const entitlements = resolveEntitlements({
    subscriptionTier: 'premium_monthly',
    activeAddOns: [],
    seasonalPassActive: false,
    partnerSubscriptionLevel: 'none',
  });
  const record = toEntitlementRecord(entitlements);

  assert.equal(record.unlimited_museums, true);
  assert.equal(record.advanced_ar_hints, true);
  assert.equal(record.premium_recap_exports, true);
});

test('partner level enables partner surfaces', () => {
  const entitlements = resolveEntitlements({
    subscriptionTier: 'free',
    activeAddOns: [],
    seasonalPassActive: false,
    partnerSubscriptionLevel: 'enterprise',
  });
  const record = toEntitlementRecord(entitlements);

  assert.equal(record.museum_partner_admin, true);
  assert.equal(record.sponsored_surfaces, true);
  assert.equal(record.affiliate_offers, true);
});

test('trial state transitions consumed when expired', () => {
  const state = resolveTrialState({
    eligible: true,
    active: false,
    consumed: false,
    endsAt: '2000-01-01T00:00:00.000Z',
  });

  assert.equal(state.consumed, true);
  assert.equal(state.eligible, false);
});
