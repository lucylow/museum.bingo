import axios from 'axios';

interface HintRequest {
  artworkTitle: string;
  artworkDescription: string;
  bingoPrompt: string;
}

/**
 * Generates a subtle hint for a player without revealing the exact answer.
 */
export async function generateSubtleHint(request: HintRequest): Promise<string> {
  const prompt = `
You are a helpful museum guide. A player is looking for an artwork that matches the bingo prompt: "${request.bingoPrompt}".
The target artwork is titled "${request.artworkTitle}" and described as: "${request.artworkDescription}".
Give a subtle hint that points the player in the right direction without explicitly naming the artwork or the prompt. Be playful and museum-appropriate. Keep it under 30 words.
  `;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.7,
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );

  return response.data.choices[0].message.content.trim();
}
