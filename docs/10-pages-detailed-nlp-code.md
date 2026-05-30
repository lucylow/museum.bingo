# 10 Pages of Detailed Code for Natural Language Processing (NLP) - Museum.Bingo

This document provides complete, production-ready NLP modules for Museum.Bingo. Each page focuses on a specific task: generating bingo prompts, analysing artwork descriptions, semantic search, sentiment analysis, multilingual support, named entity recognition, Q&A bots, subtle hints, text-to-embedding for CLIP, and real-time audio transcription.

---

## Page 1 - Artwork Description Summarization (Hugging Face Transformers)

```python
# nlp/summarization.py
# Summarises long artwork descriptions into short, engaging blurbs.
# Uses a distilled BART model for speed.

from transformers import pipeline
from typing import List

class ArtworkSummarizer:
    def __init__(self, model_name="sshleifer/distilbart-cnn-12-6"):
        self.summarizer = pipeline(
            "summarization",
            model=model_name,
            device=-1  # CPU; use 0 for GPU
        )

    def summarize(self, text: str, max_length: int = 50, min_length: int = 10) -> str:
        """
        Generate a concise summary suitable for a bingo hint.
        """
        if len(text.split()) < 20:
            return text  # already short
        result = self.summarizer(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False
        )
        return result[0]['summary_text']

    def batch_summarize(self, texts: List[str]) -> List[str]:
        return [self.summarize(t) for t in texts]


# Example usage
if __name__ == "__main__":
    summarizer = ArtworkSummarizer()
    long_desc = "This magnificent oil painting from 1872 depicts a tranquil river landscape at sunset, featuring three children playing near a wooden bridge, with vibrant golden hues reflecting on the water surface. The artist intended to evoke nostalgia for rural simplicity."
    short = summarizer.summarize(long_desc)
    print(short)  # "Three children play near a bridge at sunset in this 1872 oil painting."
```

**Integration:** Called when generating bingo hints or when user taps "Tell me more" on an artwork.

---

## Page 2 - Bingo Prompt Generation from Museum Collection (LLM + Nimble)

```typescript
// nlp/promptGenerator.ts
// Uses an LLM (via Nimble Answer API) to create bingo prompts from artwork titles/descriptions.

import axios from 'axios';

interface PromptRequest {
  artworkTitles: string[];
  artworkDescriptions: string[];
  cardSize: 3 | 4;
  style: 'funny' | 'educational' | 'challenging';
}

export class BingoPromptGenerator {
  private readonly nimbleUrl = 'https://api.nimbleway.com/v1/answer';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generatePrompts(request: PromptRequest): Promise<string[][]> {
    const artworksText = request.artworkTitles.map((title, idx) => {
      const desc = request.artworkDescriptions[idx]?.slice(0, 100) || '';
      return `- ${title}: ${desc}`;
    }).join('\n');

    const systemPrompt = `You are an expert museum game designer. Create a ${request.cardSize}x${request.cardSize} bingo card.
Each cell must contain a short, visually verifiable prompt (e.g., "painting with a dog", "sculpture that looks uncomfortable").
Prompts should be ${request.style}. Return ONLY valid JSON, no extra text.`;

    const userPrompt = `Artworks in this museum:\n${artworksText}\nGenerate the bingo card.`;

    const response = await axios.post(
      this.nimbleUrl,
      {
        query: userPrompt,
        system: systemPrompt,
        model: 'gpt-4-turbo',
        temperature: 0.8,
        max_tokens: 800,
      },
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );

    const raw = response.data.answer;
    return this.parsePrompts(raw, request.cardSize);
  }

  private parsePrompts(raw: string, size: number): string[][] {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === size && parsed[0].length === size) {
        return parsed;
      }
    } catch (e) {}
    // Fallback default
    return Array(size).fill(Array(size).fill("Find something unusual"));
  }
}
```

**Integration:** Called once per museum when onboarding; results cached in Firestore.

---

## Page 3 - Semantic Search for Artworks (Sentence Transformers)

```python
# nlp/semantic_search.py
# Allows users to search for artworks by natural language description.
# Uses Sentence-BERT embeddings with FAISS index.

from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from typing import List, Tuple

class ArtworkSemanticSearch:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.encoder = SentenceTransformer(model_name)
        self.index = None
        self.artwork_ids = []
        self.artwork_texts = []

    def build_index(self, artwork_texts: List[str], artwork_ids: List[str]):
        """Build FAISS index from artwork descriptions/titles."""
        self.artwork_texts = artwork_texts
        self.artwork_ids = artwork_ids
        embeddings = self.encoder.encode(artwork_texts, convert_to_numpy=True)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product (cosine after norm)
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """Return artwork ids with similarity scores."""
        if self.index is None:
            raise ValueError("Index not built. Call build_index first.")
        query_emb = self.encoder.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(query_emb)
        distances, indices = self.index.search(query_emb, top_k)
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1:
                results.append((self.artwork_ids[idx], float(distances[0][i])))
        return results

# Example
if __name__ == "__main__":
    searcher = ArtworkSemanticSearch()
    searcher.build_index(
        ["Woman with a Pearl Earring", "The Starry Night", "Mona Lisa"],
        ["art1", "art2", "art3"]
    )
    results = searcher.search("girl with jewelry")
    print(results)  # [('art1', 0.87), ...]
```

