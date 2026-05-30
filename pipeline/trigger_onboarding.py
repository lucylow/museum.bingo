"""
Museum onboarding entrypoint.

Admin provides a museum URL or CSV path. This module records onboarding state in
Firestore and triggers the Tower onboarding pipeline.
"""

from __future__ import annotations

from typing import Any, Dict, TypedDict

from google.cloud import firestore

try:
    from tower import run_pipeline
except ImportError:  # pragma: no cover - local development fallback
    run_pipeline = None  # type: ignore[assignment]


class Source(TypedDict):
    type: str
    value: str


db = firestore.Client()


def start_onboarding(museum_id: str, source: Source) -> Dict[str, Any]:
    """
    Start onboarding for a museum from URL or CSV source.

    source examples:
      {"type": "url", "value": "https://museum.org/collection"}
      {"type": "csv", "value": "s3://bucket/path/artworks.csv"}
    """
    if source["type"] not in {"url", "csv"}:
        raise ValueError("source.type must be either 'url' or 'csv'")

    job_ref = db.collection("onboarding_jobs").document(museum_id)
    job_ref.set(
        {
            "museumId": museum_id,
            "status": "pending",
            "source": dict(source),
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
    )

    if run_pipeline is None:
        raise RuntimeError("tower.run_pipeline is unavailable in this environment")

    run_pipeline(
        pipeline_id="museum_onboarding",
        inputs={
            "museum_id": museum_id,
            "source_type": source["type"],
            "source_value": source["value"],
        },
        webhook_url="https://api.museum.bingo/webhooks/tower/onboarding_complete",
    )
    return {"job_id": museum_id, "status": "started"}


def onboard_museum_http(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Framework-agnostic helper for HTTP handlers.
    Expects payload: {"museumId": "...", "source": {"type": "...", "value": "..."}}
    """
    museum_id = payload["museumId"]
    source: Source = payload["source"]
    return start_onboarding(museum_id, source)

