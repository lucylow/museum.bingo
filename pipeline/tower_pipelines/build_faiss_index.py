"""
Build and publish FAISS index artifacts.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

import boto3
import faiss
import numpy as np
from google.cloud import firestore


INDEX_BUCKET = "museum-bingo-indices"
s3 = boto3.client("s3")
db = firestore.Client()


def build_index(museum_id: str) -> str:
    """Read embeddings from Firestore, build FAISS index, and upload to S3."""
    embedding_doc = db.collection("embeddings").document(museum_id).get()
    embeddings_list: List[Dict[str, Any]] = embedding_doc.get("embeddings") or []
    if not embeddings_list:
        raise ValueError(f"No embeddings found for museum {museum_id}")

    vectors = np.array([item["embedding"] for item in embeddings_list], dtype=np.float32)
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)

    index_key = f"museums/{museum_id}/faiss_index.bin"
    mapping_key = f"museums/{museum_id}/id_mapping.json"

    s3.put_object(Bucket=INDEX_BUCKET, Key=index_key, Body=faiss.serialize_index(index))
    mapping = {str(i): item["artwork_id"] for i, item in enumerate(embeddings_list)}
    s3.put_object(Bucket=INDEX_BUCKET, Key=mapping_key, Body=json.dumps(mapping).encode("utf-8"))

    db.collection("museums").document(museum_id).set(
        {
            "embedding_index_version": firestore.SERVER_TIMESTAMP,
            "index_s3_key": index_key,
            "index_size": vectors.shape[0],
            "mapping_s3_key": mapping_key,
        },
        merge=True,
    )
    return index_key


def notify_mobile_app(museum_id: str, index_key: str) -> None:
    """Placeholder for push notifications (FCM/APNs/pubsub)."""
    _ = (museum_id, index_key)


def handler(inputs: Dict[str, Any]) -> Dict[str, Any]:
    museum_id = inputs["museum_id"]
    index_key = build_index(museum_id)
    notify_mobile_app(museum_id, index_key)
    return {"status": "index_built", "museum_id": museum_id, "key": index_key}

