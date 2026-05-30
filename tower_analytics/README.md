# Museum.Bingo Tower Analytics

This directory contains the serverless analytics pipeline for Museum.Bingo.

## Setup

1. Install dependencies:
   - `pip install -r requirements.txt`
2. Export credentials:
   - `TOWER_API_KEY`
   - `TOWER_ORG_ID`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
3. Generate pipeline `Towerfile`s:
   - `python setup.py`

## Pipelines

- `01_ingest_events`: Firestore event ingestion to Bronze.
- `02_anonymize_data`: Sanitization and anonymized Silver events.
- `03_engagement_metrics`: Daily engagement metrics (Bronze -> Silver).
- `04_artwork_popularity`: Artwork popularity analysis (Silver -> Gold).
- `05_visitor_flow`: Visitor flow and route patterns.
- `06_retention_analysis`: D1/D7/D30 retention metrics.
- `07_notification_alert`: Engagement anomaly detection + Slack alerts.

## Deployment

Deploy each pipeline from its directory with Tower CLI:

- `tower deploy`

Run immediately for validation:

- `tower run`
