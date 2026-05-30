import { db } from '../config/firebase';

export interface UserPosition {
  x: number;
  y: number;
  heading?: number; // Compass direction in degrees [0, 360).
}

export interface ArtworkLocation {
  artworkId: string;
  title: string;
  bingoTileId: string;
  x: number; // Museum floor plan x coordinate.
  y: number;
}

/**
 * Recommends the nearest unvalidated artwork that matches a bingo prompt,
 * using spatial distance and optional heading alignment.
 */
export async function recommendNextArtwork(
  museumId: string,
  userPos: UserPosition,
  completedTileIds: string[]
): Promise<{ artwork: ArtworkLocation; distance: number; bearing: number } | null> {
  // Get all artworks that correspond to uncompleted bingo prompts.
  const museumDoc = await db.collection('museums').doc(museumId).get();
  const bingoPrompts = museumDoc.data()?.bingoPrompts;
  const allTiles = bingoPrompts?.flat() ?? [];

  const pendingTileIds = allTiles
    .map((_: unknown, idx: number) => `tile_${idx}`)
    .filter((id: string) => !completedTileIds.includes(id));

  if (pendingTileIds.length === 0) {
    return null;
  }

  // Fetch artwork locations for those tiles.
  const artworkSnapshot = await db
    .collection('artworks')
    .where('museumId', '==', museumId)
    .where('bingoTileId', 'in', pendingTileIds)
    .limit(10)
    .get();

  const candidates: ArtworkLocation[] = artworkSnapshot.docs.map((doc: any) => ({
    artworkId: doc.id,
    title: doc.data().title,
    bingoTileId: doc.data().bingoTileId,
    x: doc.data().locationX,
    y: doc.data().locationY,
  }));

  if (candidates.length === 0) {
    return null;
  }

  let best: { artwork: ArtworkLocation; distance: number; bearing: number; score: number } | null = null;

  for (const art of candidates) {
    const dx = art.x - userPos.x;
    const dy = art.y - userPos.y;
    const distance = Math.hypot(dx, dy);
    const bearing = (Math.atan2(dy, dx) * 180) / Math.PI + 360;
    const normalizedBearing = bearing % 360;

    let score = distance;
    if (userPos.heading !== undefined) {
      const relative = Math.abs(normalizedBearing - userPos.heading);
      const headingPenalty = Math.min(relative, 360 - relative) / 180;
      score = distance * (1 + headingPenalty);
    }

    if (!best || score < best.score) {
      best = { artwork: art, distance, bearing: normalizedBearing, score };
    }
  }

  if (!best) {
    return null;
  }

  return {
    artwork: best.artwork,
    distance: best.distance,
    bearing: best.bearing,
  };
}
