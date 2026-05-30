"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const placesService_1 = require("../services/placesService");
const router = express_1.default.Router();
router.get('/nearby', auth_1.verifyFirebaseToken, async (req, res) => {
    const { lat, lng, radius, type } = req.query;
    if (!lat || !lng) {
        res.status(400).json({ error: 'Missing lat/lng' });
        return;
    }
    const parsedLat = Number.parseFloat(String(lat));
    const parsedLng = Number.parseFloat(String(lng));
    const parsedRadius = radius ? Number.parseInt(String(radius), 10) : 500;
    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        res.status(400).json({ error: 'lat must be a valid latitude between -90 and 90' });
        return;
    }
    if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        res.status(400).json({ error: 'lng must be a valid longitude between -180 and 180' });
        return;
    }
    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0 || parsedRadius > 50000) {
        res.status(400).json({ error: 'radius must be a positive number up to 50000 meters' });
        return;
    }
    try {
        const places = await placesService_1.placesService.searchNearby(parsedLat, parsedLng, parsedRadius, type ? String(type) : 'museum');
        res.json(places);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Places API error:', error);
        res.status(500).json({ error: 'Failed to fetch nearby places' });
    }
});
router.get('/details/:placeId', auth_1.verifyFirebaseToken, async (req, res) => {
    const { placeId } = req.params;
    try {
        const place = await placesService_1.placesService.getPlaceDetails(placeId);
        if (!place) {
            res.status(404).json({ error: 'Place not found' });
            return;
        }
        res.json(place);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Place details API error:', error);
        res.status(500).json({ error: 'Failed to fetch place details' });
    }
});
exports.default = router;
