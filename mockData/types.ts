export interface ArtworkMetadata {
  id: string;
  museumId: string;
  title: string;
  artist: string;
  description: string;
  imageS3Key: string;
  resizedS3Key: string;
  locationX: number;
  locationY: number;
  bingoTileId: string;
  embedding: Float32Array;
}
