import { MobileCLIPModel } from './MobileCLIPModel';
import { ArtworkIndex } from './ArtworkIndex';
import { EmbeddingDownloader } from './EmbeddingDownloader';
import { RecognitionResult } from './ArtworkRecognizer';

export class AIPipeline {
  private static instance: AIPipeline;
  private model: MobileCLIPModel | null = null;
  private index: ArtworkIndex | null = null;
  private currentMuseumId: string | null = null;

  static getInstance(): AIPipeline {
    if (!AIPipeline.instance) AIPipeline.instance = new AIPipeline();
    return AIPipeline.instance;
  }

  async init(): Promise<void> {
    if (!this.model) {
      this.model = new MobileCLIPModel();
      await this.model.load();
    }
  }

  async loadMuseum(museumId: string, embeddingUrl: string): Promise<void> {
    await this.init();
    const artworks = await EmbeddingDownloader.downloadIndex(museumId, embeddingUrl);
    const index = new ArtworkIndex();
    index.build(artworks);
    this.index = index;
    this.currentMuseumId = museumId;
  }

  async recognize(
    rgbData: Uint8Array,
    width: number,
    height: number,
  ): Promise<RecognitionResult | null> {
    if (!this.model || !this.index) return null;

    const { embedding, latencyMs: embeddingLatency } = await this.model.encodeImage(rgbData, width, height);
    const searchStart = performance.now();
    const match = this.index.search(embedding);
    const searchLatency = performance.now() - searchStart;

    if (!match) return null;

    return {
      artworkId: match.metadata.id,
      tileId: match.metadata.bingoTileId,
      artworkTitle: match.metadata.title,
      confidence: match.similarity,
      embeddingLatency,
      searchLatency,
      totalLatency: embeddingLatency + searchLatency,
    };
  }

  async prewarm(museumId: string, embeddingUrl: string): Promise<void> {
    const nextArtworks = await EmbeddingDownloader.downloadIndex(museumId, embeddingUrl);
    const nextIndex = new ArtworkIndex();
    nextIndex.build(nextArtworks);
    setTimeout(() => {
      this.index = nextIndex;
      this.currentMuseumId = museumId;
    }, 0);
  }

  getStatus(): {
    modelLoaded: boolean;
    indexLoaded: boolean;
    currentMuseum: string | null;
    indexSize: number;
  } {
    return {
      modelLoaded: !!this.model?.isModelLoaded(),
      indexLoaded: !!this.index,
      currentMuseum: this.currentMuseumId,
      indexSize: this.index?.size() || 0,
    };
  }
}
