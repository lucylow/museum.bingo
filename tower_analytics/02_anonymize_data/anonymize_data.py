"""
Tower Pipeline: Data anonymization pass before Silver aggregation.
"""

import polars as pl
from datetime import datetime, timedelta

from tower import app, run, tables


@app.pipeline(
    name="anonymize_events",
    description="Drops disallowed metadata keys and keeps anonymized analytics events",
    schedule="15 * * * *",
)
def anonymize_analytics_events():
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    events_df = tables.read(
        "bronze.analytics_events",
        filter=f"date = '{yesterday}'",
        engine="polars",
    )
    if events_df.height == 0:
        return {"status": "no_data", "date": yesterday}

    allowed = ["event_id", "user_id", "session_id", "museum_id", "event_type", "timestamp", "location_hash", "date"]
    sanitized = events_df.select([pl.col(c) for c in allowed if c in events_df.columns])
    tables.write("silver.analytics_events", sanitized, mode="append")
    return {"status": "success", "records": sanitized.height}


if __name__ == "__main__":
    run()
