import { ArtworkIndex, ArtworkMetadata } from './ArtworkIndex';

export interface Recommendation {
  artworkId: string;
  tileId: string;
  title: string;
  score: number;
  reason: string;
}

interface RecommendationEngineOptions {
  sentenceEncoderEndpoint?: string;
}

export class RecommendationEngine {
  private readonly artworkIndex: ArtworkIndex;
  private readonly sentenceEncoder: SentenceEncoder;

  constructor(artworkIndex: ArtworkIndex, options: RecommendationEngineOptions = {}) {
    this.artworkIndex = artworkIndex;
    this.sentenceEncoder = new SentenceEncoder(options.sentenceEncoderEndpoint);
  }

  async recommendForPrompt(prompt: string, limit = 3): Promise<Recommendation[]> {
    const promptEmbedding = await this.sentenceEncoder.encode(prompt);
    const candidates = this.artworkIndex.searchKNN(promptEmbedding, limit);

    return candidates.map((candidate) => ({
      artworkId: candidate.metadata.id,
      tileId: candidate.metadata.bingoTileId,
      title: candidate.metadata.title,
      score: candidate.similarity,
      reason: `This artwork matches your prompt "${prompt}"`,
    }));
  }

  async findSimilarArtworks(artworkId: string, limit = 5): Promise<ArtworkMetadata[]> {
    const artwork = this.artworkIndex.getMetadata(artworkId);
    if (!artwork) return [];

    const neighbors = this.artworkIndex.searchKNN(artwork.embedding, limit + 1);
    return neighbors.filter((item) => item.metadata.id !== artworkId).map((item) => item.metadata);
  }
}

class SentenceEncoder {
  private readonly endpoint: string;

  constructor(endpoint = 'https://api.museum.bingo/semantic-encode') {
    this.endpoint = endpoint;
  }

  async encode(text: string): Promise<Float32Array> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error(`Semantic encoding failed with status ${response.status}`);
    }
    const data = await response.json();
    return new Float32Array(data.embedding);
  }
}
