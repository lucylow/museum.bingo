"""
Centralized retry and monitoring helpers for onboarding and indexing.
"""

from __future__ import annotations

import datetime as dt
import hmac
import logging
import os
from hashlib import sha256
from typing import Any, Callable, Dict

from google.cloud import firestore
from tenacity import retry, stop_after_attempt, wait_exponential

from pipeline.tower_pipelines.nimble_crawl import start_nimble_crawl


db = firestore.Client()
logger = logging.getLogger("museum_bingo_pipeline")
logger.setLevel(logging.INFO)
WEBHOOK_SECRET = os.environ.get("TOWER_WEBHOOK_SECRET", "")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=12))
def robust_request(func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    try:
        return func(*args, **kwargs)
    except Exception:
        logger.exception("Request failed for %s", getattr(func, "__name__", "unknown"))
        raise


def crawl_with_retry(start_url: str, museum_id: str) -> str:
    try:
        job_id = robust_request(start_nimble_crawl, start_url, museum_id)
        logger.info("Nimble crawl started job=%s museum=%s", job_id, museum_id)
        return job_id
    except Exception as exc:
        db.collection("onboarding_jobs").document(museum_id).set(
            {"status": "failed", "error": str(exc), "updatedAt": firestore.SERVER_TIMESTAMP},
            merge=True,
        )
        raise


def verify_signature(body: bytes, signature: str | None) -> bool:
    if not WEBHOOK_SECRET or not signature:
        return False
    expected = hmac.new(WEBHOOK_SECRET.encode("utf-8"), body, sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def handle_tower_webhook(payload: Dict[str, Any], raw_body: bytes, signature: str | None) -> Dict[str, Any]:
    if not verify_signature(raw_body, signature):
        return {"status": 401, "error": "invalid signature"}

    museum_id = payload["inputs"]["museum_id"]
    status = payload.get("status")
    if status == "completed":
        db.collection("museums").document(museum_id).set(
            {
                "onboarding_status": "complete",
                "last_index_update": firestore.SERVER_TIMESTAMP,
            },
            merge=True,
        )
        logger.info("Onboarding completed museum=%s", museum_id)
        return {"status": 200, "received": True}

    error_text = payload.get("error", "unknown")
    logger.error("Onboarding failed museum=%s error=%s", museum_id, error_text)
    return {"status": 500, "received": True, "error": error_text}


def trigger_full_reindex(museum_id: str) -> None:
    """Placeholder to run full rebuild pipeline."""
    _ = museum_id


def check_index_freshness(museum_id: str, stale_days: int = 7) -> bool:
    museum_doc = db.collection("museums").document(museum_id).get()
    last_update = museum_doc.get("last_index_update")
    if not last_update:
        return False

    now = dt.datetime.now(dt.timezone.utc)
    if (now - last_update).days > stale_days:
        logger.warning("Index stale for museum=%s; triggering rebuild", museum_id)
        trigger_full_reindex(museum_id)
        return True
    return False

