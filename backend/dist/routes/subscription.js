"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const subscriptionService_1 = require("../services/subscriptionService");
const config_1 = require("../stripe/config");
const stripeErrorHandler_1 = require("../utils/stripeErrorHandler");
const revenueEvents_1 = require("../monetization/revenueEvents");
const router = express_1.default.Router();
router.get('/tiers', (_req, res) => {
    res.json(config_1.TIERS);
});
router.get('/catalog', (_req, res) => {
    res.json(config_1.MONETIZATION_CATALOG);
});
router.get('/architecture', (_req, res) => {
    res.json(subscriptionService_1.SubscriptionService.getMonetizationArchitecture());
});
router.post('/create-checkout', auth_1.verifyFirebaseToken, async (req, res) => {
    const { priceId, successUrl, cancelUrl } = req.body;
    const user = req.user;
    if (!user?.uid || !user.email) {
        res.status(400).json({ error: 'Authenticated user email is required for subscriptions' });
        return;
    }
    if (!priceId || !(priceId in config_1.PRICE_IDS)) {
        res.status(400).json({ error: 'Invalid subscription tier' });
        return;
    }
    const frontendUrl = process.env.FRONTEND_URL || 'https://museum.bingo';
    const resolvedSuccessUrl = successUrl || `${frontendUrl}/subscription/success`;
    const resolvedCancelUrl = cancelUrl || `${frontendUrl}/subscription/cancel`;
    try {
        const session = await subscriptionService_1.SubscriptionService.createCheckoutSession(user.uid, user.email, priceId, resolvedSuccessUrl, resolvedCancelUrl);
        res.json(session);
    }
    catch (error) {
        const handled = (0, stripeErrorHandler_1.handleStripeError)(error);
        res.status(handled.statusCode).json({ error: handled.message });
    }
});
router.get('/status', auth_1.verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    if (!user?.uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const status = await subscriptionService_1.SubscriptionService.getUserSubscriptionStatus(user.uid);
        res.json(status);
    }
    catch (error) {
        const handled = (0, stripeErrorHandler_1.handleStripeError)(error);
        res.status(handled.statusCode).json({ error: handled.message });
    }
});
router.get('/entitlements', auth_1.verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    if (!user?.uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const state = await subscriptionService_1.SubscriptionService.getUserMonetizationState(user.uid);
        res.json(state);
    }
    catch (error) {
        const handled = (0, stripeErrorHandler_1.handleStripeError)(error);
        res.status(handled.statusCode).json({ error: handled.message });
    }
});
router.post('/portal', auth_1.verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    const { returnUrl } = req.body;
    if (!user?.uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const frontendUrl = process.env.FRONTEND_URL || 'https://museum.bingo';
    const resolvedReturnUrl = returnUrl || `${frontendUrl}/subscription`;
    try {
        const url = await subscriptionService_1.SubscriptionService.createCustomerPortalSession(user.uid, resolvedReturnUrl);
        res.json({ url });
    }
    catch (error) {
        const handled = (0, stripeErrorHandler_1.handleStripeError)(error);
        res.status(handled.statusCode).json({ error: handled.message });
    }
});
router.post('/cancel', auth_1.verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    if (!user?.uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const userDoc = await firebase_1.db.collection('users').doc(user.uid).get();
        const subscriptionId = userDoc.data()?.stripeSubscriptionId;
        if (!subscriptionId) {
            res.status(404).json({ error: 'No active subscription found' });
            return;
        }
        await subscriptionService_1.SubscriptionService.cancelSubscription(subscriptionId, true);
        res.json({ success: true, message: 'Subscription will be cancelled at period end' });
    }
    catch (error) {
        const handled = (0, stripeErrorHandler_1.handleStripeError)(error);
        res.status(handled.statusCode).json({ error: handled.message });
    }
});
router.post('/revenue-events', auth_1.verifyFirebaseToken, async (req, res) => {
    const user = req.user;
    if (!user?.uid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const body = req.body;
    if (!body.eventType || !body.bucket || !body.idempotencyKey) {
        res.status(400).json({ error: 'eventType, bucket, and idempotencyKey are required' });
        return;
    }
    try {
        const result = await (0, revenueEvents_1.trackRevenueEvent)({
            eventId: (0, crypto_1.randomUUID)(),
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
    }
    catch (error) {
        const handled = (0, stripeErrorHandler_1.handleStripeError)(error);
        res.status(handled.statusCode).json({ error: handled.message });
    }
});
exports.default = router;
