"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const HISTORICAL_MUSEUMS = [
    {
        id: 'smithsonian_american_history',
        name: 'National Museum of American History',
        city: 'Washington, D.C.',
        state: 'DC',
        latitude: 38.8913,
        longitude: -77.03,
        description: 'Millions of artifacts documenting American history.',
        imageUrl: 'https://images.si.edu/american-history.jpg',
        type: 'history',
    },
    {
        id: 'colonial_williamsburg',
        name: 'Colonial Williamsburg',
        city: 'Williamsburg',
        state: 'VA',
        latitude: 37.2707,
        longitude: -76.7075,
        description: 'Living history museum recreating 18th-century America.',
        type: 'living_history',
    },
    {
        id: 'ellis_island',
        name: 'Ellis Island National Museum of Immigration',
        city: 'New York',
        state: 'NY',
        latitude: 40.6995,
        longitude: -74.0397,
        description: 'Gateway for millions of immigrants to the United States.',
        type: 'immigration',
    },
    {
        id: 'gettysburg',
        name: 'Gettysburg Museum of History',
        city: 'Gettysburg',
        state: 'PA',
        latitude: 39.8309,
        longitude: -77.2314,
        description: 'Civil War artifacts and exhibits.',
        type: 'military_history',
    },
    {
        id: 'alcatraz',
        name: 'Alcatraz Island Museum',
        city: 'San Francisco',
        state: 'CA',
        latitude: 37.8267,
        longitude: -122.4233,
        description: 'Historic federal prison and exhibits.',
        type: 'penal_history',
    },
    {
        id: 'ushmm',
        name: 'United States Holocaust Memorial Museum',
        city: 'Washington, D.C.',
        state: 'DC',
        latitude: 38.8869,
        longitude: -77.033,
        description: 'Comprehensive Holocaust history museum.',
        type: 'holocaust',
    },
    {
        id: 'nrm',
        name: 'National Railroad Museum',
        city: 'Green Bay',
        state: 'WI',
        latitude: 44.4996,
        longitude: -88.038,
        description: 'Historical trains and railroad artifacts.',
        type: 'transportation',
    },
    {
        id: 'pioneer_village',
        name: 'Pioneer Village Museum',
        city: 'Minden',
        state: 'NE',
        latitude: 40.4986,
        longitude: -98.9479,
        description: '19th-century frontier life exhibits.',
        type: 'pioneer',
    },
];
function toRadians(value) {
    return (value * Math.PI) / 180;
}
function distanceInMeters(lat1, lon1, lat2, lon2) {
    const earthRadiusMeters = 6371000;
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
}
router.get('/historical', (_req, res) => {
    res.json(HISTORICAL_MUSEUMS);
});
router.get('/nearby', (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius ?? 5000);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
        res.status(400).json({ error: 'lat, lng and radius must be valid numbers' });
        return;
    }
    const nearby = HISTORICAL_MUSEUMS.map((museum) => ({
        ...museum,
        distance: distanceInMeters(lat, lng, museum.latitude, museum.longitude),
    }))
        .filter((museum) => museum.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
    res.json(nearby);
});
router.get('/:museumId', (req, res) => {
    const museum = HISTORICAL_MUSEUMS.find((entry) => entry.id === req.params.museumId);
    if (!museum) {
        res.status(404).json({ error: 'Museum not found' });
        return;
    }
    res.json(museum);
});
exports.default = router;
