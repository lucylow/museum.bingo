export interface ArtworkMetadata {
  id: string;
  museumId: string;
  title: string;
  bingoTileId: string;
  embedding: Float32Array;
}

export class ArtworkIndex {
  private embeddings: Float32Array[] = [];
  private metadata: ArtworkMetadata[] = [];
  private idToIndexMap: Map<string, number> = new Map();
  private dimension = 512;

  build(artworks: ArtworkMetadata[]): void {
    this.embeddings = artworks.map((a) => a.embedding);
    this.metadata = artworks;
    this.idToIndexMap.clear();
    artworks.forEach((art, idx) => this.idToIndexMap.set(art.id, idx));
    if (this.embeddings.length > 0) {
      this.dimension = this.embeddings[0].length;
    }
  }

  search(
    queryEmbedding: Float32Array,
    threshold = 0.85,
  ): { metadata: ArtworkMetadata; similarity: number } | null {
    if (this.embeddings.length === 0) return null;
    if (queryEmbedding.length !== this.dimension) return null;

    let bestIdx = -1;
    let bestSim = -1;

    for (let i = 0; i < this.embeddings.length; i++) {
      const sim = this.cosineSimilarity(queryEmbedding, this.embeddings[i]);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    if (bestSim < threshold || bestIdx < 0) return null;
    return { metadata: this.metadata[bestIdx], similarity: bestSim };
  }

  searchKNN(
    queryEmbedding: Float32Array,
    k: number,
  ): Array<{ metadata: ArtworkMetadata; similarity: number }> {
    if (this.embeddings.length === 0 || queryEmbedding.length !== this.dimension || k <= 0) {
      return [];
    }

    const similarities = this.embeddings.map((embedding) =>
      this.cosineSimilarity(queryEmbedding, embedding),
    );
    const topMatches = similarities
      .map((sim, idx) => ({ sim, idx }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, k);

    return topMatches.map(({ sim, idx }) => ({
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

  getMetadata(artworkId: string): ArtworkMetadata | null {
    const idx = this.idToIndexMap.get(artworkId);
    return idx !== undefined ? this.metadata[idx] : null;
  }

  size(): number {
    return this.embeddings.length;
  }
}
