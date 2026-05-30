"""
Tower CLIP embedding step for resized artwork images.
"""

from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, List

import boto3
import clip
import numpy as np
import torch
from google.cloud import firestore
from PIL import Image

try:
    from tower import run_pipeline
except ImportError:  # pragma: no cover
    run_pipeline = None  # type: ignore[assignment]


RESIZED_BUCKET = "museum-bingo-resized"
s3 = boto3.client("s3")
db = firestore.Client()

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)


def get_embedding(image_bytes: bytes) -> np.ndarray:
    """Generate normalized 512-d CLIP embedding."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image_tensor = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model.encode_image(image_tensor)
    embedding = embedding / embedding.norm(dim=-1, keepdim=True)
    return embedding.cpu().numpy().flatten().astype(np.float32)


def handler(inputs: Dict[str, Any]) -> Dict[str, Any]:
    museum_id = inputs["museum_id"]
    metadata_doc = db.collection("artworks_metadata").document(museum_id).get()
    artworks: List[Dict[str, Any]] = metadata_doc.get("artworks") or []

    embeddings = []
    for artwork in artworks:
        image_obj = s3.get_object(Bucket=RESIZED_BUCKET, Key=artwork["resized_s3_key"])
        image_bytes = image_obj["Body"].read()
        vector = get_embedding(image_bytes)
        embeddings.append({"artwork_id": artwork["artwork_id"], "embedding": vector.tolist()})

    db.collection("embeddings").document(museum_id).set(
        {
            "embeddings": embeddings,
            "model": "ViT-B/32",
            "created_at": firestore.SERVER_TIMESTAMP,
        }
    )

    if run_pipeline is None:
        raise RuntimeError("tower.run_pipeline is unavailable in this environment")

    run_pipeline("build_faiss_index", inputs={"museum_id": museum_id}, wait=False)
    return {"status": "embeddings_created", "count": len(embeddings), "museum_id": museum_id}

