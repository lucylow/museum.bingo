"""
Incremental FAISS updates for newly added artworks.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

import boto3
import faiss
import numpy as np

from pipeline.tower_pipelines.clip_embedding import get_embedding
from pipeline.tower_pipelines.image_processing import process_artwork


INDEX_BUCKET = "museum-bingo-indices"
RESIZED_BUCKET = "museum-bingo-resized"
s3 = boto3.client("s3")


def download_from_s3(bucket: str, key: str) -> bytes:
    return s3.get_object(Bucket=bucket, Key=key)["Body"].read()


def notify_index_update(museum_id: str) -> None:
    """Placeholder for app refresh notifications."""
    _ = museum_id


def add_new_artworks(museum_id: str, new_artworks: List[Dict[str, Any]]) -> Dict[str, Any]:
    processed = [process_artwork(artwork, museum_id) for artwork in new_artworks]

    new_embeddings = []
    for artwork in processed:
        image_bytes = download_from_s3(RESIZED_BUCKET, artwork["resized_s3_key"])
        vector = get_embedding(image_bytes)
        new_embeddings.append({"artwork_id": artwork["artwork_id"], "embedding": vector.tolist()})

    index_key = f"museums/{museum_id}/faiss_index.bin"
    existing_index_bytes = download_from_s3(INDEX_BUCKET, index_key)
    index = faiss.deserialize_index(existing_index_bytes)

    new_vectors = np.array([item["embedding"] for item in new_embeddings], dtype=np.float32)
    if new_vectors.size:
        index.add(new_vectors)

    s3.put_object(Bucket=INDEX_BUCKET, Key=index_key, Body=faiss.serialize_index(index))

    mapping_key = f"museums/{museum_id}/id_mapping.json"
    mapping_bytes = download_from_s3(INDEX_BUCKET, mapping_key)
    mapping: Dict[str, str] = json.loads(mapping_bytes.decode("utf-8"))
    next_index = len(mapping)
    for offset, embedding in enumerate(new_embeddings):
        mapping[str(next_index + offset)] = embedding["artwork_id"]

    s3.put_object(
        Bucket=INDEX_BUCKET,
        Key=mapping_key,
        Body=json.dumps(mapping).encode("utf-8"),
    )

    notify_index_update(museum_id)
    return {"status": "updated", "museum_id": museum_id, "added": len(new_embeddings)}