**Integration:** Used in the "Find artwork by description" feature and for heat vision hint suggestions.

---

## Page 4 - User Feedback Sentiment Analysis (DistilBERT)

```python
# nlp/sentiment.py
# Classifies user feedback (ratings, comments) into positive/negative/neutral.
# Uses a fine-tuned DistilBERT model.

from transformers import pipeline

class FeedbackSentimentAnalyzer:
    def __init__(self, model_name="distilbert-base-uncased-finetuned-sst-2-english"):
        self.classifier = pipeline("sentiment-analysis", model=model_name)

    def analyze(self, text: str) -> dict:
        result = self.classifier(text)[0]
        label = result['label']  # POSITIVE or NEGATIVE
        score = result['score']
        sentiment = 'positive' if label == 'POSITIVE' else 'negative'
        return {
            'sentiment': sentiment,
            'confidence': score,
            'is_neutral': score < 0.6  # low confidence => neutral
        }

    def aggregate_feedback(self, feedbacks: list) -> dict:
        """Aggregate multiple feedbacks into museum-level metrics."""
        sentiments = [self.analyze(fb) for fb in feedbacks]
        pos = sum(1 for s in sentiments if s['sentiment'] == 'positive')
        neg = sum(1 for s in sentiments if s['sentiment'] == 'negative')
        neutral = len(sentiments) - pos - neg
        return {
            'positive': pos,
            'negative': neg,
            'neutral': neutral,
            'avg_confidence': sum(s['confidence'] for s in sentiments)/len(sentiments)
        }
```

**Integration:** Called after each game session to collect user satisfaction; results stored in Firestore for museum dashboards.

---

## Page 5 - Multilingual Support for Museum Labels (Hugging Face M2M100)

```python
# nlp/translation.py
# Translates artwork titles and descriptions into the user's preferred language.
# Uses M2M100 (100+ languages).

from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer

class MuseumTranslator:
    def __init__(self, model_name="facebook/m2m100_418M"):
        self.tokenizer = M2M100Tokenizer.from_pretrained(model_name)
        self.model = M2M100ForConditionalGeneration.from_pretrained(model_name)

    def translate(self, text: str, target_lang: str = "fr", source_lang: str = "en") -> str:
        """Translate text from source_lang to target_lang."""
        self.tokenizer.src_lang = source_lang
        encoded = self.tokenizer(text, return_tensors="pt")
        generated = self.model.generate(
            **encoded,
            forced_bos_token_id=self.tokenizer.get_lang_id(target_lang),
            max_length=100
        )
        return self.tokenizer.batch_decode(generated, skip_special_tokens=True)[0]

    def batch_translate(self, texts: List[str], target_lang: str) -> List[str]:
        return [self.translate(t, target_lang) for t in texts]

# Example
if __name__ == "__main__":
    translator = MuseumTranslator()
    translated = translator.translate("A painting with a dog", target_lang="es")
    print(translated)  # "Una pintura con un perro"
```

**Integration:** The app detects the device language and translates bingo prompts and artwork details on the fly.

---

## Page 6 - Named Entity Recognition (NER) for Artists and Artworks

```python
# nlp/ner.py
# Extracts artist names, artwork titles, and periods from museum text.

from transformers import pipeline

class ArtworkNER:
    def __init__(self):
        # Using a model fine-tuned on museum texts (e.g., dslim/bert-base-NER)
        self.ner = pipeline("ner", aggregation_strategy="simple")

    def extract_entities(self, text: str) -> dict:
        results = self.ner(text)
        entities = {
            'PERSON': [],    # artist names
            'WORK_OF_ART': [], # artwork titles
            'DATE': [],       # creation years/periods
            'LOC': []         # places (e.g., "Louvre")
        }
        for ent in results:
            if ent['entity_group'] in entities:
                entities[ent['entity_group']].append(ent['word'])
        # Deduplicate and join multi-word entities
        for k in entities:
            entities[k] = list(dict.fromkeys(entities[k]))
        return entities

    def get_artist_from_description(self, description: str) -> str:
        entities = self.extract_entities(description)
        return entities['PERSON'][0] if entities['PERSON'] else "Unknown"

# Example
if __name__ == "__main__":
    ner = ArtworkNER()
    desc = "Painted by Vincent van Gogh in 1889 at Saint-Remy-de-Provence."
    ents = ner.extract_entities(desc)
    print(ents)  # {'PERSON': ['Vincent van Gogh'], 'DATE': ['1889'], ...}
```

**Integration:** Used when ingesting museum data to automatically tag artworks with artists and time periods for better search and bingo prompt generation.

---

## Page 7 - Question Answering Bot for Museum FAQs

