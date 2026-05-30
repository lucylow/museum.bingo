/**
 * GDPR-oriented anonymization utilities for analytics identifiers.
 */

import { createHash, randomBytes } from 'crypto';

export class AnonymizationService {
  private static instance: AnonymizationService;
  private salt: string;

  private constructor() {
    this.salt = process.env.ANONYMISATION_SALT || randomBytes(32).toString('hex');
  }

  static getInstance(): AnonymizationService {
    if (!AnonymizationService.instance) {
      AnonymizationService.instance = new AnonymizationService();
    }
    return AnonymizationService.instance;
  }

  anonymiseUserId(originalId: string): string {
    return createHash('sha256').update(`${originalId}:${this.salt}`).digest('hex');
  }

  anonymiseSessionId(sessionId: string): string {
    return createHash('sha256').update(`${sessionId}:session_scope`).digest('hex').slice(0, 16);
  }

  blurLocation(lat: number, lng: number, precision = 0.01): string {
    const blurredLat = Math.round(lat / precision) * precision;
    const blurredLng = Math.round(lng / precision) * precision;
    return createHash('sha256').update(`${blurredLat},${blurredLng}`).digest('hex').slice(0, 8);
  }

  rotateSalt(): void {
    this.salt = randomBytes(32).toString('hex');
    // eslint-disable-next-line no-console
    console.log(`[ANON] Salt rotated at ${new Date().toISOString()}`);
  }
}

export function prepareAnalyticsUser(originalUid: string): { analyticsId: string; saltRotatedAt: string } {
  const anonymizer = AnonymizationService.getInstance();
  return {
    analyticsId: anonymizer.anonymiseUserId(originalUid),
    saltRotatedAt: new Date().toISOString().split('T')[0],
  };
}
