import RNFS from 'react-native-fs';
import { ArtworkMetadata } from './ArtworkIndex';

const INDEX_CACHE_DIR = `${RNFS.DocumentDirectoryPath}/embeddings`;

export class EmbeddingDownloader {
  static async ensureCacheDirectory(): Promise<void> {
    const exists = await RNFS.exists(INDEX_CACHE_DIR);
    if (!exists) await RNFS.mkdir(INDEX_CACHE_DIR);
  }

  static async downloadIndex(museumId: string, presignedUrl: string): Promise<ArtworkMetadata[]> {
    await this.ensureCacheDirectory();
    const localPath = `${INDEX_CACHE_DIR}/${museumId}.json`;

    const cachedExists = await RNFS.exists(localPath);
    if (cachedExists) {
      const cached = await RNFS.readFile(localPath);
      return this.parseArtworks(JSON.parse(cached));
    }

    const response = await fetch(presignedUrl);
    const artworks = await response.json();
    const serializable = artworks.map((item: ArtworkMetadata) => ({
      ...item,
      embedding: Array.from(item.embedding),
    }));
    await RNFS.writeFile(localPath, JSON.stringify(serializable));
    return this.parseArtworks(artworks);
  }

  static async clearCache(museumId?: string): Promise<void> {
    if (museumId) {
      const path = `${INDEX_CACHE_DIR}/${museumId}.json`;
      if (await RNFS.exists(path)) await RNFS.unlink(path);
      return;
    }

    const exists = await RNFS.exists(INDEX_CACHE_DIR);
    if (!exists) return;

    const files = await RNFS.readDir(INDEX_CACHE_DIR);
    for (const file of files) {
      await RNFS.unlink(file.path);
    }
  }

  private static parseArtworks(raw: Array<any>): ArtworkMetadata[] {
    return raw.map((item) => ({
      ...item,
      embedding: new Float32Array(item.embedding),
    }));
  }
}
