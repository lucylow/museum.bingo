from typing import Any, Dict, List

import clip
import numpy as np
import torch
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
device = "cuda" if torch.cuda.is_available() else "cpu"
model, _preprocess = clip.load("ViT-B/32", device=device)


class TextRequest(BaseModel):
    text: str


class SimilarityRequest(BaseModel):
    text: str
    image_embedding: List[float]


@app.post("/encode-text")
async def encode_text(request: TextRequest) -> Dict[str, Any]:
    with torch.no_grad():
        text_tokens = clip.tokenize([request.text]).to(device)
        embedding = model.encode_text(text_tokens)
        embedding = embedding / embedding.norm(dim=-1, keepdim=True)
        return {"embedding": embedding.cpu().numpy().tolist()[0]}


@app.post("/similarity")
async def compute_similarity(request: SimilarityRequest) -> Dict[str, float]:
    image_embedding = np.array(request.image_embedding, dtype=np.float32)

    with torch.no_grad():
        text_tokens = clip.tokenize([request.text]).to(device)
        text_embedding = model.encode_text(text_tokens).cpu().numpy()[0]

    text_embedding = text_embedding / np.linalg.norm(text_embedding)
    similarity = np.dot(image_embedding, text_embedding)
    return {"similarity": float(similarity)}
