"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nimbleService = exports.NimbleService = void 0;
const axios_1 = __importDefault(require("axios"));
const NIMBLE_API_KEY = process.env.NIMBLE_API_KEY;
const NIMBLE_API_BASE_URL = process.env.NIMBLE_API_BASE_URL || 'https://api.nimbleway.com/api/v1';
const NIMBLE_DEFAULT_DRIVER = (process.env.NIMBLE_DEFAULT_DRIVER || 'vx8');
const NIMBLE_TIMEOUT_MS = Number(process.env.NIMBLE_TIMEOUT_MS || 45000);
const ONBOARDING_EXTRACT_CONCURRENCY = 4;
class NimbleService {
    get headers() {
        if (!NIMBLE_API_KEY) {
            throw new Error('NIMBLE_API_KEY is not configured');
        }
        return {
            Authorization: `Bearer ${NIMBLE_API_KEY}`,
            'Content-Type': 'application/json',
        };
    }
    async searchMuseumCollectionPages(query, limit = 20) {
        const response = await axios_1.default.post(`${NIMBLE_API_BASE_URL}/search`, { query, limit }, { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS });
        return response.data.results || [];
    }
    async mapDomainUrls(domainUrl, driver) {
        const response = await axios_1.default.post(`${NIMBLE_API_BASE_URL}/map`, { url: domainUrl, render: true, driver: driver || NIMBLE_DEFAULT_DRIVER }, { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS });
        return response.data.urls || response.data.result?.urls || [];
    }
    async extractArtwork(url, driver) {
        const response = await axios_1.default.post(`${NIMBLE_API_BASE_URL}/extract`, {
            url,
            render: true,
            driver: driver || NIMBLE_DEFAULT_DRIVER,
            parser: {
                title: { selector: '.artwork-title, h1', extractor: 'text' },
                artist: { selector: '.artist-name, [itemprop="creator"]', extractor: 'text' },
                imageUrl: { selector: 'img', extractor: 'src' },
                description: { selector: '.description, [itemprop="description"]', extractor: 'text' },
            },
        }, { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS });
        return response.data.data || response.data.result?.data || {};
    }
    async extractUrl(url, options) {
        const response = await axios_1.default.post(`${NIMBLE_API_BASE_URL}/extract`, {
            url,
            render: options?.render ?? true,
            driver: options?.driver || NIMBLE_DEFAULT_DRIVER,
            ...(options?.parser ? { parser: options.parser } : {}),
        }, { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS });
        return response.data.data || response.data.result?.data || {};
    }
    async onboardMuseum(input) {
        const maxArtworkPages = Math.min(Math.max(input.maxArtworkPages ?? 20, 1), 100);
        const domain = this.normalizeDomain(input.museumDomain);
        const driver = input.driver || NIMBLE_DEFAULT_DRIVER;
        const searchQuery = `${input.museumName} collection site:${domain.replace(/^https?:\/\//, '')}`;
        const searchResults = await this.searchMuseumCollectionPages(searchQuery, 25);
        const collectionUrl = this.pickCollectionUrl(searchResults, domain);
        const mappedUrls = await this.mapDomainUrls(domain, driver);
        const searchResultUrls = searchResults.map((item) => item.url || item.link || '').filter(Boolean);
        const candidateArtworkUrls = this.sanitizeUrls([...mappedUrls, ...searchResultUrls], domain)
            .filter((url) => this.looksLikeArtworkUrl(url))
            .slice(0, maxArtworkPages);
        const extractedArtworks = await this.mapConcurrent(candidateArtworkUrls, ONBOARDING_EXTRACT_CONCURRENCY, async (url) => {
            const extracted = await this.extractArtwork(url, driver);
            return this.normalizeArtworkRecord(extracted, url);
        });
        return {
            collectionUrl,
            candidateArtworkUrls,
            extractedArtworks: extractedArtworks.filter((artwork) => Object.keys(artwork).length > 1),
        };
    }
    normalizeDomain(value) {
        const hasScheme = /^https?:\/\//.test(value);
        return hasScheme ? value : `https://${value}`;
    }
    pickCollectionUrl(results, domain) {
        const domainHost = new URL(domain).hostname.replace(/^www\./, '');
        const best = results.find((result) => {
            const candidateUrl = result.url || result.link;
            if (!candidateUrl)
                return false;
            try {
                const host = new URL(candidateUrl).hostname.replace(/^www\./, '');
                const isCollectionPage = /collection|artwork|gallery/i.test(candidateUrl);
                return host.endsWith(domainHost) && isCollectionPage;
            }
            catch {
                return false;
            }
        });
        return best?.url || best?.link || null;
    }
    looksLikeArtworkUrl(url) {
        return /artwork|collection|object|gallery|works?|exhibition|visit/i.test(url);
    }
    sanitizeUrls(urls, domain) {
        const domainHost = new URL(domain).hostname.replace(/^www\./, '');
        const seen = new Set();
        return urls
            .map((value) => value.trim())
            .filter(Boolean)
            .filter((value) => /^https?:\/\//i.test(value))
            .filter((value) => {
            try {
                const host = new URL(value).hostname.replace(/^www\./, '');
                return host.endsWith(domainHost);
            }
            catch {
                return false;
            }
        })
            .filter((value) => {
            const dedupeKey = value.replace(/\/+$/, '').split('#')[0].toLowerCase();
            if (seen.has(dedupeKey)) {
                return false;
            }
            seen.add(dedupeKey);
            return true;
        });
    }
    normalizeArtworkRecord(record, sourceUrl) {
        return {
            sourceUrl,
            ...Object.fromEntries(Object.entries(record).filter(([, value]) => {
                if (typeof value === 'string') {
                    return value.trim().length > 0;
                }
                return value !== null && value !== undefined;
            })),
        };
    }
    async mapConcurrent(items, concurrency, handler) {
        const results = new Array(items.length);
        let cursor = 0;
        const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
            while (cursor < items.length) {
                const currentIndex = cursor;
                cursor += 1;
                results[currentIndex] = await handler(items[currentIndex], currentIndex);
            }
        });
        await Promise.all(workers);
        return results;
    }
}
exports.NimbleService = NimbleService;
exports.nimbleService = new NimbleService();
