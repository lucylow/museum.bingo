"""
Tower step for Nimble crawl orchestration.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

import boto3
import requests

try:
    from tower import run_pipeline
except ImportError:  # pragma: no cover
    run_pipeline = None  # type: ignore[assignment]


NIMBLE_CRAWL_URL = "https://api.nimbleway.com/v1/crawl"
NIMBLE_API_KEY = os.environ.get("NIMBLE_API_KEY", "")
RAW_BUCKET = os.environ.get("MUSEUM_BINGO_RAW_BUCKET", "museum-bingo-raw-images")
s3 = boto3.client("s3")


def upload_to_s3(key: str, payload: str) -> None:
    s3.put_object(Bucket=RAW_BUCKET, Key=key, Body=payload.encode("utf-8"))


def start_nimble_crawl(start_url: str, museum_id: str) -> str:
    """Initiate async Nimble crawl and return Nimble job id."""
    if not NIMBLE_API_KEY:
        raise RuntimeError("NIMBLE_API_KEY is not configured")

    payload = {
        "start_urls": [start_url],
        "driver": "vx8",
        "max_depth": 3,
        "max_pages": 2000,
        "output_format": "json",
        "webhook_url": (
            "https://api.museum.bingo/webhooks/nimble/crawl_complete"
            f"?museum_id={museum_id}"
        ),
        "parsing_rules": {
            "artwork_selector": ".artwork-item",
            "fields": {
                "title": ".artwork-title",
                "artist": ".artist-name",
                "image_url": "img.artwork-image@src",
                "description": ".artwork-description",
                "room": ".gallery-location",
            },
        },
    }
    headers = {"Authorization": f"Bearer {NIMBLE_API_KEY}"}
    response = requests.post(NIMBLE_CRAWL_URL, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()["job_id"]


def handle_nimble_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Persist raw crawl output and queue image processing."""
    museum_id = payload["museum_id"]
    results = payload.get("data", [])
    s3_key = f"museums/{museum_id}/nimble_raw.json"
    upload_to_s3(s3_key, json.dumps(results))

    if run_pipeline is None:
        raise RuntimeError("tower.run_pipeline is unavailable in this environment")

    run_pipeline(
        pipeline_id="image_processing",
        inputs={"museum_id": museum_id, "artworks": results},
        wait=False,
    )
    return {"status": "accepted", "museum_id": museum_id, "artworks": len(results)}

