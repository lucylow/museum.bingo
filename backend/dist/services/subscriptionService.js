"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const firebase_1 = require("../config/firebase");
const config_1 = require("../stripe/config");
class SubscriptionService {
    static async createCheckoutSession(userId, customerEmail, priceId, successUrl, cancelUrl) {
        const customerId = await this.getOrCreateCustomerId(userId, customerEmail);
        const session = await config_1.stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: config_1.PRICE_IDS[priceId], quantity: 1 }],
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
    static async createCustomerPortalSession(userId, returnUrl) {
        const userDoc = await firebase_1.db.collection('users').doc(userId).get();
        const customerId = userDoc.data()?.stripeCustomerId;
        if (!customerId) {
            throw new Error('No Stripe customer found');
        }
        const session = await config_1.stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
        return session.url;
    }
    static async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
        if (cancelAtPeriodEnd) {
            await config_1.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
            return;
        }
        await config_1.stripe.subscriptions.cancel(subscriptionId);
    }
    static async getUserSubscriptionStatus(userId) {
        const userDoc = await firebase_1.db.collection('users').doc(userId).get();
        const subscriptionId = userDoc.data()?.stripeSubscriptionId;
        if (!subscriptionId) {
            return { isActive: false, tier: null, expiresAt: null };
        }
        const subscription = await config_1.stripe.subscriptions.retrieve(subscriptionId);
        return this.mapSubscriptionStatus(subscription);
    }
    static async getUserMonetizationState(userId) {
        const userDoc = await firebase_1.db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const subscriptionId = userData?.stripeSubscriptionId;
        let subscription = { isActive: false, tier: null, expiresAt: null };
        if (subscriptionId) {
            const stripeSubscription = await config_1.stripe.subscriptions.retrieve(subscriptionId);
            subscription = this.mapSubscriptionStatus(stripeSubscription);
        }
        const activeAddOns = Array.isArray(userData?.monetizationAddOns) ? userData?.monetizationAddOns : [];
        const partnerSubscriptionLevel = userData?.partnerSubscriptionLevel || 'none';
        const seasonalPassActive = Boolean(userData?.seasonalPassActive) || subscription.tier === 'PREMIUM_YEARLY';
        const entitlements = this.buildMonetizationEntitlements(subscription, activeAddOns, seasonalPassActive, partnerSubscriptionLevel);
        return {
            subscription,
            entitlements,
            activeAddOns,
            partnerSubscriptionLevel,
            suggestedUpsells: this.buildSuggestedUpsells(entitlements),
        };
    }
    static getTierFromPriceId(priceId) {
        if (!priceId) {
            return null;
        }
        const tierKey = Object.keys(config_1.PRICE_IDS).find((key) => {
            const candidate = config_1.PRICE_IDS[key];
            return candidate === priceId;
        });
        return tierKey || null;
    }
    static mapSubscriptionStatus(subscription) {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = this.getTierFromPriceId(priceId);
        const expiresAt = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null;
        return { isActive, tier, expiresAt };
    }
    static buildMonetizationEntitlements(subscription, activeAddOns, seasonalPassActive, partnerSubscriptionLevel) {
        const hasPremium = subscription.isActive;
        const hasFamilyPlan = subscription.tier === 'FAMILY_MONTHLY';
        const hasAddOn = (addOnId) => activeAddOns.includes(addOnId);
        const hasPartnerAccess = partnerSubscriptionLevel !== 'none';
        return {
            unlimitedMuseums: hasPremium,
            advancedArHints: hasPremium,
            extendedStatsHistory: hasPremium,
            galleryQuestPass: seasonalPassActive,
            premiumCardSkins: hasPremium || hasAddOn('premium_card_skins'),
            avatarFramesAndNameEffects: hasPremium || hasAddOn('avatar_frames'),
            specialConfettiStyles: hasPremium || hasAddOn('confetti_styles'),
            familyModeRooms: hasPremium || hasFamilyPlan,
            classroomPack: hasFamilyPlan || hasAddOn('classroom_pack'),
            groupLeaderboardsAndCoop: hasPremium || hasFamilyPlan,
            hintPacks: hasAddOn('hint_packs'),
            bonusDailyChallengeCards: hasPremium || hasAddOn('bonus_daily_challenges'),
            speedRunMode: hasPremium || hasAddOn('speed_run_mode'),
            collectibleStorageShelves: hasPremium || hasAddOn('collectible_storage'),
            tokenDrops: seasonalPassActive || hasAddOn('token_drops'),
            premiumShareExports: hasPremium || hasAddOn('premium_share_cards'),
            sponsoredChallenges: hasPartnerAccess || hasAddOn('sponsored_challenges'),
            ticketAndGiftShopOffers: hasPartnerAccess || hasAddOn('ticket_and_shop_promotions'),
            museumWhiteLabel: partnerSubscriptionLevel === 'white_label' || partnerSubscriptionLevel === 'enterprise',
            brandedArOverlays: hasPartnerAccess,
            visitorEngagementAnalytics: hasPartnerAccess,
        };
    }
    static buildSuggestedUpsells(entitlements) {
        const suggestions = [];
        if (!entitlements.galleryQuestPass) {
            suggestions.push('gallery_quest_pass');
        }
        if (!entitlements.premiumCardSkins) {
            suggestions.push('premium_card_skins');
        }
        if (!entitlements.hintPacks) {
            suggestions.push('hint_packs');
        }
        if (!entitlements.collectibleStorageShelves) {
            suggestions.push('collectible_storage');
        }
        if (!entitlements.premiumShareExports) {
            suggestions.push('premium_share_cards');
        }
        return suggestions;
    }
    static async getOrCreateCustomerId(userId, email) {
        const userRef = firebase_1.db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const existingId = userDoc.data()?.stripeCustomerId;
        if (existingId) {
            return existingId;
        }
        const customer = await config_1.stripe.customers.create({ email, metadata: { userId } });
        await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
        return customer.id;
    }
}
exports.SubscriptionService = SubscriptionService;
