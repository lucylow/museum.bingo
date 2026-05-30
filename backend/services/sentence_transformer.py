from typing import Dict, List, Optional

import faiss
import numpy as np
import pickle
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer


class SentenceEmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.dimension = 384
        self.index: Optional[faiss.IndexFlatIP] = None
        self.texts: List[str] = []
        self.metadata: List[Dict] = []

    def encode_text(self, text: str) -> np.ndarray:
        embedding = self.model.encode([text])[0]
        return embedding / np.linalg.norm(embedding)

    def encode_batch(self, texts: List[str]) -> np.ndarray:
        embeddings = self.model.encode(texts)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / norms

    def build_index(self, texts: List[str], metadata_list: List[Dict]) -> None:
        self.texts = texts
        self.metadata = metadata_list
        embeddings = self.encode_batch(texts)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings.astype(np.float32))

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        if self.index is None:
            return []

        query_embedding = self.encode_text(query).reshape(1, -1).astype(np.float32)
        distances, indices = self.index.search(query_embedding, top_k)
        results: List[Dict] = []

        for idx, score in zip(indices[0], distances[0]):
            if idx == -1:
                continue
            results.append(
                {
                    "text": self.texts[idx],
                    "metadata": self.metadata[idx],
                    "similarity": float(score),
                }
            )
        return results

    def save_index(self, path: str) -> None:
        if self.index is None:
            raise ValueError("No index built")

        faiss.write_index(self.index, f"{path}.faiss")
        with open(f"{path}.meta", "wb") as handle:
            pickle.dump((self.texts, self.metadata), handle)

    def load_index(self, path: str) -> None:
        self.index = faiss.read_index(f"{path}.faiss")
        with open(f"{path}.meta", "rb") as handle:
            self.texts, self.metadata = pickle.load(handle)


app = FastAPI()
service = SentenceEmbeddingService()


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


@app.post("/semantic-search")
async def semantic_search(request: SearchRequest):
    results = service.search(request.query, request.top_k)
    return {"results": results}


@app.post("/index-artworks")
async def index_artworks(artworks: List[Dict]):
    texts = [f"{artwork['title']} {artwork['description']}" for artwork in artworks]
    service.build_index(texts, artworks)
    return {"status": "indexed", "count": len(texts)}
