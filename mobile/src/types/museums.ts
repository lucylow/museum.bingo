export type MuseumType =
  | 'history'
  | 'living_history'
  | 'immigration'
  | 'military_history'
  | 'penal_history'
  | 'holocaust'
  | 'transportation'
  | 'pioneer';

export interface HistoricalMuseum {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl?: string;
  type: MuseumType;
}

export interface NearbyMuseum extends HistoricalMuseum {
  distance: number;
}
