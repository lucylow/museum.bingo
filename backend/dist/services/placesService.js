"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.placesService = exports.PlacesService = void 0;
const axios_1 = __importDefault(require("axios"));
const firebase_1 = require("../config/firebase");
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
class PlacesService {
    async searchNearby(lat, lng, radiusMeters = 500, type = 'museum') {
        if (!PLACES_API_KEY) {
            throw new Error('GOOGLE_PLACES_API_KEY is not configured');
        }
        const cacheKey = `places:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMeters}:${type}`;
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const url = `${PLACES_BASE_URL}/nearbysearch/json`;
        const response = await axios_1.default.get(url, {
            params: {
                location: `${lat},${lng}`,
                radius: radiusMeters,
                type,
                key: PLACES_API_KEY,
            },
            timeout: 10000,
        });
        if (response.data.status && response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places nearby search failed: ${response.data.error_message || response.data.status}`);
        }
        const places = (response.data.results || []).map((p) => ({
            placeId: p.place_id,
            name: p.name,
            formattedAddress: p.vicinity || p.name,
            location: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
            types: p.types || [],
            rating: p.rating,
            photoRef: p.photos?.[0]?.photo_reference,
            vicinity: p.vicinity,
        }));
        await this.cacheResults(cacheKey, places, 3600);
        return places;
    }
    async getPlaceDetails(placeId) {
        if (!PLACES_API_KEY) {
            throw new Error('GOOGLE_PLACES_API_KEY is not configured');
        }
        const cacheKey = `place:${placeId}`;
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const url = `${PLACES_BASE_URL}/details/json`;
        const response = await axios_1.default.get(url, {
            params: {
                place_id: placeId,
                fields: 'name,formatted_address,geometry,types,rating,photos',
                key: PLACES_API_KEY,
            },
            timeout: 10000,
        });
        if (response.data.status && response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Place details failed: ${response.data.error_message || response.data.status}`);
        }
        const p = response.data.result;
        if (!p)
            return null;
        const place = {
            placeId,
            name: p.name,
            formattedAddress: p.formatted_address || p.name,
            location: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
            types: p.types || [],
            rating: p.rating,
            photoRef: p.photos?.[0]?.photo_reference,
        };
        await this.cacheResults(cacheKey, place, 86400);
        return place;
    }
    async getCached(key) {
        const doc = await firebase_1.db.collection('place_cache').doc(key).get();
        if (!doc.exists)
            return null;
        const data = doc.data();
        if (!data || data.expiresAt <= Date.now())
            return null;
        return data.value;
    }
    async cacheResults(key, value, ttlSeconds) {
        await firebase_1.db.collection('place_cache').doc(key).set({
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
            updatedAt: firebase_1.FieldValue.serverTimestamp(),
        });
    }
}
exports.PlacesService = PlacesService;
exports.placesService = new PlacesService();
