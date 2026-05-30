"""
Museum.Bingo Analytics Pipeline - Tower Setup & Configuration
Requires: Tower CLI installed (`pip install tower`) and API keys configured.
"""

import os
import sys
from pathlib import Path

ANALYTICS_CONFIG = {
    "organization": "museum-bingo",
    "iceberg_catalog": "museum_bingo_catalog",
    "lakehouse_bucket": "s3://museum-bingo-analytics/",
    "schedules": {
        "daily_engagement": "0 2 * * *",
        "hourly_realtime": "0 * * * *",
        "weekly_summary": "0 3 * * 0",
        "monthly_retention": "0 4 1 * *",
    },
}

ANALYTICS_PIPELINES = [
    "01_ingest_events",
    "02_anonymize_data",
    "03_engagement_metrics",
    "04_artwork_popularity",
    "05_visitor_flow",
    "06_retention_analysis",
    "07_notification_alert",
]


def setup_tower_environment() -> None:
    """Configure required environment variables and verify Tower access."""
    required_vars = [
        "TOWER_API_KEY",
        "TOWER_ORG_ID",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
    ]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        print(f"ERROR: Missing environment variables: {missing}")
        sys.exit(1)

    from tower.api import list_apps

    try:
        _ = list_apps(limit=1)
        print(
            f"Tower connection successful. Organization: {os.getenv('TOWER_ORG_ID')}"
        )
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Tower connection failed: {exc}")
        sys.exit(1)


def generate_towerfile_for_pipeline(pipeline_name: str) -> None:
    """Generate a Towerfile per analytics pipeline directory."""
    entrypoint = f"{pipeline_name.split('_', 2)[-1]}.py"
    towerfile_content = f"""# Towerfile for {pipeline_name}
runtime: python3.11
requirements: ../requirements.txt
entrypoint: {entrypoint}
env_vars:
  - ANALYTICS_ENV=production
  - ICEBERG_CATALOG=museum_bingo_catalog
limits:
  timeout: 3600
  memory: 2048 MB
"""
    with open(f"{pipeline_name}/Towerfile", "w", encoding="utf-8") as handle:
        handle.write(towerfile_content)


if __name__ == "__main__":
    setup_tower_environment()
    for pipeline in ANALYTICS_PIPELINES:
        Path(pipeline).mkdir(exist_ok=True)
        generate_towerfile_for_pipeline(pipeline)
    print(f"Created {len(ANALYTICS_PIPELINES)} analytics pipelines with Towerfiles")
