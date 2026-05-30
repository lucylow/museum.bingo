import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import { getMuseumIndexDownloadUrls } from '../api/museum';

export interface ArtworkIndex {
  indexBuffer: ArrayBuffer;
  idMapping: Record<number, string>;
}

const INDICES_DIR = `${RNFS.DocumentDirectoryPath}/indices`;

function parseMapping(input: unknown): Record<number, string> {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const typed: Record<number, string> = {};
  Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
    const index = Number.parseInt(key, 10);
    if (!Number.isNaN(index) && typeof value === 'string') {
      typed[index] = value;
    }
  });
  return typed;
}

export async function downloadMuseumIndex(museumId: string): Promise<ArtworkIndex | null> {
  const { indexUrl, mappingUrl } = await getMuseumIndexDownloadUrls(museumId);
  const indexPath = `${INDICES_DIR}/${museumId}.bin`;

  await RNFS.mkdir(INDICES_DIR);

  const indexDownload = await RNFS.downloadFile({
    fromUrl: indexUrl,
    toFile: indexPath,
  }).promise;
  if (indexDownload.statusCode !== 200) {
    return null;
  }

  const mappingResponse = await fetch(mappingUrl);
  if (!mappingResponse.ok) {
    return null;
  }
  const mappingJson = await mappingResponse.json();
  const idMapping = parseMapping(mappingJson);

  const indexBase64 = await RNFS.readFile(indexPath, 'base64');
  const indexBuffer = Buffer.from(indexBase64, 'base64').buffer;

  return { indexBuffer, idMapping };
}

let currentIndex: ArtworkIndex | null = null;

// TODO: replace with concrete native bridge once FAISS mobile binding is wired.
interface FaissBridgeType {
  loadIndex: (indexBuffer: ArrayBuffer) => Promise<void>;
  search: (queryEmbedding: Float32Array, k: number) => [number, number];
}

const FaissBridge: FaissBridgeType = {
  async loadIndex(_indexBuffer: ArrayBuffer) {
    return;
  },
  search(_queryEmbedding: Float32Array, _k: number) {
    return [-1, 0];
  },
};

export async function loadIndexForMuseum(museumId: string): Promise<void> {
  currentIndex = await downloadMuseumIndex(museumId);
  if (!currentIndex) {
    throw new Error(`Unable to download index for museum ${museumId}`);
  }
  await FaissBridge.loadIndex(currentIndex.indexBuffer);
}

export function searchArtwork(
  queryEmbedding: Float32Array
): { artworkId: string; similarity: number } | null {
  if (!currentIndex) {
    return null;
  }

  const [index, similarity] = FaissBridge.search(queryEmbedding, 1);
  if (index < 0 || similarity <= 0.85) {
    return null;
  }

  const artworkId = currentIndex.idMapping[index];
  if (!artworkId) {
    return null;
  }
  return { artworkId, similarity };
}

