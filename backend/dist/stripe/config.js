"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONETIZATION_CATALOG = exports.TIERS = exports.PRICE_IDS = exports.PRODUCTS = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
}
exports.stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});
exports.PRODUCTS = {
    PREMIUM_MONTHLY: process.env.STRIPE_PRODUCT_PREMIUM_MONTHLY || 'prod_premium_monthly',
    PREMIUM_YEARLY: process.env.STRIPE_PRODUCT_PREMIUM_YEARLY || 'prod_premium_yearly',
    FAMILY_MONTHLY: process.env.STRIPE_PRODUCT_FAMILY_MONTHLY || 'prod_family_monthly',
};
exports.PRICE_IDS = {
    PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
    PREMIUM_YEARLY: process.env.STRIPE_PRICE_PREMIUM_YEARLY || 'price_premium_yearly',
    FAMILY_MONTHLY: process.env.STRIPE_PRICE_FAMILY_MONTHLY || 'price_family_monthly',
};
exports.TIERS = [
    {
        id: 'PREMIUM_MONTHLY',
        name: 'Premium Monthly',
        price: 499,
        interval: 'month',
        features: [
            'Unlimited museums and advanced AR hints',
            'Expanded bingo card themes and cosmetics',
            'Longer gameplay and progress history',
            'Reward and speed-run challenge access',
        ],
    },
    {
        id: 'PREMIUM_YEARLY',
        name: 'Premium Yearly',
        price: 4999,
        interval: 'year',
        features: [
            'Everything in Premium Monthly',
            'Gallery Quest seasonal pass bonus rewards',
            'Premium recap exports and poster downloads',
            '2 months free compared to monthly billing',
        ],
    },
    {
        id: 'FAMILY_MONTHLY',
        name: 'Family Plan',
        price: 999,
        interval: 'month',
        features: [
            'Up to 5 family members or class participants',
            'Shared rooms, group leaderboards, and co-op challenges',
            'Family organizer tools for trips and classrooms',
        ],
    },
];
exports.MONETIZATION_CATALOG = [
    {
        id: 'freemium_tiers',
        title: 'Freemium Tiers',
        description: 'Core gameplay stays free while premium unlocks richer exploration tools.',
        items: [
            {
                id: 'free_core',
                name: 'Free Core',
                description: 'One museum, standard bingo cards, and limited hint assists.',
                unlockType: 'free',
            },
            {
                id: 'premium_unlimited',
                name: 'Premium Unlimited',
                description: 'Unlimited museums, advanced AR hints, more themes, and longer stats history.',
                unlockType: 'premium',
            },
        ],
    },
    {
        id: 'seasonal_passes',
        title: 'Seasonal Passes',
        description: 'Time-limited events with optional pass progression.',
        items: [
            {
                id: 'gallery_quest_pass',
                name: 'Gallery Quest Pass',
                description: 'Special bingo boards, rare badges, collectibles, and event reward tracks.',
                unlockType: 'season-pass',
            },
        ],
    },
    {
        id: 'cosmetics',
        title: 'Cosmetic Upgrades',
        description: 'Visual personalization that does not affect game balance.',
        items: [
            {
                id: 'premium_card_skins',
                name: 'Premium Card Skins',
                description: 'Unlock themed card looks and collectible board styles.',
                unlockType: 'add-on',
            },
            {
                id: 'avatar_frames',
                name: 'Avatar Frames and Name Effects',
                description: 'Avatar frames, leaderboard name effects, and profile badge displays.',
                unlockType: 'add-on',
            },
            {
                id: 'confetti_styles',
                name: 'Special Confetti Styles',
                description: 'Unlock custom confetti and celebration finishers.',
                unlockType: 'add-on',
            },
        ],
    },
    {
        id: 'group_packs',
        title: 'Family and Group Packs',
        description: 'Bundles for families, school trips, and group play.',
        items: [
            {
                id: 'family_mode',
                name: 'Family Mode',
                description: 'Shared rooms, group progress, and cooperative challenge boards.',
                unlockType: 'premium',
            },
            {
                id: 'classroom_pack',
                name: 'Classroom Pack',
                description: 'Class-size leaderboards and field-trip challenge templates.',
                unlockType: 'add-on',
            },
        ],
    },
    {
        id: 'rewards_and_collectibles',
        title: 'Rewards and Collectibles',
        description: 'Optional add-ons focused on status, cosmetic value, and replay loops.',
        items: [
            {
                id: 'hint_packs',
                name: 'Extra Hint Packs',
                description: 'Optional packs with bonus hints and challenge cards.',
                unlockType: 'add-on',
            },
            {
                id: 'speed_run_mode',
                name: 'Speed Run Mode',
                description: 'Time-based challenge mode with cosmetic-only ranking rewards.',
                unlockType: 'premium',
            },
            {
                id: 'collectible_storage',
                name: 'Collectible Storage Shelves',
                description: 'Expanded storage for digital collectibles and museum trophies.',
                unlockType: 'add-on',
            },
            {
                id: 'token_drops',
                name: 'Seasonal Token Drops',
                description: 'Optional NFT-style seasonal token rewards with cosmetic value only.',
                unlockType: 'season-pass',
            },
        ],
    },
    {
        id: 'sponsored_and_partner',
        title: 'Sponsored and Museum Partner Features',
        description: 'Brand-safe integrations for museums and sponsors.',
        items: [
            {
                id: 'sponsored_challenges',
                name: 'Sponsored Challenges',
                description: 'Partner-branded bingo tiles, rewards, and event-specific cards.',
                unlockType: 'partner',
            },
            {
                id: 'museum_partner_subscription',
                name: 'Museum Partner Subscription',
                description: 'White-label app mode, branded overlays, and visitor engagement analytics.',
                unlockType: 'partner',
            },
            {
                id: 'ticket_and_shop_promotions',
                name: 'Ticket and Gift Shop Integrations',
                description: 'Affiliate offers, in-app shop promotions, and post-bingo discount unlocks.',
                unlockType: 'partner',
            },
        ],
    },
    {
        id: 'shareable_exports',
        title: 'Shareable Recap Exports',
        description: 'Premium-quality exports for social sharing and keepsakes.',
        items: [
            {
                id: 'premium_share_cards',
                name: 'Premium Share Cards',
                description: 'Polished session recap cards and visit poster exports.',
                unlockType: 'premium',
            },
        ],
    },
];
