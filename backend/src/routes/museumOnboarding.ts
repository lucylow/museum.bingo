import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import { NimbleDriver, nimbleService } from '../services/nimbleService';

const router = express.Router();

type OnboardMuseumBody = {
  museumName?: string;
  museumDomain?: string;
  maxArtworkPages?: number;
  driver?: NimbleDriver;
};

type NimbleSearchBody = {
  query?: string;
  limit?: number;
};

type NimbleMapBody = {
  museumDomain?: string;
  driver?: NimbleDriver;
};

type NimbleExtractBody = {
  url?: string;
  driver?: NimbleDriver;
  parser?: Record<string, unknown>;
};

function normalizeDriver(value?: string): NimbleDriver | undefined {
  if (!value) return undefined;
  if (value === 'vx6' || value === 'vx8' || value === 'vx10') {
    return value;
  }
  return undefined;
}

router.post('/onboard', verifyFirebaseToken, async (req, res) => {
  const { museumName, museumDomain, maxArtworkPages } = req.body as OnboardMuseumBody;
  const driver = normalizeDriver((req.body as OnboardMuseumBody).driver);

  if (!museumName || !museumDomain) {
    res.status(400).json({ error: 'museumName and museumDomain are required' });
    return;
  }

  try {
    const result = await nimbleService.onboardMuseum({
      museumName: museumName.trim(),
      museumDomain: museumDomain.trim(),
      maxArtworkPages,
      driver,
    });
    res.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Nimble onboarding error:', error);
    res.status(500).json({ error: 'Failed to onboard museum via Nimble' });
  }
});

router.post('/search', verifyFirebaseToken, async (req, res) => {
  const { query, limit } = req.body as NimbleSearchBody;
  if (!query || !query.trim()) {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  try {
    const safeLimit = Math.max(1, Math.min(limit || 20, 100));
    const results = await nimbleService.searchMuseumCollectionPages(query.trim(), safeLimit);
    res.json({ query: query.trim(), count: results.length, results });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Nimble search error:', error);
    res.status(500).json({ error: 'Failed to execute Nimble search' });
  }
});

router.post('/map', verifyFirebaseToken, async (req, res) => {
  const { museumDomain } = req.body as NimbleMapBody;
  const driver = normalizeDriver((req.body as NimbleMapBody).driver);

  if (!museumDomain || !museumDomain.trim()) {
    res.status(400).json({ error: 'museumDomain is required' });
    return;
  }

  try {
    const urls = await nimbleService.mapDomainUrls(museumDomain.trim(), driver);
    res.json({ museumDomain: museumDomain.trim(), count: urls.length, urls });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Nimble map error:', error);
    res.status(500).json({ error: 'Failed to execute Nimble map' });
  }
});

router.post('/extract', verifyFirebaseToken, async (req, res) => {
  const { url, parser } = req.body as NimbleExtractBody;
  const driver = normalizeDriver((req.body as NimbleExtractBody).driver);

  if (!url || !url.trim()) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  try {
    const data = await nimbleService.extractUrl(url.trim(), { driver, parser });
    res.json({ url: url.trim(), data });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Nimble extract error:', error);
    res.status(500).json({ error: 'Failed to execute Nimble extract' });
  }
});

export default router;
