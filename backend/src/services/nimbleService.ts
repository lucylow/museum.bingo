import axios from 'axios';

const NIMBLE_API_KEY = process.env.NIMBLE_API_KEY;
const NIMBLE_API_BASE_URL = process.env.NIMBLE_API_BASE_URL || 'https://api.nimbleway.com/api/v1';
const NIMBLE_DEFAULT_DRIVER = (process.env.NIMBLE_DEFAULT_DRIVER || 'vx8') as NimbleDriver;
const NIMBLE_TIMEOUT_MS = Number(process.env.NIMBLE_TIMEOUT_MS || 45000);
const ONBOARDING_EXTRACT_CONCURRENCY = 4;

export type NimbleDriver = 'vx6' | 'vx8' | 'vx10';

type NimbleSearchItem = {
  url?: string;
  link?: string;
  title?: string;
  description?: string;
};

type NimbleSearchResponse = {
  results?: NimbleSearchItem[];
};

type NimbleMapResponse = {
  urls?: string[];
  result?: { urls?: string[] };
};

type NimbleExtractResponse = {
  data?: Record<string, unknown>;
  result?: { data?: Record<string, unknown> };
};

export type OnboardMuseumInput = {
  museumName: string;
  museumDomain: string;
  maxArtworkPages?: number;
  driver?: NimbleDriver;
};

export type OnboardMuseumResult = {
  collectionUrl: string | null;
  candidateArtworkUrls: string[];
  extractedArtworks: Array<Record<string, unknown>>;
};

export class NimbleService {
  private get headers(): Record<string, string> {
    if (!NIMBLE_API_KEY) {
      throw new Error('NIMBLE_API_KEY is not configured');
    }

    return {
      Authorization: `Bearer ${NIMBLE_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  async searchMuseumCollectionPages(query: string, limit = 20): Promise<NimbleSearchItem[]> {
    const response = await axios.post<NimbleSearchResponse>(
      `${NIMBLE_API_BASE_URL}/search`,
      { query, limit },
      { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS }
    );
    return response.data.results || [];
  }

  async mapDomainUrls(domainUrl: string, driver?: NimbleDriver): Promise<string[]> {
    const response = await axios.post<NimbleMapResponse>(
      `${NIMBLE_API_BASE_URL}/map`,
      { url: domainUrl, render: true, driver: driver || NIMBLE_DEFAULT_DRIVER },
      { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS }
    );

    return response.data.urls || response.data.result?.urls || [];
  }

  async extractArtwork(url: string, driver?: NimbleDriver): Promise<Record<string, unknown>> {
    const response = await axios.post<NimbleExtractResponse>(
      `${NIMBLE_API_BASE_URL}/extract`,
      {
        url,
        render: true,
        driver: driver || NIMBLE_DEFAULT_DRIVER,
        parser: {
          title: { selector: '.artwork-title, h1', extractor: 'text' },
          artist: { selector: '.artist-name, [itemprop="creator"]', extractor: 'text' },
          imageUrl: { selector: 'img', extractor: 'src' },
          description: { selector: '.description, [itemprop="description"]', extractor: 'text' },
        },
      },
      { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS }
    );

    return response.data.data || response.data.result?.data || {};
  }

  async extractUrl(
    url: string,
    options?: { driver?: NimbleDriver; parser?: Record<string, unknown>; render?: boolean }
  ): Promise<Record<string, unknown>> {
    const response = await axios.post<NimbleExtractResponse>(
      `${NIMBLE_API_BASE_URL}/extract`,
      {
        url,
        render: options?.render ?? true,
        driver: options?.driver || NIMBLE_DEFAULT_DRIVER,
        ...(options?.parser ? { parser: options.parser } : {}),
      },
      { headers: this.headers, timeout: NIMBLE_TIMEOUT_MS }
    );

    return response.data.data || response.data.result?.data || {};
  }

  async onboardMuseum(input: OnboardMuseumInput): Promise<OnboardMuseumResult> {
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

    const extractedArtworks = await this.mapConcurrent(
      candidateArtworkUrls,
      ONBOARDING_EXTRACT_CONCURRENCY,
      async (url) => {
        const extracted = await this.extractArtwork(url, driver);
        return this.normalizeArtworkRecord(extracted, url);
      }
    );

    return {
      collectionUrl,
      candidateArtworkUrls,
      extractedArtworks: extractedArtworks.filter((artwork) => Object.keys(artwork).length > 1),
    };
  }

  private normalizeDomain(value: string): string {
    const hasScheme = /^https?:\/\//.test(value);
    return hasScheme ? value : `https://${value}`;
  }

  private pickCollectionUrl(results: NimbleSearchItem[], domain: string): string | null {
    const domainHost = new URL(domain).hostname.replace(/^www\./, '');
    const best = results.find((result) => {
      const candidateUrl = result.url || result.link;
      if (!candidateUrl) return false;
      try {
        const host = new URL(candidateUrl).hostname.replace(/^www\./, '');
        const isCollectionPage = /collection|artwork|gallery/i.test(candidateUrl);
        return host.endsWith(domainHost) && isCollectionPage;
      } catch {
        return false;
      }
    });
    return best?.url || best?.link || null;
  }

  private looksLikeArtworkUrl(url: string): boolean {
    return /artwork|collection|object|gallery|works?|exhibition|visit/i.test(url);
  }

  private sanitizeUrls(urls: string[], domain: string): string[] {
    const domainHost = new URL(domain).hostname.replace(/^www\./, '');
    const seen = new Set<string>();

    return urls
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value) => /^https?:\/\//i.test(value))
      .filter((value) => {
        try {
          const host = new URL(value).hostname.replace(/^www\./, '');
          return host.endsWith(domainHost);
        } catch {
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

  private normalizeArtworkRecord(record: Record<string, unknown>, sourceUrl: string): Record<string, unknown> {
    return {
      sourceUrl,
      ...Object.fromEntries(
        Object.entries(record).filter(([, value]) => {
          if (typeof value === 'string') {
            return value.trim().length > 0;
          }
          return value !== null && value !== undefined;
        })
      ),
    };
  }

  private async mapConcurrent<T, R>(
    items: T[],
    concurrency: number,
    handler: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
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

export const nimbleService = new NimbleService();
