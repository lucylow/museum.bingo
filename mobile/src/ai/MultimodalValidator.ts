import { MobileCLIPModel } from './MobileCLIPModel';
import { ArtworkIndex, ArtworkMetadata } from './ArtworkIndex';

export interface MultimodalValidationResult {
  matches: boolean;
  imageTextSimilarity: number;
  artworkMatch?: {
    metadata: ArtworkMetadata;
    similarity: number;
  } | null;
}

interface ValidatorOptions {
  textEncoderEndpoint?: string;
}

export class MultimodalValidator {
  private readonly clipModel: MobileCLIPModel;
  private readonly textEncoder: ClipTextEncoderClient;
  private index: ArtworkIndex | null = null;

  constructor(options: ValidatorOptions = {}) {
    this.clipModel = new MobileCLIPModel();
    this.textEncoder = new ClipTextEncoderClient(options.textEncoderEndpoint);
  }

  async initialize(): Promise<void> {
    await this.clipModel.load();
  }

  setIndex(index: ArtworkIndex): void {
    this.index = index;
  }

  async validate(
    frameRgb: Uint8Array,
    width: number,
    height: number,
    expectedPrompt: string,
  ): Promise<MultimodalValidationResult> {
    const { embedding: imageEmbedding } = await this.clipModel.encodeImage(frameRgb, width, height);
    const textEmbedding = await this.textEncoder.encode(expectedPrompt);
    const imageTextSimilarity = this.cosineSimilarity(imageEmbedding, textEmbedding);

    return {
      matches: imageTextSimilarity > 0.75,
      imageTextSimilarity,
      artworkMatch: this.index?.search(imageEmbedding) ?? null,
    };
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

class ClipTextEncoderClient {
  private readonly endpoint: string;

  constructor(endpoint = 'https://api.museum.bingo/encode-text') {
    this.endpoint = endpoint;
  }

  async encode(text: string): Promise<Float32Array> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error(`Text encoding failed with status ${response.status}`);
    }
    const data = await response.json();
    return new Float32Array(data.embedding);
  }
}
