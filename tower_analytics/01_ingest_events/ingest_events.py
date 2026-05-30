"""
Tower Pipeline: Firestore event ingestion to Bronze layer.
"""

from datetime import datetime, timedelta

from tower import app, run, tables


@app.pipeline(
    name="ingest_events",
    description="Ingests raw analytics events into bronze analytics table",
    schedule="0 * * * *",
)
def ingest_firestore_events():
    # In production this would read exported webhooks or cloud storage drops.
    now = datetime.utcnow()
    start_window = (now - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end_window = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    staged_events = tables.read(
        "raw.firestore_analytics_events",
        filter=f"ingested_at >= '{start_window}' AND ingested_at < '{end_window}'",
        engine="polars",
    )

    if staged_events.height == 0:
        return {"status": "no_data", "window_start": start_window, "window_end": end_window}

    tables.write("bronze.analytics_events", staged_events, mode="append")
    return {"status": "success", "records": staged_events.height}


if __name__ == "__main__":
    run()
