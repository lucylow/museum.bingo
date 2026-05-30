import type { Frame } from 'react-native-vision-camera';
import { runAsync } from 'react-native-worklets-core';
import { MobileCLIPModel } from './MobileCLIPModel';
import { ArtworkIndex, ArtworkMetadata } from './ArtworkIndex';

export interface RecognitionResult {
  artworkId: string;
  tileId: string;
  artworkTitle: string;
  confidence: number;
  embeddingLatency: number;
  searchLatency: number;
  totalLatency: number;
}

export class ArtworkRecognizer {
  private clipModel: MobileCLIPModel | null = null;
  private index: ArtworkIndex | null = null;
  private currentMuseumId: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      const model = new MobileCLIPModel();
      await model.load();
      this.clipModel = model;
    })();

    return this.initializationPromise;
  }

  async loadMuseumIndex(museumId: string, artworks: ArtworkMetadata[]): Promise<void> {
    const index = new ArtworkIndex();
    index.build(artworks);
    this.index = index;
    this.currentMuseumId = museumId;
  }

  async recognizeFrame(frame: Frame): Promise<RecognitionResult | null> {
    if (!this.clipModel || !this.index) return null;
    const startTotal = performance.now();

    const rgbData = new Uint8Array(frame.toArrayBuffer());
    const { embedding, latencyMs: embeddingLatency } = await this.clipModel.encodeImage(
      rgbData,
      frame.width,
      frame.height,
    );

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
      totalLatency: performance.now() - startTotal,
    };
  }

  async recognizeFrameAsync(frame: Frame): Promise<RecognitionResult | null> {
    return new Promise((resolve) => {
      runAsync(frame, async () => {
        const result = await this.recognizeFrame(frame);
        resolve(result);
      });
    });
  }

  isReady(): boolean {
    return !!this.clipModel?.isModelLoaded() && !!this.index;
  }

  getCurrentMuseumId(): string | null {
    return this.currentMuseumId;
  }
}
