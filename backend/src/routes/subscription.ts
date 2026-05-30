import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../config/firebase';
import { AuthenticatedRequest, verifyFirebaseToken } from '../middleware/auth';
import { SubscriptionService } from '../services/subscriptionService';
import { MONETIZATION_CATALOG, PRICE_IDS, TIERS } from '../stripe/config';
import { handleStripeError } from '../utils/stripeErrorHandler';
import { trackRevenueEvent } from '../monetization/revenueEvents';
import { MonetizationBucket, RevenueEventType } from '../monetization/types';

const router = express.Router();

type CreateCheckoutBody = {
  priceId?: keyof typeof PRICE_IDS;
  successUrl?: string;
  cancelUrl?: string;
};

type PortalBody = {
  returnUrl?: string;
};

type RevenueEventBody = {
  eventType?: RevenueEventType;
  bucket?: MonetizationBucket;
  productId?: string;
  offerId?: string;
  couponCode?: string;
  amountCents?: number;
  currency?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
};

router.get('/tiers', (_req: Request, res: Response) => {
  res.json(TIERS);
});

router.get('/catalog', (_req: Request, res: Response) => {
  res.json(MONETIZATION_CATALOG);
});

router.get('/architecture', (_req: Request, res: Response) => {
  res.json(SubscriptionService.getMonetizationArchitecture());
});

router.post('/create-checkout', verifyFirebaseToken, async (req: Request, res: Response) => {
  const { priceId, successUrl, cancelUrl } = req.body as CreateCheckoutBody;
  const user = (req as AuthenticatedRequest).user;

  if (!user?.uid || !user.email) {
    res.status(400).json({ error: 'Authenticated user email is required for subscriptions' });
    return;
  }

  if (!priceId || !(priceId in PRICE_IDS)) {
    res.status(400).json({ error: 'Invalid subscription tier' });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://museum.bingo';
  const resolvedSuccessUrl = successUrl || `${frontendUrl}/subscription/success`;
  const resolvedCancelUrl = cancelUrl || `${frontendUrl}/subscription/cancel`;

  try {
    const session = await SubscriptionService.createCheckoutSession(
      user.uid,
      user.email,
      priceId,
      resolvedSuccessUrl,
      resolvedCancelUrl
    );
    res.json(session);
  } catch (error) {
    const handled = handleStripeError(error);
    res.status(handled.statusCode).json({ error: handled.message });
  }
});

router.get('/status', verifyFirebaseToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const status = await SubscriptionService.getUserSubscriptionStatus(user.uid);
    res.json(status);
  } catch (error) {
    const handled = handleStripeError(error);
    res.status(handled.statusCode).json({ error: handled.message });
  }
});

router.get('/entitlements', verifyFirebaseToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const state = await SubscriptionService.getUserMonetizationState(user.uid);
    res.json(state);
  } catch (error) {
    const handled = handleStripeError(error);
    res.status(handled.statusCode).json({ error: handled.message });
  }
});

router.post('/portal', verifyFirebaseToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const { returnUrl } = req.body as PortalBody;

  if (!user?.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://museum.bingo';
  const resolvedReturnUrl = returnUrl || `${frontendUrl}/subscription`;

  try {
    const url = await SubscriptionService.createCustomerPortalSession(user.uid, resolvedReturnUrl);
    res.json({ url });
  } catch (error) {
    const handled = handleStripeError(error);
    res.status(handled.statusCode).json({ error: handled.message });
  }
});

router.post('/cancel', verifyFirebaseToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const subscriptionId = userDoc.data()?.stripeSubscriptionId as string | undefined;
    if (!subscriptionId) {
      res.status(404).json({ error: 'No active subscription found' });
      return;
    }

    await SubscriptionService.cancelSubscription(subscriptionId, true);
    res.json({ success: true, message: 'Subscription will be cancelled at period end' });
  } catch (error) {
    const handled = handleStripeError(error);
    res.status(handled.statusCode).json({ error: handled.message });
  }
});

router.post('/revenue-events', verifyFirebaseToken, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body as RevenueEventBody;
  if (!body.eventType || !body.bucket || !body.idempotencyKey) {
    res.status(400).json({ error: 'eventType, bucket, and idempotencyKey are required' });
    return;
  }

  try {
    const result = await trackRevenueEvent({
      eventId: randomUUID(),
      userId: user.uid,
      eventType: body.eventType,
      bucket: body.bucket,
      productId: body.productId,
      offerId: body.offerId,
      couponCode: body.couponCode,
      amountCents: body.amountCents,
      currency: body.currency,
      idempotencyKey: body.idempotencyKey,
      metadata: body.metadata,
      createdAt: new Date().toISOString(),
    });
    res.json(result);
  } catch (error) {
    const handled = handleStripeError(error);
    res.status(handled.statusCode).json({ error: handled.message });
  }
});

export default router;
