import axios from 'axios';
import { db, FieldValue } from '../config/firebase';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface Place {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  types: string[];
  rating?: number;
  photoRef?: string;
  vicinity?: string;
}

type CacheDoc<T> = {
  value: T;
  expiresAt: number;
};

type PlacesApiResult = {
  place_id: string;
  name: string;
  vicinity?: string;
  geometry: { location: { lat: number; lng: number } };
  types: string[];
  rating?: number;
  photos?: Array<{ photo_reference?: string }>;
};

type PlacesNearbyResponse = {
  results?: PlacesApiResult[];
  status?: string;
  error_message?: string;
};

type PlaceDetailsResponse = {
  result?: PlacesApiResult & { formatted_address?: string };
  status?: string;
  error_message?: string;
};

export class PlacesService {
  async searchNearby(lat: number, lng: number, radiusMeters = 500, type = 'museum'): Promise<Place[]> {
    if (!PLACES_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured');
    }

    const cacheKey = `places:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMeters}:${type}`;
    const cached = await this.getCached<Place[]>(cacheKey);
    if (cached) return cached;

    const url = `${PLACES_BASE_URL}/nearbysearch/json`;
    const response = await axios.get<PlacesNearbyResponse>(url, {
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

    const places: Place[] = (response.data.results || []).map((p) => ({
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

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    if (!PLACES_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured');
    }

    const cacheKey = `place:${placeId}`;
    const cached = await this.getCached<Place>(cacheKey);
    if (cached) return cached;

    const url = `${PLACES_BASE_URL}/details/json`;
    const response = await axios.get<PlaceDetailsResponse>(url, {
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
    if (!p) return null;

    const place: Place = {
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

  private async getCached<T>(key: string): Promise<T | null> {
    const doc = await db.collection('place_cache').doc(key).get();
    if (!doc.exists) return null;

    const data = doc.data() as CacheDoc<T> | undefined;
    if (!data || data.expiresAt <= Date.now()) return null;
    return data.value;
  }

  private async cacheResults<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await db.collection('place_cache').doc(key).set({
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

export const placesService = new PlacesService();
