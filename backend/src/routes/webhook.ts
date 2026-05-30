import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { FieldValue, db } from '../config/firebase';
import { SubscriptionService } from '../services/subscriptionService';
import { stripe } from '../stripe/config';

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret || typeof signature !== 'string') {
    res.status(400).send('Missing webhook signing secret or signature');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (error) {
    res.status(400).send(`Webhook signature verification failed: ${String(error)}`);
    return;
  }

  try {
    const eventRef = db.collection('stripe_webhook_events').doc(event.id);
    const shouldProcess = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(eventRef);
      const data = existing.data() as { processed?: boolean } | undefined;
      if (data?.processed) {
        return false;
      }

      transaction.set(
        eventRef,
        {
          id: event.id,
          type: event.type,
          processed: false,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: existing.exists ? existing.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    });

    if (!shouldProcess) {
      res.json({ received: true, duplicate: true });
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    await eventRef.set(
      {
        processed: true,
        processedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ received: true });
  } catch (error) {
    await db
      .collection('stripe_webhook_events')
      .doc(event.id)
      .set(
        {
          processed: false,
          error: String(error),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    res.status(500).json({ received: false, error: String(error) });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  if (!userId || !subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tier = SubscriptionService.getTierFromPriceId(subscription.items.data[0]?.price?.id);

  await db
    .collection('users')
    .doc(userId)
    .set(
      {
        stripeCustomerId: customerId ?? null,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionTier: tier,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  await db.collection('subscription_events').add({
    userId,
    eventType: 'subscription_created',
    stripeSubscriptionId: subscriptionId,
    timestamp: FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const userId = await getUserIdFromSubscription(subscription);
  if (!userId) {
    return;
  }

  const status = SubscriptionService.mapSubscriptionStatus(subscription);
  await db.collection('users').doc(userId).set(
    {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: status.isActive ? 'active' : subscription.status,
      subscriptionTier: status.tier,
      currentPeriodEnd: status.expiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = await getUserIdFromSubscription(subscription);
  if (!userId) {
    return;
  }

  await db.collection('users').doc(userId).set(
    {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'canceled',
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) {
    return;
  }

  await db.collection('subscription_events').add({
    eventType: 'payment_succeeded',
    stripeSubscriptionId: subscriptionId,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    timestamp: FieldValue.serverTimestamp(),
  });
}

async function getUserIdFromSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata?.userId;
  if (fromMetadata) {
    return fromMetadata;
  }

  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) {
    return null;
  }

  const customer = await stripe.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) {
    return null;
  }

  return customer.metadata?.userId || null;
}

export default router;