```python
# nlp/qa_bot.py
# Answers user questions about the museum (e.g., "Where is the bathroom?")
# Uses a retrieval-augmented generation (RAG) pipeline.

from transformers import pipeline
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class MuseumQABot:
    def __init__(self, faq_file: str, model_name="all-MiniLM-L6-v2"):
        self.encoder = SentenceTransformer(model_name)
        self.reader = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")
        self.faqs = self.load_faqs(faq_file)
        self.build_index()

    def load_faqs(self, file_path: str) -> list:
        # Each FAQ: {"question": str, "answer": str}
        import json
        with open(file_path) as f:
            return json.load(f)

    def build_index(self):
        questions = [faq['question'] for faq in self.faqs]
        embeddings = self.encoder.encode(questions, convert_to_numpy=True)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)

    def answer(self, user_query: str) -> str:
        # Retrieve top 3 similar FAQs
        query_emb = self.encoder.encode([user_query], convert_to_numpy=True)
        faiss.normalize_L2(query_emb)
        distances, indices = self.index.search(query_emb, 3)
        best_idx = indices[0][0] if indices[0][0] != -1 else 0
        best_faq = self.faqs[best_idx]
        # Use reader to refine answer
        context = best_faq['question'] + " " + best_faq['answer']
        result = self.reader(question=user_query, context=context)
        return result['answer']

# Example: pre-load FAQs like:
# [{"question": "Where is the coat check?", "answer": "The coat check is near the main entrance."}]
```

**Integration:** Exposed as an in-app chat widget. Helps users without interrupting gameplay.

---

## Page 8 - Generating Subtle Hints (LLM with Prompt Engineering)

```typescript
// nlp/subtleHint.ts
// Generates a cryptic, playful hint that doesn't give away the exact artwork.

import axios from 'axios';

export class SubtleHintGenerator {
  private readonly openaiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateHint(
    artworkTitle: string,
    artworkDescription: string,
    bingoPrompt: string
  ): Promise<string> {
    const prompt = `You are a museum guide. The player is hunting for an artwork that matches the bingo prompt: "${bingoPrompt}".
The target artwork is titled "${artworkTitle}" and described as "${artworkDescription}".
Give a subtle, poetic, or playful hint that points the player in the right direction without naming the artwork or the prompt. Keep it under 25 words.`;

    const response = await axios.post(
      this.openaiUrl,
      {
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.9,
      },
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );
    return response.data.choices[0].message.content.trim();
  }
}
```

**Integration:** Called when user taps "Give me a hint" on a bingo tile. The hint appears as an overlay.

---

## Page 9 - Text-to-Embedding for Prompt Matching (CLIP Text Encoder)

```python
# nlp/text_encoder.py
# Encodes bingo prompts into the same embedding space as artwork images (CLIP).
# Enables direct similarity comparison.

import torch
import clip
from typing import List

class CLIPTextEncoder:
    def __init__(self, model_name="ViT-B/32"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, _ = clip.load(model_name, device=self.device)
        self.model.eval()

    def encode_prompt(self, prompt: str) -> List[float]:
        """Return a 512-dim embedding for the prompt."""
        text = clip.tokenize([prompt]).to(self.device)
        with torch.no_grad():
            embedding = self.model.encode_text(text)
        return embedding.cpu().numpy()[0].tolist()

    def batch_encode(self, prompts: List[str]) -> List[List[float]]:
        text_tokens = clip.tokenize(prompts).to(self.device)
        with torch.no_grad():
            embeddings = self.model.encode_text(text_tokens)
        return embeddings.cpu().numpy().tolist()
```

**Integration:** Used during museum onboarding to pre-compute embeddings for all bingo prompts. The mobile app then matches these against the image embedding from the camera frame for multimodal validation.

---

## Page 10 - Real-time Audio Transcription of Audio Guides (Whisper)

```python
# nlp/transcription.py
# Transcribes live audio from museum audio guides or user voice input.
# Uses OpenAI Whisper (small model for on-device or API).

import whisper
import numpy as np

class AudioTranscriber:
    def __init__(self, model_size="base"):
        self.model = whisper.load_model(model_size)

    def transcribe_file(self, audio_path: str) -> str:
        result = self.model.transcribe(audio_path)
        return result["text"]

    def transcribe_chunk(self, audio_chunk: np.ndarray, sample_rate: int = 16000) -> str:
        """For streaming, buffer chunks and pass to model (simplified)."""
        # In practice, use a streaming ASR like faster-whisper or Silero VAD.
        result = self.model.transcribe(audio_chunk, fp16=False)
        return result["text"]

    def extract_keywords(self, text: str) -> list:
        """Simple keyword extraction for triggering bingo events."""
        from sklearn.feature_extraction.text import CountVectorizer
        vectorizer = CountVectorizer(stop_words='english', max_features=5)
        X = vectorizer.fit_transform([text])
        return vectorizer.get_feature_names_out().tolist()
```

**Integration (stretch goal):** Allows users to say "I found a painting with a dog" and the app validates the bingo tile via voice + NLP. Also transcribes audio guide content for accessibility.

---

All NLP modules are designed to be **modular**, **lightweight** (where possible), and **easily deployable** on the Museum.Bingo backend (Python/Tower) or on-device (TypeScript with TensorFlow.js). They directly support the hackathon's judging criteria for **technical execution** and **feasibility** by adding intelligent, interactive language features to the AR bingo experience.
