import assert from 'node:assert/strict';
import test from 'node:test';
import { SubscriptionService } from '../src/services/subscriptionService';
import { PRICE_IDS } from '../src/stripe/config';

test('getTierFromPriceId resolves known tier', () => {
  const tier = SubscriptionService.getTierFromPriceId(PRICE_IDS.PREMIUM_MONTHLY);
  assert.equal(tier, 'PREMIUM_MONTHLY');
});

test('getTierFromPriceId returns null for unknown price', () => {
  const tier = SubscriptionService.getTierFromPriceId('price_unknown');
  assert.equal(tier, null);
});

test('monetization architecture exposes trust principles and products', () => {
  const architecture = SubscriptionService.getMonetizationArchitecture();
  assert.ok(architecture.plan.trustPrinciples.length > 0);
  assert.ok(architecture.products.length > 0);
  assert.ok(architecture.seasonPass.name.length > 0);
});
