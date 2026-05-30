import * as fs from 'fs';

// In production, use a real vector DB (FAISS, LanceDB, Pinecone, etc.).
// This module is a simplified in-memory index for demonstration.

export interface ArtworkMetadata {
  id: string;
  museumId: string;
  title: string;
  bingoTileId: string;
}

export class VectorIndex {
  private embeddings: Float32Array[] = [];
  private metadata: ArtworkMetadata[] = [];
  private dimension: number;

  constructor(dimension: number = 512) {
    this.dimension = dimension;
  }

  add(embedding: Float32Array, meta: ArtworkMetadata): void {
    if (embedding.length !== this.dimension) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.dimension}, got ${embedding.length}`
      );
    }
    this.embeddings.push(embedding);
    this.metadata.push(meta);
  }

  /**
   * Find nearest artwork by cosine similarity.
   * Returns top K matches with similarity score.
   */
  search(query: Float32Array, topK: number = 1): { metadata: ArtworkMetadata; similarity: number }[] {
    if (this.embeddings.length === 0) {
      return [];
    }

    const similarities = this.embeddings.map((emb) => this.cosineSimilarity(query, emb));
    const indices = similarities
      .map((sim, idx) => ({ sim, idx }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, topK);

    return indices.map(({ sim, idx }) => ({
      metadata: this.metadata[idx],
      similarity: sim,
    }));
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
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

  // Persist index to disk (JSON format for portability).
  save(filePath: string): void {
    const data = {
      dimension: this.dimension,
      embeddings: this.embeddings.map((e) => Array.from(e)),
      metadata: this.metadata,
    };
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  load(filePath: string): void {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    this.dimension = data.dimension;
    this.embeddings = data.embeddings.map((arr: number[]) => new Float32Array(arr));
    this.metadata = data.metadata;
  }
}

// Singleton instance for current museum.
let currentIndex: VectorIndex | null = null;

export function setMuseumIndex(index: VectorIndex): void {
  currentIndex = index;
}

export function searchArtwork(
  queryEmbedding: Float32Array,
  threshold = 0.85
): { metadata: ArtworkMetadata; similarity: number } | null {
  if (!currentIndex) {
    throw new Error('No vector index loaded');
  }
  const results = currentIndex.search(queryEmbedding, 1);
  if (results.length === 0 || results[0].similarity < threshold) {
    return null;
  }
  return results[0];
}
