import Stripe from 'stripe';
import { db } from '../config/firebase';
import { PRICE_IDS, stripe } from '../stripe/config';

type SubscriptionStatus = {
  isActive: boolean;
  tier: string | null;
  expiresAt: Date | null;
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
