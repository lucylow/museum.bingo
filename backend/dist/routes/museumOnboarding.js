"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const nimbleService_1 = require("../services/nimbleService");
const router = express_1.default.Router();
function normalizeDriver(value) {
    if (!value)
        return undefined;
    if (value === 'vx6' || value === 'vx8' || value === 'vx10') {
        return value;
    }
    return undefined;
}
router.post('/onboard', auth_1.verifyFirebaseToken, async (req, res) => {
    const { museumName, museumDomain, maxArtworkPages } = req.body;
    const driver = normalizeDriver(req.body.driver);
    if (!museumName || !museumDomain) {
        res.status(400).json({ error: 'museumName and museumDomain are required' });
        return;
    }
    try {
        const result = await nimbleService_1.nimbleService.onboardMuseum({
            museumName: museumName.trim(),
            museumDomain: museumDomain.trim(),
            maxArtworkPages,
            driver,
        });
        res.json(result);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Nimble onboarding error:', error);
        res.status(500).json({ error: 'Failed to onboard museum via Nimble' });
    }
});
router.post('/search', auth_1.verifyFirebaseToken, async (req, res) => {
    const { query, limit } = req.body;
    if (!query || !query.trim()) {
        res.status(400).json({ error: 'query is required' });
        return;
    }
    try {
        const safeLimit = Math.max(1, Math.min(limit || 20, 100));
        const results = await nimbleService_1.nimbleService.searchMuseumCollectionPages(query.trim(), safeLimit);
        res.json({ query: query.trim(), count: results.length, results });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Nimble search error:', error);
        res.status(500).json({ error: 'Failed to execute Nimble search' });
    }
});
router.post('/map', auth_1.verifyFirebaseToken, async (req, res) => {
    const { museumDomain } = req.body;
    const driver = normalizeDriver(req.body.driver);
    if (!museumDomain || !museumDomain.trim()) {
        res.status(400).json({ error: 'museumDomain is required' });
        return;
    }
    try {
        const urls = await nimbleService_1.nimbleService.mapDomainUrls(museumDomain.trim(), driver);
        res.json({ museumDomain: museumDomain.trim(), count: urls.length, urls });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Nimble map error:', error);
        res.status(500).json({ error: 'Failed to execute Nimble map' });
    }
});
router.post('/extract', auth_1.verifyFirebaseToken, async (req, res) => {
    const { url, parser } = req.body;
    const driver = normalizeDriver(req.body.driver);
    if (!url || !url.trim()) {
        res.status(400).json({ error: 'url is required' });
        return;
    }
    try {
        const data = await nimbleService_1.nimbleService.extractUrl(url.trim(), { driver, parser });
        res.json({ url: url.trim(), data });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Nimble extract error:', error);
        res.status(500).json({ error: 'Failed to execute Nimble extract' });
    }
});
exports.default = router;
