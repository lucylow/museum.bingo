"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const subscriptionService_1 = require("../services/subscriptionService");
const config_1 = require("../stripe/config");
const revenueEvents_1 = require("../monetization/revenueEvents");
const router = express_1.default.Router();
router.post('/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret || typeof signature !== 'string') {
        res.status(400).send('Missing webhook signing secret or signature');
        return;
    }
    let event;
    try {
        event = config_1.stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    }
    catch (error) {
        res.status(400).send(`Webhook signature verification failed: ${String(error)}`);
        return;
    }
    try {
        const eventRef = firebase_1.db.collection('stripe_webhook_events').doc(event.id);
        const shouldProcess = await firebase_1.db.runTransaction(async (transaction) => {
            const existing = await transaction.get(eventRef);
            const data = existing.data();
            if (data?.processed) {
                return false;
            }
            transaction.set(eventRef, {
                id: event.id,
                type: event.type,
                processed: false,
                updatedAt: firebase_1.FieldValue.serverTimestamp(),
                createdAt: existing.exists ? existing.data()?.createdAt || firebase_1.FieldValue.serverTimestamp() : firebase_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            return true;
        });
        if (!shouldProcess) {
            res.json({ received: true, duplicate: true });
            return;
        }
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
            default:
                break;
        }
        await eventRef.set({
            processed: true,
            processedAt: firebase_1.FieldValue.serverTimestamp(),
            updatedAt: firebase_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        res.json({ received: true });
    }
    catch (error) {
        await firebase_1.db
            .collection('stripe_webhook_events')
            .doc(event.id)
            .set({
            processed: false,
            error: String(error),
            updatedAt: firebase_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        res.status(500).json({ received: false, error: String(error) });
    }
});
async function handleCheckoutSessionCompleted(session) {
    const userId = session.metadata?.userId;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    if (!userId || !subscriptionId) {
        return;
    }
    const subscription = await config_1.stripe.subscriptions.retrieve(subscriptionId);
    const tier = subscriptionService_1.SubscriptionService.getTierFromPriceId(subscription.items.data[0]?.price?.id);
    await firebase_1.db
        .collection('users')
        .doc(userId)
        .set({
        stripeCustomerId: customerId ?? null,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionTier: tier,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: firebase_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    await firebase_1.db.collection('subscription_events').add({
        userId,
        eventType: 'subscription_created',
        stripeSubscriptionId: subscriptionId,
        timestamp: firebase_1.FieldValue.serverTimestamp(),
    });
    await (0, revenueEvents_1.trackRevenueEvent)({
        eventId: `stripe-checkout-${session.id}`,
        userId,
        eventType: 'subscription_purchased',
        bucket: 'freemium_upgrade',
        productId: tier || undefined,
        amountCents: session.amount_total ?? undefined,
        currency: session.currency?.toUpperCase(),
        idempotencyKey: `stripe-checkout-${session.id}`,
        createdAt: new Date().toISOString(),
    });
}
async function handleSubscriptionUpdated(subscription) {
    const userId = await getUserIdFromSubscription(subscription);
    if (!userId) {
        return;
    }
    const status = subscriptionService_1.SubscriptionService.mapSubscriptionStatus(subscription);
    await firebase_1.db.collection('users').doc(userId).set({
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: status.isActive ? 'active' : subscription.status,
        subscriptionTier: status.tier,
        currentPeriodEnd: status.expiresAt,
        updatedAt: firebase_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    await (0, revenueEvents_1.trackRevenueEvent)({
        eventId: `stripe-subscription-updated-${subscription.id}-${subscription.current_period_end}`,
        userId,
        eventType: 'plan_upgraded',
        bucket: 'freemium_upgrade',
        productId: status.tier || undefined,
        idempotencyKey: `stripe-subscription-updated-${subscription.id}-${subscription.current_period_end}`,
        createdAt: new Date().toISOString(),
    });
}
async function handleSubscriptionDeleted(subscription) {
    const userId = await getUserIdFromSubscription(subscription);
    if (!userId) {
        return;
    }
    await firebase_1.db.collection('users').doc(userId).set({
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'canceled',
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        updatedAt: firebase_1.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function handleInvoicePaymentSucceeded(invoice) {
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId) {
        return;
    }
    await firebase_1.db.collection('subscription_events').add({
        eventType: 'payment_succeeded',
        stripeSubscriptionId: subscriptionId,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        timestamp: firebase_1.FieldValue.serverTimestamp(),
    });
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    const userId = customerId ? await lookupUserIdByCustomerId(customerId) : null;
    if (!userId) {
        return;
    }
    await (0, revenueEvents_1.trackRevenueEvent)({
        eventId: `stripe-invoice-${invoice.id}`,
        userId,
        eventType: 'subscription_purchased',
        bucket: 'freemium_upgrade',
        amountCents: invoice.amount_paid,
        currency: invoice.currency?.toUpperCase(),
        idempotencyKey: `stripe-invoice-${invoice.id}`,
        createdAt: new Date().toISOString(),
    });
}
async function getUserIdFromSubscription(subscription) {
    const fromMetadata = subscription.metadata?.userId;
    if (fromMetadata) {
        return fromMetadata;
    }
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    if (!customerId) {
        return null;
    }
    const customer = await config_1.stripe.customers.retrieve(customerId);
    if ('deleted' in customer && customer.deleted) {
        return null;
    }
    return customer.metadata?.userId || null;
}
async function lookupUserIdByCustomerId(customerId) {
    const usersSnapshot = await firebase_1.db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
    if (usersSnapshot.empty) {
        return null;
    }
    return usersSnapshot.docs[0]?.id || null;
}
exports.default = router;
