import axios from 'axios';
import { db } from '../config/firebase';

const NIMBLE_API_KEY = process.env.NIMBLE_API_KEY;

/**
 * Generates a bingo card tailored to a museum collection using AI.
 * It samples artwork metadata, asks an LLM for prompt candidates, then stores the result.
 */
export async function generateDynamicBingoCard(
  museumId: string,
  size: 3 | 4 = 3
): Promise<string[][]> {
  // Step 1: sample artwork titles/descriptions for grounding.
  const artworks = await fetchArtworkMetadata(museumId, 50);
  const artworkDescriptions = artworks.map((a) => `${a.title}: ${a.description}`).join('\n');

  // Step 2: ask LLM for bingo prompts.
  const llmResponse = await callLLM(artworkDescriptions, size);
  const prompts = parseLLMResponse(llmResponse, size);

  // Step 3: persist prompts for museum.
  await db.collection('bingo_cards').doc(museumId).set({
    size,
    prompts,
    generatedAt: new Date(),
  });

  return prompts;
}

async function fetchArtworkMetadata(museumId: string, limit: number): Promise<any[]> {
  const snapshot = await db.collection('artworks').where('museumId', '==', museumId).limit(limit).get();
  return snapshot.docs.map((doc: any) => doc.data());
}

async function callLLM(artworkDescriptions: string, size: number): Promise<string> {
  const prompt = `
You are helping create a bingo game for a museum. Given the following list of artworks with titles and descriptions, generate a ${size}x${size} bingo card where each cell contains a short, fun, and challenging prompt that visitors can hunt for. The prompts should be visually verifiable (e.g., "Find a painting with a dog", "Sculpture that looks uncomfortable", "Artwork with gold leaf"). Return only a JSON array of arrays.

Artworks:
${artworkDescriptions}

Output format: [[prompt1, prompt2, ...], [prompt3, ...], ...]
  `;

  // Uses Nimble Answer API (or swap to direct OpenAI call).
  const response = await axios.post(
    'https://api.nimbleway.com/v1/answer',
    {
      query: prompt,
      model: 'gpt-4',
    },
    { headers: { Authorization: `Bearer ${NIMBLE_API_KEY}` } }
  );

  return response.data.answer;
}

function parseLLMResponse(text: string, size: number): string[][] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length === size && parsed[0].length === size) {
      return parsed;
    }
  } catch (_err) {
    // fallback below.
  }

  const defaults: Record<number, string[][]> = {
    3: [
      ['Painting with a dog', 'Sculpture looks uncomfortable', 'Self-portrait suspicious eyes'],
      ['Landscape with mountains', 'Artwork with gold leaf', 'Still life with fruit'],
      ['Portrait of a king', 'Seashell in painting', 'Artwork with text'],
    ],
    4: [
      ['Animal in the corner', 'Broken frame', 'Hidden signature', 'Depiction of water'],
      ['Religious symbol', 'Musical instrument', 'Fruit bowl', 'Architecture study'],
      ['War scene', 'Mythological creature', 'Floral pattern', 'Knight armor'],
      ['Crown or tiara', 'Cherubs', 'Ship at sea', 'Hands clasped'],
    ],
  };

  return defaults[size];
}
