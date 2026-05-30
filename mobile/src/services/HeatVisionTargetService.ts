import bearing from '@turf/bearing';
import { UserPosition } from './PositioningService';

export interface ArtworkLocation {
  id: string;
  title: string;
  tileId: string;
  lat: number;
  lng: number;
  hasBeenValidated?: boolean;
}

export interface HeatVisionTarget {
  artworkId: string;
  tileId: string;
  title: string;
  bearing: number;
  relativeBearing: number;
  distanceMeters: number;
}

export class HeatVisionTargetService {
  private artworks: ArtworkLocation[] = [];

  private completedTileIds = new Set<string>();

  setMuseumArtworks(artworks: ArtworkLocation[]): void {
    this.artworks = artworks;
    this.completedTileIds = new Set(
      artworks.filter((artwork) => artwork.hasBeenValidated === true).map((artwork) => artwork.tileId),
    );
  }

  markTileCompleted(tileId: string): void {
    this.completedTileIds.add(tileId);
  }

  getNearestUnvalidatedTarget(userPos: UserPosition): HeatVisionTarget | null {
    let nearest: ArtworkLocation | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const artwork of this.artworks) {
      if (this.completedTileIds.has(artwork.tileId)) continue;
      const distance = this.calculateDistanceMeters(userPos.lat, userPos.lng, artwork.lat, artwork.lng);
      if (distance < nearestDistance) {
        nearest = artwork;
        nearestDistance = distance;
      }
    }

    if (!nearest || !Number.isFinite(nearestDistance)) return null;

    const rawBearing = bearing([userPos.lng, userPos.lat], [nearest.lng, nearest.lat]);
    const absoluteBearing = ((rawBearing % 360) + 360) % 360;
    const relativeBearing = ((absoluteBearing - userPos.heading) % 360 + 360) % 360;

    return {
      artworkId: nearest.id,
      tileId: nearest.tileId,
      title: nearest.title,
      bearing: absoluteBearing,
      relativeBearing,
      distanceMeters: nearestDistance,
    };
  }

  private calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const radius = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radius * c;
  }
}
