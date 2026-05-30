import { FieldValue, db } from '../config/firebase';
import { RevenueEvent } from './types';

function normalizeIdempotencyKey(key: string): string {
  return key.trim().slice(0, 160);
}

export async function trackRevenueEvent(event: RevenueEvent): Promise<{ recorded: boolean; duplicate: boolean }> {
  const key = normalizeIdempotencyKey(event.idempotencyKey);
  if (!key) {
    throw new Error('Revenue event requires idempotency key');
  }

  const docId = `${event.userId}_${key}`;
  const ref = db.collection('revenue_events').doc(docId);
  const shouldWrite = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (snapshot.exists) {
      return false;
    }

    tx.set(ref, {
      ...event,
      idempotencyKey: key,
      createdAt: event.createdAt,
      serverTimestamp: FieldValue.serverTimestamp(),
    });
    return true;
  });

  return { recorded: shouldWrite, duplicate: !shouldWrite };
}
