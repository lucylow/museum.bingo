const defaultCard = [
  ['Find an animal', 'Abstract sculpture', 'Portrait in blue'],
  ['Landscape painting', 'Historical artifact', 'Artwork with gold frame'],
  ['Something from 1800s', 'Modern installation', 'A self-portrait'],
];

export interface MuseumIndexDownloadUrls {
  indexUrl: string;
  mappingUrl: string;
}

export async function getMuseumBingoCard(_museumId: string): Promise<string[][]> {
  // Placeholder API function; replace with backend fetch when API is available.
  return defaultCard;
}

export async function getMuseumIndexDownloadUrls(
  museumId: string
): Promise<MuseumIndexDownloadUrls> {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const response = await fetch(`${backendUrl}/api/museums/${museumId}/index-download`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch index URLs: HTTP ${response.status}`);
  }

  const data = (await response.json()) as Partial<MuseumIndexDownloadUrls>;
  if (!data.indexUrl || !data.mappingUrl) {
    throw new Error('Invalid index URL payload from backend');
  }

  return {
    indexUrl: data.indexUrl,
    mappingUrl: data.mappingUrl,
  };
}
