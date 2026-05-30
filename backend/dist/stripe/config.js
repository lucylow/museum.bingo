"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIERS = exports.PRICE_IDS = exports.PRODUCTS = exports.stripe = void 0;
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
        features: ['Unlimited museums', 'Multiplayer rooms', 'Advanced AR hints', 'No ads'],
    },
    {
        id: 'PREMIUM_YEARLY',
        name: 'Premium Yearly',
        price: 4999,
        interval: 'year',
        features: ['Everything in Monthly, plus 2 months free', 'Exclusive badges'],
    },
    {
        id: 'FAMILY_MONTHLY',
        name: 'Family Plan',
        price: 999,
        interval: 'month',
        features: ['Up to 5 family members', 'Shared progress', 'Parent dashboard'],
    },
];
