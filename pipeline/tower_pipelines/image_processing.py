"""
Tower image processing step.

Downloads artwork images, stores raw and resized (224x224) variants to S3, then
writes processed metadata and triggers the CLIP embedding step.
"""

from __future__ import annotations

import hashlib
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from typing import Any, Dict, List

import boto3
import requests
from google.cloud import firestore
from PIL import Image

try:
    from tower import run_pipeline
except ImportError:  # pragma: no cover
    run_pipeline = None  # type: ignore[assignment]


RAW_BUCKET = "museum-bingo-raw-images"
RESIZED_BUCKET = "museum-bingo-resized"
MAX_DOWNLOAD_THREADS = 10
s3 = boto3.client("s3")
db = firestore.Client()


def _stable_artwork_id(museum_id: str, image_url: str) -> str:
    digest = hashlib.sha256(image_url.encode("utf-8")).hexdigest()[:16]
    return f"{museum_id}_{digest}"


def process_artwork(artwork: Dict[str, Any], museum_id: str) -> Dict[str, Any]:
    """Download, resize, upload, and return normalized metadata."""
    image_url = artwork["image_url"]
    response = requests.get(image_url, timeout=30)
    response.raise_for_status()
    image = Image.open(BytesIO(response.content)).convert("RGB")
    resized = image.resize((224, 224), Image.Resampling.LANCZOS)

    artwork_id = artwork.get("id") or _stable_artwork_id(museum_id, image_url)
    raw_key = f"museums/{museum_id}/raw/{artwork_id}.jpg"
    resized_key = f"museums/{museum_id}/resized/{artwork_id}.jpg"

    raw_buffer = BytesIO()
    image.save(raw_buffer, format="JPEG", quality=85)
    s3.put_object(Bucket=RAW_BUCKET, Key=raw_key, Body=raw_buffer.getvalue())

    resized_buffer = BytesIO()
    resized.save(resized_buffer, format="JPEG", quality=90)
    s3.put_object(Bucket=RESIZED_BUCKET, Key=resized_key, Body=resized_buffer.getvalue())

    return {
        "artwork_id": artwork_id,
        "title": artwork.get("title", ""),
        "artist": artwork.get("artist", ""),
        "description": artwork.get("description", ""),
        "room": artwork.get("room", ""),
        "resized_s3_key": resized_key,
        "raw_s3_key": raw_key,
        "original_url": image_url,
    }


def handler(inputs: Dict[str, Any]) -> Dict[str, Any]:
    museum_id = inputs["museum_id"]
    artworks: List[Dict[str, Any]] = inputs.get("artworks", [])

    with ThreadPoolExecutor(max_workers=MAX_DOWNLOAD_THREADS) as executor:
        processed = list(executor.map(lambda art: process_artwork(art, museum_id), artworks))

    db.collection("artworks_metadata").document(museum_id).set(
        {
            "artworks": processed,
            "status": "images_processed",
            "updated_at": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    if run_pipeline is None:
        raise RuntimeError("tower.run_pipeline is unavailable in this environment")

    run_pipeline("clip_embedding", inputs={"museum_id": museum_id}, wait=False)
    return {"status": "images_processed", "count": len(processed), "museum_id": museum_id}

