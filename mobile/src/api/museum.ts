const defaultCard = [
  ['Find an animal', 'Abstract sculpture', 'Portrait in blue'],
  ['Landscape painting', 'Historical artifact', 'Artwork with gold frame'],
  ['Something from 1800s', 'Modern installation', 'A self-portrait'],
];

export async function getMuseumBingoCard(_museumId: string): Promise<string[][]> {
  // Placeholder API function; replace with backend fetch when API is available.
  return defaultCard;
}
